import { CartItem } from '../components/cart/CartProvider';

const WHATSAPP_NUMBER = '601112269835';

export interface OrderDetails {
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  deliveryMode: string;
  address?: string;
  notes?: string;
}

type Locale = 'en' | 'zh' | 'ms';

const labels = {
  en: {
    header:       'NEW ORDER REQUEST — CHENG-BOOM',
    customer:     'CUSTOMER DETAILS',
    name:         'Name',
    phone:        'Phone',
    payment:      'Payment Method',
    mode:         'Order Mode',
    address:      'Delivery Address',
    notes:        'Notes',
    items:        'ORDER ITEMS',
    packingList:  'PACKING LIST (FOR SHOP)',
    no:           'No.',
    code:         'Item Code',
    qty:          'Qty',
    unitPrice:    'Unit Price',
    original:     'Original Price',
    discounted:   'Discounted',
    subtotal:     'Subtotal',
    originalTotal:'Total (Before Discount)',
    savings:      'Total Savings',
    total:        'TOTAL PAYABLE',
    closing:      'Kindly confirm my order and provide the payment details or QR code at your earliest convenience. Thank you.',
  },
  zh: {
    header:       '新订单请求 — CHENG-BOOM',
    customer:     '客户信息',
    name:         '姓名',
    phone:        '电话',
    payment:      '付款方式',
    mode:         '取货方式',
    address:      '送货地址',
    notes:        '备注',
    items:        '订单明细',
    packingList:  '装箱单 (供商店使用)',
    no:           '序号',
    code:         '产品编号',
    qty:          '数量',
    unitPrice:    '单价',
    original:     '原价',
    discounted:   '已折扣',
    subtotal:     '小计',
    originalTotal:'折扣前总额',
    savings:      '总节省',
    total:        '应付总额',
    closing:      '烦请确认我的订单并提供付款详情或二维码，谢谢。',
  },
  ms: {
    header:       'PERMINTAAN PESANAN BARU — CHENG-BOOM',
    customer:     'MAKLUMAT PELANGGAN',
    name:         'Nama',
    phone:        'Telefon',
    payment:      'Kaedah Pembayaran',
    mode:         'Mod Pesanan',
    address:      'Alamat Penghantaran',
    notes:        'Nota',
    items:        'BUTIRAN PESANAN',
    packingList:  'SENARAI PEMBUNGKUSAN (UNTUK KEDAI)',
    no:           'No.',
    code:         'Kod Produk',
    qty:          'Kuantiti',
    unitPrice:    'Harga Seunit',
    original:     'Harga Asal',
    discounted:   'Didiskaun',
    subtotal:     'Subjumlah',
    originalTotal:'Jumlah (Sebelum Diskaun)',
    savings:      'Jumlah Penjimatan',
    total:        'JUMLAH PERLU DIBAYAR',
    closing:      'Sila sahkan pesanan saya dan berikan butiran pembayaran atau kod QR. Terima kasih.',
  },
};

export const generateWhatsAppLink = (
  items: CartItem[],
  totalPrice: number,
  details: OrderDetails,
  locale: Locale = 'en',
  isSeller: boolean = false
): string => {
  const l = labels[locale] || labels.en;

  const date = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  // --- Header ---
  let msg = `*${l.header}*\n`;
  msg += `${date}  |  ${time}\n`;
  msg += `${divider}\n\n`;

  // --- Customer ---
  msg += `*${l.customer}*\n`;
  msg += `${l.name}: ${details.customerName}\n`;
  msg += `${l.phone}: ${details.customerPhone}\n`;
  msg += `${l.payment}: ${details.paymentMethod}\n`;
  msg += `${l.mode}: ${details.deliveryMode}\n`;
  if (details.deliveryMode === 'Delivery' && details.address) {
    msg += `${l.address}: ${details.address}\n`;
  }
  if (details.notes) {
    msg += `${l.notes}: ${details.notes}\n`;
  }
  msg += `\n${divider}\n\n`;

  // --- Items ---
  msg += `*${l.items}*\n\n`;

  items.forEach((item, idx) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    msg += `*${idx + 1}. ${item.name}*\n`;
    if (item.code) {
      msg += `   ${l.code}: \`${item.code}\`\n`;
    }
    msg += `   ${l.qty}: ${item.quantity}\n`;
    msg += `   ${l.unitPrice}: RM ${item.price.toFixed(2)}\n`;
    if (item.originalPrice && item.originalPrice > item.price) {
      msg += `   ${l.original}: RM ${item.originalPrice.toFixed(2)} _(${l.discounted})_\n`;
    }
    msg += `   ${l.subtotal}: *RM ${itemTotal}*\n\n`;
  });

  // --- Packing List (For Shop) ---
  msg += `${divider}\n`;
  msg += `📦 *${l.packingList}*\n\n`;
  
  // Create a simple text-based table
  // Headers
  const noHeader = l.no.padEnd(4);
  const codeHeader = l.code.padEnd(12);
  const qtyHeader = l.qty;
  
  msg += `\`${noHeader}| ${codeHeader}| ${qtyHeader}\`\n`;
  msg += `\`--------------------------\`\n`;
  
  items.forEach((item, idx) => {
    const noStr = `${idx + 1}`.padEnd(4);
    const codeStr = (item.code || '-').padEnd(12);
    const qtyStr = `${item.quantity}`;
    msg += `\`${noStr}| ${codeStr}| ${qtyStr}\`\n`;
  });
  msg += `\n`;

  // --- Summary ---
  const totalOriginal = items.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const savings = totalOriginal - totalPrice;

  msg += `${divider}\n`;
  if (savings > 0) {
    msg += `${l.originalTotal}: RM ${totalOriginal.toFixed(2)}\n`;
    msg += `${l.savings}: *RM ${savings.toFixed(2)}*\n`;
  }
  
  if (isSeller) {
    msg += `⭐ *Seller Discount Applied (15%)*\n`;
  }

  msg += `\n*${l.total}: RM ${totalPrice.toFixed(2)}*\n\n`;

  // --- Closing ---
  msg += `${divider}\n`;
  msg += `${l.closing}`;

  const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
};
