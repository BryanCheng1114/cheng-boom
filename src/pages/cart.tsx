import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '../components/cart/CartProvider';
import { useBusiness } from '../context/BusinessContext';
import { SharedCheckoutModal } from '../components/checkout/SharedCheckoutModal';
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
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

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

  const removeSelectedItems = () => {
    selectedItemIds.forEach(id => removeItem(id));
    setSelectedItemIds([]);
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

  if (items.length === 0) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center min-h-[50vh] sm:min-h-[60vh] flex flex-col justify-center items-center">
          <div className="mb-4 sm:mb-6 w-20 h-20 sm:w-24 sm:h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
            <ShoppingCart className="w-8 h-8 sm:w-12 sm:h-12" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4 text-foreground tracking-tight">{t.cart.emptyTitle || 'Your cart is empty'}</h1>
          
          {!isLoggedIn ? (
            <>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 sm:mb-10 text-sm sm:text-base max-w-md leading-relaxed px-4">
                {locale === 'zh' 
                  ? `登录您的 ${settings?.businessName || 'Cheng-BOOM'} 帐户以查看您保存的商品或继续购物` 
                  : locale === 'ms'
                  ? `Log masuk ke akaun ${settings?.businessName || 'Cheng-BOOM'} anda untuk melihat item anda yang disimpan atau teruskan membeli-belah`
                  : `Sign in to your ${settings?.businessName || 'Cheng-BOOM'} account to view your saved items or continue shopping`}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto">
                <Link 
                  href="/shop" 
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  {locale === 'zh' ? '继续购物' : locale === 'ms' ? 'Teruskan Membeli-belah' : 'Continue shopping'} <ArrowRight size={18} className="hidden sm:block" />
                </Link>
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 bg-primary text-zinc-900 rounded-full font-bold hover:brightness-110 transition-all text-center shadow-lg shadow-primary/20"
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
      </>
    );
  }

  const baseTotalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemSavings = totalOriginalPrice - baseTotalPrice;

  return (
    <>
      <Head>
        <title>{`${t.cart.title} - Cheng-BOOM`}</title>
      </Head>
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="flex items-center justify-between mb-4 sm:mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
            {locale === 'zh' ? '我的购物车' : locale === 'ms' ? 'Troli Beli-belah Saya' : 'My Shopping Cart'}
          </h1>
        </div>

        {/* Mobile Subtotal Header */}
        <div className="flex sm:hidden items-center justify-between mb-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {locale === 'zh' ? `小计 (${selectedItemIds.length})` : locale === 'ms' ? `Subjumlah (${selectedItemIds.length})` : `Subtotal (${selectedItemIds.length})`}: <span className="font-bold text-foreground ml-1">RM {finalSelectedTotalPrice.toFixed(2)}</span>
          </div>
          <button
            onClick={() => {
              if (selectedItemIds.length === 0) {
                alert(locale === 'zh' ? '请选择商品进行结算' : locale === 'ms' ? 'Sila pilih item untuk dibayar' : 'Please select items to checkout');
                return;
              }
              setIsCheckoutOpen(true);
            }}
            disabled={selectedItemIds.length === 0}
            className={`py-2 px-5 rounded-full font-bold text-sm transition-all shadow-sm ${selectedItemIds.length > 0 ? 'bg-primary text-zinc-900 hover:brightness-110' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed shadow-none'}`}
          >
            {t.cart.checkout.confirmBtn || 'Check Out'}
          </button>
        </div>
        
        <div className="w-full">
          {/* Cart Table Header (Desktop only) */}
          <div className="hidden sm:flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            <div className="w-[40px] flex justify-center shrink-0">
              <button onClick={toggleAllSelection} className="hover:text-primary transition-colors focus:outline-none">
                {selectedItemIds.length === items.length && items.length > 0 ? (
                  <CheckSquare size={20} className="text-primary" />
                ) : (
                  <Square size={20} />
                )}
              </button>
            </div>
            <div className="flex-1">{locale === 'zh' ? '商品' : locale === 'ms' ? 'Item' : 'Item'}</div>
            <div className="w-[15%] text-center">{locale === 'zh' ? '单价' : locale === 'ms' ? 'Harga Seunit' : 'Item Price'}</div>
            <div className="w-[15%] text-center">{locale === 'zh' ? '数量' : locale === 'ms' ? 'Kuantiti' : 'Quantity'}</div>
            <div className="w-[15%] text-center">{locale === 'zh' ? '价格' : locale === 'ms' ? 'Harga' : 'Price'}</div>
            <div className="w-[10%] flex justify-center shrink-0"></div>
          </div>

          {/* Cart Items */}
          <div className="w-full pb-6">
            {items.map((item) => (
              <div key={item.cartItemId} className="group relative flex flex-row flex-wrap sm:flex-nowrap items-start sm:items-center gap-2 sm:gap-4 py-6 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
                
                {/* Checkbox */}
                <div className="flex w-[30px] sm:w-[40px] justify-center shrink-0 mt-3 sm:mt-0">
                  <button 
                    onClick={() => toggleItemSelection(item.cartItemId)}
                    className="text-zinc-400 hover:text-primary transition-colors focus:outline-none"
                  >
                    {selectedItemIds.includes(item.cartItemId) ? (
                      <CheckSquare size={20} className="text-primary" />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>
                </div>

                {/* Mobile & Desktop Image */}
                <Link href={`/shop/${item.id}?from=cart`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden bg-transparent shrink-0">
                  <img src={item.image || '/transparent-Background.png'} alt={item.name} className="w-full h-full object-contain" />
                </Link>

                {/* Details Container */}
                <div className="flex-1 flex flex-col justify-center gap-1 sm:gap-0 sm:flex-row sm:items-center min-w-[150px]">
                  
                  {/* Title & Mobile details */}
                  <div className="flex-1 flex flex-col justify-center">
                    <Link href={`/shop/${item.id}?from=cart`} className="hover:opacity-80 transition-opacity">
                      <h3 className="text-sm sm:text-base font-medium text-foreground line-clamp-2 leading-tight">
                        {t.products?.[item.id]?.name || item.name}
                      </h3>
                    </Link>
                    
                    {/* Mobile Price */}
                    <div className="sm:hidden mt-1 text-foreground font-bold text-sm">
                      RM {item.price.toFixed(2)}
                    </div>

                    {/* Variation */}
                    {(item.variant || item.code) && (
                      <div className="text-xs text-zinc-500 mt-1 sm:mt-2 flex items-center gap-2">
                        <span className="font-medium text-zinc-600 dark:text-zinc-400">{locale === 'zh' ? '分类:' : locale === 'ms' ? 'Variasi:' : 'Variation:'}</span>
                        {item.variant ? (
                          (productsMap[item.id] && productsMap[item.id].boxPrice !== null && productsMap[item.id].boxPrice !== undefined) ? (
                            <div className="relative group/variant" onClick={(e) => e.preventDefault()}>
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
                                className="bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded px-2 py-1 text-xs outline-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:ring-1 focus:ring-primary"
                              >
                                <option value="Single">Single</option>
                                <option value="Box">Box</option>
                              </select>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500">{item.variant}</span>
                          )
                        ) : (
                          <span className="text-xs text-zinc-500">{item.code}</span>
                        )}
                      </div>
                    )}

                    {/* Mobile Remove & Quantity Row */}
                    <div className="flex sm:hidden items-center justify-between mt-4 w-full pr-2">
                      <button 
                        onClick={() => setItemToRemove(item.cartItemId)}
                        className="text-primary text-sm font-medium hover:opacity-80 transition-opacity"
                      >
                        {locale === 'zh' ? '删除' : locale === 'ms' ? 'Padam' : 'Remove'}
                      </button>

                      {/* Mobile Quantity */}
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-sm overflow-hidden h-7">
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-7 h-full flex items-center justify-center bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-r border-zinc-200 dark:border-zinc-700"
                        >
                          <Minus size={12} />
                        </button>
                        <div className="w-8 h-full flex items-center justify-center bg-transparent text-xs font-medium text-foreground">
                          {item.quantity}
                        </div>
                        <button 
                          onClick={() => {
                            const maxStock = productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity);
                            updateQuantity(item.cartItemId, item.quantity + 1, maxStock);
                          }}
                          disabled={item.quantity >= (productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity))}
                          className="w-7 h-full flex items-center justify-center bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors border-l border-zinc-200 dark:border-zinc-700"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Only Columns */}
                  
                  {/* Unit Price (Desktop) */}
                  <div className="hidden sm:block w-[15%] text-center">
                    <p className="text-zinc-600 dark:text-zinc-300 font-medium text-sm">RM {item.price.toFixed(2)}</p>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="mt-1 flex flex-col items-center justify-center gap-0.5">
                        {(() => {
                          const pDetails = productsMap[item.id];
                          let isSellerPrice = false;
                          if (pDetails) {
                            if (item.variant === 'Box') {
                              isSellerPrice = isSeller && pDetails.boxSellerPrice != null && item.price === pDetails.boxSellerPrice;
                            } else {
                              isSellerPrice = isSeller && pDetails.sellerPrice != null && item.price === pDetails.sellerPrice;
                            }
                          }
                          return (
                            <span className={`text-xs font-medium ${isSellerPrice ? 'text-primary' : 'text-zinc-400 line-through'}`}>
                              {isSellerPrice 
                                ? (locale === 'zh' ? '卖家优惠 ' : locale === 'ms' ? 'Diskaun Penjual ' : 'Seller Discount ') 
                                : ''}
                              {isSellerPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) + '%' : `RM ${item.originalPrice.toFixed(2)}`}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Quantity (Desktop) */}
                  <div className="hidden sm:flex w-[15%] flex-col items-center justify-center">
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-sm overflow-hidden h-8">
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-8 h-full flex items-center justify-center bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-r border-zinc-200 dark:border-zinc-700"
                      >
                        <Minus size={14} />
                      </button>
                      <div className="w-10 h-full flex items-center justify-center bg-transparent text-sm font-medium text-foreground">
                        {item.quantity}
                      </div>
                      <button 
                        onClick={() => {
                          const maxStock = productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity);
                          updateQuantity(item.cartItemId, item.quantity + 1, maxStock);
                        }}
                        disabled={item.quantity >= (productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity))}
                        className="w-8 h-full flex items-center justify-center bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors border-l border-zinc-200 dark:border-zinc-700"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {item.quantity >= (productsStock[item.id] !== undefined ? productsStock[item.id] : (item.stock ?? Infinity)) ? (
                      <p className="text-red-500 text-[10px] uppercase mt-1 text-center">Max Stock</p>
                    ) : (productsStock[item.id] !== undefined && productsStock[item.id] <= 5 && productsStock[item.id] > 0) ? (
                      <p className="text-red-500 text-xs mt-1 text-center">{productsStock[item.id]} items left</p>
                    ) : null}
                  </div>

                  {/* Total Price (Desktop) */}
                  <div className="hidden sm:flex w-[15%] justify-center items-center font-bold text-sm text-foreground">
                    RM {(item.price * item.quantity).toFixed(2)}
                  </div>

                  {/* Delete Action (Desktop) */}
                  <div className="hidden sm:flex w-[10%] justify-center">
                    <button 
                      onClick={() => setItemToRemove(item.cartItemId)}
                      className="text-zinc-400 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={18} />
                    </button>
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
                setIsCheckoutOpen(true);
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
        <div className="hidden sm:block sticky bottom-0 w-full bg-white dark:bg-zinc-950 border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 transition-all duration-300 rounded-sm mt-8">
          <div className="w-full px-5 sm:px-8 py-4 sm:py-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
            
            {/* Left Actions */}
            <div className="flex items-center gap-6">
              <Link 
                href="/shop" 
                className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full py-2.5 px-6 transition-all text-sm sm:text-base font-bold group shadow-sm"
              >
                <ArrowRight size={18} className="rotate-180 transition-transform group-hover:-translate-x-1" />
                <span className="whitespace-nowrap">{locale === 'zh' ? '继续购物' : locale === 'ms' ? 'Teruskan Membeli-belah' : 'Continue Shopping'}</span>
              </Link>
            </div>

            {/* Right Totals & Checkout */}
            <div className="flex items-center gap-4 sm:gap-6 ml-auto relative">
              <div className="text-right flex items-center gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center justify-end gap-2 text-sm sm:text-base font-medium text-zinc-600 dark:text-zinc-300">
                    {locale === 'zh' ? '总计' : locale === 'ms' ? 'Jumlah' : 'Total'} ({selectedItemIds.length} {locale === 'zh' ? '件' : locale === 'ms' ? 'item' : 'items'}): 
                    <span className="text-2xl sm:text-3xl font-black text-primary ml-1 whitespace-nowrap">RM {finalSelectedTotalPrice.toFixed(2)}</span>
                  </div>
                  {selectedTotalSaved > 0 && (
                    <div className="text-xs sm:text-sm font-medium text-zinc-500">
                      {locale === 'zh' ? '已节省' : locale === 'ms' ? 'Jimat' : 'Saved'} <span className="text-primary font-bold ml-1">RM {selectedTotalSaved.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsDiscountDetailOpen(!isDiscountDetailOpen)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 mt-0.5"
                >
                  {isDiscountDetailOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>

              {/* Check Out Button */}
              <button
                onClick={() => {
                  if (selectedItemIds.length === 0) {
                    alert(locale === 'zh' ? '请选择商品进行结算' : locale === 'ms' ? 'Sila pilih item untuk dibayar' : 'Please select items to checkout');
                    return;
                  }
                  setIsCheckoutOpen(true);
                }}
                disabled={selectedItemIds.length === 0}
                className={`py-3 sm:py-4 px-8 sm:px-10 rounded-full font-black text-base sm:text-lg transition-all shadow-md flex items-center justify-center ${selectedItemIds.length > 0 ? 'bg-primary text-zinc-900 hover:brightness-110 hover:shadow-lg hover:shadow-primary/20' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed shadow-none'}`}
              >
                {t.cart.checkout.confirmBtn || 'Check Out'}
              </button>

              {/* Discount Details Popover */}
              <AnimatePresence>
                {isDiscountDetailOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-[calc(100%+20px)] right-0 sm:right-[150px] w-[340px] sm:w-[420px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-[60] origin-bottom-right"
                  >
                    {/* Tail arrow */}
                    <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white dark:bg-zinc-900 border-b border-r border-zinc-200 dark:border-zinc-800 rotate-45" />
                    
                    <h4 className="text-lg font-black text-foreground mb-4">
                      {locale === 'zh' ? '折扣详情' : locale === 'ms' ? 'Perincian Diskaun' : 'Discount Detail'}
                    </h4>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center gap-4 text-zinc-600 dark:text-zinc-400 font-medium">
                        <span className="whitespace-nowrap">{locale === 'zh' ? '小计' : locale === 'ms' ? 'Subjumlah' : 'Subtotal'}</span>
                        <span className="whitespace-nowrap">RM {selectedTotalOriginalPrice.toFixed(2)}</span>
                      </div>
                      
                      {selectedTotalPromoDiscount > 0 && (
                        <div className="flex justify-between items-center gap-4 text-zinc-600 dark:text-zinc-400 font-medium">
                          <span className="whitespace-nowrap">{locale === 'zh' ? '商品折扣' : locale === 'ms' ? 'Diskaun Produk' : 'Product Discount'}</span>
                          <span className="whitespace-nowrap">-RM {selectedTotalPromoDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {selectedTotalSellerItemDiscount > 0 && (
                        <div className="flex justify-between items-center gap-4 text-primary font-medium">
                          <span className="whitespace-nowrap">{locale === 'zh' ? '卖家专属优惠' : locale === 'ms' ? 'Tawaran Eksklusif Penjual' : 'Seller Exclusive Price'}</span>
                          <span className="whitespace-nowrap">-RM {selectedTotalSellerItemDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {selectedTotalDiscount > 0 && (
                        <div className="flex justify-between items-center gap-4 text-purple-500 font-medium">
                          <span className="whitespace-nowrap">{locale === 'zh' ? `${sellerLevelName || '卖家'}折扣 (${discountPercent}%)` : locale === 'ms' ? `Diskaun ${sellerLevelName || 'Penjual'} (${discountPercent}%)` : `${sellerLevelName || 'Seller'} Tier Discount (${discountPercent}%)`}</span>
                          <span className="whitespace-nowrap">-RM {selectedTotalDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex justify-between items-center gap-4 text-primary font-bold">
                          <span className="whitespace-nowrap">{locale === 'zh' ? '已节省' : locale === 'ms' ? 'Jimat' : 'Saved'}</span>
                          <span className="whitespace-nowrap">-RM {selectedTotalSaved.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 font-black text-foreground mt-2">
                          <span className="whitespace-nowrap">{locale === 'zh' ? '总金额' : locale === 'ms' ? 'Jumlah Keseluruhan' : 'Total Amount'}</span>
                          <span className="whitespace-nowrap">RM {finalSelectedTotalPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-right text-[10px] text-zinc-400 mt-2">
                          * {locale === 'zh' ? '结账时显示的最终价格' : locale === 'ms' ? 'Harga akhir dipaparkan semasa pembayaran' : 'Final price shown at checkout'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* ── CHECKOUT MODAL ────────────────────────────────────────── */}

        {isCheckoutOpen && (
          <SharedCheckoutModal
            mode="cart"
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
            onClose={() => setIsCheckoutOpen(false)}
            onStockError={handleStockError}
          />
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
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800/50">
                <h3 className="text-lg font-black text-foreground">
                  {removeItemTranslations.title[locale as 'en' | 'zh' | 'ms'] || removeItemTranslations.title.en}
                </h3>
                <button 
                  onClick={() => setItemToRemove(null)}
                  className="text-zinc-400 hover:text-foreground transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-zinc-600 dark:text-zinc-300 font-medium">
                  {removeItemTranslations.message[locale as 'en' | 'zh' | 'ms'] || removeItemTranslations.message.en}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setItemToRemove(null)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
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
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
            >
              {/* Top bar with X */}
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800/50">
                <h3 className="text-lg font-black text-foreground">
                  {clearCartTranslations.title[locale as 'en' | 'zh' | 'ms'] || clearCartTranslations.title.en}
                </h3>
                <button 
                  onClick={() => setIsClearCartModalOpen(false)}
                  className="text-zinc-400 hover:text-foreground transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-zinc-600 dark:text-zinc-300 font-medium">
                  {clearCartTranslations.message[locale as 'en' | 'zh' | 'ms'] || clearCartTranslations.message.en}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setIsClearCartModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
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
    </>
  );
}
