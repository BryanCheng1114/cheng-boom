import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '../components/cart/CartProvider';
import { generateWhatsAppLink, OrderDetails } from '../services/whatsappService';
import { Trash2, Plus, Minus, ArrowRight, MessageCircle, Shield, X, MapPin, CreditCard, User, Phone, Check, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { cn } from '../utils/cn';

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalOriginalPrice, totalItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { t, locale } = useTranslation();

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
            quantity: item.quantity
          })),
          totalAmount: totalPrice
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      // 2. Open WhatsApp
      const isSeller = typeof window !== 'undefined' && JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller';
      const url = generateWhatsAppLink(items, totalPrice, orderDetails, locale as 'en' | 'zh' | 'ms', isSeller);
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

  const totalSavings = totalOriginalPrice - totalPrice;

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
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:text-primary transition-colors text-muted-foreground active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="hidden sm:block w-28 text-right font-black text-xl text-foreground">
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
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>⚡ {t.cart.savings}</span>
                    <span>- RM {totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400 font-medium">
                  <span>{t.cart.shipping}</span>
                  <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded-md">{t.cart.calculatedNext}</span>
                </div>
                
                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t.cart.totalPayable}</span>
                    <span className="text-4xl font-black text-primary">RM {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-5 px-4 bg-primary text-zinc-900 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl hover:shadow-primary/20 flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                <MessageCircle size={22} strokeWidth={3} className="shrink-0" />
                <span className="leading-tight">{t.cart.orderBtn}</span>
              </button>
              
              <div className="mt-8 space-y-3">
                 <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                   <Shield size={14} className="text-primary" />
                   {t.cart.verified}
                 </div>
              </div>
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
                    {/* Seller Benefit Notice */}
                    {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller' && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-3xl p-6 flex items-center gap-5 group">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-500 flex items-center justify-center text-zinc-900 shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                          <Zap size={24} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-500 mb-1">Seller Benefit Active</p>
                          <p className="text-sm font-bold text-foreground leading-tight">A <span className="text-primary font-black italic">15% discount</span> has been automatically applied to your selection.</p>
                        </div>
                      </div>
                    )}
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
                            {method}
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
                            {mode}
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
                        className="w-full py-5 px-4 bg-primary text-zinc-900 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl hover:shadow-primary/20 flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                     <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
                       {t.cart.checkout.total}: RM {totalPrice.toFixed(2)}
                     </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
