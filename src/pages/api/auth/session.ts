import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyCustomerSessionToken } from '../../../lib/customerSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const session = await verifyCustomerSessionToken(req.cookies.customer_token);
  if (!session) {
    res.setHeader('Set-Cookie', 'customer_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return res.status(401).json({ authenticated: false });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, sellerLevel: true },
  });
  if (!customer?.isActive) {
    res.setHeader('Set-Cookie', 'customer_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true, user: customer });
}
