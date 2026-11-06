import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { prisma } from '../../lib/prisma';
import { resolveBusinessName } from '../../lib/brand';
import { getAdminFromRequest } from '../../utils/adminAuth';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const referredBy = typeof req.body?.referredBy === 'string' ? req.body.referredBy.trim() : '';
    if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
    if (phone.length < 5 || phone.length > 40) return res.status(400).json({ message: 'Enter a valid phone number.' });
    if (referredBy.length > 100) return res.status(400).json({ message: 'The referral name is too long.' });

    try {
      const request = await prisma.accountRequest.create({ data: { name, phone, referredBy: referredBy || null } });
      const adminEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
      const forwardedProto = req.headers['x-forwarded-proto'];
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || 'https'}://${req.headers.host || ''}`).replace(/\/$/, '');
      if (adminEmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const port = Number(process.env.SMTP_PORT || 465);
          const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS.replace(/\s+/g, '') } });
          const settings = await prisma.businessSettings.findFirst({ select: { businessName: true } });
          const businessName = resolveBusinessName(settings?.businessName);
          await transporter.sendMail({
            from: `"${businessName} Account Requests" <${adminEmail}>`,
            to: adminEmail,
            subject: `New account request: ${name}`,
            text: `A new account request is waiting for review.\n\nName: ${name}\nPhone: ${phone}\nReferred by: ${referredBy || 'Not provided'}\n\nReview requests: ${siteUrl}/admin/account-requests`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#27272a"><div style="background:#d92e20;color:white;padding:22px 26px"><h1 style="margin:0;font-size:22px">New account request</h1></div><div style="padding:24px;border:1px solid #e4e4e7"><p>A prospective customer is waiting for an account.</p><p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Phone:</strong> ${escapeHtml(phone)}<br><strong>Referred by:</strong> ${escapeHtml(referredBy || 'Not provided')}</p><a href="${escapeHtml(`${siteUrl}/admin/account-requests`)}" style="display:inline-block;background:#d92e20;color:#fff;padding:12px 18px;text-decoration:none;border-radius:24px">Review request</a></div></div>`,
          });
        } catch (emailError) {
          console.error('Account request saved but admin notification email failed:', emailError);
        }
      } else {
        console.warn('Account request saved; SMTP is not configured, so no notification email was sent.');
      }
      return res.status(201).json({ success: true, id: request.id });
    } catch (error) {
      console.error('Failed to save account request:', error);
      return res.status(500).json({ message: 'Unable to send your request right now. Please try again.' });
    }
  }

  if (!(await getAdminFromRequest(req))) return res.status(401).json({ message: 'Admin sign-in is required.' });

  if (req.method === 'GET') {
    try {
      const requests = await prisma.accountRequest.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] });
      return res.status(200).json(requests);
    } catch (error) {
      console.error('Failed to load account requests:', error);
      return res.status(500).json({ message: 'Unable to load account requests.' });
    }
  }

  if (req.method === 'PATCH') {
    const id = typeof req.body?.id === 'string' ? req.body.id : '';
    const status = req.body?.status;
    if (!id || !['Pending', 'Completed'].includes(status)) return res.status(400).json({ message: 'Invalid account request update.' });
    try {
      const updated = await prisma.accountRequest.update({ where: { id }, data: { status } });
      return res.status(200).json(updated);
    } catch (error) {
      console.error('Failed to update account request:', error);
      return res.status(500).json({ message: 'Unable to update account request.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
