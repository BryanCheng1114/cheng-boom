import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { resolveBusinessName } from '../../lib/brand';
import { getPwaIconUrl } from '../../utils/pwa';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  try {
    const settings = await prisma.businessSettings.findFirst({
      select: { businessName: true, logoUrl: true, faviconUrl: true },
    });
    const name = resolveBusinessName(settings?.businessName);
    const logo = settings?.logoUrl || settings?.faviconUrl;
    const icons = logo ? [192, 512].map((size) => {
      const src = getPwaIconUrl(logo, size);
      const isCloudinaryPng = src.includes('res.cloudinary.com') && src.includes(`w_${size},h_${size}`);

      return {
        src,
        ...(isCloudinaryPng ? { sizes: `${size}x${size}`, type: 'image/png' } : {}),
        purpose: 'any',
      };
    }) : [];

    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      id: '/',
      name,
      short_name: name,
      description: `${name} online store`,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons,
    });
  } catch (error) {
    console.error('PWA manifest error:', error);
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    return res.status(200).json({
      id: '/',
      name: 'Dolphin Firework',
      short_name: 'Dolphin Firework',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [],
    });
  }
}
