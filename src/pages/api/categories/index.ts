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
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const category = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
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
