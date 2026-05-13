import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { sendOrderReceiptEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { customerInfo, items, totalAmount } = req.body;
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

      // 2. Create the order with historical snapshot of delivery/payment details
      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          totalAmount: parseFloat(totalAmount),
          status: 'Pending',
          paymentMethod: customerInfo.paymentMethod,
          deliveryMode: customerInfo.deliveryMode,
          address: customerInfo.address,
          notes: customerInfo.notes,
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

      sendOrderReceiptEmail(order, { ...customerInfo, role: customer.role }, items, totalAmount).catch(console.error);

      return res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
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
