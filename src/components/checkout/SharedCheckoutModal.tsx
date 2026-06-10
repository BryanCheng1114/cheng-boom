import React, { useState, useEffect } from 'react';
import { X, User, Phone, HelpCircle, CreditCard, Check, MapPin, MessageCircle, Upload, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useBusiness } from '../../context/BusinessContext';
import { generateWhatsAppLink, OrderDetails } from '../../services/whatsappService';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '../../utils/cn';

const paymentMethodLabels: Record<string, Record<string, string>> = {
  'Cash on Delivery': { en: 'Cash on Delivery', zh: '货到付款', ms: 'Tunai Semasa' },
  'TNG e-wallet': { en: 'TNG eWallet', zh: 'TNG电子钱包', ms: 'e-Dompet TNG' },
  'Bank Transfer': { en: 'Bank Transfer', zh: '银行转账', ms: 'Pindahan Bank' },
  'TNG DuitNow': { en: 'DuitNow QR', zh: 'DuitNow二维码', ms: 'DuitNow QR' }
};

const deliveryModeLabels: Record<string, Record<string, string>> = {
  'Self Collect': { en: 'Self Collect', zh: '自取', ms: 'Ambil Sendiri' },
  'Delivery': { en: 'Delivery', zh: '运送', ms: 'Penghantaran' }
};

interface SharedCheckoutModalProps {
  mode: 'single' | 'cart';
  onClose: () => void;
  
  // Single mode props
  product?: any;
  quantity?: number;
  
  // Cart mode props
  cartItems?: any[];
  cartTotals?: {
    totalPrice: number;
    totalOriginalPrice: number;
    totalDiscount: number;
    discountPercent: number;
    sellerLevelName: string;
    isFreeShipping: boolean;
  };
  clearCart?: () => void;
}

