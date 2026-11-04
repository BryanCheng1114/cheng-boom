import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { resolveBusinessName } from '../../lib/brand';
import { requireAdmin } from '../../utils/customerAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      const settings = await prisma.businessSettings.findFirst({
        select: { businessName: true, logoUrl: true, faviconUrl: true, watermarkUrl: true, primaryColor: true, accentColor: true, businessType: true, phone: true, email: true, whatsapp: true, description: true, operatingHours: true, facebook: true, instagram: true, tiktok: true, bankTransferImage: true, tngDuitnowImage: true },
      });
      if (!settings) {
        // Return default structure if no settings exist yet
        return res.status(200).json({
          businessName: 'Dolphin Firework',
          logoUrl: null,
          whatsapp: null,
        });
      }
      return res.status(200).json({
        ...settings,
        businessName: resolveBusinessName(settings.businessName),
      });
    } 
    
    if (req.method === 'POST' || req.method === 'PATCH') {
      if (!(await requireAdmin(req, res))) return;
      const existingSettings = await prisma.businessSettings.findFirst();
      
      const allowedFields = [
        'businessName',
        'logoUrl',
        'watermarkUrl',
        'faviconUrl',
        'primaryColor',
        'accentColor',
        'businessType',
        'ownerName',
        'address',
        'phone',
        'email',
        'whatsapp',
        'description',
        'operatingHours',
        'facebook',
        'instagram',
        'tiktok',
        'bankTransferImage',
        'tngDuitnowImage',
      ];

      const cleanData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          cleanData[field] = req.body[field];
        }
      }
      if (cleanData.businessName !== undefined) {
        cleanData.businessName = resolveBusinessName(cleanData.businessName);
      }

      if (existingSettings) {
        const updated = await prisma.businessSettings.update({
          where: { id: existingSettings.id },
          data: cleanData,
        });
        return res.status(200).json({
          ...updated,
          businessName: resolveBusinessName(updated.businessName),
        });
      } else {
        const created = await prisma.businessSettings.create({
          data: cleanData as any,
        });
        return res.status(201).json({
          ...created,
          businessName: resolveBusinessName(created.businessName),
        });
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Business Settings API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
}
