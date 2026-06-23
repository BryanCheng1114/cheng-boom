import React, { useState, useEffect } from 'react';
import { User, Phone, HelpCircle, CreditCard, Check, MapPin, MessageCircle, Upload, ExternalLink, ArrowLeft, ShieldCheck, Tag, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useBusiness } from '../../context/BusinessContext';
import { generateWhatsAppLink, OrderDetails } from '../../services/whatsappService';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const paymentMethodLabels: Record<string, Record<string, string>> = {
  'Cash on Delivery': { en: 'Cash on Delivery', zh: '货到付款', ms: 'Tunai Semasa' },
  'DuitNow & Bank Transfer': { en: 'DuitNow & Bank Transfer', zh: 'DuitNow与银行转账', ms: 'DuitNow & Pindahan Bank' }
};

const deliveryModeLabels: Record<string, Record<string, string>> = {
  'Self Collect': { en: 'Self Collect', zh: '自取', ms: 'Ambil Sendiri' },
  'Delivery': { en: 'Delivery', zh: '运送', ms: 'Penghantaran' }
};

interface InlineCheckoutDetailsProps {
  cartItems: any[];
  cartTotals: {
    totalPrice: number;
    totalOriginalPrice: number;
    totalDiscount: number;
    discountPercent: number;
    sellerLevelName: string;
    isFreeShipping: boolean;
  };
  clearCart: () => void;
  onBack: () => void;
  onSuccess: () => void;
  onStockError?: (productName: string) => void;
}

