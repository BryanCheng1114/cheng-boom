import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../lib/prisma';
import { verifyCustomerSessionToken } from '../lib/customerSession';

export async function getCustomerFromRequest(req: NextApiRequest) {
  const session = await verifyCustomerSessionToken(req.cookies.customer_token);
  if (!session) return null;

  return prisma.customer.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, sellerLevelId: true },
  }).then((customer) => customer?.isActive ? customer : null);
}

export async function requireCustomerOrAdmin(req: NextApiRequest, res: NextApiResponse) {
  const customer = await getCustomerFromRequest(req);
  if (customer) return true;

  const { getAdminFromRequest } = await import('./adminAuth');
  const admin = await getAdminFromRequest(req);
  if (admin) return true;

  res.status(401).json({ error: 'Please sign in to access the store.' });
  return false;
}

export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const { getAdminFromRequest } = await import('./adminAuth');
  const admin = await getAdminFromRequest(req);
  if (admin) return true;
  res.status(401).json({ error: 'Admin sign-in is required.' });
  return false;
}
