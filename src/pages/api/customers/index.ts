import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { getAdminFromRequest } from '../../../utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (!(await getAdminFromRequest(req))) {
      return res.status(401).json({ error: 'Admin sign-in is required to view customer accounts.' });
    }

    try {
      const dbCustomers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          orders: {
            select: { totalAmount: true, status: true }
          }
        }
      });
      
      const customers = dbCustomers.map(customer => {
        const totalSpent = customer.orders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + o.totalAmount, 0);
          
        const { orders, password: _password, ...customerWithoutOrders } = customer;
        return {
          ...customerWithoutOrders,
          totalSpent
        };
      });

      return res.status(200).json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }

  if (req.method === 'POST') {
    if (!(await getAdminFromRequest(req))) {
      return res.status(401).json({ message: 'Admin sign-in is required to create customer accounts.' });
    }

    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const sellerPricing = req.body.sellerPricing;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password);

    if (!validEmail) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!validPassword) return res.status(400).json({ message: 'Password must be at least 8 characters and include a number and a special character.' });
    if (sellerPricing !== 'A' && sellerPricing !== 'B') {
      return res.status(400).json({ message: 'Choose Seller A or Seller B pricing.' });
    }

    try {
      const existing = await prisma.customer.findUnique({ where: { email } });
      if (existing?.password) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const name = existing?.name?.trim() || email.split('@')[0].replace(/[._-]+/g, ' ').trim() || email;
      const customer = existing
        ? await prisma.customer.update({
            where: { id: existing.id },
            data: { name, password: hashedPassword, role: 'Seller', sellerPricing, sellerLevelId: null },
          })
        : await prisma.customer.create({
            data: { name, email, password: hashedPassword, role: 'Seller', sellerPricing },
          });

      const { password: _password, ...customerWithoutPassword } = customer;
      return res.status(existing ? 200 : 201).json(customerWithoutPassword);
    } catch (error: any) {
      console.error('Error creating seller account:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      return res.status(500).json({ message: 'Failed to create the seller account.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
