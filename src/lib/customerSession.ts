import * as jose from 'jose';
import { getJwtSecretBytes } from './jwtSecret';

export interface CustomerSession {
  id: string;
  role: string;
}

export async function createCustomerSessionToken(customer: CustomerSession) {
  const secret = getJwtSecretBytes();
  if (!secret) throw new Error('JWT_SECRET must be configured before customer sign-in can be enabled.');
  return new jose.SignJWT({ id: customer.id, role: customer.role, type: 'customer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyCustomerSessionToken(token?: string | null): Promise<CustomerSession | null> {
  const secret = getJwtSecretBytes();
  if (!token || !secret) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    if (payload.type !== 'customer' || typeof payload.id !== 'string' || typeof payload.role !== 'string') return null;
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}
