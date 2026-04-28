import { NextApiRequest } from 'next';
import * as jose from 'jose';
import { prisma } from '../lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-123'
);

export async function getAdminFromRequest(req: NextApiRequest) {
  const token = req.cookies.admin_token;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.id) return null;

    const admin = await prisma.admin.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        username: true,
        theme: true,
      }
    });

    return admin;
  } catch (error) {
    return null;
  }
}
