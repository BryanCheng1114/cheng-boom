import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    // Fetch user info using the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userInfoResponse.ok) {
      return res.status(400).json({ message: 'Invalid access token' });
    }

    const payload = await userInfoResponse.json();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'No email provided by Google' });
    }

    const email = payload.email;
    const name = payload.name || 'Google User';

    // Check if customer exists by email
    let customer = await (prisma as any).customer.findUnique({
      where: { email },
      include: { sellerLevel: true }
    });

    if (!customer) {
      // Check if user exists by phone, wait, we don't have phone from payload.
      // So create a new customer
      customer = await (prisma as any).customer.create({
        data: {
          name,
          email,
          role: 'Member',
          isActive: true
        },
        include: { sellerLevel: true }
      });
    }

    // Return user info (omit password)
    const { password: _, ...userWithoutPassword } = customer;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
