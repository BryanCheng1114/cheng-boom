import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../../lib/prisma';
import { getAdminFromRequest } from '../../../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  if (!(await getAdminFromRequest(req))) {
    return res.status(401).json({ message: 'Admin sign-in is required.' });
  }

  const id = req.query.id;
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const validPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password);

  if (typeof id !== 'string' || !id) return res.status(400).json({ message: 'Invalid seller account.' });
  if (!validPassword) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and include a number and a special character.' });
  }

  try {
    const seller = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!seller || seller.role !== 'Seller') {
      return res.status(404).json({ message: 'Seller account not found.' });
    }

    await prisma.customer.update({
      where: { id },
      data: { password: await bcrypt.hash(password, 10) },
    });

    return res.status(200).json({ id: seller.id, email: seller.email });
  } catch (error) {
    console.error('Failed to update seller sign-in password:', error);
    return res.status(500).json({ message: 'Could not update the seller password.' });
  }
}
