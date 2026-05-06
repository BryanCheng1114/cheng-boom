import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const product = await prisma.product.findUnique({
        where: { id: String(id) },
      });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(200).json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, code, nameZh, nameMs, description, images, videoUrl, stock, price, sellerPrice, promotion, category, status } = req.body;
      
      const trimmedCode = code?.trim();
      if (trimmedCode) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            code: {
              equals: trimmedCode,
              mode: 'insensitive',
            },
            id: {
              not: String(id),
            },
          },
        });
        if (existingProduct) {
          return res.status(400).json({ error: `Product code '${trimmedCode}' already exists.` });
        }
      }

      if (category) {
        await prisma.category.upsert({
          where: { name: category },
          update: {},
          create: { name: category },
        });
      }

      const product = await prisma.product.update({
        where: { id: String(id) },
        data: {
          name,
          code: trimmedCode || null,
          nameZh: nameZh?.trim() || null,
          nameMs: nameMs?.trim() || null,
          description,
          images: Array.isArray(images) ? images : [],
          videoUrl,
          stock: parseInt(stock as any),
          price: parseFloat(price as any),
          sellerPrice: sellerPrice ? parseFloat(sellerPrice as any) : null,
          promotion: promotion ? parseFloat(promotion as any) : null,
          category,
          status,
        },
      });
      
      return res.status(200).json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const product = await prisma.product.findUnique({
        where: { id: String(id) },
        select: { images: true }
      });

      if (product && product.images.length > 0) {
        const { default: cloudinary } = await import('../../../lib/cloudinary');
        
        for (const imageUrl of product.images) {
          // Extract public_id from URL
          // Format: https://res.cloudinary.com/[cloud]/image/upload/v[v]/[folder]/[public_id].[ext]
          const parts = imageUrl.split('/');
          const uploadIndex = parts.indexOf('upload');
          if (uploadIndex !== -1) {
            // public_id is everything after 'v[version]/' and before the extension
            const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
            const publicId = publicIdWithExt.split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }
        }
      }

      await prisma.product.delete({
        where: { id: String(id) },
      });
      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
