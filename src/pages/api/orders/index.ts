import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { sendOrderReceiptEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { customerInfo, items, totalAmount, originalAmount, totalDiscount, sellerLevelName, discountPercent, isFreeShipping } = req.body;
      const { name, phone, address } = customerInfo;

      // 1. Find or create the customer based on phone number
      const customer = await prisma.customer.upsert({
        where: { phone: phone },
        update: {
          name: name,
          address: address || undefined,
        },
        create: {
          name: name,
          phone: phone,
          address: address || undefined,
          role: 'Guest',
        },
      });

      // 2. Wrap stock deduction and order creation in an interactive transaction
      const order = await prisma.$transaction(async (tx) => {
        // 2a. Deduct stock atomically for each item
        for (const item of items) {
          const qty = parseInt(item.quantity);
          const updateResult = await tx.product.updateMany({
            where: {
              id: item.productId || item.id,
              stock: {
                gte: qty // ONLY update if stock is sufficient
              }
            },
            data: {
              stock: {
                decrement: qty
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
              })),
            },
          },
          include: {
            items: true,
          },
        });
      });

      sendOrderReceiptEmail(
        order, 
        { ...customerInfo, role: customer.role }, 
        items, 
        totalAmount,
        originalAmount,
        totalDiscount,
        sellerLevelName,
        discountPercent,
        isFreeShipping
      ).catch(console.error);

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
