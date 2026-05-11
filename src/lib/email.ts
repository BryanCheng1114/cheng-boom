import nodemailer from 'nodemailer';

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

export const sendOrderReceiptEmail = async (order: any, customerInfo: any, items: any[], totalAmount: number) => {
  // If no password is set, log a warning and skip to prevent crashing
  if (!process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP_PASS is not set in .env. Order email receipt was NOT sent.');
    return;
  }

  const date = new Date().toLocaleString('en-MY', { 
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const itemsHtml = items.map((item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">
        <strong>${item.name}</strong><br/>
        <span style="color: #666; font-size: 12px;">Code: ${item.code || '-'}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right;">RM ${parseFloat(item.price).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right;">RM ${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #09090b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #f59e0b; margin: 0; font-style: italic; font-weight: 900;">CHENG-BOOM</h1>
        <p style="color: #fff; margin: 5px 0 0 0; letter-spacing: 2px; font-size: 12px;">NEW ORDER NOTIFICATION</p>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #666; font-size: 14px; text-align: right; margin-top: 0;">Date: ${date}</p>
        
        <h2 style="font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block;">Customer Details</h2>
        <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
          <tr><td style="padding: 4px 0; width: 120px; color: #666;">Name:</td><td><strong>${customerInfo.name}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Phone:</td><td><strong>${customerInfo.phone}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Payment:</td><td>${customerInfo.paymentMethod}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Mode:</td><td>${customerInfo.deliveryMode}</td></tr>
          ${customerInfo.deliveryMode === 'Delivery' ? `<tr><td style="padding: 4px 0; color: #666;">Address:</td><td>${customerInfo.address}</td></tr>` : ''}
          ${customerInfo.notes ? `<tr><td style="padding: 4px 0; color: #666;">Notes:</td><td style="color: #dc2626;">${customerInfo.notes}</td></tr>` : ''}
        </table>

        <h2 style="font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; display: inline-block;">Order Items</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f4f4f5;">
              <th style="padding: 10px; text-align: left;">No.</th>
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Unit Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="padding: 15px 12px; text-align: right; font-weight: bold;">TOTAL PAYABLE:</td>
              <td style="padding: 15px 12px; text-align: right; font-weight: bold; color: #f59e0b; font-size: 16px;">RM ${parseFloat(totalAmount.toString()).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; font-size: 14px;">
          <strong>Action Required:</strong> Check WhatsApp to follow up with the customer at <strong>${customerInfo.phone}</strong> to confirm payment and arrangements.
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: '"Cheng-BOOM System" <no-reply@cheng-boom.com>',
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
