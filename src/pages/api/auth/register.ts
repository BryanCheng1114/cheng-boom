import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, phone, email, password, address, otp } = req.body;

    // Both phone and email are now mandatory
    if (!name || !password || !phone || !email || !otp) {
      return res.status(400).json({ message: 'Name, phone, email, password, and OTP are required' });
    }

    // Check if customer already exists (as Member/Seller)
    const existingCustomerByEmail = await (prisma as any).customer.findUnique({
      where: { email },
    });
    
    let existingCustomerByPhone = null;
    if (phone) {
      existingCustomerByPhone = await (prisma as any).customer.findUnique({
        where: { phone },
      });
    }

    // If an account with this email or phone exists and has a password, they are already registered
    if (existingCustomerByEmail && existingCustomerByEmail.password) {
      return res.status(400).json({ 
        code: 'USER_EXISTS', 
        message: 'An account with this email already exists.' 
      });
    }
    
    if (existingCustomerByPhone && existingCustomerByPhone.password) {
      return res.status(400).json({ 
        code: 'USER_EXISTS', 
        message: 'An account with this phone number already exists.' 
      });
    }

    // Verify OTP
    const otpRecord = await (prisma as any).otpVerification.findUnique({
      where: { email }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP requested for this email. Please request a new code.' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    // OTP is valid, proceed to hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prefer using the existing guest record by email or phone to upgrade
    const existingCustomerToUpgrade = existingCustomerByEmail || existingCustomerByPhone;

    let customer;
    if (existingCustomerToUpgrade) {
      // If they were a guest, upgrade them to a member
      customer = await (prisma as any).customer.update({
        where: { id: existingCustomerToUpgrade.id },
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          address: address || existingCustomerToUpgrade.address,
          role: existingCustomerToUpgrade.role === 'Seller' ? 'Seller' : 'Member', // Don't demote sellers
        },
      });
    } else {
      // Create new member
      customer = await (prisma as any).customer.create({
        data: {
          name,
          phone,
          email,
          password: hashedPassword,
          address,
          role: 'Member',
        },
      });
    }

    // Delete the used OTP
    await (prisma as any).otpVerification.delete({
      where: { email }
    });

    // Return user info (omit password)
    const { password: _, ...userWithoutPassword } = customer;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

