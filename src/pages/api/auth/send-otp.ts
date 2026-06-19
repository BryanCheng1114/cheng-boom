import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if customer already exists as a Member or Seller (they have a password)
    const existingCustomer = await (prisma as any).customer.findUnique({
      where: { email },
    });

    if (existingCustomer && existingCustomer.password) {
      return res.status(400).json({ 
        code: 'USER_EXISTS', 
        message: 'An account with this email already exists.' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate expiry (e.g., 10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to OtpVerification table
    await (prisma as any).otpVerification.upsert({
      where: { email },
      update: {
        otp,
        expiresAt,
        createdAt: new Date(),
      },
      create: {
        email,
        otp,
        expiresAt,
      },
    });

    // Send Email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // Force IPv4
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace(/\s+/g, ''), // remove spaces
      },
      tls: {
        rejectUnauthorized: false
      }
    } as any);

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Cheng-BOOM'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">Thank you for registering. Please use the verification code below to complete your sign-up process:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
          </div>
          <p style="color: #555; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP Send error:', error);
    return res.status(500).json({ message: 'Internal server error while sending OTP' });
  }
}
