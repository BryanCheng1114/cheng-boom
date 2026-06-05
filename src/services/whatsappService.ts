import { CartItem } from '../components/cart/CartProvider';

const WHATSAPP_NUMBER = '601112269835';

export interface OrderDetails {
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  deliveryMode: string;
  address?: string;
  notes?: string;
  role?: string;
  paymentReceiptUrl?: string;
}

type Locale = 'en' | 'zh' | 'ms';

const labels = {
  en: {
    header:       'NEW ORDER REQUEST — {BUSINESS}',
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
    receipt:      'Payment Receipt',
    closing:      'Kindly confirm my order at your earliest convenience. Thank you.',
  },
  zh: {
    header:       '新订单请求 — {BUSINESS}',
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
    receipt:      '付款收据',
    closing:      '烦请确认我的订单，谢谢。',
  },
  ms: {
    header:       'PERMINTAAN PESANAN BARU — {BUSINESS}',
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
    receipt:      'Resit Pembayaran',
    closing:      'Sila sahkan pesanan saya. Terima kasih.',
  },
};

export const generateWhatsAppLink = (
  items: CartItem[],
  totalPrice: number,
  details: OrderDetails,
  locale: Locale = 'en',
  isSeller: boolean = false,
  businessName: string = 'CHENG-BOOM',
  whatsappNumber: string = '601112269835',
  sellerLevelName: string = '',
  discountPercent: number = 0,
  isFreeShipping: boolean = false
): string => {
  const l = labels[locale] || labels.en;

  const date = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  // --- Header ---
  let msg = `*${l.header.replace('{BUSINESS}', businessName.toUpperCase())}*\n`;
  msg += `${date}  |  ${time}\n`;
  msg += `${divider}\n\n`;

  // --- Customer ---
  msg += `*${l.customer}*\n`;
  const accountType = isSeller && sellerLevelName ? sellerLevelName : (details.role || 'Guest');
  msg += `Account Type: ${accountType}\n`;
  msg += `${l.name}: ${details.customerName}\n`;
  msg += `${l.phone}: ${details.customerPhone}\n`;
  msg += `${l.payment}: ${details.paymentMethod}\n`;
  if (details.paymentReceiptUrl) {
    msg += `${l.receipt}:\n${details.paymentReceiptUrl}\n`;
  }
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

  // --- Summary ---
  const totalOriginal = items.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const baseTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemSavings = totalOriginal - baseTotal;
  const sellerDiscountVal = baseTotal - totalPrice;

  msg += `${divider}\n`;
  msg += `${l.originalTotal}: RM ${totalOriginal.toFixed(2)}\n`;

  if (itemSavings > 0) {
    msg += `Item Discount: *-RM ${itemSavings.toFixed(2)}*\n`;
  }

  if (sellerDiscountVal > 0) {
    const savingsLabel = isSeller 
      ? (locale === 'zh' ? `${sellerLevelName || '卖家'}折扣 (${discountPercent}%)` : locale === 'ms' ? `Diskaun ${sellerLevelName || 'Penjual'} (${discountPercent}%)` : `${sellerLevelName || 'Seller'} Discount (${discountPercent}%)`)
      : l.savings;
    msg += `${savingsLabel}: *-RM ${sellerDiscountVal.toFixed(2)}*\n`;
  }
  
  if (isFreeShipping) {
    msg += `Shipping: *FREE*\n`;
  }

  msg += `\n*${l.total}: RM ${totalPrice.toFixed(2)}*\n\n`;

  // --- Closing ---
  msg += `${divider}\n`;
  
  let dynamicClosing = l.closing;
  
  if (details.paymentMethod === 'Cash on Delivery') {
    if (locale === 'zh') dynamicClosing = '烦请确认我的订单并安排发货，谢谢。';
    else if (locale === 'ms') dynamicClosing = 'Sila sahkan pesanan saya dan uruskan penghantaran. Terima kasih.';
    else dynamicClosing = 'Please confirm my order and arrange the delivery. Thank you.';
  } else if (details.paymentMethod === 'TNG eWallet' || details.paymentMethod === 'TNG DuitNow') {
    if (details.paymentReceiptUrl) {
      if (locale === 'zh') dynamicClosing = '烦请确认我的订单，我已附上 TNG 付款收据，请查收并处理我的订单，谢谢。';
      else if (locale === 'ms') dynamicClosing = 'Sila sahkan pesanan saya, saya telah melampirkan resit pembayaran TNG, sila semak dan proses pesanan saya. Terima kasih.';
      else dynamicClosing = 'Please confirm my order, I have attached the TNG payment receipt, kindly check and process my order. Thank you.';
    } else {
      if (locale === 'zh') dynamicClosing = '烦请确认我的订单并提供您的 TNG 二维码或账户信息，谢谢。';
      else if (locale === 'ms') dynamicClosing = 'Sila sahkan pesanan saya dan berikan kod QR TNG atau butiran akaun anda. Terima kasih.';
      else dynamicClosing = 'Please confirm my order and provide your TNG QR code or account details. Thank you.';
    }
  } else if (details.paymentMethod === 'Bank Transfer') {
    if (details.paymentReceiptUrl) {
      if (locale === 'zh') dynamicClosing = '烦请确认我的订单，我已附上付款收据，请查收并处理我的订单，谢谢。';
      else if (locale === 'ms') dynamicClosing = 'Sila sahkan pesanan saya, saya telah melampirkan resit pembayaran, sila semak dan proses pesanan saya. Terima kasih.';
      else dynamicClosing = 'Please confirm my order, I have attached the payment receipt, kindly check and process my order. Thank you.';
    } else {
      if (locale === 'zh') dynamicClosing = '烦请确认我的订单并提供您的银行账户信息，谢谢。';
      else if (locale === 'ms') dynamicClosing = 'Sila sahkan pesanan saya dan berikan maklumat akaun bank anda. Terima kasih.';
      else dynamicClosing = 'Please confirm my order and provide your bank account information. Thank you.';
    }
  }

  msg += `${dynamicClosing}`;

  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
};
