import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Missing token or new password' });
    }

    // Find customer by token
    const customer = await (prisma as any).customer.findFirst({
      where: {
        resetToken: token,
      },
    });

    if (!customer) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    // Check if token is expired
    if (!customer.resetTokenExpiry || new Date() > customer.resetTokenExpiry) {
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear the reset token
    await (prisma as any).customer.update({
      where: { id: customer.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({ message: 'Password has been successfully reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error while processing request' });
  }
}
