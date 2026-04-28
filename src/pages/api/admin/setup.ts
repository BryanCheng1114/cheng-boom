import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adminUsername = 'admin';
    const adminPassword = 'Password123!';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.admin.upsert({
      where: { username: adminUsername },
      update: {
        password: hashedPassword
      },
      create: {
        username: adminUsername,
        password: hashedPassword
      }
    });

    return res.status(200).json({ message: 'Admin seeded successfully', username: admin.username });
  } catch (error: any) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: error.message });
  }
}
