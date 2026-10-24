import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { getAdminFromRequest } from '../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const admin = await getAdminFromRequest(req);
  if (!admin) return res.status(401).json({ message: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters.' });
  }

  try {
    const adminWithPassword = await prisma.admin.findUnique({ where: { id: admin.id } });
    if (!adminWithPassword || !(await bcrypt.compare(currentPassword, adminWithPassword.password))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({ where: { id: admin.id }, data: { password: hashedPassword } });
    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Admin password update failed:', error);
    return res.status(500).json({ message: 'Unable to update password.' });
  }
}
