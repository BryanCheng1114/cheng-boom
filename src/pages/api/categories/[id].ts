import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { name, code, nameZh, nameMs, image, transparentImage } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Category Name is required' });
      if (!code || !code.trim()) return res.status(400).json({ error: 'Category Code is required' });

      const cleanCode = code.trim().replace(/[^a-zA-Z0-9-_]/g, '');
      if (!cleanCode) return res.status(400).json({ error: 'Category Code must contain alphanumeric characters' });

      // Check unique constraints for name and code (excluding current category)
      const existing = await prisma.category.findFirst({
        where: {
          id: { not: id },
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

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          name: name.trim(),
          code: cleanCode,
          nameZh: nameZh?.trim() || null,
          nameMs: nameMs?.trim() || null,
          image: image?.trim() || null,
          transparentImage: transparentImage?.trim() || null,
        },
      });

      return res.status(200).json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Find the category to get its name (since products are linked by category name)
      const category = await prisma.category.findUnique({
        where: { id }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Hide all products under this category by setting status to 'Hold'
      await prisma.product.updateMany({
        where: { category: category.name },
        data: { status: 'Hold' }
      });

      // Delete the category
      await prisma.category.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
