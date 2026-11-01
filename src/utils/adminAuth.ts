import { NextApiRequest } from 'next';
import * as jose from 'jose';
import { prisma } from '../lib/prisma';
import { getJwtSecretBytes } from '../lib/jwtSecret';

export async function getAdminFromRequest(req: NextApiRequest) {
  const token = req.cookies.admin_token;

  if (!token) {
    return null;
  }
  const secret = getJwtSecretBytes();
  if (!secret) return null;

  try {
    const { payload } = await jose.jwtVerify(token, secret);
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
