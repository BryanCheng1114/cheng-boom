import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, phone, password, address } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone and password are required' });
    }

    // Check if customer already exists
    const existingCustomer = await (prisma as any).customer.findUnique({
      where: { phone },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    let customer;
    if (existingCustomer) {
      // If they were a guest, upgrade them to a member
      customer = await (prisma as any).customer.update({
        where: { phone },
        data: {
          name,
          password: hashedPassword,
          address: address || existingCustomer.address,
          role: existingCustomer.role === 'Seller' ? 'Seller' : 'Member', // Don't demote sellers
        },
      });
    } else {
      // Create new member
      customer = await (prisma as any).customer.create({
        data: {
          name,
          phone,
          password: hashedPassword,
          address,
          role: 'Member',
        },
      });
    }

    // Return user info (omit password)
    const { password: _, ...userWithoutPassword } = customer;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
