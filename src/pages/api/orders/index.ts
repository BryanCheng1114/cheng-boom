import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { sendOrderReceiptEmail, sendCustomerOrderReceiptEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { customerInfo, items, totalAmount, originalAmount, totalDiscount, sellerLevelName, discountPercent, isFreeShipping } = req.body;
      const { name, phone, email, address } = customerInfo;
      const allowedPaymentMethods = ['Cash on Delivery', 'DuitNow & Bank Transfer'];
      if (!allowedPaymentMethods.includes(customerInfo.paymentMethod)) {
        return res.status(400).json({ error: 'Please select a supported payment method.' });
      }
      if (customerInfo.paymentMethod === 'DuitNow & Bank Transfer' && !customerInfo.paymentReceiptUrl) {
        return res.status(400).json({ error: 'A payment receipt is required for DuitNow and bank transfer orders.' });
      }

      // 1. Find or create the customer
      let customer;
      const { customerId } = customerInfo;
      
      try {
        if (customerId) {
          // Logged-in user: find existing customer and optionally update their shipping address/phone
          customer = await prisma.customer.findUnique({ where: { id: customerId } });
          if (customer) {
             customer = await prisma.customer.update({
               where: { id: customerId },
               data: {
                 phone: phone || customer.phone,
                address: address || customer.address,
                preferredPayment: customerInfo.paymentMethod,
                orderMode: customerInfo.deliveryMode,
                notes: customerInfo.notes || null
               }
             });
          }
        }
        
        // If no customerId or customer wasn't found in DB, fallback to phone-based guest logic
        if (!customer) {
          customer = await prisma.customer.upsert({
            where: { phone: phone },
            update: {
              name: name,
              address: address || undefined,
              preferredPayment: customerInfo.paymentMethod,
              orderMode: customerInfo.deliveryMode,
              notes: customerInfo.notes || null,
            },
            create: {
              name: name,
              phone: phone,
              email: email || undefined,
              address: address || undefined,
              preferredPayment: customerInfo.paymentMethod,
              orderMode: customerInfo.deliveryMode,
              notes: customerInfo.notes || null,
              role: 'Guest',
            },
          });
        }
      } catch (err: any) {
        if (err.code === 'P2002') {
          customer = await prisma.customer.findFirst({
            where: { OR: [{ phone: phone }, email ? { email: email } : {}] }
          });
          if (!customer) throw err;
        } else {
          throw err;
        }
      }

      // Rebuild every line price from the saved account's assigned price group.
      // Never accept a price sent by the browser as the order's source of truth.
      const pricingGroup = customer?.role === 'Seller' && customer?.sellerPricing === 'B' ? 'B' : 'A';
      const productIds = [...new Set(items.map((item: any) => item.productId || item.id))] as string[];
      const orderProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const orderProductMap = new Map(orderProducts.map((product) => [product.id, product]));
      const pricedItems = items.map((item: any) => {
        const product = orderProductMap.get(item.productId || item.id);
        if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.name || item.id}`);
        const variant = item.variant || 'Single';
        const price = variant === 'Box'
          ? (pricingGroup === 'B' ? product.sellerBBoxPrice : product.sellerABoxPrice)
          : variant === 'Bundle'
            ? (pricingGroup === 'B' ? product.sellerBBundlePrice : product.sellerABundlePrice)
            : (pricingGroup === 'B' ? product.sellerBPrice : product.sellerAPrice);
        const fallbackPrice = variant === 'Box'
          ? product.sellerABoxPrice
          : variant === 'Bundle'
            ? product.sellerABundlePrice
            : product.sellerAPrice;
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || (price ?? fallbackPrice) == null) {
          throw new Error(`INVALID_ORDER_ITEM:${item.name || item.id}`);
        }
        const unitPrice = price ?? fallbackPrice!;
        const originalPrice = pricingGroup === 'B' && fallbackPrice != null && fallbackPrice > unitPrice ? fallbackPrice : undefined;
        return { ...item, variant, quantity, price: unitPrice, originalPrice, itemsPerBox: product.itemsPerBox, bundleQuantity: product.bundleQuantity };
      });
      const authoritativeTotal = pricedItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
      const authoritativeOriginalTotal = pricedItems.reduce((sum: number, item: any) => sum + (item.originalPrice ?? item.price) * item.quantity, 0);
      const authoritativeDiscount = authoritativeOriginalTotal - authoritativeTotal;

      // 2. Wrap stock deduction and order creation in an interactive transaction
      const order = await prisma.$transaction(async (tx) => {
        // 2a. Deduct stock atomically for each item
        for (const item of pricedItems) {
          const qty = item.quantity;
          const packSize = item.variant === 'Box' ? item.itemsPerBox : item.variant === 'Bundle' ? item.bundleQuantity : 1;
          const deductQty = qty * (packSize || 1);
          const updateResult = await tx.product.updateMany({
            where: {
              id: item.productId || item.id,
              stock: {
                gte: deductQty // ONLY update if stock is sufficient
              }
            },
            data: {
              stock: {
                decrement: deductQty
              }
            }
          });

          // If count is 0, it means the product doesn't exist OR stock is insufficient
          if (updateResult.count === 0) {
            throw new Error(`INSUFFICIENT_STOCK:${item.name}`);
          }
        }

        // 2b. Create the order
        return await tx.order.create({
          data: {
            customerId: customer.id,
              totalAmount: authoritativeTotal,
            status: 'Pending',
            paymentMethod: customerInfo.paymentMethod,
            deliveryMode: customerInfo.deliveryMode,
            address: customerInfo.address,
            notes: customerInfo.notes,
            paymentReceiptUrl: customerInfo.paymentMethod === 'DuitNow & Bank Transfer' ? customerInfo.paymentReceiptUrl : null,
            items: {
              create: pricedItems.map((item: any) => ({
                productId: item.productId || item.id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity),
                variant: item.variant || null,
              })),
            },
          },
          include: {
            items: true,
          },
        });
      });

      // Preserve legacy receipt labels while prices are migrated to Seller A/B.
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, sellerAPrice: true, sellerABoxPrice: true, itemsPerBox: true },
      });
      const productMap: Record<string, any> = {};
      products.forEach((p) => { productMap[p.id] = p; });
      const enrichedItems = pricedItems.map((item: any) => {
        const pd = productMap[item.productId || item.id];
        return { ...item, sellerPrice: pd?.sellerAPrice ?? null, boxSellerPrice: pd?.sellerABoxPrice ?? null, itemsPerBox: pd?.itemsPerBox ?? null };
      });

      sendOrderReceiptEmail(
        order, 
        { ...customerInfo, role: customer.role }, 
        enrichedItems, 
        authoritativeTotal,
        authoritativeOriginalTotal,
        authoritativeDiscount,
        '',
        0,
        isFreeShipping
      ).catch(err => console.error('Failed to send admin email:', err));

      // 4. Send email receipt to customer
      if (email) {
        sendCustomerOrderReceiptEmail(
          order, 
          { ...customerInfo, email, role: customer.role }, 
          enrichedItems, 
          authoritativeTotal,
          authoritativeOriginalTotal,
          authoritativeDiscount,
          '',
          0,
          isFreeShipping
        ).catch(err => console.error('Failed to send customer email:', err));
      }

      return res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Check if it's our custom insufficient stock error
      if (error.message && error.message.startsWith('INSUFFICIENT_STOCK:')) {
        const productName = error.message.split(':')[1];
        return res.status(400).json({ 
          code: 'INSUFFICIENT_STOCK', 
          productName,
          error: `Insufficient stock for ${productName}` 
        });
      }
      
      return res.status(500).json({ error: 'Failed to create order' });
    }
  }

  if (req.method === 'GET') {
    try {
      const orders = await prisma.order.findMany({
        include: {
          customer: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
