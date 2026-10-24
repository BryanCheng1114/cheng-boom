import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, HelpCircle, CreditCard, Check, MapPin, MessageCircle, Upload, ExternalLink, ArrowLeft, AlertTriangle, X, Mail, Download } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useBusiness } from '../../context/BusinessContext';
import { generateWhatsAppLink, OrderDetails } from '../../services/whatsappService';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { OrderCompletionDetails } from './OrderCompletionDetails';

const paymentMethodLabels: Record<string, Record<string, string>> = {
  'Cash on Delivery': { en: 'Cash on Delivery', zh: '货到付款', ms: 'Tunai Semasa' },
  'DuitNow & Bank Transfer': { en: 'DuitNow & Bank Transfer', zh: 'DuitNow与银行转账', ms: 'DuitNow & Pindahan Bank' }
};

const deliveryModeLabels: Record<string, Record<string, string>> = {
  'Self Collect': { en: 'Self Collect', zh: '自取', ms: 'Ambil Sendiri' },
  'Delivery': { en: 'Delivery', zh: '运送', ms: 'Penghantaran' }
};

interface InlineCheckoutDetailsProps {
  step: 'checkout' | 'payment';
  cartItems: any[];
  cartTotals: {
    totalPrice: number;
    totalOriginalPrice: number;
    totalDiscount: number;
    productDiscount: number;
    sellerDiscount: number;
    discountPercent: number;
    sellerLevelName: string;
    isFreeShipping: boolean;
  };
  clearCart: () => void;
  onBack: () => void;
  onProceedPayment: () => void;
  onBackToCheckout: () => void;
  onSuccess: (details: OrderCompletionDetails) => void;
  onStockError?: (productName: string) => void;
}

