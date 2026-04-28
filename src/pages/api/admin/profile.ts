import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFromRequest } from '../../../utils/adminAuth';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await getAdminFromRequest(req);

  if (!admin) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(admin);
  }

  if (req.method === 'PATCH') {
    try {
      const { theme } = req.body;
      
      if (theme && !['light', 'dark'].includes(theme)) {
        return res.status(400).json({ message: 'Invalid theme' });
      }

      const updatedAdmin = await prisma.admin.update({
        where: { id: admin.id },
        data: { theme },
        select: {
          id: true,
          username: true,
          theme: true,
        }
      });

      return res.status(200).json(updatedAdmin);
    } catch (error) {
      console.error('Settings update error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
