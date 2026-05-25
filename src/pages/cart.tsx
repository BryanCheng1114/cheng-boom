import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '../components/cart/CartProvider';
import { generateWhatsAppLink, OrderDetails } from '../services/whatsappService';
import { useBusiness } from '../context/BusinessContext';
import { Trash2, Plus, Minus, ArrowRight, MessageCircle, Shield, X, MapPin, CreditCard, User, Phone, Check, Zap, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { cn } from '../utils/cn';
import { motion, useAnimation } from 'framer-motion';

const paymentMethodLabels: Record<string, Record<string, string>> = {
  'TNG e-wallet': { en: 'TNG eWallet', zh: 'TNG电子钱包', ms: 'e-Dompet TNG' },
  'bank transfer': { en: 'Bank Transfer', zh: '银行转账', ms: 'Pindahan Bank' },
  'DuitNow qr': { en: 'DuitNow QR', zh: 'DuitNow二维码', ms: 'DuitNow QR' }
};

const deliveryModeLabels: Record<string, Record<string, string>> = {
  'Self Collect': { en: 'Self Collect', zh: '自取', ms: 'Ambil Sendiri' },
  'Delivery': { en: 'Delivery', zh: '运送', ms: 'Penghantaran' }
};

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalOriginalPrice, totalItems, totalDiscount, discountPercent, isFreeShipping } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();

  // Modal Form State
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'TNG e-wallet',
    deliveryMode: 'Self Collect',
    address: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productsStock, setProductsStock] = useState<Record<string, number>>({});
  const [isWhatsAppTermsAgreed, setIsWhatsAppTermsAgreed] = useState(false);
  const [shakeTerms, setShakeTerms] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const shakeControls = useAnimation();

  const isSeller = typeof window !== 'undefined' && (
    localStorage.getItem('user_role') === 'Seller' || 
    JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller'
  );
  
  const sellerLevelName = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem('user') || '{}').sellerLevel?.name : '';

  useEffect(() => {
    setMounted(true);
    
    // Auto-populate from logged in user
    const fetchUserProfile = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        try {
          const res = await fetch(`/api/customers/${user.id}`);
          if (res.ok) {
            const fullProfile = await res.json();
            
            const mapPayment = (val: string | null | undefined) => {
              if (!val) return 'TNG e-wallet';
              const lower = val.toLowerCase();
              if (lower.includes('bank')) return 'bank transfer';
              if (lower.includes('duit')) return 'DuitNow qr';
              return 'TNG e-wallet';
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
            // Fallback to local storage basic info
            setOrderDetails(prev => ({
              ...prev,
              customerName: user.name || '',
              customerPhone: user.phone || ''
            }));
          }
        } catch (err) {
          console.error('Failed to fetch user profile for cart:', err);
        }
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch product stocks on mount
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const stockMap: Record<string, number> = {};
          data.forEach((p: any) => {
            stockMap[p.id] = p.stock || 0;
          });
          setProductsStock(stockMap);
        }
      } catch (err) {
        console.error('Failed to fetch product stocks:', err);
      }
    };
    fetchStocks();
  }, []);

  // Monitor stock and auto-clamp quantities if database stock levels decrease
  useEffect(() => {
    if (Object.keys(productsStock).length > 0) {
      items.forEach((item) => {
        const dbStock = productsStock[item.id];
        if (dbStock !== undefined && item.quantity > dbStock) {
          updateQuantity(item.id, dbStock);
        }
      });
    }
  }, [productsStock, items, updateQuantity]);

  if (!mounted) return null; // Prevent hydration mismatch

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-4 text-foreground">{t.cart.emptyTitle}</h1>
        <p className="text-muted-foreground mb-8 text-lg">{t.cart.emptyDesc}</p>
        <Link 
          href="/shop" 
          className="px-8 py-3 bg-primary text-zinc-900 rounded-full font-bold hover:brightness-110 transition-all inline-flex items-center gap-2"
        >
          {t.cart.startShopping} <ArrowRight size={20} />
        </Link>
      </div>
    );
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Save to database
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
            role: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').role : 'Guest'
          },
          items: items.map(item => ({
            productId: item.id,
            code: item.code,
            name: item.name,
            price: item.price,
            originalPrice: item.originalPrice,
            quantity: item.quantity
          })),
          totalAmount: totalPrice,
          originalAmount: totalOriginalPrice,
          totalDiscount: totalDiscount,
          sellerLevelName: sellerLevelName,
          discountPercent: discountPercent,
          isFreeShipping: isFreeShipping
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      // 2. Open WhatsApp
      const url = generateWhatsAppLink(
        items, 
        totalPrice, 
        { 
          ...orderDetails, 
          role: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').role : 'Guest' 
        }, 
        locale as 'en' | 'zh' | 'ms', 
        isSeller,
        settings?.businessName,
        settings?.whatsapp,
        sellerLevelName,
        discountPercent,
        isFreeShipping
      );
      window.open(url, '_blank');

      // 3. Cleanup
      clearCart();
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseTotalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemSavings = totalOriginalPrice - baseTotalPrice;

  return (
    <>
      <Head>
        <title>{`${t.cart.title} - Cheng-BOOM`}</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <h1 className="text-4xl font-black text-foreground mb-12 tracking-tight">
          {t.cart.title} <span className="text-primary italic">{t.cart.selection}</span> ({totalItems} {t.cart.items})
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.id} className="group relative flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-border rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300">
                {/* Product Image */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border">
                  <img src={item.image || '/transparent-Background.png'} alt={item.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {t.products?.[item.id]?.name || item.name}
                  </h3>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <p className="text-primary font-black text-lg">RM {item.price.toFixed(2)}</p>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <p className="text-zinc-400 line-through text-sm font-bold">RM {item.originalPrice.toFixed(2)}</p>
                    )}
                  </div>
                  {item.quantity >= (productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity)) && (
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                      ⚠️ Max Stock Reached
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-6 sm:pt-0 border-border">
                  <div className="flex items-center gap-4 bg-zinc-100 dark:bg-white/5 px-4 py-2 rounded-2xl border border-border">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:text-primary transition-colors text-muted-foreground active:scale-90"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-6 text-center font-black text-lg text-foreground">{item.quantity}</span>
                    <button 
                      onClick={() => {
                        const maxStock = productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity);
                        updateQuantity(item.id, item.quantity + 1, maxStock);
                      }}
                      disabled={item.quantity >= (productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity))}
                      className="p-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-muted-foreground active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="hidden sm:block w-32 text-right font-black text-xl text-foreground whitespace-nowrap">
                    RM {(item.price * item.quantity).toFixed(2)}
                  </div>

                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-6 px-4">
               <Link href="/shop" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                 ← {t.cart.continueShopping}
               </Link>
              <button 
                onClick={clearCart}
                className="text-red-500 hover:text-red-600 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> {t.cart.clear}
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 text-white dark:bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 sticky top-24 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <h2 className="text-3xl font-black text-white mb-8 tracking-tight">{t.cart.summary}</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-zinc-400 font-medium">
                  <span>{t.cart.subtotal}</span>
                  <span>RM {totalOriginalPrice.toFixed(2)}</span>
                </div>
                {totalItemSavings > 0 && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>{t.cart.savings || 'Promo Savings'}</span>
                    <span>- RM {totalItemSavings.toFixed(2)}</span>
                  </div>
                )}
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-yellow-500 font-bold">
                    <span>{locale === 'zh' ? `${sellerLevelName || '卖家'}折扣` : locale === 'ms' ? `Diskaun ${sellerLevelName || 'Penjual'}` : `${sellerLevelName || 'Seller'} Discount (${discountPercent}%)`}</span>
                    <span>- RM {totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400 font-medium">
                  <span>{t.cart.shipping}</span>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-md ${isFreeShipping ? 'bg-blue-500/20 text-blue-400 font-black' : 'bg-white/10'}`}>
                    {isFreeShipping ? 'FREE' : t.cart.calculatedNext}
                  </span>
                </div>
                
                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.cart.totalPayable}</span>
                    <span className="text-4xl font-black text-primary">RM {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsWhatsAppTermsAgreed(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-5 px-4 bg-primary text-zinc-900 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl hover:shadow-primary/20 flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                <MessageCircle size={22} strokeWidth={3} className="shrink-0" />
                <span className="leading-tight">{t.cart.orderBtn}</span>
              </button>

            </div>
          </div>
        </div>

        {/* ── CHECKOUT MODAL ────────────────────────────────────────── */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
              onClick={() => setIsCheckoutOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-[40px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-8 duration-500">
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-20 text-zinc-500"
              >
                <X size={24} />
              </button>

              <form onSubmit={handleCheckoutSubmit} className="max-h-[90vh] overflow-y-auto">
                <div className="p-8 sm:p-12">
                  <div className="mb-10">
                    <h2 className="text-3xl font-black text-foreground mb-2">{t.cart.checkout.title} <span className="text-primary">{t.cart.checkout.titleAccent}</span></h2>
                    <p className="text-muted-foreground font-medium">{t.cart.checkout.desc}</p>
                  </div>

                  <div className="space-y-8">

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                          <User size={12} className="text-primary" /> {t.cart.checkout.formName}
                        </label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                          placeholder={t.cart.checkout.formNamePlaceholder}
                          value={orderDetails.customerName}
                          onChange={(e) => setOrderDetails({ ...orderDetails, customerName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                          <Phone size={12} className="text-primary" /> {t.cart.checkout.formPhone}
                        </label>
                        <input 
                          type="tel" 
                          required
                          className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                          placeholder={t.cart.checkout.formPhonePlaceholder}
                          value={orderDetails.customerPhone}
                          onChange={(e) => setOrderDetails({ ...orderDetails, customerPhone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        <CreditCard size={12} className="text-primary" /> {t.cart.checkout.paymentTitle}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['TNG e-wallet', 'bank transfer', 'DuitNow qr'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setOrderDetails({ ...orderDetails, paymentMethod: method })}
                            className={cn(
                              "px-4 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2",
                              orderDetails.paymentMethod === method
                                ? "bg-primary border-primary text-zinc-900 shadow-lg shadow-primary/20 scale-[1.02]"
                                : "bg-zinc-50 dark:bg-white/5 border-border text-zinc-500 dark:text-zinc-400 hover:border-primary/50"
                            )}
                          >
                            {orderDetails.paymentMethod === method && <Check size={14} strokeWidth={3} />}
                            {paymentMethodLabels[method]?.[locale] || method}
                          </button>
                        ))}
                      </div>
                    </div>

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
                            className={cn(
                              "px-4 py-4 rounded-2xl border text-sm font-black transition-all flex items-center justify-center gap-2",
                              orderDetails.deliveryMode === mode
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xl scale-[1.02]"
                                : "bg-zinc-50 dark:bg-white/5 border-border text-zinc-500 dark:text-zinc-400 hover:border-zinc-900/50 dark:hover:border-white/50"
                            )}
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
                        <textarea 
                          required
                          className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold resize-none"
                          placeholder={t.cart.checkout.addressPlaceholder}
                          rows={3}
                          value={orderDetails.address}
                          onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Special Notes */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">{t.cart.checkout.notes}</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                        placeholder={t.cart.checkout.notesPlaceholder}
                        value={orderDetails.notes}
                        onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-12 flex flex-col gap-4">
                     <button 
                        type="submit"
                        disabled={isSubmitting}
                        onClick={(e) => {
                          if (!isWhatsAppTermsAgreed) {
                            e.preventDefault();
                            shakeControls.start({
                              x: [0, -15, 15, -12, 12, -8, 8, -4, 4, 0],
                              y: [0, 8, -8, 6, -6, 4, -4, 2, -2, 0],
                              rotate: [0, -3, 3, -2, 2, -1, 1, 0],
                              transition: { duration: 0.5, ease: "easeInOut" }
                            });
                            setShakeTerms(true);
                            setTimeout(() => setShakeTerms(false), 500);
                          }
                        }}
                        className={cn(
                          "w-full py-5 px-4 bg-primary text-zinc-900 rounded-[20px] font-black text-lg transition-all flex justify-center items-center gap-2",
                          (!isWhatsAppTermsAgreed || isSubmitting) ? "opacity-40 cursor-not-allowed grayscale shadow-none" : "hover:brightness-110 shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
                        )}
                     >
                        {isSubmitting ? (
                          <div className="w-6 h-6 border-4 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" />
                        ) : (
                          <MessageCircle size={22} strokeWidth={3} className="shrink-0" />
                        )}
                        <span className="leading-tight">
                          {isSubmitting ? 'Processing...' : t.cart.checkout.confirmBtn}
                        </span>
                     </button>

                     <div className="flex justify-end my-2">
                       <button
                         type="button"
                         onClick={() => setIsGuideOpen(true)}
                         className="flex items-center gap-1.5 text-white hover:text-primary transition-colors text-xs font-black uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                       >
                         <HelpCircle size={14} strokeWidth={3} />
                         {locale === 'zh' ? '下单指南' : locale === 'ms' ? 'Panduan Pesanan' : 'Ordering Guide'}
                       </button>
                     </div>

                     {/* Premium custom robot verification checkbox */}
                     <motion.div 
                       animate={shakeControls}
                       className={cn(
                         "border rounded-2xl p-4 transition-all duration-300 flex items-start gap-4 cursor-pointer select-none",
                         isWhatsAppTermsAgreed 
                           ? "bg-green-500/5 border-green-500/30 dark:bg-green-500/10" 
                           : "bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10 hover:border-blue-500/40",
                         shakeTerms && "border-red-500 bg-red-500/5 dark:bg-red-500/10"
                       )}
                       onClick={() => setIsWhatsAppTermsAgreed(!isWhatsAppTermsAgreed)}
                     >
                       <div className="flex items-center mt-0.5">
                         <div className={cn(
                           "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                           isWhatsAppTermsAgreed 
                             ? "bg-green-500 border-green-500 text-zinc-900 scale-105 shadow-md shadow-green-500/20" 
                             : "border-blue-400 dark:border-blue-500 bg-white dark:bg-zinc-950"
                         )}>
                           {isWhatsAppTermsAgreed && <Check size={14} strokeWidth={4} />}
                         </div>
                       </div>
                       <div className="text-left">
                         <p className={cn(
                           "text-[10px] font-black uppercase tracking-widest mb-1 transition-colors",
                           isWhatsAppTermsAgreed ? "text-green-500 animate-pulse" : "text-blue-500"
                         )}>
                           {locale === 'zh' ? '安全下单验证' : locale === 'ms' ? 'Pengesahan Pesanan Selamat' : 'Secure Order Verification'}
                         </p>
                         <p className={cn(
                           "text-[11px] font-bold leading-relaxed transition-colors",
                           isWhatsAppTermsAgreed ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                         )}>
                           {locale === 'zh' 
                             ? '我明了并同意：点击后，我将被重定向到 WhatsApp 且内容已自动填好。为避免下单失败，我绝不修改文本，直接点击发送。' 
                             : locale === 'ms' 
                               ? 'Saya faham & setuju: Selepas klik, saya akan dihalakan ke WhatsApp dengan maklumat yang diisi automatik. Saya tidak akan mengubah mesej dan terus klik hantar.' 
                               : 'I understand & agree: After clicking, I will be redirected to WhatsApp with autofilled information. I will not edit the text and click send directly.'}
                         </p>
                       </div>
                     </motion.div>

                     <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
                       {t.cart.checkout.total}: RM {totalPrice.toFixed(2)}
                     </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── GUIDANCE MODAL ────────────────────────────────────────── */}
        {isGuideOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
              onClick={() => setIsGuideOpen(false)}
            />
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-[40px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-8 duration-500">
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-20 text-zinc-500"
              >
                <X size={24} />
              </button>
              <div className="p-8 sm:p-12 max-h-[85vh] overflow-y-auto text-center">
                 <h2 className="text-3xl font-black text-foreground mb-8">
                   {locale === 'zh' ? '下单指南' : locale === 'ms' ? 'Panduan Pesanan' : 'Ordering Guide'}
                 </h2>
                 
                 <div className="space-y-12 text-left">
                   {/* Step 1 placeholder */}
                   <div className="space-y-4">
                     <h3 className="text-xl font-bold flex items-center gap-3">
                       <span className="w-8 h-8 rounded-full bg-primary text-zinc-900 flex items-center justify-center font-black">1</span> 
                       {locale === 'zh' ? '自动跳转到 WhatsApp' : locale === 'ms' ? 'Hala ke WhatsApp' : 'Redirect to WhatsApp'}
                     </h3>
                     <p className="text-muted-foreground leading-relaxed">
                       {locale === 'zh' 
                         ? '点击确认后，您将被直接带到 WhatsApp，我们已为您自动填好包含订单详细信息的消息。' 
                         : locale === 'ms' 
                         ? 'Selepas pengesahan, anda akan dibawa ke WhatsApp. Mesej mengandungi butiran pesanan anda akan diisi secara automatik.' 
                         : 'After confirming, you will be taken to WhatsApp where your message containing order details will be automatically filled.'}
                     </p>
                     <div 
                       className="w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative cursor-zoom-in group"
                       onClick={() => setZoomedImage('/ordering guide/image1.png')}
                     >
                       <img 
                         src="/ordering guide/image1.png" 
                         alt="Guide Step 1" 
                         className="w-full h-auto object-contain bg-zinc-50 dark:bg-zinc-900 group-hover:scale-105 transition-transform duration-500" 
                       />
                     </div>
                   </div>

                   {/* Step 2 placeholder */}
                   <div className="space-y-4">
                     <h3 className="text-xl font-bold flex items-center gap-3">
                       <span className="w-8 h-8 rounded-full bg-primary text-zinc-900 flex items-center justify-center font-black">2</span> 
                       {locale === 'zh' ? '发送信息' : locale === 'ms' ? 'Hantar Mesej' : 'Send the Message'}
                     </h3>
                     <p className="text-muted-foreground leading-relaxed">
                       {locale === 'zh' 
                         ? '只需在 WhatsApp 中点击“发送”即可！为确保系统准确处理，请不要修改任何预填文本。' 
                         : locale === 'ms' 
                         ? 'Hanya klik "Hantar" di WhatsApp! Jangan ubah sebarang teks pramuat untuk memastikan pemprosesan yang tepat.' 
                         : 'Simply click "Send" in WhatsApp! Please do not modify the pre-filled text to ensure your order is processed accurately.'}
                     </p>
                     <div 
                       className="w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative cursor-zoom-in group"
                       onClick={() => setZoomedImage('/ordering guide/image2.png')}
                     >
                       <img 
                         src="/ordering guide/image2.png" 
                         alt="Guide Step 2" 
                         className="w-full h-auto object-contain bg-zinc-50 dark:bg-zinc-900 group-hover:scale-105 transition-transform duration-500" 
                       />
                     </div>
                   </div>


                   {/* Step 3 */}
                   <div className="space-y-4">
                     <h3 className="text-xl font-bold flex items-center gap-3">
                       <span className="w-8 h-8 rounded-full bg-primary text-zinc-900 flex items-center justify-center font-black">3</span> 
                       {locale === 'zh' ? '等待客服确认' : locale === 'ms' ? 'Tunggu Pengesahan Peniaga' : 'Wait for Dealer Confirmation'}
                     </h3>
                     <p className="text-muted-foreground leading-relaxed">
                       {locale === 'zh' 
                         ? '我们的客服将在 24 小时内回复您，处理您的订单并完成交易。请耐心等待，我们会尽快与您对接！' 
                         : locale === 'ms' 
                         ? 'Peniaga kami akan membalas dalam masa 24 jam untuk memproses pesanan anda. Sila tunggu dengan sabar sementara kami menyelesaikan urusan dengan anda!' 
                         : 'Our dealer will reply within 24 hours to process your order and complete the deal. Please wait patiently as we will assist you very soon!'}
                     </p>
                   </div>
                 </div>

                 <button 
                   onClick={() => setIsGuideOpen(false)}
                   className="w-full mt-10 py-5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-[20px] font-black text-lg transition-all active:scale-[0.98] shadow-xl hover:shadow-black/20"
                 >
                   {locale === 'zh' ? '知道了！' : locale === 'ms' ? 'Faham!' : 'Got it!'}
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* ── IMAGE LIGHTBOX ────────────────────────────────────────── */}
        {zoomedImage && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all duration-200 z-10"
            >
              <X size={20} />
            </button>
            <div
              className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImage}
                alt="Zoomed Preview"
                className="w-auto h-auto max-w-full max-h-[85vh] object-contain"
              />
            </div>
          </div>
        )}

      </div>
    </>
  );
}
