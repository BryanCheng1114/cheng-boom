import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, phone, email, password, address } = req.body;

    if (!name || !password || (!phone && !email)) {
      return res.status(400).json({ message: 'Name, password, and either phone or email are required' });
    }

    // Check if customer already exists
    let existingCustomer = null;
    if (phone) {
      existingCustomer = await (prisma as any).customer.findUnique({
        where: { phone },
      });
    } else if (email) {
      existingCustomer = await (prisma as any).customer.findUnique({
        where: { email },
      });
    }

    if (existingCustomer && existingCustomer.password) {
      return res.status(400).json({ 
        code: 'USER_EXISTS', 
        message: 'An account with this phone number or email already exists.' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let customer;
    if (existingCustomer) {
      // If they were a guest, upgrade them to a member
      customer = await (prisma as any).customer.update({
        where: { id: existingCustomer.id },
        data: {
          name,
          email: email || existingCustomer.email,
          phone: phone || existingCustomer.phone,
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
          phone: phone || null,
          email: email || null,
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