export function InlineCheckoutDetails({ step, cartItems, cartTotals, clearCart, onBack, onProceedPayment, onBackToCheckout, onSuccess, onStockError }: InlineCheckoutDetailsProps) {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();

  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'DuitNow & Bank Transfer',
    deliveryMode: 'Self Collect',
    address: '',
    notes: '',
    paymentReceiptUrl: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [pdfErrorModalOpen, setPdfErrorModalOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [highlightReceipt, setHighlightReceipt] = useState(false);

  const isCheckoutFormComplete = Boolean(
    cartItems.length > 0 &&
    orderDetails.customerName.trim() &&
    /^01[0-9]{8,9}$/.test(orderDetails.customerPhone) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderDetails.customerEmail || '') &&
    ['Self Collect', 'Delivery'].includes(orderDetails.deliveryMode) &&
    (orderDetails.deliveryMode !== 'Delivery' || orderDetails.address?.trim())
  );
  const isPaymentComplete = ['Cash on Delivery', 'DuitNow & Bank Transfer'].includes(orderDetails.paymentMethod) &&
    (orderDetails.paymentMethod !== 'DuitNow & Bank Transfer' || Boolean(orderDetails.paymentReceiptUrl));

  const downloadDuitNowImage = async () => {
    if (!settings?.bankTransferImage) return;
    try {
      const response = await fetch(settings.bankTransferImage);
      if (!response.ok) throw new Error('Unable to download payment image');
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'duitnow-payment-qr';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(imageUrl);
    } catch {
      window.open(settings.bankTransferImage, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        try {
          const res = await fetch(`/api/customers/${user.id}`);
          if (res.ok) {
            const fullProfile = await res.json();
            const mapPayment = (val: string | null | undefined) => {
              if (!val) return 'DuitNow & Bank Transfer';
              const lower = val.toLowerCase();
              if (lower.includes('cash') || lower.includes('delivery')) return 'Cash on Delivery';
              return 'DuitNow & Bank Transfer';
            };
            const mapDelivery = (val: string | null | undefined) => {
              if (!val) return 'Self Collect';
              return val.toLowerCase().includes('delivery') ? 'Delivery' : 'Self Collect';
            };
            setOrderDetails(prev => ({
              ...prev,
              customerName: fullProfile.name || '',
              customerPhone: fullProfile.phone || '',
              customerEmail: fullProfile.email || '',
              address: fullProfile.address || '',
              paymentMethod: mapPayment(fullProfile.preferredPayment),
              deliveryMode: mapDelivery(fullProfile.orderMode),
              notes: fullProfile.notes || ''
            }));
          } else {
            setOrderDetails(prev => ({
              ...prev,
              customerName: user.name || '',
              customerPhone: user.phone || '',
              customerEmail: user.email || ''
            }));
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      }
    };
    fetchUserProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.type === 'application/pdf') {
      setPdfErrorModalOpen(true);
      e.target.value = '';
      return;
    }
    setIsUploadingReceipt(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formDataObj });
      if (res.ok) {
        const data = await res.json();
        setOrderDetails(prev => ({ ...prev, paymentReceiptUrl: data.urls[0] }));
        setHighlightReceipt(false);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'checkout') {
      if (!isCheckoutFormComplete) return;
      onProceedPayment();
      return;
    }
    if (!isPaymentComplete) {
      if (orderDetails.paymentMethod === 'DuitNow & Bank Transfer') {
        setHighlightReceipt(true);
        receiptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    void handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : {};
      const role = userObj.role || 'Guest';
      const customerId = userObj.id || null;
      const isSeller = typeof window !== 'undefined' && (
        localStorage.getItem('user_role') === 'Seller' || role === 'Seller'
      );

      const orderItemsPayload = cartItems.map(item => ({
        id: item.id,
        cartItemId: item.cartItemId,
        code: item.code,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        quantity: item.quantity,
        variant: item.variant,
        itemsPerBox: item.itemsPerBox
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: {
            name: orderDetails.customerName,
            phone: orderDetails.customerPhone,
            email: orderDetails.customerEmail,
            address: orderDetails.address || (orderDetails.deliveryMode === 'Self Collect' ? 'Self Collect' : ''),
            paymentMethod: orderDetails.paymentMethod,
            deliveryMode: orderDetails.deliveryMode,
            notes: orderDetails.notes,
            paymentReceiptUrl: orderDetails.paymentReceiptUrl,
            role,
            customerId
          },
          items: orderItemsPayload,
          totalAmount: cartTotals.totalPrice,
          originalAmount: cartTotals.totalOriginalPrice,
          totalDiscount: cartTotals.totalDiscount,
          sellerLevelName: cartTotals.sellerLevelName,
          discountPercent: cartTotals.discountPercent,
          isFreeShipping: cartTotals.isFreeShipping
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === 'INSUFFICIENT_STOCK') {
          if (onStockError) {
            onStockError(errorData.productName);
          } else {
            alert(`Insufficient stock for ${errorData.productName}`);
          }
          setIsSubmitting(false);
          return;
        }
        throw new Error('Failed to save order');
      }

      const savedOrder = await response.json().catch(() => ({}));
      clearCart();
      onSuccess({
        paymentMethod: orderDetails.paymentMethod,
        totalAmount: Number(savedOrder.totalAmount ?? cartTotals.totalPrice),
        itemPrice: cartTotals.totalOriginalPrice,
        productDiscount: cartTotals.productDiscount,
        sellerDiscount: cartTotals.sellerDiscount,
        deliveryMode: orderDetails.deliveryMode
      });
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex flex-col lg:flex-row h-full">

            {/* LEFT PANEL: Form */}
            <div className="flex-1 p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-zinc-100">
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={step === 'checkout' ? onBack : onBackToCheckout}
                  className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-zinc-900">{step === 'payment' ? (locale === 'zh' ? '付款详情' : locale === 'ms' ? 'Butiran Pembayaran' : 'Payment Details') : (locale === 'zh' ? '结账详情' : locale === 'ms' ? 'Butiran Semak Keluar' : 'Checkout Details')}</h2>
                  <p className="text-sm text-zinc-500 font-medium mt-1">{step === 'payment' ? (locale === 'zh' ? '选择付款方式并完成付款。' : locale === 'ms' ? 'Pilih kaedah pembayaran dan lengkapkan pembayaran.' : 'Choose how you would like to pay and complete your order.') : t.cart.checkout.desc}</p>
                </div>
              </div>

              <form id="checkout-form" onSubmit={handleFormSubmit} className="space-y-8">
                {step === 'checkout' && <>
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                        <User size={12} className="text-zinc-400" /> {t.cart.checkout.formName}
                      </label>
                      <input type="text" required className="text-zinc-900 w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 outline-none transition-all font-bold text-sm" placeholder={t.cart.checkout.formNamePlaceholder} value={orderDetails.customerName} onChange={(e) => setOrderDetails({ ...orderDetails, customerName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 group w-max">
                        <Phone size={12} className="text-zinc-400" /> {t.cart.checkout.formPhone}
                        <span className="cursor-help flex items-center justify-center w-4 h-4 rounded-full bg-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-300">
                          <HelpCircle size={10} strokeWidth={3} />
                        </span>
                        <div className="absolute bottom-full mb-1.5 left-0 hidden group-hover:block w-[220px] p-2.5 bg-zinc-900 text-white text-[10px] leading-relaxed font-bold rounded-lg shadow-2xl z-[110] normal-case tracking-normal">
                          {locale === 'zh' ? '仅接受马来西亚手机号码格式。' : locale === 'ms' ? 'Hanya format nombor Malaysia diterima.' : 'Only Malaysia number format is accepted.'}
                          <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-zinc-900 rotate-45 rounded-sm" />
                        </div>
                      </label>
                      <input type="tel" required minLength={10} maxLength={15} pattern="^01[0-9]{8,9}$" className="text-zinc-900 w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 outline-none transition-all font-bold text-sm" placeholder="0123456789" value={orderDetails.customerPhone} onChange={(e) => setOrderDetails({ ...orderDetails, customerPhone: e.target.value.replace(/\D/g, '') })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                      <Mail size={12} className="text-zinc-400" /> {locale === 'zh' ? '电子邮件' : locale === 'ms' ? 'Alamat E-mel' : 'Email Address'}
                    </label>
                    <input type="email" required className="text-zinc-900 w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 outline-none transition-all font-bold text-sm" placeholder="you@example.com" value={orderDetails.customerEmail || ''} onChange={(e) => setOrderDetails({ ...orderDetails, customerEmail: e.target.value })} />
                  </div>

                </>}

                {step === 'checkout' ? <>
                  {/* Order Mode */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                      <MapPin size={12} className="text-zinc-400" /> {locale === 'zh' ? '订单方式' : locale === 'ms' ? 'Mod Pesanan' : 'Order Mode'}
                    </label>
                    <div className="flex gap-3">
                      {['Self Collect', 'Delivery'].map((mode) => {
                        const isSelected = orderDetails.deliveryMode === mode;
                        return (
                          <button key={mode} type="button" onClick={() => setOrderDetails({ ...orderDetails, deliveryMode: mode })} className={cn("flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm", isSelected ? "bg-zinc-900 text-white border-zinc-900 shadow-md" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300")}>
                            {deliveryModeLabels[mode]?.[locale as 'en' | 'zh' | 'ms'] || mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <AnimatePresence>
                    {orderDetails.deliveryMode === 'Delivery' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="space-y-2 pt-2">
                          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                            <MapPin size={12} className="text-zinc-400" /> {locale === 'zh' ? '配送地址' : locale === 'ms' ? 'Alamat Penghantaran' : 'Delivery Address'}
                          </label>
                          <textarea required className="text-zinc-900 w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 outline-none transition-all font-medium text-sm resize-none" placeholder={locale === 'zh' ? '请输入完整的配送地址...' : locale === 'ms' ? 'Masukkan alamat penghantaran yang lengkap...' : 'Enter complete delivery address...'} rows={3} value={orderDetails.address || ''} onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                      <MessageCircle size={12} className="text-zinc-400" /> {locale === 'zh' ? '备注（可选）' : locale === 'ms' ? 'Nota (Pilihan)' : 'Notes (Optional)'}
                    </label>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/10 transition-all">
                      <textarea className="bg-transparent text-zinc-800 text-sm w-full resize-none outline-none placeholder:text-zinc-400" placeholder={locale === 'zh' ? '例如：送货前请电话联系...' : locale === 'ms' ? 'cth. Sila hubungi sebelum penghantaran...' : 'e.g. Please call before delivery...'} rows={3} value={orderDetails.notes || ''} onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })} maxLength={100} />
                      <div className="text-right text-zinc-400 text-[10px] font-medium mt-1">{(orderDetails.notes || '').length}/100</div>
                    </div>
                  </div>
                </> : (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-semibold text-zinc-900">{locale === 'zh' ? '费用明细' : locale === 'ms' ? 'Butiran Bayaran' : 'Payment Details'}</h3>
                        <span className="text-xs text-zinc-500">{cartItems.length} {locale === 'zh' ? '种商品' : locale === 'ms' ? 'jenis item' : 'items'}</span>
                      </div>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4"><span className="text-zinc-500">{locale === 'zh' ? '商品金额' : locale === 'ms' ? 'Harga item' : 'Item price'}</span><span className="font-medium text-zinc-900">RM {cartTotals.totalOriginalPrice.toFixed(2)}</span></div>
                        <div className="flex items-center justify-between gap-4"><span className="text-zinc-500">{locale === 'zh' ? '运费' : locale === 'ms' ? 'Caj penghantaran' : 'Shipping'}</span><span className="text-right font-medium text-zinc-700">{orderDetails.deliveryMode === 'Delivery' ? (locale === 'zh' ? '稍后计算' : locale === 'ms' ? 'Akan dikira kemudian' : '-') : 'RM 0.00'}</span></div>
                        <div className="flex items-center justify-between gap-4"><span className="text-zinc-500">{locale === 'zh' ? '折扣' : locale === 'ms' ? 'Diskaun' : 'Discount'}</span><span className="font-medium text-zinc-900">-RM {cartTotals.productDiscount.toFixed(2)}</span></div>
                        {cartTotals.sellerDiscount > 0 && <div className="flex items-center justify-between gap-4"><span className="text-zinc-500">{locale === 'zh' ? '卖家折扣' : locale === 'ms' ? 'Diskaun penjual' : 'Seller discount'}</span><span className="font-medium text-zinc-900">-RM {cartTotals.sellerDiscount.toFixed(2)}</span></div>}
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
                        <span className="font-semibold text-zinc-900">{locale === 'zh' ? '订单总额' : locale === 'ms' ? 'Jumlah keseluruhan' : 'Grand total'}</span>
                        <span className="text-xl font-bold tracking-tight text-zinc-900">RM {cartTotals.totalPrice.toFixed(2)}</span>
                      </div>
                      {orderDetails.deliveryMode === 'Delivery' && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{locale === 'zh' ? '运费尚未计入以上总额，将稍后计算。' : locale === 'ms' ? 'Caj penghantaran belum termasuk dalam jumlah ini dan akan dikira kemudian.' : 'Shipping is not included in this total and will be calculated later.'}</p>}
                    </div>

                    <section className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                        <CreditCard size={17} className="text-zinc-500" />{locale === 'zh' ? '选择付款方式' : locale === 'ms' ? 'Pilih Kaedah Pembayaran' : 'Choose a payment method'}
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {['Cash on Delivery', 'DuitNow & Bank Transfer'].map((method) => {
                          const isSelected = orderDetails.paymentMethod === method;
                          return (
                            <button key={method} type="button" aria-pressed={isSelected} onClick={() => { setOrderDetails((prev) => ({ ...prev, paymentMethod: method, paymentReceiptUrl: method === 'Cash on Delivery' ? '' : prev.paymentReceiptUrl })); setHighlightReceipt(false); }} className={cn('flex min-h-14 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-colors', isSelected ? 'border-zinc-400 bg-zinc-200 text-zinc-900 ring-1 ring-zinc-300' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50')}>
                              {isSelected && <Check size={16} className="text-zinc-700" />}{paymentMethodLabels[method]?.[locale] || method}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {orderDetails.paymentMethod === 'DuitNow & Bank Transfer' ? (
                      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{locale === 'zh' ? 'DuitNow 与银行转账' : locale === 'ms' ? 'DuitNow & Pindahan Bank' : 'DuitNow & Bank Transfer'}</h3>
                          <p className="mt-1 text-sm leading-5 text-slate-600">{locale === 'zh' ? '请按以下资料付款，并上传付款收据。' : locale === 'ms' ? 'Buat pembayaran menggunakan maklumat di bawah dan muat naik resit.' : 'Pay using the details below, then upload your payment receipt.'}</p>
                        </div>
                        {settings?.bankTransferImage ? <figure className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6"><button type="button" onClick={() => setZoomedImage(settings.bankTransferImage || null)} className="group block w-full cursor-zoom-in rounded-lg bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500" aria-label={locale === 'zh' ? '放大查看 DuitNow 图片' : locale === 'ms' ? 'Klik untuk besarkan imej DuitNow' : 'View DuitNow image larger'}><img src={settings.bankTransferImage} alt="DuitNow payment QR code" className="mx-auto max-h-[min(65vh,520px)] w-full object-contain transition-transform group-hover:scale-[1.01]" /><span className="mt-3 block text-center text-xs text-zinc-500">{locale === 'zh' ? '点击放大查看' : locale === 'ms' ? 'Klik untuk lihat lebih besar' : 'Click to view larger'}</span></button><button type="button" onClick={downloadDuitNowImage} className="mx-auto mt-3 flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"><Download size={16} />{locale === 'zh' ? '下载图片' : locale === 'ms' ? 'Muat Turun Imej' : 'Download image'}</button></figure> : <p className="rounded-xl border border-zinc-200 bg-zinc-100 p-3 text-sm text-zinc-700">{locale === 'zh' ? '付款资料暂不可用，请联系商店。' : locale === 'ms' ? 'Maklumat pembayaran belum tersedia. Sila hubungi kedai.' : 'Payment details are not available yet. Please contact the store.'}</p>}
                        <div className="space-y-2" ref={receiptRef}>
                          <label className="block text-sm font-medium text-slate-700">{locale === 'zh' ? '付款收据' : locale === 'ms' ? 'Resit Pembayaran' : 'Payment receipt'} <span className="text-rose-600">*</span></label>
                          {orderDetails.paymentReceiptUrl ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-100 p-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-emerald-800"><Check size={17} />{locale === 'zh' ? '收据已上传' : locale === 'ms' ? 'Resit dimuat naik' : 'Receipt uploaded'}</div>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => window.open(orderDetails.paymentReceiptUrl, '_blank')} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-200"><ExternalLink size={14} className="mr-1 inline" />{locale === 'zh' ? '查看' : locale === 'ms' ? 'Lihat' : 'View'}</button>
                                <button type="button" onClick={() => document.getElementById('receipt-upload')?.click()} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-200"><Upload size={14} className="mr-1 inline" />{locale === 'zh' ? '更改' : locale === 'ms' ? 'Tukar' : 'Replace'}</button>
                              </div>
                            </div>
                          ) : (
                            <button type="button" onClick={() => document.getElementById('receipt-upload')?.click()} disabled={isUploadingReceipt} className={cn('flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-zinc-100 p-5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-200', highlightReceipt ? 'border-rose-500 bg-rose-50' : 'border-zinc-300')}>
                              {isUploadingReceipt ? <span className="h-6 w-6 animate-spin border-2 border-zinc-300 border-t-zinc-700" /> : <Upload size={22} className="text-zinc-600" />}
                              <span>{isUploadingReceipt ? (locale === 'zh' ? '上传中...' : locale === 'ms' ? 'Sedang dimuat naik...' : 'Uploading receipt...') : (locale === 'zh' ? '选择收据图片' : locale === 'ms' ? 'Pilih imej resit' : 'Choose receipt image')}</span>
                              <span className="text-xs text-zinc-500">JPG, PNG or WEBP</span>
                            </button>
                          )}
                          <input id="receipt-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleReceiptUpload} disabled={isUploadingReceipt} className="hidden" />
                        </div>
                      </section>
                    ) : (
                      <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-sm text-zinc-700"><Check size={17} className="mt-0.5 shrink-0 text-yellow-700" /><p>{locale === 'zh' ? '您选择了货到付款。取货或收到订单时付款。' : locale === 'ms' ? 'Anda memilih tunai semasa penghantaran. Bayaran dibuat semasa menerima pesanan.' : 'You selected Cash on Delivery. Payment will be collected when you receive your order.'}</p></div>
                    )}
                  </div>
                )}
                {step === 'payment' && (
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingReceipt || !isPaymentComplete}
                    className={cn('mt-2 flex w-full items-center justify-center gap-2 rounded-full border px-6 py-4 text-base font-semibold transition-colors', isSubmitting || isUploadingReceipt || !isPaymentComplete ? 'cursor-not-allowed border-zinc-200 bg-zinc-200 text-zinc-500' : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800')}
                  >
                    {isSubmitting ? <span className="h-5 w-5 animate-spin border-2 border-white/30 border-t-white" /> : <Check size={18} />}
                    {isSubmitting ? (locale === 'zh' ? '处理中...' : locale === 'ms' ? 'Sedang Diproses...' : 'Processing...') : (locale === 'zh' ? '完成订单' : locale === 'ms' ? 'Lengkapkan Pesanan' : 'Complete Order')}
                  </button>
                )}
              </form>
            </div>

            {/* RIGHT PANEL: Order Summary & Submit */}
            {step === 'checkout' && <div className="w-full bg-zinc-50/50 p-6 sm:p-10 lg:w-[480px] lg:p-12 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-zinc-900 mb-6">{locale === 'zh' ? '订单摘要' : locale === 'ms' ? 'Ringkasan Pesanan' : 'Order Summary'}</h3>

                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mb-8">
                  {cartItems.map((item, idx) => (
                    <div key={item.id + idx} className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-zinc-100 shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-sm text-zinc-900 truncate">{item.name}</h4>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">{locale === 'zh' ? '数量' : locale === 'ms' ? 'Kuantiti' : 'Qty'}: {item.quantity}</p>
                      </div>
                      <div className="font-bold text-sm text-zinc-900">
                        RM {item.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">{locale === 'zh' ? '小计' : locale === 'ms' ? 'Jumlah Kecil' : 'Subtotal'}</span>
                    <span className="text-zinc-900 font-bold">RM {cartTotals.totalOriginalPrice.toFixed(2)}</span>
                  </div>
                  {cartTotals.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 font-medium">{locale === 'zh' ? '折扣' : locale === 'ms' ? 'Diskaun' : 'Discount'}</span>
                      <span className="text-zinc-900 font-bold">-RM {cartTotals.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {orderDetails.deliveryMode === 'Delivery' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 font-medium">{locale === 'zh' ? '运费' : locale === 'ms' ? 'Caj penghantaran' : 'Shipping'}</span>
                      <span className="text-right font-semibold text-zinc-700">{locale === 'zh' ? '稍后计算' : locale === 'ms' ? 'Akan dikira kemudian' : '-'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={cn('border-zinc-200', step === 'checkout' ? 'pt-8 mt-8 border-t' : 'mt-auto')}>
                {step === 'checkout' && <div className="flex justify-between items-end mb-8">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">{locale === 'zh' ? '总金额' : locale === 'ms' ? 'Jumlah Keseluruhan' : 'Total Amount'}</span>
                    <span className="text-[10px] font-bold text-zinc-400">{locale === 'zh' ? '结账时显示的最终价格' : locale === 'ms' ? 'Harga akhir dipaparkan semasa semak keluar' : 'Final price shown at checkout'}</span>
                  </div>
                  <span className="text-3xl font-black text-zinc-900 whitespace-nowrap ml-4">RM {cartTotals.totalPrice.toFixed(2)}</span>
                </div>}


                <button
                  form="checkout-form"
                  type="submit"
                  disabled={isSubmitting || isUploadingReceipt || (step === 'checkout' ? !isCheckoutFormComplete : !isPaymentComplete)}
                  className={cn('w-full flex items-center justify-center gap-2 rounded-full border px-5 py-4 text-base font-semibold transition-colors', (isSubmitting || isUploadingReceipt || (step === 'checkout' ? !isCheckoutFormComplete : !isPaymentComplete)) ? 'cursor-not-allowed border-zinc-200 bg-zinc-200 text-zinc-500' : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800')}
                >
                  {isSubmitting ? <span className="h-5 w-5 animate-spin border-2 border-white/30 border-t-white" /> : step === 'checkout' ? <CreditCard size={18} /> : <Check size={18} />}
                  {isSubmitting ? (locale === 'zh' ? '处理中...' : locale === 'ms' ? 'Sedang Diproses...' : 'Processing...') : step === 'checkout' ? (locale === 'zh' ? '前往付款' : locale === 'ms' ? 'Teruskan ke Pembayaran' : 'Proceed to Payment') : (locale === 'zh' ? '完成订单' : locale === 'ms' ? 'Lengkapkan Pesanan' : 'Complete Order')}
                </button>
              </div>
            </div>}
          </div>
        </div>

        {pdfErrorModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-2">PDF Not Supported</h3>
              <p className="text-sm text-zinc-500 font-medium mb-8">Please upload an image file (JPG, PNG) of your receipt instead of a PDF document.</p>
              <button onClick={() => setPdfErrorModalOpen(false)} className="w-full py-3.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors">
                Got it
              </button>
            </div>
          </div>
        )}


      </div>

      {/* ── GUIDANCE MODAL ────────────────────────────────────────── */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={() => setIsGuideOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden border border-zinc-200  animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
            <button onClick={() => setIsGuideOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full hover:bg-zinc-100 transition-colors z-20 text-zinc-500"><X size={20} className="sm:w-6 sm:h-6" /></button>
            <div className="p-5 sm:p-12 overflow-y-auto text-center custom-scrollbar">
              <h2 className="text-xl sm:text-3xl font-black text-zinc-900 mb-5 sm:mb-8">{locale === 'zh' ? '下单指南' : locale === 'ms' ? 'Panduan Pesanan' : 'Ordering Guide'}</h2>
              <div className="space-y-4 sm:space-y-12 text-left">
                <div className="space-y-2.5 sm:space-y-4 bg-zinc-50 sm:bg-transparent p-4 rounded-2xl sm:p-0 sm:rounded-none border border-zinc-100 sm:border-transparent">
                  <h3 className="text-[14px] sm:text-xl font-bold flex items-center gap-2.5 sm:gap-3 text-zinc-900"><span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-xs sm:text-base shrink-0">1</span> {locale === 'zh' ? '自动跳转到 WhatsApp' : locale === 'ms' ? 'Hala ke WhatsApp' : 'Redirect to WhatsApp'}</h3>
                  <p className="text-[12px] sm:text-base text-zinc-500 leading-relaxed pl-8 sm:pl-11">{locale === 'zh' ? '点击确认后，您将被直接带到 WhatsApp，我们已为您自动填好包含订单详细信息的消息。' : locale === 'ms' ? 'Selepas pengesahan, anda akan dibawa ke WhatsApp. Mesej mengandungi butiran pesanan anda akan diisi secara automatik.' : 'After confirming, you will be taken to WhatsApp where your message containing order details will be automatically filled.'}</p>
                  <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-200  shadow-sm relative cursor-zoom-in group mt-2 sm:mt-0" onClick={() => setZoomedImage('/ordering guide/image1.png')}><img src="/ordering guide/image1.png" alt="Guide Step 1" className="w-full h-auto object-contain bg-white group-hover:scale-105 transition-transform duration-500" /></div>
                </div>
                <div className="space-y-2.5 sm:space-y-4 bg-zinc-50 sm:bg-transparent p-4 rounded-2xl sm:p-0 sm:rounded-none border border-zinc-100 sm:border-transparent">
                  <h3 className="text-[14px] sm:text-xl font-bold flex items-center gap-2.5 sm:gap-3 text-zinc-900"><span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-xs sm:text-base shrink-0">2</span> {locale === 'zh' ? '发送信息' : locale === 'ms' ? 'Hantar Mesej' : 'Send the Message'}</h3>
                  <p className="text-[12px] sm:text-base text-zinc-500 leading-relaxed pl-8 sm:pl-11">{locale === 'zh' ? '只需在 WhatsApp 中点击“发送”即可！为确保系统准确处理，请不要修改任何预填文本。' : locale === 'ms' ? 'Hanya klik "Hantar" di WhatsApp! Jangan ubah sebarang teks pramuat untuk memastikan pemprosesan yang tepat.' : 'Simply click "Send" in WhatsApp! Please do not modify the pre-filled text to ensure your order is processed accurately.'}</p>
                  <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-200  shadow-sm relative cursor-zoom-in group mt-2 sm:mt-0" onClick={() => setZoomedImage('/ordering guide/image2.png')}><img src="/ordering guide/image2.png" alt="Guide Step 2" className="w-full h-auto object-contain bg-white group-hover:scale-105 transition-transform duration-500" /></div>
                </div>
                <div className="space-y-2.5 sm:space-y-4 bg-zinc-50 sm:bg-transparent p-4 rounded-2xl sm:p-0 sm:rounded-none border border-zinc-100 sm:border-transparent">
                  <h3 className="text-[14px] sm:text-xl font-bold flex items-center gap-2.5 sm:gap-3 text-zinc-900"><span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-xs sm:text-base shrink-0">3</span> {locale === 'zh' ? '等待客服确认' : locale === 'ms' ? 'Tunggu Pengesahan Peniaga' : 'Wait for Dealer Confirmation'}</h3>
                  <p className="text-[12px] sm:text-base text-zinc-500 leading-relaxed pl-8 sm:pl-11">{locale === 'zh' ? '我们的客服将在 24 小时内回复您，处理您的订单并完成交易。请耐心等待，我们会尽快与您对接！' : locale === 'ms' ? 'Peniaga kami akan membalas dalam masa 24 jam untuk memproses pesanan anda. Sila tunggu dengan sabar sementara kami menyelesaikan urusan dengan anda!' : 'Our dealer will reply within 24 hours to process your order and complete the deal. Please wait patiently as we will assist you very soon!'}</p>
                </div>
              </div>
              <button onClick={() => setIsGuideOpen(false)} className="w-full mt-6 sm:mt-10 py-3.5 sm:py-5 bg-zinc-900 text-white rounded-xl sm:rounded-[20px] font-black text-[14px] sm:text-lg transition-all shadow-lg hover:shadow-zinc-900/20 hover:brightness-110 active:scale-[0.98]">{locale === 'zh' ? '知道了！' : locale === 'ms' ? 'Faham!' : 'Got it!'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE LIGHTBOX ────────────────────────────────────────── */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8" onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-900 transition-all duration-200 z-10"><X size={20} /></button>
          {settings?.bankTransferImage === zoomedImage && <button type="button" onClick={(event) => { event.stopPropagation(); void downloadDuitNowImage(); }} className="absolute right-16 top-4 flex h-10 items-center gap-2 rounded-full border border-zinc-600 bg-zinc-800 px-4 text-sm font-medium text-white hover:bg-zinc-700 sm:right-20 sm:top-6"><Download size={16} />{locale === 'zh' ? '下载' : locale === 'ms' ? 'Muat Turun' : 'Download'}</button>}
          <div className="relative flex max-h-[90vh] w-full max-w-6xl items-center justify-center overflow-hidden rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}><img src={zoomedImage} alt="Zoomed Preview" className="h-auto max-h-[90vh] w-auto max-w-full object-contain" /></div>
        </div>
      )}

    </>
  );
}
