import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465' || true,
  tls: { rejectUnauthorized: false },
  ...({ family: 4 } as any),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const adminEmail = process.env.SMTP_FROM || process.env.SMTP_USER!;

  const now = new Date();
  const formattedDate = now.toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // ── 1. Admin Notification Email (matches order receipt style) ────
  const adminHtml = `
<div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #333;">

  <!-- Header -->
  <div style="background-color: #09090b; padding: 24px 28px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #f59e0b; margin: 0; font-style: italic; font-weight: 900; text-transform: uppercase; font-size: 26px;">CHENG-BOOM</h1>
    <p style="color: #fff; margin: 6px 0 0 0; letter-spacing: 2px; font-size: 11px;">📩 NEW CONTACT REQUEST</p>
  </div>

  <!-- Body -->
  <div style="padding: 28px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #666; font-size: 13px; text-align: right; margin-top: 0;">Received: ${formattedDate}</p>

    <!-- Section: Sender Details -->
    <h2 style="font-size: 16px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block; margin-bottom: 14px;">Sender Details</h2>
    <table style="width: 100%; margin-bottom: 24px; font-size: 14px; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0; width: 110px; color: #666;">Name:</td>
        <td><strong>${name}</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #666;">Email:</td>
        <td><strong>${email}</strong></td>
      </tr>
    </table>

    <!-- Section: Message -->
    <h2 style="font-size: 16px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block; margin-bottom: 14px;">Message Content</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
      <thead>
        <tr style="background-color: #f4f4f5;">
          <th style="padding: 10px 12px; text-align: left;">Message</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 14px 12px; border: 1px solid #eeeeee; white-space: pre-wrap; line-height: 1.7;">${message}</td>
        </tr>
      </tbody>
    </table>

    <!-- Action Note -->
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; font-size: 14px; border-radius: 0 4px 4px 0;">
      <strong>Action Required:</strong> Reply to this inquiry at
      <a href="mailto:${email}?subject=Re:%20Your%20Inquiry%20to%20Cheng-BOOM" style="color: #f59e0b; font-weight: bold;">${email}</a>
      to address their request promptly.
    </div>
  </div>
</div>
  `;

  // ── 2. Auto-Reply Email to User (matches receipt style, content adapted) ────
  const autoReplyHtml = `
<div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #333;">

  <!-- Header -->
  <div style="background-color: #09090b; padding: 24px 28px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #f59e0b; margin: 0; font-style: italic; font-weight: 900; text-transform: uppercase; font-size: 26px;">CHENG-BOOM</h1>
    <p style="color: #fff; margin: 6px 0 0 0; letter-spacing: 2px; font-size: 11px;">🎆 REQUEST RECEIVED CONFIRMATION</p>
  </div>

  <!-- Body -->
  <div style="padding: 28px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #666; font-size: 13px; text-align: right; margin-top: 0;">Date: ${formattedDate}</p>

    <!-- Greeting -->
    <h2 style="font-size: 16px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block; margin-bottom: 14px;">Your Request Details</h2>

    <!-- Customer Info table -->
    <table style="width: 100%; margin-bottom: 24px; font-size: 14px; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0; width: 110px; color: #666;">Name:</td>
        <td><strong>${name}</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #666;">Email:</td>
        <td><strong>${email}</strong></td>
      </tr>
    </table>

    <!-- Message submitted -->
    <h2 style="font-size: 16px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block; margin-bottom: 14px;">Your Message</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
      <thead>
        <tr style="background-color: #f4f4f5;">
          <th style="padding: 10px 12px; text-align: left;">Message Submitted</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 14px 12px; border: 1px solid #eeeeee; white-space: pre-wrap; line-height: 1.7;">${message}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td style="padding: 12px; text-align: right; color: #666; font-size: 13px;">Status: <strong style="color: #f59e0b;">RECEIVED ✓</strong></td>
        </tr>
      </tfoot>
    </table>

    <!-- What Happens Next -->
    <h2 style="font-size: 16px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block; margin-bottom: 14px;">What Happens Next?</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
      <tbody>
        <tr style="background-color: #f4f4f5;">
          <td style="padding: 10px 12px; width: 32px; text-align: center; font-size: 16px;">1</td>
          <td style="padding: 10px 12px; border-left: 1px solid #e5e5e5;">Our team reviews your inquiry</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; width: 32px; text-align: center; font-size: 16px;">2</td>
          <td style="padding: 10px 12px; border-left: 1px solid #e5e5e5;">We prepare a personalised response for you</td>
        </tr>
        <tr style="background-color: #f4f4f5;">
          <td style="padding: 10px 12px; width: 32px; text-align: center; font-size: 16px;">3</td>
          <td style="padding: 10px 12px; border-left: 1px solid #e5e5e5;">You receive our reply within <strong>1–2 business days</strong></td>
        </tr>
      </tbody>
    </table>

    <!-- Info box -->
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; font-size: 14px; border-radius: 0 4px 4px 0; margin-bottom: 20px;">
      <strong>Need urgent assistance?</strong> You can reach us directly on WhatsApp at
      <a href="https://wa.me/601112269835" style="color: #f59e0b; font-weight: bold;">+60 111-226-9835</a>
      for a faster response.
    </div>

    <!-- Footer note -->
    <p style="font-size: 12px; color: #999; text-align: center; margin: 0; padding-top: 16px; border-top: 1px solid #e5e5e5;">
      Thank you for choosing <strong>Cheng-BOOM</strong> — Malaysia's No.1 Fireworks Destination 🎇<br/>
      <span style="font-size: 11px;">This is an automated reply. Please do not respond to this email directly.</span>
    </p>
  </div>
</div>
  `;

  try {
    await Promise.all([
      // Admin notification
      transporter.sendMail({
        from: `"Cheng-BOOM System" <${adminEmail}>`,
        replyTo: email,
        to: adminEmail,
        subject: `📩 NEW CONTACT REQUEST - ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: adminHtml,
      }),
      // Auto-reply to user
      transporter.sendMail({
        from: `"Cheng-BOOM" <${adminEmail}>`,
        to: email,
        subject: `We've Received Your Request — Cheng-BOOM 🎆`,
        text: `Hi ${name},\n\nThank you for contacting Cheng-BOOM! We have received your message and will reply within 1–2 business days.\n\nYour message:\n${message}\n\nBest regards,\nCheng-BOOM Team`,
        html: autoReplyHtml,
      }),
    ]);

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form email error:', error);
    res.status(500).json({ message: 'Failed to send message', error: String(error) });
  }
}
