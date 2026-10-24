import nodemailer from 'nodemailer';
import { prisma } from './prisma';

// You will need to set these in your .env file
// SMTP_USER=bryancheng3396@gmail.com
// SMTP_PASS=your_gmail_app_password

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  // Force IPv4 to prevent ETIMEDOUT on broken IPv6 networks
  tls: { rejectUnauthorized: false },
  // Node.js will prioritize IPv4 with this flag
  ...({ family: 4 } as any),
  auth: {
    user: process.env.SMTP_USER || 'bryancheng3396@gmail.com',
    pass: process.env.SMTP_PASS, 
  },
});

const escapeEmailHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const sendCustomerAccountUpdateEmail = async (customer: { name?: string | null; email?: string | null }) => {
  if (!customer.email) throw new Error('Customer email is not available.');
  if (!process.env.SMTP_PASS) throw new Error('SMTP_PASS is not configured.');

  let businessName = 'CHENG-BOOM';
  let supportPhone = '';
  try {
    const settings = await prisma.businessSettings.findFirst();
    if (settings?.businessName) businessName = settings.businessName;
    if (settings?.whatsapp) supportPhone = settings.whatsapp;
  } catch (error) {
    console.error('Failed to fetch business settings for account update email:', error);
  }

  const safeBusinessName = escapeEmailHtml(businessName);
  const safeCustomerName = escapeEmailHtml(customer.name || 'Customer');
  const safeSupportPhone = escapeEmailHtml(supportPhone);
  const safeSupportEmail = escapeEmailHtml(process.env.SMTP_USER || 'our support email');
  const date = new Date().toLocaleDateString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="margin:0; padding:24px 12px; background:#f3f4f6; font-family:Arial,sans-serif; color:#27272a;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e4e4e7;">
        <div style="padding:24px; background:#09090b; text-align:center;">
          <h1 style="margin:0; color:#f59e0b; font-size:24px; font-weight:800; letter-spacing:1px;">${safeBusinessName}</h1>
          <p style="margin:8px 0 0; color:#ffffff; font-size:11px; letter-spacing:2px;">ACCOUNT UPDATE</p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px; font-size:16px; font-weight:700;">Dear ${safeCustomerName},</p>
          <p style="margin:0 0 16px; color:#444; font-size:14px; line-height:1.7;">
            This email is to let you know that your account type with ${safeBusinessName} has been changed from Seller to Member.
          </p>
          <div style="margin:20px 0; padding:16px; border-left:4px solid #f59e0b; background:#f4f4f5;">
            <div style="margin-bottom:5px; color:#71717a; font-size:12px;">Your account type</div>
            <div style="color:#18181b; font-size:16px; font-weight:700;">Member Account</div>
          </div>
          <p style="margin:0 0 16px; color:#444; font-size:14px; line-height:1.7;">
            You can continue to sign in and use your account as a Member. Seller-only pricing and benefits will no longer apply to future orders. Your existing account details and order history remain available.
          </p>
          <p style="margin:0 0 20px; color:#444; font-size:14px; line-height:1.7;">
            If you believe this change was made in error or have any questions, please contact us at <a href="mailto:${safeSupportEmail}" style="color:#2563eb;">${safeSupportEmail}</a>${safeSupportPhone ? ` or WhatsApp us at <strong>${safeSupportPhone}</strong>` : ''}.
          </p>
          <p style="margin:0; color:#444; font-size:14px; line-height:1.7;">Thank you,<br/><strong>${safeBusinessName} Team</strong></p>
          <p style="margin:24px 0 0; padding-top:14px; border-top:1px solid #e4e4e7; color:#71717a; font-size:12px; line-height:1.6; text-align:center;">
            Account update sent on ${date}. Please reply to this email if you need assistance.
          </p>
        </div>
      </div>
    </div>
  `;

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!fromAddress) throw new Error('SMTP sender address is not configured.');

  await transporter.sendMail({
    from: `"${businessName} System" <${fromAddress}>`,
    to: customer.email,
    subject: `Account type update - ${businessName}`,
    html,
  });
};

export const sendOrderReceiptEmail = async (
  order: any, 
  customerInfo: any, 
  items: any[], 
  totalAmount: number,
  originalAmount?: number,
  totalDiscount?: number,
  sellerLevelName?: string,
  discountPercent?: number,
  isFreeShipping?: boolean
) => {
  // If no password is set, log a warning and skip to prevent crashing
  if (!process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP_PASS is not set in .env. Order email receipt was NOT sent.');
    return;
  }

  // Fetch dynamic business settings
  let businessName = 'CHENG-BOOM';
  try {
    const settings = await prisma.businessSettings.findFirst();
    if (settings && settings.businessName) {
      businessName = settings.businessName;
    }
  } catch (error) {
    console.error('Failed to fetch business settings for email:', error);
  }

  const date = new Date().toLocaleString('en-MY', { 
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const isSeller = !!(sellerLevelName && sellerLevelName.trim() !== '');

  let promoItemDiscount = 0;
  let sellerItemDiscount = 0;

  const itemsHtml = items.map((item, index) => {
    const orig = item.originalPrice || item.price;
    const isDiscounted = orig > item.price;
    const savings = isDiscounted ? (orig - item.price) * item.quantity : 0;

    // Variant label: "Single" or "Box (x12)"
    const variantLabel = item.variant === 'Box'
      ? `Box${item.itemsPerBox ? ` (x${item.itemsPerBox})` : ''}`
      : item.variant === 'Single'
        ? 'Single'
        : '';

    // Detect seller-exclusive price vs promo discount
    const isSellerPrice = isSeller && isDiscounted && (
      item.variant === 'Box'
        ? item.boxSellerPrice != null && parseFloat(item.price) === parseFloat(item.boxSellerPrice)
        : item.sellerPrice != null && parseFloat(item.price) === parseFloat(item.sellerPrice)
    );

    if (isDiscounted) {
      if (isSellerPrice) {
        sellerItemDiscount += savings;
      } else {
        promoItemDiscount += savings;
      }
    }

    const discountLabel = isSellerPrice
      ? `<span style="color: #f59e0b; font-size: 11px; font-weight: bold;">Seller Discount</span>`
      : `<span style="color: #dc2626; font-size: 11px;">Promo</span>`;

    const discountCell = isDiscounted
      ? `<div style="color: #dc2626;">-RM ${savings.toFixed(2)}</div><div>${discountLabel}</div>`
      : '-';

    return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">
        <strong>${item.name}</strong><br/>
        <span style="color: #666; font-size: 12px;">Code: ${item.code || '-'}</span>
        ${variantLabel ? `<br/><span style="display: inline-block; margin-top: 3px; padding: 1px 6px; background: #f4f4f5; border-radius: 4px; font-size: 11px; color: #555; font-weight: 600;">${variantLabel}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; white-space: nowrap;">RM ${parseFloat(orig).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; white-space: nowrap;">${discountCell}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; white-space: nowrap;">RM ${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `;
  }).join('');
  
  const baseTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemDiscount = promoItemDiscount + sellerItemDiscount;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 750px; margin: 0 auto; color: #333;">
      <div style="background-color: #09090b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #f59e0b; margin: 0; font-style: italic; font-weight: 900; text-transform: uppercase;">${businessName}</h1>
        <p style="color: #fff; margin: 5px 0 0 0; letter-spacing: 2px; font-size: 12px;">NEW ORDER NOTIFICATION</p>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #666; font-size: 14px; text-align: right; margin-top: 0;">Date: ${date}</p>
        
        <h2 style="font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block;">Customer Details</h2>
        <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
          <tr><td style="padding: 4px 0; width: 120px; color: #666;">Name:</td><td><strong>${customerInfo.name}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Phone:</td><td><strong>${customerInfo.phone}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Account Type:</td><td><strong style="text-transform: uppercase; color: #f59e0b;">${sellerLevelName || customerInfo.role || 'Guest'}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Payment:</td><td>${customerInfo.paymentMethod}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Mode:</td><td>${customerInfo.deliveryMode}</td></tr>
          ${customerInfo.deliveryMode === 'Delivery' ? `<tr><td style="padding: 4px 0; color: #666;">Address:</td><td>${customerInfo.address}</td></tr>` : ''}
          ${customerInfo.notes ? `<tr><td style="padding: 4px 0; color: #666;">Notes:</td><td style="color: #dc2626;">${customerInfo.notes}</td></tr>` : ''}
          ${customerInfo.paymentReceiptUrl ? `<tr><td style="padding: 4px 0; color: #666;">Receipt:</td><td><a href="${customerInfo.paymentReceiptUrl}" target="_blank" style="display: inline-block; padding: 6px 12px; background-color: #f59e0b; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; margin-top: 4px;">🔗 View Receipt</a></td></tr>` : ''}
        </table>

        <h2 style="font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block;">Order Items</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f4f4f5;">
              <th style="padding: 10px; text-align: left; width: 5%;">No.</th>
              <th style="padding: 10px; text-align: left; width: 40%;">Product</th>
              <th style="padding: 10px; text-align: center; width: 10%;">Qty</th>
              <th style="padding: 10px; text-align: right; width: 15%; white-space: nowrap;">Unit Price</th>
              <th style="padding: 10px; text-align: right; width: 15%; white-space: nowrap;">${isSeller ? 'Disc.' : 'Promo'}</th>
              <th style="padding: 10px; text-align: right; width: 15%; white-space: nowrap;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            ${totalItemDiscount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 10px 12px; text-align: right; font-size: 14px; color: #666;">Original Total:</td>
              <td style="padding: 10px 12px; text-align: right; font-size: 14px; color: #666;">RM ${parseFloat((originalAmount || baseTotal + totalItemDiscount).toString()).toFixed(2)}</td>
            </tr>
            ${promoItemDiscount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 4px 12px; text-align: right; font-size: 13px; color: #666;">Item Discount:</td>
              <td style="padding: 4px 12px; text-align: right; font-size: 13px; color: #dc2626;">-RM ${promoItemDiscount.toFixed(2)}</td>
            </tr>` : ''}
            ${sellerItemDiscount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 4px 12px; text-align: right; font-size: 13px; color: #666;">Seller Price Savings:</td>
              <td style="padding: 4px 12px; text-align: right; font-size: 13px; color: #f59e0b;">-RM ${sellerItemDiscount.toFixed(2)}</td>
            </tr>` : ''}
            ` : ''}
            ${totalDiscount && totalDiscount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 10px 12px; text-align: right; font-size: 14px; color: #f59e0b;">
                ${sellerLevelName || 'Seller'} Tier Discount (${discountPercent || 0}%):
              </td>
              <td style="padding: 10px 12px; text-align: right; font-size: 14px; color: #f59e0b;">-RM ${parseFloat((baseTotal - totalAmount).toString()).toFixed(2)}</td>
            </tr>
            ` : ''}
            ${isFreeShipping ? `
            <tr>
              <td colspan="5" style="padding: 10px 12px; text-align: right; font-size: 14px; color: #3b82f6;">Shipping:</td>
              <td style="padding: 10px 12px; text-align: right; font-size: 14px; color: #3b82f6; font-weight: bold;">FREE</td>
            </tr>
            ` : ''}
            <tr>
              <td colspan="5" style="padding: 15px 12px; text-align: right; font-weight: bold;">TOTAL PAYABLE:</td>
              <td style="padding: 15px 12px; text-align: right; font-weight: bold; color: #f59e0b; font-size: 16px;">RM ${parseFloat(totalAmount.toString()).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; font-size: 14px;">
          <strong>Action Required:</strong> Check WhatsApp to follow up with the customer at <strong>${customerInfo.phone}</strong> to confirm payment and arrangements.${customerInfo.paymentReceiptUrl ? '<br/><br/><strong>⚠️ Please click the "View Receipt" link above to verify the payment transfer.</strong>' : ''}
        </div>
      </div>
    </div>
  `;


  const mailOptions = {
    from: `"${businessName} System" <no-reply@cheng-boom.com>`,
    to: 'bryancheng3396@gmail.com',
    subject: `🚨 NEW ORDER RECEIVED - RM ${parseFloat(totalAmount.toString()).toFixed(2)} (${customerInfo.name})`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Order receipt email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send order email receipt:', error);
  }
};

export const sendCustomerOrderReceiptEmail = async (
  order: any, 
  customerInfo: any, 
  items: any[], 
  totalAmount: number,
  originalAmount?: number,
  totalDiscount?: number,
  sellerLevelName?: string,
  discountPercent?: number,
  isFreeShipping?: boolean
) => {
  if (!process.env.SMTP_PASS) return;
  if (!customerInfo.email) {
    console.log('No customer email provided, skipping customer receipt email.');
    return;
  }

  let businessName = 'CHENG-BOOM';
  let supportPhone = '';
  try {
    const settings = await prisma.businessSettings.findFirst();
    if (settings && settings.businessName) {
      businessName = settings.businessName;
    }
    if (settings && settings.whatsapp) {
      supportPhone = settings.whatsapp;
    }
  } catch (error) {
    console.error('Failed to fetch business settings for email:', error);
  }

  const date = new Date().toLocaleString('en-MY', { 
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const isSeller = !!(sellerLevelName && sellerLevelName.trim() !== '');

  let promoItemDiscount = 0;
  let sellerItemDiscount = 0;

  const itemsHtml = items.map((item, index) => {
    const orig = item.originalPrice || item.price;
    const isDiscounted = orig > item.price;
    const savings = isDiscounted ? (orig - item.price) * item.quantity : 0;

    const variantLabel = item.variant === 'Box'
      ? `Box${item.itemsPerBox ? ` (x${item.itemsPerBox})` : ''}`
      : item.variant === 'Single' ? 'Single' : '';

    const isSellerPrice = isSeller && isDiscounted && (
      item.variant === 'Box'
        ? item.boxSellerPrice != null && parseFloat(item.price) === parseFloat(item.boxSellerPrice)
        : item.sellerPrice != null && parseFloat(item.price) === parseFloat(item.sellerPrice)
    );

    if (isDiscounted) {
      if (isSellerPrice) {
        sellerItemDiscount += savings;
      } else {
        promoItemDiscount += savings;
      }
    }

    const discountLabel = isSellerPrice
      ? `<span style="color: #f59e0b; font-size: 11px; font-weight: bold;">Seller Discount</span>`
      : `<span style="color: #dc2626; font-size: 11px;">Promo</span>`;

    const discountCell = isDiscounted
      ? `<div style="color: #dc2626;">-RM ${savings.toFixed(2)}</div><div>${discountLabel}</div>`
      : '-';

    return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">
        <strong>${item.name}</strong><br/>
        <span style="color: #666; font-size: 12px;">Code: ${item.code || '-'}</span>
        ${variantLabel ? `<br/><span style="display: inline-block; margin-top: 3px; padding: 1px 6px; background: #f4f4f5; border-radius: 4px; font-size: 11px; color: #555; font-weight: 600;">${variantLabel}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; white-space: nowrap;">RM ${parseFloat(orig).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; white-space: nowrap;">${discountCell}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; white-space: nowrap;">RM ${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `;
  }).join('');
  
  const baseTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemDiscount = promoItemDiscount + sellerItemDiscount;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 750px; margin: 0 auto; color: #333;">
      <div style="background-color: #09090b; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #f59e0b; margin: 0; font-style: italic; font-weight: 900; text-transform: uppercase;">${businessName}</h1>
        <p style="color: #fff; margin: 10px 0 0 0; letter-spacing: 1px; font-size: 14px;">ORDER CONFIRMATION</p>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin-top: 0; font-size: 20px;">Hi ${customerInfo.name},</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #444;">
          Thank you for your order! We have received your order details and are currently reviewing your payment. 
          We will start processing your order within 24 hours.
        </p>

        <p style="color: #666; font-size: 14px; text-align: right; margin-top: 20px;">Date: ${date}</p>
        
        <h2 style="font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block;">Your Details</h2>
        <table style="width: 100%; margin-bottom: 25px; font-size: 14px;">
          <tr><td style="padding: 4px 0; width: 120px; color: #666;">Name:</td><td><strong>${customerInfo.name}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Phone:</td><td><strong>${customerInfo.phone}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Email:</td><td><strong>${customerInfo.email}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Mode:</td><td><strong>${customerInfo.deliveryMode}</strong></td></tr>
          ${customerInfo.deliveryMode === 'Delivery' ? `<tr><td style="padding: 4px 0; color: #666;">Address:</td><td>${customerInfo.address}</td></tr>` : ''}
          <tr><td style="padding: 4px 0; color: #666;">Payment Method:</td><td>${customerInfo.paymentMethod}</td></tr>
          ${customerInfo.notes ? `<tr><td style="padding: 4px 0; color: #666;">Notes:</td><td style="color: #444;">${customerInfo.notes}</td></tr>` : ''}
        </table>

        <h2 style="font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block;">Order Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f4f4f5;">
              <th style="padding: 10px; text-align: left; width: 5%;">No.</th>
              <th style="padding: 10px; text-align: left; width: 40%;">Product</th>
              <th style="padding: 10px; text-align: center; width: 10%;">Qty</th>
              <th style="padding: 10px; text-align: right; width: 15%; white-space: nowrap;">Unit Price</th>
              <th style="padding: 10px; text-align: right; width: 15%; white-space: nowrap;">${isSeller ? 'Disc.' : 'Promo'}</th>
              <th style="padding: 10px; text-align: right; width: 15%; white-space: nowrap;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            ${totalItemDiscount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 10px 12px; text-align: right; font-size: 14px; color: #666;">Original Total:</td>
              <td style="padding: 10px 12px; text-align: right; font-size: 14px; color: #666;">RM ${parseFloat((originalAmount || baseTotal + totalItemDiscount).toString()).toFixed(2)}</td>
            </tr>
            ${promoItemDiscount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 4px 12px; text-align: right; font-size: 13px; color: #666;">Item Discount:</td>
              <td style="padding: 4px 12px; text-align: right; font-size: 13px; color: #dc2626;">-RM ${promoItemDiscount.toFixed(2)}</td>
            </tr>` : ''}
            ${sellerItemDiscount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 4px 12px; text-align: right; font-size: 13px; color: #666;">Seller Price Savings:</td>
              <td style="padding: 4px 12px; text-align: right; font-size: 13px; color: #f59e0b;">-RM ${sellerItemDiscount.toFixed(2)}</td>
            </tr>` : ''}
            ` : ''}
            ${totalDiscount && totalDiscount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 10px 12px; text-align: right; font-size: 14px; color: #f59e0b;">
                ${sellerLevelName || 'Seller'} Tier Discount (${discountPercent || 0}%):
              </td>
              <td style="padding: 10px 12px; text-align: right; font-size: 14px; color: #f59e0b;">-RM ${parseFloat((baseTotal - totalAmount).toString()).toFixed(2)}</td>
            </tr>
            ` : ''}
            ${isFreeShipping ? `
            <tr>
              <td colspan="5" style="padding: 10px 12px; text-align: right; font-size: 14px; color: #3b82f6;">Shipping:</td>
              <td style="padding: 10px 12px; text-align: right; font-size: 14px; color: #3b82f6; font-weight: bold;">FREE</td>
            </tr>
            ` : ''}
            <tr>
              <td colspan="5" style="padding: 15px 12px; text-align: right; font-weight: bold;">TOTAL PAID:</td>
              <td style="padding: 15px 12px; text-align: right; font-weight: bold; color: #f59e0b; font-size: 16px;">RM ${parseFloat(totalAmount.toString()).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; font-size: 14px; line-height: 1.6; color: #333;">
          <p style="margin-top: 0; font-size: 15px;"><strong>Please make sure all the information above is correct.</strong></p>
          <p style="margin-bottom: 0;">If you notice any issues with your order or need further assistance, please contact us immediately. You can reach us at <strong>${process.env.SMTP_USER || 'our email'}</strong>${supportPhone ? ` or WhatsApp us at <strong>${supportPhone}</strong>` : ''}. We are always happy to help!</p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${businessName}" <no-reply@cheng-boom.com>`,
    to: customerInfo.email,
    subject: `Order Confirmation - ${businessName}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Customer receipt email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send customer order email receipt:', error);
  }
};
