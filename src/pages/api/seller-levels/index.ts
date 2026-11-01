import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAdmin, requireCustomerOrAdmin } from '../../../utils/customerAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (!(await requireCustomerOrAdmin(req, res))) return;
  } else if (req.method === 'POST') {
    if (!(await requireAdmin(req, res))) return;
  }

  try {
    if (req.method === 'GET') {
      const levels = await prisma.sellerLevel.findMany({
        orderBy: { discountPercent: 'asc' }
      });
      return res.status(200).json(levels);
    } 
    
    if (req.method === 'POST') {
      const { name, description, discountPercent, freeShipping, prioritySupport } = req.body;
      const created = await prisma.sellerLevel.create({
        data: {
          name,
          description: description || null,
          discountPercent: parseFloat(discountPercent) || 0,
          freeShipping: Boolean(freeShipping),
          prioritySupport: Boolean(prioritySupport)
        }
      });
      return res.status(201).json(created);
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Seller Levels API Error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Seller Level name must be unique.' });
    }
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
}