export function InlineCheckoutDetails({ cartItems, cartTotals, clearCart, onBack, onSuccess, onStockError }: InlineCheckoutDetailsProps) {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();

  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'DuitNow & Bank Transfer',
    deliveryMode: 'Self Collect',
    address: '',
    notes: '',
    paymentReceiptUrl: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppTermsAgreed, setIsWhatsAppTermsAgreed] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [pdfErrorModalOpen, setPdfErrorModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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
              address: fullProfile.address || '',
              paymentMethod: mapPayment(fullProfile.preferredPayment),
              deliveryMode: mapDelivery(fullProfile.orderMode),
              notes: fullProfile.notes || ''
            }));
          } else {
            setOrderDetails(prev => ({
              ...prev,
              customerName: user.name || '',
              customerPhone: user.phone || ''
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

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const role = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').role : 'Guest';
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
            address: orderDetails.address || (orderDetails.deliveryMode === 'Self Collect' ? 'Self Collect' : ''),
            paymentMethod: orderDetails.paymentMethod,
            deliveryMode: orderDetails.deliveryMode,
            notes: orderDetails.notes,
            paymentReceiptUrl: orderDetails.paymentReceiptUrl,
            role
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

      const url = generateWhatsAppLink(
        orderItemsPayload,
        cartTotals.totalPrice,
        { ...orderDetails, role },
        locale as 'en' | 'zh' | 'ms',
        isSeller,
        settings?.businessName,
        settings?.whatsapp ?? undefined,
        cartTotals.sellerLevelName,
        cartTotals.discountPercent,
        cartTotals.isFreeShipping
      );
      window.open(url, '_blank');

      clearCart();
      onSuccess();
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
      <div className="bg-white border-double border-[6px] border-zinc-200/60 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col lg:flex-row h-full">
          
          {/* LEFT PANEL: Form */}
          <div className="flex-1 p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-zinc-100">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={onBack}
                className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900">Checkout Details</h2>
                <p className="text-sm text-zinc-500 font-medium mt-1">{t.cart.checkout.desc}</p>
              </div>
            </div>

            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-8">
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
                  <input type="tel" required pattern="^(\+?601|01)[0-9]{8,9}$" className="text-zinc-900 w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 outline-none transition-all font-bold text-sm" placeholder={t.cart.checkout.formPhonePlaceholder} value={orderDetails.customerPhone} onChange={(e) => setOrderDetails({ ...orderDetails, customerPhone: e.target.value })} />
                </div>
              </div>

              {/* Order Mode */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  <MapPin size={12} className="text-zinc-400" /> Order Mode
                </label>
                <div className="flex gap-3">
                  {['Self Collect', 'Delivery'].map((mode) => {
                    const isSelected = orderDetails.deliveryMode === mode;
                    return (
                      <button key={mode} type="button" onClick={() => setOrderDetails({ ...orderDetails, deliveryMode: mode })} className={cn("flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm", isSelected ? "bg-zinc-900 text-white border-zinc-900 shadow-md" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300")}>
                        {deliveryModeLabels[mode]?.[locale as 'en'|'zh'|'ms'] || mode}
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
                        <MapPin size={12} className="text-zinc-400" /> Delivery Address
                      </label>
                      <textarea required className="text-zinc-900 w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 outline-none transition-all font-medium text-sm resize-none" placeholder="Enter complete delivery address..." rows={3} value={orderDetails.address || ''} onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Payment Method */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  <CreditCard size={12} className="text-zinc-400" /> {t.cart.checkout.paymentTitle}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Cash on Delivery', 'DuitNow & Bank Transfer'].map((method) => {
                    const isSelected = orderDetails.paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setOrderDetails({ ...orderDetails, paymentMethod: method })}
                        className={cn("px-4 py-4 rounded-2xl border-2 text-[11px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2", isSelected ? "bg-zinc-900 border-zinc-900 text-white shadow-md scale-[1.02]" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300")}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                        {paymentMethodLabels[method]?.[locale] || method}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Receipt Section */}
              <AnimatePresence mode="popLayout">
                {(orderDetails.paymentMethod === 'DuitNow & Bank Transfer') && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-zinc-50 rounded-[24px] p-6 sm:p-8 border border-zinc-200 mt-2">
                      <h4 className="text-base font-black mb-6 text-center text-zinc-900">
                        DuitNow & Bank Transfer Details
                      </h4>
                      
                      {settings?.bankTransferImage && (
                        <div className="mb-6"><img src={settings.bankTransferImage} alt="Bank Details" className="w-full max-w-[280px] mx-auto rounded-2xl shadow-sm border border-zinc-200" /></div>
                      )}
                      
                      <p className="text-xs font-bold text-zinc-500 mb-8 text-center max-w-sm mx-auto leading-relaxed">
                        {locale === 'zh' ? '请将款项转至上方银行账户或扫描二维码，并上传转账收据。' : locale === 'ms' ? 'Sila pindahkan jumlah keseluruhan ke akaun bank atau imbas kod QR di atas, dan muat naik resit.' : 'Please transfer the total amount to the bank account or scan the QR code above, and upload the receipt.'}
                      </p>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Upload Receipt Image</label>
                        <div className="relative border-2 border-dashed border-zinc-300 rounded-[20px] p-8 flex flex-col items-center justify-center hover:bg-white transition-colors cursor-pointer group bg-white/50 overflow-hidden min-h-[160px]">
                          {orderDetails.paymentReceiptUrl ? (
                            <div className="flex flex-col items-center gap-5 z-20 w-full">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-1"><Check size={28} /></div>
                                <span className="text-sm font-bold text-green-600 text-center">{locale === 'zh' ? '收据已成功上传' : locale === 'ms' ? 'Resit Berjaya Dimuat Naik' : 'Receipt Uploaded Successfully'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button type="button" onClick={() => window.open(orderDetails.paymentReceiptUrl, '_blank')} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                                  <ExternalLink size={16} /> {locale === 'zh' ? '查看' : locale === 'ms' ? 'Lihat' : 'View'}
                                </button>
                                <button type="button" onClick={() => document.getElementById('receipt-upload')?.click()} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                                  <Upload size={16} /> {locale === 'zh' ? '更改' : locale === 'ms' ? 'Tukar' : 'Change'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3" onClick={() => document.getElementById('receipt-upload')?.click()}>
                              {isUploadingReceipt ? <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" /> : <Upload size={32} className="text-zinc-300 group-hover:text-zinc-600 transition-colors" />}
                              <span className="text-sm font-bold text-zinc-500">{isUploadingReceipt ? 'Uploading...' : 'Click to Upload Receipt'}</span>
                            </div>
                          )}
                          <input id="receipt-upload" type="file" accept="image/*" onChange={handleReceiptUpload} disabled={isUploadingReceipt} className="hidden" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  <MessageCircle size={12} className="text-zinc-400" /> Notes (Optional)
                </label>
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/10 transition-all">
                  <textarea className="bg-transparent text-zinc-800 text-sm w-full resize-none outline-none placeholder:text-zinc-400" placeholder="e.g. Please call before delivery..." rows={3} value={orderDetails.notes || ''} onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })} maxLength={100} />
                  <div className="text-right text-zinc-400 text-[10px] font-medium mt-1">{(orderDetails.notes || '').length}/100</div>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: Order Summary & Submit */}
          <div className="w-full lg:w-[480px] bg-zinc-50/50 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-zinc-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mb-8">
                {cartItems.map((item, idx) => (
                  <div key={item.id + idx} className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-zinc-100 shrink-0">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-sm text-zinc-900 truncate">{item.name}</h4>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-bold text-sm text-zinc-900">
                      RM {item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-zinc-200">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-medium">Subtotal</span>
                  <span className="text-zinc-900 font-bold">RM {cartTotals.totalOriginalPrice.toFixed(2)}</span>
                </div>
                {cartTotals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Discount</span>
                    <span className="text-zinc-900 font-bold">-RM {cartTotals.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-zinc-200">
              <div className="flex justify-between items-end mb-8">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Total Amount</span>
                  <span className="text-[10px] font-bold text-zinc-400">Final price shown at checkout</span>
                </div>
                <span className="text-3xl font-black text-zinc-900 whitespace-nowrap ml-4">RM {cartTotals.totalPrice.toFixed(2)}</span>
              </div>

              {/* Secure Order Verification */}
              <div 
                className="bg-white border-2 border-zinc-200 rounded-2xl p-5 flex items-start gap-3 cursor-pointer select-none mb-6 hover:border-zinc-300 transition-colors" 
                onClick={() => setIsWhatsAppTermsAgreed(!isWhatsAppTermsAgreed)}
              >
                <div className={cn("w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5", isWhatsAppTermsAgreed ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-300")}>
                  {isWhatsAppTermsAgreed && <Check size={16} strokeWidth={3} />}
                </div>
                <div>
                  <div className="text-zinc-900 font-bold text-sm mb-1.5 flex items-center gap-1.5"><ShieldCheck size={16} className="text-zinc-500"/> Secure Verification</div>
                  <div className="text-zinc-500 text-xs leading-relaxed font-medium">
                    I understand that I will be redirected to WhatsApp. I will not edit the text and will click send directly.
                  </div>
                </div>
              </div>

              <button 
                form="checkout-form"
                type="submit" 
                disabled={isSubmitting || (!orderDetails.paymentReceiptUrl && orderDetails.paymentMethod === 'DuitNow & Bank Transfer')}
                onClick={(e) => {
                  if (!isWhatsAppTermsAgreed) {
                    e.preventDefault();
                    alert('Please agree to the Secure Order Verification first.');
                  } else if (!orderDetails.paymentReceiptUrl && orderDetails.paymentMethod === 'DuitNow & Bank Transfer') {
                    e.preventDefault();
                    alert('Please upload your payment receipt first.');
                  }
                }}
                className={cn("w-full bg-zinc-900 text-white font-black text-base py-5 rounded-2xl flex justify-center items-center gap-2 transition-all", (!isWhatsAppTermsAgreed || isSubmitting) ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-800 shadow-xl shadow-zinc-900/20")}
              >
                {isSubmitting ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <MessageCircle size={20} strokeWidth={2.5} />}
                {isSubmitting ? 'PROCESSING...' : 'COMPLETE ORDER'}
              </button>

              <button 
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="w-full mt-3 bg-zinc-100 text-zinc-900 font-black text-sm py-4 rounded-2xl flex justify-center items-center hover:bg-zinc-200 transition-colors shadow-sm"
              >
                Ordering Guide
              </button>
            </div>
          </div>
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
          <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}><img src={zoomedImage} alt="Zoomed Preview" className="w-auto h-auto max-w-full max-h-[85vh] object-contain" /></div>
        </div>
      )}

    </>
  );
}
