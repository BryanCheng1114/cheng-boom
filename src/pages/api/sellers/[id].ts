import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const { sellerLevelId, isActive, role } = req.body;
      
      const updated = await prisma.customer.update({
        where: { id },
        data: {
          ...(sellerLevelId !== undefined && { sellerLevelId }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
          ...(role !== undefined && { role })
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
