import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '../components/cart/CartProvider';
import { useBusiness } from '../context/BusinessContext';
import { SharedCheckoutModal } from '../components/checkout/SharedCheckoutModal';
import { InlineCheckoutDetails } from '../components/checkout/InlineCheckoutDetails';
import { OrderComplete } from '../components/checkout/OrderComplete';
import { Trash2, Plus, Minus, ChevronUp, ChevronDown, CheckSquare, Square, ArrowRight, MessageCircle, Shield, X, MapPin, CreditCard, User, Phone, Check, Zap, HelpCircle, Upload, ExternalLink, AlertTriangle, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cart() {
  const { items, updateQuantity, updateVariant, removeItem, clearCart, totalPrice, totalOriginalPrice, totalItems, totalDiscount, discountPercent, isFreeShipping } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isDiscountDetailOpen, setIsDiscountDetailOpen] = useState(false);
  const [productsStock, setProductsStock] = useState<Record<string, number>>({});
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleAllSelection = () => {
    if (selectedItemIds.length === items.length && items.length > 0) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map(i => i.cartItemId));
    }
  };

  const executeBulkDelete = () => {
    selectedItemIds.forEach(id => removeItem(id));
    setSelectedItemIds([]);
    setIsBulkDeleteModalOpen(false);
  };






  const isSeller = typeof window !== 'undefined' && (
    localStorage.getItem('user_role') === 'Seller' || 
    JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller'
  );
  
  const sellerLevelName = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem('user') || '{}').sellerLevel?.name : '';
  const selectedItems = items.filter(i => selectedItemIds.includes(i.cartItemId));
  
  const selectedTotalOriginalPrice = selectedItems.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const selectedBaseTotalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let selectedTotalDiscount = 0;
  let finalSelectedTotalPrice = selectedBaseTotalPrice;
  
  if (isSeller && discountPercent > 0) {
    selectedTotalDiscount = selectedBaseTotalPrice * (discountPercent / 100);
    finalSelectedTotalPrice = selectedBaseTotalPrice - selectedTotalDiscount;
  }
  
  const selectedTotalItemSavings = selectedTotalOriginalPrice - selectedBaseTotalPrice;
  const selectedTotalSaved = selectedTotalItemSavings + selectedTotalDiscount;
  
  let selectedTotalPromoDiscount = 0;
  let selectedTotalSellerItemDiscount = 0;

  selectedItems.forEach(item => {
    if (item.originalPrice && item.originalPrice > item.price) {
      const pDetails = productsMap[item.id];
      let isSellerPrice = false;
      if (pDetails) {
        if (item.variant === 'Box') {
          isSellerPrice = isSeller && pDetails.boxSellerPrice != null && item.price === pDetails.boxSellerPrice;
        } else {
          isSellerPrice = isSeller && pDetails.sellerPrice != null && item.price === pDetails.sellerPrice;
        }
      }
      const savings = (item.originalPrice - item.price) * item.quantity;
      if (isSellerPrice) {
        selectedTotalSellerItemDiscount += savings;
      } else {
        selectedTotalPromoDiscount += savings;
      }
    }
  });



  const clearCartTranslations = {
    title: { en: 'Clear Cart', zh: '清空购物车', ms: 'Kosongkan Troli' },
    message: { en: 'Are you sure you want to clear all items in the cart?', zh: '您确定要清空购物车中的所有商品吗？', ms: 'Adakah anda pasti ingin mengosongkan semua item di dalam troli?' },
    confirm: { en: 'Yes, clear it', zh: '是的，清空', ms: 'Ya, kosongkan' },
    cancel: { en: 'Cancel', zh: '取消', ms: 'Batal' }
  };

  const bulkDeleteTranslations = {
    title: { en: 'Delete Selected Items', zh: '删除所选商品', ms: 'Padam Item Terpilih' },
    message: { en: 'Are you sure you want to remove the selected items from your cart?', zh: '您确定要从购物车中移除所选商品吗？', ms: 'Adakah anda pasti ingin membuang item yang dipilih dari troli anda?' },
    confirm: { en: 'Yes, delete', zh: '是的，删除', ms: 'Ya, padam' },
    cancel: { en: 'Cancel', zh: '取消', ms: 'Batal' }
  };

  const removeItemTranslations = {
    title: { en: 'Remove Item', zh: '移除商品', ms: 'Buang Item' },
    message: { en: 'Are you sure you want to remove this item from your cart?', zh: '您确定要从购物车中移除此商品吗？', ms: 'Adakah anda pasti ingin membuang item ini dari troli anda?' },
    confirm: { en: 'Yes, remove it', zh: '是的，移除', ms: 'Ya, buang' },
    cancel: { en: 'Cancel', zh: '取消', ms: 'Batal' }
  };


  useEffect(() => {
    setMounted(true);
    
    // Auto-populate from logged in user
    const fetchUserProfile = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setIsLoggedIn(true);
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
          const pMap: Record<string, any> = {};
          data.forEach((p: any) => {
            stockMap[p.id] = p.stock || 0;
            pMap[p.id] = p;
          });
          setProductsStock(stockMap);
          setProductsMap(pMap);
        }
      } catch (err) {
        console.error('Failed to fetch product stocks:', err);
      }
    };
    fetchStocks();
  }, []);
  const handleStockError = async (productName: string) => {
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
      console.error('Failed to refresh stocks on error:', err);
    }
  };


  // Monitor stock and auto-clamp quantities if database stock levels decrease
  useEffect(() => {
    if (Object.keys(productsStock).length > 0) {
      items.forEach((item) => {
        const dbStock = productsStock[item.id];
        if (dbStock !== undefined && item.quantity > dbStock) {
          updateQuantity(item.cartItemId, dbStock);
        }
      });
    }
  }, [productsStock, items, updateQuantity]);

  if (!mounted) return null; // Prevent hydration mismatch

  if (items.length === 0 && checkoutStep === 1) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center -mt-16">
        <div className="max-w-md mx-auto px-4 text-center flex flex-col justify-center items-center">
          <div className="mb-6 sm:mb-8 w-24 h-24 sm:w-28 sm:h-28 bg-zinc-200 rounded-full flex items-center justify-center text-white shadow-inner">
            <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-3 text-zinc-900 tracking-tight">{t.cart.emptyTitle || 'Your cart is empty'}</h1>
          
          {!isLoggedIn ? (
            <>
              <p className="text-zinc-500 mb-8 sm:mb-10 text-sm sm:text-base leading-relaxed">
                {locale === 'zh' 
                  ? `登录您的 ${settings?.businessName || 'Cheng-BOOM'} 帐户以查看您保存的商品或继续购物` 
                  : locale === 'ms'
                  ? `Log masuk ke akaun ${settings?.businessName || 'Cheng-BOOM'} anda untuk melihat item anda yang disimpan atau teruskan membeli-belah`
                  : `Sign in to your ${settings?.businessName || 'Cheng-BOOM'} account to view your saved items or continue shopping`}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <Link 
                  href="/shop" 
                  className="w-full sm:w-auto px-8 py-3.5 bg-zinc-100 text-zinc-600 rounded-full font-bold hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {locale === 'zh' ? '继续购物' : locale === 'ms' ? 'Teruskan Membeli-belah' : 'Continue shopping'} <ArrowRight size={18} className="hidden sm:block" />
                </Link>
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-8 py-3.5 bg-white border border-zinc-200 text-zinc-900 rounded-full font-bold hover:bg-zinc-50 transition-colors text-center shadow-sm"
                >
                  {locale === 'zh' ? '登录' : locale === 'ms' ? 'Log Masuk' : 'Sign in'}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 sm:mb-10 text-sm sm:text-base px-4">{t.cart.emptyDesc}</p>
              <Link 
                href="/shop" 
                className="w-full sm:w-auto max-w-xs mx-auto px-6 sm:px-8 py-3.5 sm:py-3 bg-primary text-zinc-900 rounded-full font-bold hover:brightness-110 transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {t.cart.startShopping || 'Continue shopping'} <ArrowRight size={18} />
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const baseTotalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemSavings = totalOriginalPrice - baseTotalPrice;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{`${t.cart.title} - Cheng-BOOM`}</title>
      </Head>
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="flex flex-col items-center justify-center mb-10 sm:mb-16">
          <h1 className="text-[32px] sm:text-[40px] font-medium text-zinc-900 tracking-tight mb-8 sm:mb-12">
            {locale === 'zh' ? '您的购物车' : locale === 'ms' ? 'Troli Beli-belah Anda' : 'Your Shopping Cart'}
          </h1>
          
          <div className="flex items-center gap-4 sm:gap-12 overflow-x-auto w-full justify-start sm:justify-center px-4 sm:px-0 scrollbar-hide">
            {/* Step 1 */}
            <div className={`flex items-center gap-2 sm:gap-3 px-2 shrink-0 transition-all ${checkoutStep >= 1 ? 'border-b-2 border-zinc-900 pb-3 sm:pb-4' : 'opacity-50 pb-3 sm:pb-4'}`}>
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${checkoutStep >= 1 ? 'bg-zinc-900 text-white' : 'bg-zinc-400 text-white'}`}>1</div>
              <span className={`text-[13px] sm:text-[15px] font-bold whitespace-nowrap ${checkoutStep >= 1 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                {locale === 'zh' ? '购物车' : locale === 'ms' ? 'Troli Beli-belah' : 'Shopping cart'}
              </span>
            </div>
            
            {/* Step 2 */}
            <div className={`flex items-center gap-2 sm:gap-3 px-2 shrink-0 transition-all ${checkoutStep >= 2 ? 'border-b-2 border-zinc-900 pb-3 sm:pb-4' : 'opacity-50 pb-3 sm:pb-4'}`}>
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${checkoutStep >= 2 ? 'bg-zinc-900 text-white' : 'bg-zinc-400 text-white'}`}>2</div>
              <span className={`text-[13px] sm:text-[15px] font-bold whitespace-nowrap ${checkoutStep >= 2 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                {locale === 'zh' ? '结账详情' : locale === 'ms' ? 'Butiran Pembayaran' : 'Checkout details'}
              </span>
            </div>
            
            {/* Step 3 */}
            <div className={`flex items-center gap-2 sm:gap-3 px-2 shrink-0 transition-all ${checkoutStep >= 3 ? 'border-b-2 border-zinc-900 pb-3 sm:pb-4' : 'opacity-50 pb-3 sm:pb-4'}`}>
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${checkoutStep >= 3 ? 'bg-zinc-900 text-white' : 'bg-zinc-400 text-white'}`}>3</div>
              <span className={`text-[13px] sm:text-[15px] font-bold whitespace-nowrap ${checkoutStep >= 3 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                {locale === 'zh' ? '完成订单' : locale === 'ms' ? 'Pesanan Selesai' : 'Order complete'}
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Cart Items */}
        {checkoutStep === 1 && (
          <>
          <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
          
          {/* Top Bar: Select All & Delete */}
          <div className="bg-white border-double border-[6px] border-zinc-200/60 rounded-[32px] p-4 px-6 flex items-center justify-between shadow-sm">
            <button 
              onClick={toggleAllSelection} 
              className="flex items-center gap-3 text-zinc-900 font-medium hover:opacity-80 transition-opacity focus:outline-none px-2"
            >
              <div className="text-zinc-400 hover:text-zinc-900 transition-colors">
                {selectedItemIds.length === items.length && items.length > 0 ? (
                  <CheckSquare size={20} className="text-zinc-900" />
                ) : (
                  <Square size={20} />
                )}
              </div>
              <span className="text-sm">{locale === 'zh' ? '全选' : locale === 'ms' ? 'Pilih Semua' : 'Select All'}</span>
            </button>
            
            <button 
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={selectedItemIds.length === 0}
              className={`py-2 px-6 rounded-full text-sm font-bold transition-all shadow-sm ${
                selectedItemIds.length > 0 
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800' 
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'
              }`}
            >
              {locale === 'zh' ? '删除' : locale === 'ms' ? 'Padam' : 'Delete'}
            </button>
          </div>

          {/* Cart Items List */}
          <div className="bg-white border-double border-[6px] border-zinc-200/60 rounded-[40px] p-3 sm:p-5 shadow-sm flex flex-col mb-10">
            {items.map((item, index) => (
              <div 
                key={item.cartItemId} 
                className={`group relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 transition-colors ${
                  index !== items.length - 1 ? 'border-b border-zinc-100' : ''
                }`}
              >
                {/* Item Checkbox */}
                <div className="flex justify-center shrink-0 mt-8 sm:mt-10">
                  <button 
                    onClick={() => toggleItemSelection(item.cartItemId)}
                    className="text-zinc-400 hover:text-zinc-900 transition-colors focus:outline-none"
                  >
                    {selectedItemIds.includes(item.cartItemId) ? (
                      <CheckSquare size={20} className="text-zinc-900" />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>
                </div>

                {/* Item Image Container */}
                <Link href={`/shop/${item.id}?from=cart`} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center p-2 hover:opacity-90 transition-opacity">
                  <img src={item.image || '/transparent-Background.png'} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                </Link>

                {/* Item Details */}
                <div className="flex-1 flex flex-col py-1 h-24 sm:h-28">
                  {/* Top Row: Name and Delete Icon */}
                  <div className="flex justify-between items-start gap-2">
                    <Link href={`/shop/${item.id}?from=cart`} className="hover:opacity-80 transition-opacity">
                      <h3 className="text-[14px] sm:text-[15px] font-bold text-zinc-900 line-clamp-2 leading-tight">
                        {t.products?.[item.id]?.name || item.name}
                      </h3>
                    </Link>
                    <button 
                      onClick={() => setItemToRemove(item.cartItemId)}
                      className="text-red-500 hover:text-red-600 transition-colors p-1 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Second Row: Variation */}
                  {(item.variant || item.code) && (
                    <div className="text-[12px] sm:text-[13px] text-zinc-500 mt-1">
                      {item.variant ? (
                        (productsMap[item.id] && productsMap[item.id].boxPrice !== null && productsMap[item.id].boxPrice !== undefined) ? (
                          <div className="flex items-center gap-1">
                            <span>{locale === 'zh' ? '分类:' : locale === 'ms' ? 'Variasi:' : 'Variation:'}</span>
                            <select 
                              value={item.variant} 
                              onChange={(e) => {
                                const newVariant = e.target.value as 'Single' | 'Box';
                                const pDetails = productsMap[item.id];
                                let newPrice = item.price;
                                let newOrigPrice = item.originalPrice;
                                if (pDetails) {
                                  if (newVariant === 'Box') {
                                    newPrice = pDetails.boxPromotion || (isSeller ? pDetails.boxSellerPrice : null) || pDetails.boxPrice || item.price;
                                    newOrigPrice = pDetails.boxPrice || item.originalPrice;
                                  } else {
                                    newPrice = pDetails.promotion || (isSeller ? pDetails.sellerPrice : null) || pDetails.price || item.price;
                                    newOrigPrice = pDetails.price || item.originalPrice;
                                  }
                                }
                                updateVariant(item.cartItemId, newVariant, newPrice, newOrigPrice);
                              }}
                              className="bg-transparent text-zinc-700 font-medium p-0 border-none outline-none cursor-pointer hover:text-zinc-900 transition-colors"
                            >
                              <option value="Single">Single</option>
                              <option value="Box">Box</option>
                            </select>
                          </div>
                        ) : (
                          <span>{locale === 'zh' ? '分类:' : locale === 'ms' ? 'Variasi:' : 'Variation:'} {item.variant}</span>
                        )
                      ) : (
                        <span>{item.code}</span>
                      )}
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1"></div>

                  {/* Bottom Row: Price and Quantity */}
                  <div className="flex items-end justify-between w-full mt-2">
                    <div className="font-bold text-base sm:text-lg text-zinc-900">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </div>
                    
                    <div className="flex items-center bg-zinc-100 rounded-full h-8 px-1">
                      <button 
                        onClick={() => {
                          if (item.quantity <= 1) {
                            setItemToRemove(item.cartItemId);
                          } else {
                            updateQuantity(item.cartItemId, item.quantity - 1);
                          }
                        }}
                        className="w-7 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-none"
                      >
                        <Minus size={14} />
                      </button>
                      <div className="w-6 text-center text-[13px] font-bold text-zinc-900">
                        {item.quantity}
                      </div>
                      <button 
                        onClick={() => {
                          const maxStock = productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity);
                          updateQuantity(item.cartItemId, item.quantity + 1, maxStock);
                        }}
                        disabled={item.quantity >= (productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity))}
                        className="w-7 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 disabled:opacity-50 transition-colors focus:outline-none"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Total Section */}
        <div className="sm:hidden w-full bg-white dark:bg-zinc-950 mt-4 p-4 border-t border-zinc-100 dark:border-zinc-800">
          {/* Details */}
          <div className="space-y-3 text-sm mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex justify-between items-center gap-4 text-zinc-600 dark:text-zinc-400 font-medium">
              <span>{locale === 'zh' ? `小计 (${selectedItemIds.length})` : locale === 'ms' ? `Subjumlah (${selectedItemIds.length})` : `Subtotal (${selectedItemIds.length})`}</span>
              <span>RM {selectedTotalOriginalPrice.toFixed(2)}</span>
            </div>
            
            {selectedTotalPromoDiscount > 0 && (
              <div className="flex justify-between items-center gap-4 text-zinc-600 dark:text-zinc-400 font-medium">
                <span>{locale === 'zh' ? '商品折扣' : locale === 'ms' ? 'Diskaun Produk' : 'Product Discount'}</span>
                <span>-RM {selectedTotalPromoDiscount.toFixed(2)}</span>
              </div>
            )}

            {selectedTotalSellerItemDiscount > 0 && (
              <div className="flex justify-between items-center gap-4 text-primary font-medium">
                <span>{locale === 'zh' ? '卖家专属优惠' : locale === 'ms' ? 'Tawaran Eksklusif Penjual' : 'Seller Exclusive Price'}</span>
                <span>-RM {selectedTotalSellerItemDiscount.toFixed(2)}</span>
              </div>
            )}

            {selectedTotalDiscount > 0 && (
              <div className="flex justify-between items-center gap-4 text-purple-500 font-medium">
                <span>{locale === 'zh' ? `${sellerLevelName || '卖家'}折扣 (${discountPercent}%)` : locale === 'ms' ? `Diskaun ${sellerLevelName || 'Penjual'} (${discountPercent}%)` : `${sellerLevelName || 'Seller'} Tier Discount (${discountPercent}%)`}</span>
                <span>-RM {selectedTotalDiscount.toFixed(2)}</span>
              </div>
            )}

            {selectedTotalSaved > 0 && (
              <div className="flex justify-between items-center gap-4 text-primary font-bold">
                <span>{locale === 'zh' ? '已节省' : locale === 'ms' ? 'Jimat' : 'Saved'}</span>
                <span>-RM {selectedTotalSaved.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center gap-4 font-black text-foreground text-lg mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <span>{locale === 'zh' ? `总计 (${selectedItemIds.length} 件)` : locale === 'ms' ? `Jumlah (${selectedItemIds.length} item)` : `Total (${selectedItemIds.length} Items)`}</span>
              <span className="text-primary">RM {finalSelectedTotalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Mobile Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                if (selectedItemIds.length === 0) {
                  alert(locale === 'zh' ? '请选择商品进行结算' : locale === 'ms' ? 'Sila pilih item untuk dibayar' : 'Please select items to checkout');
                  return;
                }
                setCheckoutStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={selectedItemIds.length === 0}
              className={`w-full py-3.5 rounded-full font-black text-base transition-all shadow-md ${selectedItemIds.length > 0 ? 'bg-primary text-zinc-900 hover:brightness-110 hover:shadow-lg hover:shadow-primary/20' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed shadow-none'}`}
            >
              {t.cart.checkout.confirmBtn || 'Check Out'}
            </button>
            <Link 
              href="/shop" 
              className="flex items-center justify-center w-full py-3.5 rounded-full font-bold text-base transition-all bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 shadow-sm"
            >
              {locale === 'zh' ? '继续购物' : locale === 'ms' ? 'Teruskan Membeli-belah' : 'Continue Shopping'}
            </Link>
          </div>
        </div>

        {/* Sticky Bottom Bar (Desktop Only) */}
        <div className="hidden sm:block sticky bottom-6 z-50 w-full max-w-6xl mx-auto">
          <div className="bg-white border-double border-[6px] border-zinc-200/60 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden flex flex-col">
            
            {/* Discount Details Drawer */}
            <AnimatePresence>
              {isDiscountDetailOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full bg-zinc-50/50"
                >
                  <div className="px-8 sm:px-10 pt-8 pb-4 border-b border-zinc-100">
                    <h4 className="text-lg font-black text-zinc-900 mb-6 text-left">
                      {locale === 'zh' ? '折扣详情' : locale === 'ms' ? 'Perincian Diskaun' : 'Discount Detail'}
                    </h4>
                    
                    <div className="space-y-4 text-sm w-full">
                      <div className="flex justify-between items-center gap-4 text-zinc-600 font-medium">
                        <span className="whitespace-nowrap">{locale === 'zh' ? '小计' : locale === 'ms' ? 'Subjumlah' : 'Subtotal'}</span>
                        <span className="whitespace-nowrap font-bold text-zinc-900">RM {selectedTotalOriginalPrice.toFixed(2)}</span>
                      </div>
                      
                      {selectedTotalPromoDiscount > 0 && (
                        <div className="flex justify-between items-center gap-4 text-zinc-600 font-medium">
                          <span className="whitespace-nowrap">{locale === 'zh' ? '商品折扣' : locale === 'ms' ? 'Diskaun Produk' : 'Product Discount'}</span>
                          <span className="whitespace-nowrap font-bold text-zinc-900">-RM {selectedTotalPromoDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {selectedTotalSellerItemDiscount > 0 && (
                        <div className="flex justify-between items-center gap-4 text-primary font-medium">
                          <span className="whitespace-nowrap">{locale === 'zh' ? '卖家专属优惠' : locale === 'ms' ? 'Tawaran Eksklusif Penjual' : 'Seller Exclusive Price'}</span>
                          <span className="whitespace-nowrap font-bold">-RM {selectedTotalSellerItemDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {selectedTotalDiscount > 0 && (
                        <div className="flex justify-between items-center gap-4 text-purple-500 font-medium">
                          <span className="whitespace-nowrap">{locale === 'zh' ? `${sellerLevelName || '卖家'}折扣 (${discountPercent}%)` : locale === 'ms' ? `Diskaun ${sellerLevelName || 'Penjual'} (${discountPercent}%)` : `${sellerLevelName || 'Seller'} Tier Discount (${discountPercent}%)`}</span>
                          <span className="whitespace-nowrap font-bold">-RM {selectedTotalDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="pt-4 mt-4 border-t border-zinc-200">
                        <div className="flex justify-between items-center gap-4 text-primary font-bold">
                          <span className="whitespace-nowrap">{locale === 'zh' ? '已节省' : locale === 'ms' ? 'Jimat' : 'Saved'}</span>
                          <span className="whitespace-nowrap">-RM {selectedTotalSaved.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 font-black text-zinc-900 mt-3 text-base">
                          <span className="whitespace-nowrap">{locale === 'zh' ? '总金额' : locale === 'ms' ? 'Jumlah Keseluruhan' : 'Total Amount'}</span>
                          <span className="whitespace-nowrap text-lg">RM {finalSelectedTotalPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-left text-[11px] text-zinc-400 mt-3">
                          * {locale === 'zh' ? '结账时显示的最终价格' : locale === 'ms' ? 'Harga akhir dipaparkan semasa pembayaran' : 'Final price shown at checkout'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Standard Bar Content */}
            <div className="w-full px-6 py-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 bg-white relative z-10">
              
              {/* Left Actions */}
              <div className="flex items-center gap-6">
                <Link 
                  href="/shop" 
                  className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full py-3 px-6 transition-all text-sm font-bold group shadow-sm"
                >
                  <ArrowRight size={18} className="rotate-180 transition-transform group-hover:-translate-x-1" />
                  <span className="whitespace-nowrap">{locale === 'zh' ? '继续购物' : locale === 'ms' ? 'Teruskan Membeli-belah' : 'Continue Shopping'}</span>
                </Link>
              </div>

              {/* Right Totals & Checkout */}
              <div className="flex items-center gap-4 sm:gap-6 ml-auto">
                <div className="text-right flex items-center gap-2 cursor-pointer" onClick={() => setIsDiscountDetailOpen(!isDiscountDetailOpen)}>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center justify-end gap-2 text-sm sm:text-base font-medium text-zinc-500">
                      {locale === 'zh' ? '总计' : locale === 'ms' ? 'Jumlah' : 'Total'} ({selectedItemIds.length} {locale === 'zh' ? '件' : locale === 'ms' ? 'item' : 'items'}): 
                      <span className="text-2xl sm:text-3xl font-black text-zinc-900 ml-1 whitespace-nowrap">RM {finalSelectedTotalPrice.toFixed(2)}</span>
                    </div>
                    {selectedTotalSaved > 0 && (
                      <div className="text-xs sm:text-sm font-medium text-zinc-500">
                        {locale === 'zh' ? '已节省' : locale === 'ms' ? 'Jimat' : 'Saved'} <span className="text-zinc-900 font-bold ml-1">RM {selectedTotalSaved.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    className="p-1 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-900 mt-0.5"
                  >
                    {isDiscountDetailOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                </div>

                {/* Check Out Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedItemIds.length === 0) {
                      alert(locale === 'zh' ? '请选择商品进行结算' : locale === 'ms' ? 'Sila pilih item untuk dibayar' : 'Please select items to checkout');
                      return;
                    }
                    setCheckoutStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={selectedItemIds.length === 0}
                  className={`py-3 sm:py-4 px-8 sm:px-10 rounded-full font-black text-base sm:text-lg transition-all shadow-md flex items-center justify-center ${selectedItemIds.length > 0 ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'}`}
                >
                  {t.cart.checkout.confirmBtn || 'Check Out'}
                </button>
              </div>

            </div>
          </div>
        </div>
          </>
        )}

        {/* ── CHECKOUT STEP 2: INLINE CHECKOUT DETAILS ──────────── */}

        {checkoutStep === 2 && (
          <InlineCheckoutDetails
            cartItems={selectedItems}
            cartTotals={{
              totalPrice: finalSelectedTotalPrice,
              totalOriginalPrice: selectedTotalOriginalPrice,
              totalDiscount: selectedTotalSaved,
              discountPercent: discountPercent,
              sellerLevelName: sellerLevelName,
              isFreeShipping: isFreeShipping
            }}
            clearCart={clearCart}
            onBack={() => setCheckoutStep(1)}
            onSuccess={() => {
              setCheckoutStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStockError={handleStockError}
          />
        )}

        {/* ── CHECKOUT STEP 3: ORDER COMPLETE ────────────────────── */}

        {checkoutStep === 3 && (
          <OrderComplete />
        )}

      </div>

      {/* Remove Item Confirmation Modal */}
      <AnimatePresence>
        {itemToRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100">
                <h3 className="text-lg font-black text-zinc-900">
                  {removeItemTranslations.title[locale as 'en' | 'zh' | 'ms'] || removeItemTranslations.title.en}
                </h3>
                <button 
                  onClick={() => setItemToRemove(null)}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-zinc-600 font-medium">
                  {removeItemTranslations.message[locale as 'en' | 'zh' | 'ms'] || removeItemTranslations.message.en}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setItemToRemove(null)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors"
                  >
                    {removeItemTranslations.cancel[locale as 'en' | 'zh' | 'ms'] || removeItemTranslations.cancel.en}
                  </button>
                  <button
                    onClick={() => {
                      removeItem(itemToRemove);
                      setItemToRemove(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                  >
                    {removeItemTranslations.confirm[locale as 'en' | 'zh' | 'ms'] || removeItemTranslations.confirm.en}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {isBulkDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100">
                <h3 className="text-lg font-black text-zinc-900">
                  {bulkDeleteTranslations.title[locale as 'en' | 'zh' | 'ms'] || bulkDeleteTranslations.title.en}
                </h3>
                <button 
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-zinc-600 font-medium">
                  {bulkDeleteTranslations.message[locale as 'en' | 'zh' | 'ms'] || bulkDeleteTranslations.message.en}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setIsBulkDeleteModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors"
                  >
                    {bulkDeleteTranslations.cancel[locale as 'en' | 'zh' | 'ms'] || bulkDeleteTranslations.cancel.en}
                  </button>
                  <button
                    onClick={executeBulkDelete}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                  >
                    {bulkDeleteTranslations.confirm[locale as 'en' | 'zh' | 'ms'] || bulkDeleteTranslations.confirm.en}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {isClearCartModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100">
                <h3 className="text-lg font-black text-zinc-900">
                  {clearCartTranslations.title[locale as 'en' | 'zh' | 'ms'] || clearCartTranslations.title.en}
                </h3>
                <button 
                  onClick={() => setIsClearCartModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-zinc-600 font-medium">
                  {clearCartTranslations.message[locale as 'en' | 'zh' | 'ms'] || clearCartTranslations.message.en}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setIsClearCartModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors"
                  >
                    {clearCartTranslations.cancel[locale as 'en' | 'zh' | 'ms'] || clearCartTranslations.cancel.en}
                  </button>
                  <button
                    onClick={() => {
                      clearCart();
                      setIsClearCartModalOpen(false);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                  >
                    {clearCartTranslations.confirm[locale as 'en' | 'zh' | 'ms'] || clearCartTranslations.confirm.en}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
