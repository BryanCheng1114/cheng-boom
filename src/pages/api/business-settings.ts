import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const settings = await prisma.businessSettings.findFirst();
      if (!settings) {
        // Return default structure if no settings exist yet
        return res.status(200).json({
          businessName: 'Cheng-BOOM',
          logoUrl: null,
          whatsapp: null,
        });
      }
      return res.status(200).json(settings);
    } 
    
    if (req.method === 'POST' || req.method === 'PATCH') {
      const existingSettings = await prisma.businessSettings.findFirst();
      const data = req.body;

      if (existingSettings) {
        const updated = await prisma.businessSettings.update({
          where: { id: existingSettings.id },
          data
        });
        return res.status(200).json(updated);
      } else {
        const created = await prisma.businessSettings.create({
          data
        });
        return res.status(201).json(created);
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Business Settings API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
}