export function SharedCheckoutModal({ mode, product, quantity = 1, cartItems, cartTotals, clearCart, onClose }: SharedCheckoutModalProps) {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const shakeControls = useAnimation();

  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'Bank Transfer',
    deliveryMode: 'Self Collect',
    address: '',
    notes: '',
    paymentReceiptUrl: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppTermsAgreed, setIsWhatsAppTermsAgreed] = useState(false);
  const [shakeTerms, setShakeTerms] = useState(false);
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
              if (!val) return 'Bank Transfer';
              const lower = val.toLowerCase();
              if (lower.includes('bank')) return 'Bank Transfer';
              if (lower.includes('duit') || lower.includes('tng') || lower.includes('wallet')) return 'TNG DuitNow';
              return 'Bank Transfer';
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

  // --- Pricing Logic ---
  let activePrice = 0;
  let strikeThroughPrice: number | undefined = undefined;
  let computedDiscountPercent = 0;
  let computedIsFreeShipping = false;
  let computedSellerLevelName = '';
  let computedTotalOriginalPrice = 0;
  let computedTotalDiscount = 0;
  let computedFinalTotalPrice = 0;

  if (mode === 'single' && product) {
    const isSeller = typeof window !== 'undefined' && (
      localStorage.getItem('user_role') === 'Seller' || 
      JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller'
    );

    activePrice = product.price;
    if (isSeller) {
      if (product.sellerPrice && product.sellerPrice > 0) {
        activePrice = product.sellerPrice;
        if (product.sellerPrice < product.price) strikeThroughPrice = product.price;
      } else if (product.promotion !== null && product.promotion !== undefined && product.promotion < product.price) {
        activePrice = product.promotion as number;
        strikeThroughPrice = product.price;
      }
    } else {
      if (product.promotion !== null && product.promotion !== undefined && product.promotion < product.price) {
        activePrice = product.promotion as number;
        strikeThroughPrice = product.price;
      }
    }

    if (typeof window !== 'undefined') {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      if (userObj?.role === 'Seller' && userObj?.sellerLevel) {
        computedDiscountPercent = userObj.sellerLevel.discountPercent || 0;
        computedIsFreeShipping = userObj.sellerLevel.freeShipping || false;
        computedSellerLevelName = userObj.sellerLevel.name || '';
      }
    }

    const baseTotalPrice = activePrice * quantity;
    computedTotalOriginalPrice = (strikeThroughPrice || activePrice) * quantity;
    computedTotalDiscount = baseTotalPrice * (computedDiscountPercent / 100);
    computedFinalTotalPrice = baseTotalPrice - computedTotalDiscount;
  } else if (mode === 'cart' && cartTotals) {
    computedTotalOriginalPrice = cartTotals.totalOriginalPrice;
    computedTotalDiscount = cartTotals.totalDiscount;
    computedDiscountPercent = cartTotals.discountPercent;
    computedSellerLevelName = cartTotals.sellerLevelName;
    computedIsFreeShipping = cartTotals.isFreeShipping;
    computedFinalTotalPrice = cartTotals.totalPrice;
  }

  let singleTranslatedName = mode === 'single' && product ? ((locale === 'zh' && product.nameZh) ? product.nameZh : (locale === 'ms' && product.nameMs) ? product.nameMs : null) : null;
  if (mode === 'single' && product) {
    singleTranslatedName = singleTranslatedName || (t.products as any)?.[product.id]?.name || product.name;
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const role = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').role : 'Guest';
      const isSeller = typeof window !== 'undefined' && (
        localStorage.getItem('user_role') === 'Seller' || role === 'Seller'
      );
      
      const orderItemsPayload = mode === 'single' && product ? [{
        id: product.id,
        cartItemId: `${product.id}-Single`,
        code: product.code,
        name: singleTranslatedName || '',
        price: activePrice,
        originalPrice: strikeThroughPrice,
        quantity: quantity,
        variant: 'Single',
        itemsPerBox: product.itemsPerBox
      }] : (cartItems?.map(item => ({
        id: item.id,
        cartItemId: item.cartItemId,
        code: item.code,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        quantity: item.quantity,
        variant: item.variant,
        itemsPerBox: item.itemsPerBox
      })) || []);

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
            role
          },
          items: orderItemsPayload,
          totalAmount: computedFinalTotalPrice,
          originalAmount: computedTotalOriginalPrice,
          totalDiscount: computedTotalDiscount,
          sellerLevelName: computedSellerLevelName,
          discountPercent: computedDiscountPercent,
          isFreeShipping: computedIsFreeShipping
        }),
      });

      if (!response.ok) throw new Error('Failed to save order');

      const url = generateWhatsAppLink(
        orderItemsPayload,
        computedFinalTotalPrice,
        { ...orderDetails, role },
        locale as 'en' | 'zh' | 'ms',
        isSeller,
        settings?.businessName,
        settings?.whatsapp ?? undefined,
        computedSellerLevelName,
        computedDiscountPercent,
        computedIsFreeShipping
      );
      window.open(url, '_blank');

      if (mode === 'cart' && clearCart) {
        clearCart();
      }
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-[40px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-8 duration-500">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-20 text-zinc-500">
            <X size={24} />
          </button>

          <form onSubmit={handleCheckoutSubmit} className="max-h-[90vh] overflow-y-auto">
            <div className="p-8 sm:p-12">
              <div className="mb-10">
                <h2 className="text-3xl font-black text-white mb-2">{t.cart.checkout.title} <span className="text-white">{t.cart.checkout.titleAccent}</span></h2>
                <p className="text-muted-foreground font-medium">{t.cart.checkout.desc}</p>
                
                {/* Unified Order Summary Box */}
                <div className="mt-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  {mode === 'single' && product && (
                    <>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-700">
                           {product.images && product.images.length > 0 && (
                             <img src={product.images[0]} alt={singleTranslatedName || ''} className="w-full h-full object-cover" />
                           )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-bold text-sm text-foreground truncate">{singleTranslatedName}</h4>
                          <p className="text-xs text-zinc-500 font-medium mt-0.5">Quantity: {quantity}</p>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700" />
                    </>
                  )}
                  {mode === 'cart' && cartItems && cartItems.length > 0 && (
                    <>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-900/50">
                        {cartItems.map((item, idx) => (
                          <div key={item.id + idx} className="p-4 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-700">
                               {item.image && (
                                 <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                               )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-bold text-sm text-foreground truncate">{item.name}</h4>
                              <p className="text-xs text-zinc-500 font-medium mt-0.5">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700" />
                    </>
                  )}

                  <div className="p-5 bg-primary/10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-white mb-1">
                        {locale === 'zh' ? '应付总额' : locale === 'ms' ? 'Jumlah Perlu Dibayar' : 'Total Payable'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold dark:text-zinc-400">
                        {locale === 'zh' ? '请准备此确切金额' : locale === 'ms' ? 'Sila sediakan jumlah tepat ini' : 'Please prepare this exact amount'}
                      </span>
                    </div>
                    <span className="text-3xl font-black text-white tracking-tight">RM {computedFinalTotalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      <User size={12} className="text-primary" /> {t.cart.checkout.formName}
                    </label>
                    <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold" placeholder={t.cart.checkout.formNamePlaceholder} value={orderDetails.customerName} onChange={(e) => setOrderDetails({ ...orderDetails, customerName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 group w-max">
                      <Phone size={12} className="text-primary" /> {t.cart.checkout.formPhone}
                      <span className="cursor-help flex items-center justify-center w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-primary transition-colors">
                        <HelpCircle size={10} strokeWidth={3} />
                      </span>
                      <div className="absolute bottom-full mb-1.5 left-0 hidden group-hover:block w-[220px] p-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] leading-relaxed font-bold rounded-lg shadow-2xl z-[110] normal-case tracking-normal">
                        {(t.cart.checkout as any).phoneFormatHint || "Only Malaysia mobile numbers (+60 or 01) are allowed."}
                        <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-zinc-900 dark:bg-white rotate-45 rounded-sm" />
                      </div>
                    </label>
                    <input type="tel" required pattern="^(\+?601|01)[0-9]{8,9}$" title={(t.cart.checkout as any).phoneFormatHint || "Only Malaysia mobile numbers (+60 or 01) are allowed."} className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold" placeholder={t.cart.checkout.formPhonePlaceholder} value={orderDetails.customerPhone} onChange={(e) => setOrderDetails({ ...orderDetails, customerPhone: e.target.value })} />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    <CreditCard size={12} className="text-primary" /> {t.cart.checkout.paymentTitle}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash on Delivery', 'Bank Transfer', 'TNG DuitNow'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setOrderDetails({ ...orderDetails, paymentMethod: method })}
                        className={cn("px-4 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2", orderDetails.paymentMethod === method ? "bg-primary border-primary text-zinc-900 shadow-lg shadow-primary/20 scale-[1.02]" : "bg-zinc-50 dark:bg-white/5 border-border text-zinc-500 dark:text-zinc-400 hover:border-primary/50")}
                      >
                        {orderDetails.paymentMethod === method && <Check size={14} strokeWidth={3} />}
                        {paymentMethodLabels[method]?.[locale] || method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Receipt Section (Conditional) */}
                <AnimatePresence mode="popLayout">
                  {(orderDetails.paymentMethod === 'Bank Transfer' || orderDetails.paymentMethod === 'TNG DuitNow') && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h4 className="text-sm font-black mb-4 text-center">
                          {orderDetails.paymentMethod === 'Bank Transfer' ? 'Bank Transfer Details' : 'TNG DuitNow QR'}
                        </h4>
                        
                        {orderDetails.paymentMethod === 'Bank Transfer' && settings?.bankTransferImage && (
                          <div className="mb-4"><img src={settings.bankTransferImage} alt="Bank Details" className="w-full max-w-xs mx-auto rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700" /></div>
                        )}
                        {orderDetails.paymentMethod === 'TNG DuitNow' && settings?.tngDuitnowImage && (
                          <div className="mb-4"><img src={settings.tngDuitnowImage} alt="TNG DuitNow QR" className="w-full max-w-xs mx-auto rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700" /></div>
                        )}
                        
                        <p className="text-[11px] font-bold text-zinc-500 mb-6 text-center leading-relaxed">
                          {orderDetails.paymentMethod === 'Bank Transfer' 
                            ? (locale === 'zh' ? '请将款项转至上方银行账户并上传转账收据。' : locale === 'ms' ? 'Sila pindahkan jumlah keseluruhan ke akaun bank di atas dan muat naik resit.' : 'Please transfer the total amount to the bank account above and upload the receipt.')
                            : (locale === 'zh' ? '请扫描上方二维码进行支付并上传付款收据。' : locale === 'ms' ? 'Sila imbas kod QR di atas untuk membuat pembayaran dan muat naik resit.' : 'Please scan the QR code above to pay the total amount and upload the receipt.')}
                        </p>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Upload Receipt Image</label>
                          <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group bg-white dark:bg-zinc-900 overflow-hidden min-h-[140px]">
                            {orderDetails.paymentReceiptUrl ? (
                              <div className="flex flex-col items-center gap-4 z-20 w-full">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-1"><Check size={24} /></div>
                                  <span className="text-xs font-bold text-green-600 text-center">{locale === 'zh' ? '收据已成功上传' : locale === 'ms' ? 'Resit Berjaya Dimuat Naik' : 'Receipt Uploaded Successfully'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button type="button" onClick={() => window.open(orderDetails.paymentReceiptUrl, '_blank')} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors">
                                    <ExternalLink size={14} /> {locale === 'zh' ? '查看' : locale === 'ms' ? 'Lihat' : 'View'}
                                  </button>
                                  <button type="button" onClick={() => document.getElementById('receipt-upload')?.click()} className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors">
                                    <Upload size={14} /> {locale === 'zh' ? '更改' : locale === 'ms' ? 'Tukar' : 'Change'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                {isUploadingReceipt ? <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /> : <Upload size={24} className="text-zinc-400 group-hover:text-primary transition-colors" />}
                                <span className="text-xs font-bold text-zinc-500">{isUploadingReceipt ? 'Uploading...' : 'Click to Upload Receipt'}</span>
                              </div>
                            )}
                            <input id="receipt-upload" type="file" accept="image/*" onChange={handleReceiptUpload} disabled={isUploadingReceipt} className={cn("absolute inset-0 opacity-0 disabled:cursor-not-allowed", orderDetails.paymentReceiptUrl ? "hidden" : "cursor-pointer z-10")} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Delivery Mode */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    <MapPin size={12} className="text-primary" /> {t.cart.checkout.deliveryTitle}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Self Collect', 'Delivery'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setOrderDetails({ ...orderDetails, deliveryMode: mode })}
                        className={cn("px-4 py-4 rounded-2xl border text-sm font-black transition-all flex items-center justify-center gap-2", orderDetails.deliveryMode === mode ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xl scale-[1.02]" : "bg-zinc-50 dark:bg-white/5 border-border text-zinc-500 dark:text-zinc-400 hover:border-zinc-900/50 dark:hover:border-white/50")}
                      >
                        {deliveryModeLabels[mode]?.[locale] || mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address (If Delivery) */}
                {orderDetails.deliveryMode === 'Delivery' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">{t.cart.checkout.address}</label>
                    <textarea required className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold resize-none" placeholder={t.cart.checkout.addressPlaceholder} rows={3} value={orderDetails.address} onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })} />
                  </div>
                )}

                {/* Special Notes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">{t.cart.checkout.notes}</label>
                  <textarea rows={3} className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold resize-none" placeholder={t.cart.checkout.notesPlaceholder} value={orderDetails.notes} onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })} />
                </div>
              </div>

              <div className="mt-12 flex flex-col gap-4">
                 <motion.div animate={shakeControls} className={cn("border rounded-2xl p-4 transition-all duration-300 flex items-start gap-4 cursor-pointer select-none", isWhatsAppTermsAgreed ? "bg-green-500/5 border-green-500/30 dark:bg-green-500/10" : "bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10 hover:border-blue-500/40", shakeTerms && "border-red-500 bg-red-500/5 dark:bg-red-500/10")} onClick={() => setIsWhatsAppTermsAgreed(!isWhatsAppTermsAgreed)}>
                   <div className="flex items-center mt-0.5">
                     <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shrink-0", isWhatsAppTermsAgreed ? "bg-green-500 border-green-500 text-zinc-900 scale-105 shadow-md shadow-green-500/20" : "border-blue-400 dark:border-blue-500 bg-white dark:bg-zinc-950")}>
                       {isWhatsAppTermsAgreed && <Check size={14} strokeWidth={4} />}
                     </div>
                   </div>
                   <div className="text-left">
                     <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 transition-colors", isWhatsAppTermsAgreed ? "text-green-500 animate-pulse" : "text-blue-500")}>
                       {locale === 'zh' ? '安全下单验证' : locale === 'ms' ? 'Pengesahan Pesanan Selamat' : 'Secure Order Verification'}
                     </p>
                     <p className={cn("text-[11px] font-bold leading-relaxed transition-colors", isWhatsAppTermsAgreed ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400")}>
                       {locale === 'zh' ? '我明了并同意：点击后，我将被重定向到 WhatsApp 且内容已自动填好。为避免下单失败，我绝不修改文本，直接点击发送。' : locale === 'ms' ? 'Saya faham & setuju: Selepas klik, saya akan dihalakan ke WhatsApp dengan maklumat yang diisi automatik. Saya tidak akan mengubah mesej dan terus klik hantar.' : 'I understand & agree: After clicking, I will be redirected to WhatsApp with autofilled information. I will not edit the text and click send directly.'}
                     </p>
                   </div>
                 </motion.div>

                 <button 
                    type="submit"
                    disabled={isSubmitting || (!orderDetails.paymentReceiptUrl && (orderDetails.paymentMethod === 'Bank Transfer' || orderDetails.paymentMethod === 'TNG DuitNow'))}
                    onClick={(e) => {
                      if (!isWhatsAppTermsAgreed) {
                        e.preventDefault();
                        shakeControls.start({ x: [0, -15, 15, -12, 12, -8, 8, -4, 4, 0], y: [0, 8, -8, 6, -6, 4, -4, 2, -2, 0], rotate: [0, -3, 3, -2, 2, -1, 1, 0], transition: { duration: 0.5, ease: "easeInOut" } });
                        setShakeTerms(true);
                        setTimeout(() => setShakeTerms(false), 500);
                      } else if (!orderDetails.paymentReceiptUrl && (orderDetails.paymentMethod === 'Bank Transfer' || orderDetails.paymentMethod === 'TNG DuitNow')) {
                        e.preventDefault();
                        alert(locale === 'zh' ? '请先上传付款收据。' : locale === 'ms' ? 'Sila muat naik resit pembayaran terlebih dahulu.' : 'Please upload your payment receipt first.');
                      }
                    }}
                    className={cn("w-full py-5 px-4 mb-2 bg-primary text-zinc-900 rounded-[20px] font-black text-lg transition-all flex justify-center items-center gap-2", (!isWhatsAppTermsAgreed || isSubmitting || (!orderDetails.paymentReceiptUrl && (orderDetails.paymentMethod === 'Bank Transfer' || orderDetails.paymentMethod === 'TNG DuitNow'))) ? "opacity-40 cursor-not-allowed grayscale shadow-none" : "hover:brightness-110 shadow-xl hover:shadow-primary/20 active:scale-[0.98]")}
                 >
                    {isSubmitting ? <div className="w-6 h-6 border-4 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" /> : <MessageCircle size={22} strokeWidth={3} className="shrink-0" />}
                    <span className="leading-tight">{isSubmitting ? 'Processing...' : t.cart.checkout.confirmBtn}</span>
                 </button>

                 <div className="flex justify-end mt-2">
                   <button type="button" onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1.5 text-zinc-500 hover:text-primary transition-colors text-xs font-black uppercase tracking-widest"><HelpCircle size={14} strokeWidth={3} /> {locale === 'zh' ? '下单指南' : locale === 'ms' ? 'Panduan Pesanan' : 'Ordering Guide'}</button>
                 </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── GUIDANCE MODAL ────────────────────────────────────────── */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={() => setIsGuideOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-[40px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-8 duration-500">
            <button onClick={() => setIsGuideOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-20 text-zinc-500"><X size={24} /></button>
            <div className="p-8 sm:p-12 max-h-[85vh] overflow-y-auto text-center">
               <h2 className="text-3xl font-black text-foreground mb-8">{locale === 'zh' ? '下单指南' : locale === 'ms' ? 'Panduan Pesanan' : 'Ordering Guide'}</h2>
               <div className="space-y-12 text-left">
                 <div className="space-y-4">
                   <h3 className="text-xl font-bold flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary text-zinc-900 flex items-center justify-center font-black">1</span> {locale === 'zh' ? '自动跳转到 WhatsApp' : locale === 'ms' ? 'Hala ke WhatsApp' : 'Redirect to WhatsApp'}</h3>
                   <p className="text-muted-foreground leading-relaxed">{locale === 'zh' ? '点击确认后，您将被直接带到 WhatsApp，我们已为您自动填好包含订单详细信息的消息。' : locale === 'ms' ? 'Selepas pengesahan, anda akan dibawa ke WhatsApp. Mesej mengandungi butiran pesanan anda akan diisi secara automatik.' : 'After confirming, you will be taken to WhatsApp where your message containing order details will be automatically filled.'}</p>
                   <div className="w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative cursor-zoom-in group" onClick={() => setZoomedImage('/ordering guide/image1.png')}><img src="/ordering guide/image1.png" alt="Guide Step 1" className="w-full h-auto object-contain bg-zinc-50 dark:bg-zinc-900 group-hover:scale-105 transition-transform duration-500" /></div>
                 </div>
                 <div className="space-y-4">
                   <h3 className="text-xl font-bold flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary text-zinc-900 flex items-center justify-center font-black">2</span> {locale === 'zh' ? '发送信息' : locale === 'ms' ? 'Hantar Mesej' : 'Send the Message'}</h3>
                   <p className="text-muted-foreground leading-relaxed">{locale === 'zh' ? '只需在 WhatsApp 中点击“发送”即可！为确保系统准确处理，请不要修改任何预填文本。' : locale === 'ms' ? 'Hanya klik "Hantar" di WhatsApp! Jangan ubah sebarang teks pramuat untuk memastikan pemprosesan yang tepat.' : 'Simply click "Send" in WhatsApp! Please do not modify the pre-filled text to ensure your order is processed accurately.'}</p>
                   <div className="w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative cursor-zoom-in group" onClick={() => setZoomedImage('/ordering guide/image2.png')}><img src="/ordering guide/image2.png" alt="Guide Step 2" className="w-full h-auto object-contain bg-zinc-50 dark:bg-zinc-900 group-hover:scale-105 transition-transform duration-500" /></div>
                 </div>
                 <div className="space-y-4">
                   <h3 className="text-xl font-bold flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary text-zinc-900 flex items-center justify-center font-black">3</span> {locale === 'zh' ? '等待客服确认' : locale === 'ms' ? 'Tunggu Pengesahan Peniaga' : 'Wait for Dealer Confirmation'}</h3>
                   <p className="text-muted-foreground leading-relaxed">{locale === 'zh' ? '我们的客服将在 24 小时内回复您，处理您的订单并完成交易。请耐心等待，我们会尽快与您对接！' : locale === 'ms' ? 'Peniaga kami akan membalas dalam masa 24 jam untuk memproses pesanan anda. Sila tunggu dengan sabar sementara kami menyelesaikan urusan dengan anda!' : 'Our dealer will reply within 24 hours to process your order and complete the deal. Please wait patiently as we will assist you very soon!'}</p>
                 </div>
               </div>
                <button onClick={() => setIsGuideOpen(false)} className="w-full mt-10 py-5 bg-primary text-zinc-900 rounded-[20px] font-black text-lg transition-all shadow-xl hover:shadow-primary/20 hover:brightness-110 active:scale-[0.98]">{locale === 'zh' ? '知道了！' : locale === 'ms' ? 'Faham!' : 'Got it!'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE LIGHTBOX ────────────────────────────────────────── */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8" onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all duration-200 z-10"><X size={20} /></button>
          <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}><img src={zoomedImage} alt="Zoomed Preview" className="w-auto h-auto max-w-full max-h-[85vh] object-contain" /></div>
        </div>
      )}

      {/* ── PDF ERROR MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {pdfErrorModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative">
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800/50">
                <h3 className="text-lg font-black text-foreground">{locale === 'zh' ? '不支持的文件格式' : locale === 'ms' ? 'Format Fail Tidak Disokong' : 'Unsupported File Format'}</h3>
                <button onClick={() => setPdfErrorModalOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors p-1"><X size={20} /></button>
              </div>
              <div className="p-6">
                <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                  {locale === 'zh' ? '不支持 PDF 文件。请仅上传图片格式的收据（如 JPG, PNG, WEBP）。如果您的收据是 PDF，请截屏后上传图片。' : locale === 'ms' ? 'Fail PDF tidak disokong. Sila muat naik resit dalam format gambar (seperti JPG, PNG, WEBP). Jika resit anda dalam bentuk PDF, sila ambil tangkapan skrin (screenshot) dan muat naik gambar tersebut.' : 'PDF files are not supported. Please upload receipt images only (e.g. JPG, PNG, WEBP). If you have a PDF, please take a screenshot and upload the image instead.'}
                </p>
                <div className="mt-8">
                  <button onClick={() => setPdfErrorModalOpen(false)} className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-primary text-zinc-900 transition-colors shadow-lg shadow-primary/20 active:scale-95">{locale === 'zh' ? '我明白了' : locale === 'ms' ? 'Saya faham' : 'I Understand'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
