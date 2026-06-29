import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { sendOrderReceiptEmail, sendCustomerOrderReceiptEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { customerInfo, items, totalAmount, originalAmount, totalDiscount, sellerLevelName, discountPercent, isFreeShipping } = req.body;
      const { name, phone, email, address } = customerInfo;

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
                 address: address || customer.address
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
            },
            create: {
              name: name,
              phone: phone,
              email: email || undefined,
              address: address || undefined,
              role: customerInfo.role || 'Guest',
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

      // 2. Wrap stock deduction and order creation in an interactive transaction
      const order = await prisma.$transaction(async (tx) => {
        // 2a. Deduct stock atomically for each item
        for (const item of items) {
          const qty = parseInt(item.quantity);
          const deductQty = item.variant === 'Box' && item.itemsPerBox ? qty * parseInt(item.itemsPerBox) : qty;
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
            totalAmount: parseFloat(totalAmount),
            status: 'Pending',
            paymentMethod: customerInfo.paymentMethod,
            deliveryMode: customerInfo.deliveryMode,
            address: customerInfo.address,
            notes: customerInfo.notes,
            paymentReceiptUrl: customerInfo.paymentReceiptUrl,
            items: {
              create: items.map((item: any) => ({
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

      // Enrich items with sellerPrice/boxSellerPrice for accurate email discount labeling
      const productIds = [...new Set(items.map((i: any) => i.productId || i.id))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds as string[] } },
        select: { id: true, sellerPrice: true, boxSellerPrice: true, itemsPerBox: true },
      });
      const productMap: Record<string, any> = {};
      products.forEach((p) => { productMap[p.id] = p; });
      const enrichedItems = items.map((item: any) => {
        const pd = productMap[item.productId || item.id];
        return { ...item, sellerPrice: pd?.sellerPrice ?? null, boxSellerPrice: pd?.boxSellerPrice ?? null, itemsPerBox: pd?.itemsPerBox ?? null };
      });

      sendOrderReceiptEmail(
        order, 
        { ...customerInfo, role: customer.role }, 
        enrichedItems, 
        totalAmount,
        originalAmount,
        totalDiscount,
        sellerLevelName,
        discountPercent,
        isFreeShipping
      ).catch(err => console.error('Failed to send admin email:', err));

      // 4. Send email receipt to customer
      if (email) {
        sendCustomerOrderReceiptEmail(
          order, 
          { ...customerInfo, email, role: customer.role }, 
          enrichedItems, 
          totalAmount,
          originalAmount,
          totalDiscount,
          sellerLevelName,
          discountPercent,
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
