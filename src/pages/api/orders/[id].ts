import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findUnique({
        where: { id: String(id) },
        include: {
          customer: {
            select: {
              name: true,
              phone: true,
              address: true,
              preferredPayment: true,
              orderMode: true,
            }
          },
          items: true
        }
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error('Fetch order error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: String(id) },
        data: { status },
      });

      return res.status(200).json(updatedOrder);
    } catch (error) {
      console.error('Update order error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
