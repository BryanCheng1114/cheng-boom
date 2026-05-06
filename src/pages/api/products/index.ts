import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, code, nameZh, nameMs, description, images, videoUrl, stock, price, sellerPrice, promotion, category } = req.body;
      
      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Product code is required' });
      }

      // Check unique product code
      const trimmedCode = code.trim();
      const existingProduct = await prisma.product.findFirst({
        where: {
          code: {
            equals: trimmedCode,
            mode: 'insensitive',
          },
        },
      });

      if (existingProduct) {
        return res.status(400).json({ error: `Product code '${trimmedCode}' already exists.` });
      }

      // Ensure category exists in the Category table if provided
      if (category) {
        await prisma.category.upsert({
          where: { name: category },
          update: {},
          create: { name: category },
        });
      }

      const product = await prisma.product.create({
        data: {
          name,
          code: trimmedCode,
          nameZh: nameZh?.trim() || null,
          nameMs: nameMs?.trim() || null,
          description,
          images: Array.isArray(images) ? images : [],
          videoUrl,
          stock: parseInt(stock as any) || 0,
          price: parseFloat(price as any) || 0,
          sellerPrice: sellerPrice ? parseFloat(sellerPrice as any) : null,
          promotion: promotion ? parseFloat(promotion as any) : null,
          category,
          status: 'Live',
        },
      });
      
      return res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'Invalid IDs provided' });
      }

      // Fetch all products to get image URLs
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { images: true }
      });

      // Cleanup Cloudinary
      const { default: cloudinary } = await import('../../../lib/cloudinary');
      for (const product of products) {
        if (product.images && product.images.length > 0) {
          for (const imageUrl of product.images) {
            const parts = imageUrl.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1) {
              const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
              const publicId = publicIdWithExt.split('.')[0];
              await cloudinary.uploader.destroy(publicId);
            }
          }
        }
      }

      // Delete from Database
      await prisma.product.deleteMany({
        where: { id: { in: ids } },
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error in bulk deletion:', error);
      return res.status(500).json({ error: 'Failed to perform bulk deletion' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
