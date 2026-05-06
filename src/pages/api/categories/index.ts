import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });

      // Enhance categories with a real product image
      const categoriesWithImages = await Promise.all(categories.map(async (cat) => {
        const sampleProduct = await prisma.product.findFirst({
          where: { category: cat.name },
          select: { images: true }
        });
        
        return {
          ...cat,
          image: sampleProduct?.images?.[0] || cat.image || '/example.png'
        };
      }));

      return res.status(200).json(categoriesWithImages);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, code, nameZh, nameMs, image } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Category Name is required' });
      if (!code || !code.trim()) return res.status(400).json({ error: 'Category Code is required' });

      const cleanCode = code.trim().replace(/[^a-zA-Z0-9-_]/g, '');
      if (!cleanCode) return res.status(400).json({ error: 'Category Code must contain alphanumeric characters' });

      // Check unique constraints for name and code
      const existing = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: name.trim(), mode: 'insensitive' } },
            { code: { equals: cleanCode, mode: 'insensitive' } }
          ]
        }
      });

      if (existing) {
        if (existing.name.toLowerCase() === name.trim().toLowerCase()) {
          return res.status(400).json({ error: 'Category with this Name already exists.' });
        }
        return res.status(400).json({ error: 'Category with this Code already exists.' });
      }

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          code: cleanCode,
          nameZh: nameZh?.trim() || null,
          nameMs: nameMs?.trim() || null,
          image: image?.trim() || null,
        },
      });

      return res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
