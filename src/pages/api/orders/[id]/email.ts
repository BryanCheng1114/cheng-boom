import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

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

  const { id } = req.query;
  const { subject, message } = req.body;

  if (!id || !subject || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: String(id) },
      include: { customer: true }
    });

    if (!order || !order.customer || !order.customer.email) {
      return res.status(404).json({ message: 'Order or customer email not found' });
    }

    const businessName = "Cheng-BOOM";
    const customerName = order.customer.name;
    const adminEmail = process.env.SMTP_FROM || process.env.SMTP_USER!;

    const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #333;">
  <div style="background-color: #09090b; padding: 24px 28px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #f59e0b; margin: 0; font-style: italic; font-weight: 900; text-transform: uppercase; font-size: 26px;">${businessName}</h1>
    <p style="color: #fff; margin: 6px 0 0 0; letter-spacing: 2px; font-size: 11px;">📦 ORDER NOTIFICATION</p>
  </div>
  <div style="padding: 28px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; font-weight: bold;">Dear ${customerName},</p>
    <p style="font-size: 14px; line-height: 1.6; color: #444;">
      ${message.replace(/\n/g, '<br/>')}
    </p>
    <p style="font-size: 13px; color: #888; margin-top: 30px;">
      Order ID: #${order.id.slice(-8).toUpperCase()}<br/>
      Date: ${new Date().toLocaleDateString('en-MY')}
    </p>
    <p style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
      This is an automated message. Please contact us if you have any questions.
    </p>
  </div>
</div>
`;

    await transporter.sendMail({
      from: `"${businessName}" <${adminEmail}>`,
      to: order.customer.email,
      subject: `Order #${order.id.slice(-8).toUpperCase()} - ${subject}`,
      html: emailHtml,
    });

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
