import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getAdminFromRequest } from '../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      if (!(await getAdminFromRequest(req))) {
        return res.status(401).json({ message: 'Admin sign-in is required to view seller accounts.' });
      }

      const sellers = await prisma.customer.findMany({
        where: {
          role: 'Seller'
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          sellerPricing: true,
          isActive: true,
          createdAt: true,
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
