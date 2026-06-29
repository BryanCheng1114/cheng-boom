import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const dbCustomers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          orders: {
            select: { totalAmount: true, status: true }
          }
        }
      });
      
      const customers = dbCustomers.map(customer => {
        const totalSpent = customer.orders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + o.totalAmount, 0);
          
        const { orders, ...customerWithoutOrders } = customer;
        return {
          ...customerWithoutOrders,
          totalSpent
        };
      });

      return res.status(200).json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
