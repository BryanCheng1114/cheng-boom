import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const sellers = await prisma.customer.findMany({
        where: {
          role: 'Seller'
        },
        include: {
          sellerLevel: true,
          orders: {
            select: {
              totalAmount: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Compute total spent per seller
      const formattedSellers = sellers.map(seller => ({
        ...seller,
        totalPurchases: seller.orders.length,
        totalSpent: seller.orders.reduce((sum, order) => sum + order.totalAmount, 0)
      }));

      return res.status(200).json(formattedSellers);
    } 

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Sellers API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
}
