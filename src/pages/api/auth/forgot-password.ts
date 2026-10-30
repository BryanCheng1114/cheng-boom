import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { prisma } from '../../../lib/prisma';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed' }); }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });

  try {
    const seller = await prisma.customer.findFirst({
      where: { email, role: 'Seller' },
      select: { id: true, name: true, email: true, phone: true, isActive: true },
    });

    // Return the same confirmation for unknown addresses to avoid disclosing account membership.
    if (!seller) return res.status(200).json({ message: 'If this is an active seller account, the admin has been notified.' });
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Seller password assistance email is not configured.');
      return res.status(500).json({ message: 'Email service is temporarily unavailable. Please contact the business directly.' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_PORT || '465') === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS.replace(/\s+/g, '') },
      tls: { rejectUnauthorized: false },
      ...({ family: 4 } as any),
    });

    const adminEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const safeName = escapeHtml(seller.name);
    const safeEmail = escapeHtml(seller.email);
    const safePhone = escapeHtml(seller.phone || 'Not provided');
    const receivedAt = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' });
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Cheng-BOOM'} Seller Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: seller.email || undefined,
      subject: `Seller password assistance requested — ${seller.name}`,
      text: `A seller requested password assistance. Please create a new temporary password and contact them.\n\nName: ${seller.name}\nEmail: ${seller.email}\nPhone: ${seller.phone || 'Not provided'}\nActive account: ${seller.isActive ? 'Yes' : 'No'}\nReceived: ${receivedAt}`,
      html: `<div style="margin:0;padding:24px 12px;background:#f4f4f5;font-family:Arial,sans-serif;color:#27272a"><div style="max-width:620px;margin:auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden"><div style="padding:24px 28px;background:#d92e20;color:#fff"><h1 style="margin:0;font-size:22px">Seller password help</h1><p style="margin:7px 0 0;font-size:13px;color:#ffe4df">Admin action required</p></div><div style="padding:28px"><p style="font-size:15px;line-height:1.6">A seller has confirmed that they forgot their password. Please create a new temporary password and contact them using the details below.</p><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:10px 0;color:#71717a;width:130px">Seller</td><td style="padding:10px 0;font-weight:700">${safeName}</td></tr><tr><td style="padding:10px 0;color:#71717a">Email</td><td style="padding:10px 0"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr><tr><td style="padding:10px 0;color:#71717a">Phone</td><td style="padding:10px 0">${safePhone}</td></tr><tr><td style="padding:10px 0;color:#71717a">Account status</td><td style="padding:10px 0">${seller.isActive ? 'Active' : 'Inactive'}</td></tr></table><p style="margin:22px 0 0;padding-top:16px;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px">Received ${escapeHtml(receivedAt)} · Do not send a permanent password by email.</p></div></div></div>`,
    });

    return res.status(200).json({ message: 'The admin has been notified and will contact you with a temporary password.' });
  } catch (error) {
    console.error('Seller password assistance request failed:', error);
    return res.status(500).json({ message: 'Could not send your request. Please try again later.' });
  }
}
