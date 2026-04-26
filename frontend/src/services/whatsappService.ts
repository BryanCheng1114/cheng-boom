import { CartItem } from '../components/cart/CartProvider';

const WHATSAPP_NUMBER = '01112269835';

export interface OrderDetails {
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  deliveryMode: string;
  address?: string;
  notes?: string;
}

export const generateWhatsAppLink = (items: CartItem[], totalPrice: number, details: OrderDetails): string => {
  const date = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

  let greeting = `🚀 *CHENG-BOOM NEW ORDER REQUEST*\n`;
  greeting += `📅 Date: ${date} | ⏰ Time: ${time}\n`;
  greeting += `------------------------------------------\n\n`;
  
  greeting += `👤 *CUSTOMER DETAILS*\n`;
  greeting += `   Name: ${details.customerName}\n`;
  greeting += `   Phone: ${details.customerPhone}\n`;
  greeting += `   Payment: ${details.paymentMethod}\n`;
  greeting += `   Mode: ${details.deliveryMode}\n`;
  if (details.deliveryMode === 'Delivery' && details.address) {
    greeting += `   Address: ${details.address}\n`;
  }
  if (details.notes) {
    greeting += `   Notes: ${details.notes}\n`;
  }
  greeting += `\n------------------------------------------\n\n`;
  greeting += `🛒 *ORDER ITEMS*\n`;
  
  const itemList = items.map((item) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    let line = `📦 *${item.name}*\n`;
    line += `   Quantity: ${item.quantity}\n`;
    line += `   Unit Price: RM ${item.price.toFixed(2)}\n`;
    if (item.originalPrice && item.originalPrice > item.price) {
      line += `   _Original: RM ${item.originalPrice.toFixed(2)}_ (Discounted)\n`;
    }
    line += `   *Subtotal: RM ${itemTotal}*\n`;
    return line;
  }).join('\n');
  
  const totalOriginal = items.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const savings = totalOriginal - totalPrice;

  let summary = `\n------------------------------------------\n`;
  if (savings > 0) {
    summary += `💰 *Total Original Price: RM ${totalOriginal.toFixed(2)}*\n`;
    summary += `🔥 *Total Savings: RM ${savings.toFixed(2)}*\n`;
  }
  summary += `⭐ *TOTAL PAYABLE: RM ${totalPrice.toFixed(2)}*\n\n`;
  
  const ending = `Please confirm my order and provide the payment details/QR code. Thank you!`;
  
  const message = encodeURIComponent(greeting + itemList + summary + ending);
  
  const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '');
  let formattedNumber = cleanNumber;
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '60' + formattedNumber.substring(1);
  }
  
  return `https://wa.me/${formattedNumber}?text=${message}`;
};
