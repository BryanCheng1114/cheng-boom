import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { createCustomerSessionToken } from '../../../lib/customerSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone/Email and password are required' });
    }

    const customer = await (prisma as any).customer.findFirst({
      where: {
        OR: [
          { phone: phone },
          { email: phone } // we use `phone` variable for the input string which might be email
        ]
      },
      include: { sellerLevel: true }
    });

    if (!customer || !customer.password) {
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: 'No account is registered with this email yet.',
      });
    }

    if (customer.isActive === false) {
      return res.status(403).json({ code: 'ACCOUNT_DISABLED', message: 'This account is disabled. Please contact the store administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    // Return user info (omit password)
    const { password: _, ...userWithoutPassword } = customer;
    const token = await createCustomerSessionToken({ id: customer.id, role: customer.role || 'Member' });
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `customer_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`);
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
