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
          const settings = await prisma.businessSettings.findFirst({ select: { businessName: true, logoUrl: true } });
          const businessName = resolveBusinessName(settings?.businessName);
          const safeBusinessName = escapeHtml(businessName);
          const safeName = escapeHtml(name);
          const safePhone = escapeHtml(phone);
          const safeReferredBy = escapeHtml(referredBy || 'Not provided');
          const adminInboxUrl = `${siteUrl}/admin/account-requests`;
          let logoUrl = '';
          if (settings?.logoUrl) {
            try {
              const parsedLogoUrl = new URL(settings.logoUrl, siteUrl);
              if (parsedLogoUrl.protocol === 'https:' || parsedLogoUrl.protocol === 'http:') logoUrl = parsedLogoUrl.toString();
            } catch {
              logoUrl = '';
            }
          }
          const safeLogoUrl = escapeHtml(logoUrl);
          const receivedAt = request.createdAt.toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' });
          const logoMarkup = safeLogoUrl
            ? `<img src="${safeLogoUrl}" width="54" height="54" alt="${safeBusinessName} logo" style="display:block;width:54px;height:54px;object-fit:contain;border:0;outline:none;text-decoration:none" />`
            : '';
          await transporter.sendMail({
            from: `"${businessName} Account Requests" <${adminEmail}>`,
            to: adminEmail,
            subject: `New account request — ${name} | ${businessName}`,
            text: `${businessName}\nNEW ACCOUNT REQUEST\n\nA prospective customer is waiting for an account.\n\nName: ${name}\nPhone: ${phone}\nReferred by: ${referredBy || 'Not provided'}\nReceived: ${receivedAt}\n\nReview this request in the admin account request inbox:\n${adminInboxUrl}`,
            html: `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#27272a"><div style="display:none;max-height:0;overflow:hidden;opacity:0">A new customer is waiting for an account from ${safeBusinessName}.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#fff;border:1px solid #e4e4e7;border-radius:10px;overflow:hidden"><tr><td style="padding:22px 26px;background:#09090b;border-bottom:4px solid #f59e0b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>${logoMarkup ? `<td width="68" valign="middle">${logoMarkup}</td>` : ''}<td valign="middle"><p style="margin:0;color:#f59e0b;font-size:20px;line-height:1.25;font-weight:800;letter-spacing:.4px">${safeBusinessName}</p><p style="margin:6px 0 0;color:#fff;font-size:11px;line-height:1.4;letter-spacing:2px;font-weight:700">NEW ACCOUNT REQUEST</p></td></tr></table></td></tr><tr><td style="padding:28px 26px 12px"><p style="margin:0;color:#52525b;font-size:15px;line-height:1.6">A prospective customer has requested an account. Review their details and follow up to prepare their account.</p><p style="margin:14px 0 0;color:#71717a;font-size:12px;line-height:1.5">Received ${escapeHtml(receivedAt)} · Malaysia time</p></td></tr><tr><td style="padding:12px 26px 8px"><h2 style="margin:0 0 12px;color:#18181b;font-size:16px;line-height:1.4">Customer details</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;font-size:14px"><tr><td width="140" style="padding:12px;background:#f4f4f5;color:#71717a;border-bottom:1px solid #e4e4e7">Name</td><td style="padding:12px;color:#18181b;font-weight:700;border-bottom:1px solid #e4e4e7">${safeName}</td></tr><tr><td style="padding:12px;background:#f4f4f5;color:#71717a;border-bottom:1px solid #e4e4e7">Phone number</td><td style="padding:12px;border-bottom:1px solid #e4e4e7"><a href="tel:${escapeHtml(phone)}" style="color:#18181b;font-weight:700;text-decoration:underline">${safePhone}</a></td></tr><tr><td style="padding:12px;background:#f4f4f5;color:#71717a">Referred by</td><td style="padding:12px;color:#18181b">${safeReferredBy}</td></tr></table></td></tr><tr><td align="center" style="padding:22px 26px 28px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" bgcolor="#f59e0b" style="border-radius:5px"><a href="${escapeHtml(adminInboxUrl)}" target="_blank" style="display:inline-block;padding:14px 24px;color:#09090b;font-size:14px;font-weight:700;line-height:1.2;text-decoration:none">Review account request&nbsp; &#8594;</a></td></tr></table><p style="margin:14px 0 0;color:#71717a;font-size:12px;line-height:1.5">This request is saved as pending. No account has been created yet.</p></td></tr><tr><td style="padding:16px 26px;background:#fafafa;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:11px;line-height:1.5;text-align:center">Automated notification from ${safeBusinessName}. Please sign in to the admin panel to review the request.</td></tr></table></td></tr></table></body></html>`,
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
