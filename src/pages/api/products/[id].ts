import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { serializeProduct } from '../../../utils/serializeProduct';
import { validateProductPricing } from '../../../utils/validateProductPricing';

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
      return res.status(200).json(serializeProduct(product));
    } catch (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, code, nameZh, nameMs, description, descriptionZh, descriptionMs, images, videoUrl, stock, sellerAPrice, sellerBPrice, sellerABoxPrice, sellerBBoxPrice, itemsPerBox, bundleQuantity, sellerABundlePrice, sellerBBundlePrice, category, status } = req.body;
      
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

      const pricingError = validateProductPricing(req.body);
      if (pricingError) return res.status(400).json({ error: pricingError });

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
          descriptionZh: descriptionZh?.trim() || null,
          descriptionMs: descriptionMs?.trim() || null,
          images: Array.isArray(images) ? images : [],
          videoUrl,
          stock: parseInt(stock as any),
          sellerAPrice: Number(sellerAPrice),
          sellerBPrice: Number(sellerBPrice),
          sellerABoxPrice: sellerABoxPrice !== '' && sellerABoxPrice != null ? Number(sellerABoxPrice) : null,
          sellerBBoxPrice: sellerBBoxPrice !== '' && sellerBBoxPrice != null ? Number(sellerBBoxPrice) : null,
          itemsPerBox: itemsPerBox ? parseInt(itemsPerBox as any) : null,
          bundleQuantity: bundleQuantity ? parseInt(bundleQuantity as any) : null,
          sellerABundlePrice: sellerABundlePrice !== '' && sellerABundlePrice != null ? Number(sellerABundlePrice) : null,
          sellerBBundlePrice: sellerBBundlePrice !== '' && sellerBBundlePrice != null ? Number(sellerBBundlePrice) : null,
          category,
          status,
        },
      });
      
      return res.status(200).json(serializeProduct(product));
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
