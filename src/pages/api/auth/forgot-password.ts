import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if customer exists
    const customer = await (prisma as any).customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update customer with reset token
    await (prisma as any).customer.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
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
        pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
      },
      tls: {
        rejectUnauthorized: false
      }
    } as any);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.origin ? req.headers.origin : 'http://localhost:3000');
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    const businessName = process.env.SMTP_FROM_NAME || 'Cheng-BOOM';
    const mailOptions = {
      from: `"${businessName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click this link to set a new password: ${resetLink} \n\nThis link will expire in 1 hour.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #333;">
          <div style="background-color: #09090b; padding: 24px 28px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #f59e0b; margin: 0; font-style: italic; font-weight: 900; text-transform: uppercase; font-size: 26px;">${businessName}</h1>
            <p style="color: #fff; margin: 6px 0 0 0; letter-spacing: 2px; font-size: 11px;">🔒 ACCOUNT SECURITY</p>
          </div>
          <div style="padding: 28px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; font-weight: bold;">Dear ${customer.name || 'Customer'},</p>
            <p style="font-size: 14px; line-height: 1.6; color: #444;">
              We received a request to reset the password for your account. Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #f59e0b; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #444;">
              Or copy and paste this link into your browser:<br/>
              <a href="${resetLink}" style="color: #f59e0b; word-break: break-all;">${resetLink}</a>
            </p>
            <p style="font-size: 13px; color: #888; margin-top: 30px;">
              Date: ${new Date().toLocaleDateString('en-MY')}
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
              This link will expire in 1 hour. If you did not request this, you can safely ignore this automated message.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Password reset link sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error while processing request' });
  }
}
