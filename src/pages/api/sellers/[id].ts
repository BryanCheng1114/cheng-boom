import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getAdminFromRequest } from '../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!(await getAdminFromRequest(req))) {
        return res.status(401).json({ message: 'Admin sign-in is required.' });
      }

      if (req.body.role !== undefined || req.body.sellerLevelId !== undefined) {
        return res.status(400).json({ message: 'Seller role and tier assignments are no longer managed here.' });
      }

      const { isActive } = req.body;
      
      const updated = await prisma.customer.update({
        where: { id },
        data: {
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
        include: {
          sellerLevel: true
        }
      });
      return res.status(200).json(updated);
    } 

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Sellers Update API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
}
