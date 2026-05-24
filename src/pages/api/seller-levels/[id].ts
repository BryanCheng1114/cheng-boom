import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const { name, discountPercent, freeShipping, prioritySupport } = req.body;
      const updated = await prisma.sellerLevel.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(discountPercent !== undefined && { discountPercent: parseFloat(discountPercent) }),
          ...(freeShipping !== undefined && { freeShipping: Boolean(freeShipping) }),
          ...(prioritySupport !== undefined && { prioritySupport: Boolean(prioritySupport) })
        }
      });
      return res.status(200).json(updated);
    } 
    
    if (req.method === 'DELETE') {
      await prisma.sellerLevel.delete({
        where: { id }
      });
      return res.status(200).json({ message: 'Deleted successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Seller Levels API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
}
