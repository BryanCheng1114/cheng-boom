import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { prisma } from '../../lib/prisma';
import { useCart } from '../../components/cart/CartProvider';
import { ArrowLeft, ShoppingCart, Plus, Minus, CheckCircle, Maximize2, X, Loader2, Package, User, Phone, CreditCard, MapPin, Check, MessageCircle, HelpCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { generateWhatsAppLink, OrderDetails } from '../../services/whatsappService';

const paymentMethodLabels: Record<string, Record<string, string>> = {
  'TNG e-wallet': { en: 'TNG eWallet', zh: 'TNG电子钱包', ms: 'e-Dompet TNG' },
  'bank transfer': { en: 'Bank Transfer', zh: '银行转账', ms: 'Pindahan Bank' },
  'DuitNow qr': { en: 'DuitNow QR', zh: 'DuitNow二维码', ms: 'DuitNow QR' }
};

const deliveryModeLabels: Record<string, Record<string, string>> = {
  'Self Collect': { en: 'Self Collect', zh: '自取', ms: 'Ambil Sendiri' },
  'Delivery': { en: 'Delivery', zh: '运送', ms: 'Penghantaran' }
};

import Link from 'next/link';
import { useTranslation } from '../../hooks/useTranslation';
import { useFlyToCart } from '../../components/ui/FlyToCartProvider';
import { useBusiness } from '../../context/BusinessContext';
import { cn } from '../../utils/cn';

export default function ProductDetail({ product, categoryZh, categoryMs }: { product: any, categoryZh?: string | null, categoryMs?: string | null }) {
  const router = useRouter();
  const { items, addItem } = useCart();
  const { flyToCart } = useFlyToCart();
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const [localQty, setLocalQty] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'TNG e-wallet',
    deliveryMode: 'Self Collect',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppTermsAgreed, setIsWhatsAppTermsAgreed] = useState(false);
  const [shakeTerms, setShakeTerms] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const shakeControls = useAnimation();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const cartItemSafe = items.find((item) => item.id === product?.id);
  const currentCartQtySafe = cartItemSafe?.quantity || 0;
  const maxAvailableSafe = Math.max(0, (product?.stock || 0) - currentCartQtySafe);

  // Sync / Clamp local selection if it exceeds max available stock
  useEffect(() => {
    if (localQty > maxAvailableSafe) {
      setLocalQty(maxAvailableSafe);
    }
  }, [maxAvailableSafe, localQty]);

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
            setOrderDetails(prev => ({
              ...prev,
              customerName: user.name || '',
              customerPhone: user.phone || ''
            }));
          }
        } catch (err) {
          console.error('Failed to fetch user profile for Buy Now:', err);
        }
      }
    };
    fetchUserProfile();
  }, []);

  // Handle fallback state for static generation
  if (router.isFallback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{t.productDetail.loading}</p>
      </div>
    );
  }

  if (!product || product.status === 'Hold' || product.status === 'Deactive' || product.status === 'Inactive') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">{t.productDetail.notFound}</h1>
        <Link href="/shop" className="text-primary hover:underline">{t.shop.returnToShop}</Link>
      </div>
    );
  }

  const stock = product.stock || 0;

  // Seller Logic
  const isSeller = typeof window !== 'undefined' && (
    localStorage.getItem('user_role') === 'Seller' || 
    JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller'
  );

  let activePrice = product.price;
  let hasDiscount = false;
  let strikeThroughPrice: number | undefined = undefined;

  if (isSeller) {
    if (product.sellerPrice !== null && product.sellerPrice !== undefined && product.sellerPrice > 0) {
      activePrice = product.sellerPrice;
      if (product.sellerPrice < product.price) {
        hasDiscount = true;
        strikeThroughPrice = product.price;
      }
    } else {
      const hasPromo = product.promotion !== null && product.promotion !== undefined && product.promotion < product.price;
      if (hasPromo) {
        activePrice = product.promotion as number;
        hasDiscount = true;
        strikeThroughPrice = product.price;
      }
    }
  } else {
    const hasPromo = product.promotion !== null && product.promotion !== undefined && product.promotion < product.price;
    if (hasPromo) {
      activePrice = product.promotion as number;
      hasDiscount = true;
      strikeThroughPrice = product.price;
    }
  }

  const savings = hasDiscount ? (product.price - activePrice) : 0;

  const cartItem = items.find((item) => item.id === product.id);
  const currentCartQty = cartItem?.quantity || 0;
  const maxAvailable = Math.max(0, stock - currentCartQty);

  const handleAddToCart = () => {
    if (localQty > 0 && localQty <= maxAvailable) {
      if (imageRef.current) {
        flyToCart(images[activeImageIdx] || '', imageRef.current);
      }
      
      addItem({ 
        id: product.id,
        code: product.code,
        name: translatedName, 
        price: activePrice, 
        originalPrice: strikeThroughPrice, 
        image: images[activeImageIdx] || '',
        stock: stock
      }, localQty);
      setLocalQty(0);
    }
  };

  const increment = () => {
    if (localQty < maxAvailable) setLocalQty(prev => prev + 1);
  };
  
  const decrement = () => {
    if (localQty > 0) setLocalQty(prev => prev - 1);
  };

  // @ts-ignore
  let translatedName = (locale === 'zh' && product.nameZh) ? product.nameZh : (locale === 'ms' && product.nameMs) ? product.nameMs : null;
  translatedName = translatedName || (t.products as any)?.[product.id]?.name || product.name;
  
  // @ts-ignore
  let translatedDesc = (locale === 'zh' && product.descriptionZh) ? product.descriptionZh : (locale === 'ms' && product.descriptionMs) ? product.descriptionMs : null;
  translatedDesc = translatedDesc || (t.products as any)?.[product.id]?.desc || product.description;
  
  const catKey = product.category ? product.category.toLowerCase().replace(/\s+/g, '') : '';
  // @ts-ignore
  let translatedCategory = (locale === 'zh' && categoryZh) ? categoryZh : (locale === 'ms' && categoryMs) ? categoryMs : null;
  translatedCategory = translatedCategory || (catKey ? t.shopCategories[catKey] : null) || t.shopCategories[product.category] || product.category;

  let discountPercent = 0;
  let isFreeShipping = false;
  let sellerLevelName = '';
  if (typeof window !== 'undefined') {
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    if (userObj?.role === 'Seller' && userObj?.sellerLevel) {
      discountPercent = userObj.sellerLevel.discountPercent || 0;
      isFreeShipping = userObj.sellerLevel.freeShipping || false;
      sellerLevelName = userObj.sellerLevel.name || '';
    }
  }

  const baseTotalPrice = activePrice * localQty;
  const totalOriginalPrice = (strikeThroughPrice || activePrice) * localQty;
  const totalDiscount = baseTotalPrice * (discountPercent / 100);
  const finalTotalPrice = baseTotalPrice - totalDiscount;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
          items: [{
            productId: product.id,
            code: product.code,
            name: translatedName,
            price: activePrice,
            originalPrice: strikeThroughPrice,
            quantity: localQty
          }],
          totalAmount: finalTotalPrice,
          originalAmount: totalOriginalPrice,
          totalDiscount: totalDiscount,
          sellerLevelName: sellerLevelName,
          discountPercent: discountPercent,
          isFreeShipping: isFreeShipping
        }),
      });

      if (!response.ok) throw new Error('Failed to save order');

      const url = generateWhatsAppLink(
        [{
          id: product.id,
          code: product.code,
          name: translatedName,
          price: activePrice,
          originalPrice: strikeThroughPrice,
          quantity: localQty
        }],
        finalTotalPrice,
        {
          ...orderDetails,
          role: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').role : 'Guest'
        },
        locale as 'en' | 'zh' | 'ms',
        isSeller,
        settings?.businessName,
        settings?.whatsapp ?? undefined,
        sellerLevelName,
        discountPercent,
        isFreeShipping
      );
      window.open(url, '_blank');

      setIsCheckoutOpen(false);
      setLocalQty(0);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateInquiryMessage = () => {
    const cleanNumber = (settings?.whatsapp || '601112269835').replace(/\D/g, '');
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentImage = product.images?.[activeImageIdx] || product.images?.[0];
    const imageUrl = currentImage ? (currentImage.startsWith('http') ? currentImage : `${origin}${currentImage}`) : '';
    
    let msg = '';
    if (locale === 'zh') {
      msg = `您好，我想了解更多关于这个产品的信息：\n\n*${translatedName}*\n产品编号: \`${product.code || product.id}\`\n\n图片: ${imageUrl}\n链接: ${url}\n\n请问还有库存吗？`;
    } else if (locale === 'ms') {
      msg = `Hai, saya ingin bertanya tentang produk ini:\n\n*${translatedName}*\nKod Produk: \`${product.code || product.id}\`\n\nGambar: ${imageUrl}\nPautan: ${url}\n\nAdakah stok masih ada?`;
    } else {
      msg = `Hi, I would like to inquire about this product:\n\n*${translatedName}*\nProduct Code: \`${product.code || product.id}\`\n\nImage: ${imageUrl}\nLink: ${url}\n\nIs this still in stock?`;
    }
    
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // YouTube Embed Logic
  const videoId = product.videoUrl?.split('v=')[1]?.split('&')[0] || product.videoUrl?.split('youtu.be/')[1];
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  const images = product.images || [];

  return (
    <>
      <Head>
        <title>{`${translatedName} - Cheng-BOOM`}</title>
      </Head>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Breadcrumb */}
        <Link href="/shop" className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-10 group text-sm font-medium">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          {t.productDetail.backToCollection}
        </Link>
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20 items-start">
          
          {/* LEFT: Image Section */}
          <div className="w-full space-y-4">
            <div 
              ref={imageRef}
              onClick={() => setIsViewerOpen(true)}
              className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 bg-zinc-100 dark:bg-zinc-900 border border-border/50 cursor-zoom-in group relative"
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImageIdx]}
                    alt={translatedName}
                    className="absolute inset-0 z-10 w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                  />
                  {/* Centered Watermark Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <img 
                      src={settings?.watermarkUrl || "/transparent-Background.png"} 
                      className="w-[70%] h-[70%] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                      alt="" 
                      draggable={false}
                    />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <Package size={64} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                  <Maximize2 size={32} />
                </div>
              </div>
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-primary text-zinc-900 px-3 py-1.5 rounded-xl font-black text-xs shadow-xl animate-bounce z-20">
                  {t.productDetail.sale}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIdx === idx ? 'border-primary shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info Section */}
          <div className="w-full flex flex-col justify-start">
            <div className="flex flex-col justify-start mb-8">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black tracking-widest uppercase mb-4 w-fit border border-primary/20">
                {translatedCategory}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                {translatedName}
              </h1>
            </div>

            {/* Pricing Card */}
            <div className="bg-zinc-50 dark:bg-white/5 rounded-2xl p-6 border border-border/50 mb-8">
              <div className="flex flex-wrap items-end gap-3 mb-2">
                {hasDiscount && (
                  <span className="text-lg text-zinc-400 line-through decoration-red-500/50 mb-0.5">
                    RM {strikeThroughPrice?.toFixed(2)}
                  </span>
                )}
                <span className="text-3xl font-black text-foreground tracking-tighter">
                  RM {activePrice.toFixed(2)}
                </span>
                
                {hasDiscount && (
                  <span className="text-xs font-bold text-green-500 mb-1 ml-1 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    {t.productDetail.save} RM {savings.toFixed(2)}
                  </span>
                )}
              </div>

              {isSeller && (() => {
                const labelsMap = {
                  en: {
                    original: 'Original Price',
                    promo: 'Promotion Price',
                    seller: 'Seller Price',
                    discount: 'Total Discount',
                    title: 'Seller Pricing Analysis'
                  },
                  zh: {
                    original: '产品原价',
                    promo: '促销特价',
                    seller: '卖家特价',
                    discount: '总折扣',
                    title: '卖家价格对比分析'
                  },
                  ms: {
                    original: 'Harga Asal',
                    promo: 'Harga Promosi',
                    seller: 'Harga Penjual',
                    discount: 'Jumlah Diskaun',
                    title: 'Analisis Harga Penjual'
                  }
                };
                const currentLabels = labelsMap[locale as 'en' | 'zh' | 'ms'] || labelsMap.en;

                return (
                  <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">
                      {currentLabels.title}
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse min-w-[320px]">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-extrabold border-b border-zinc-200 dark:border-zinc-800">
                              <th className="px-4 py-2.5">{currentLabels.original}</th>
                              <th className="px-4 py-2.5">{currentLabels.promo}</th>
                              <th className="px-4 py-2.5">{currentLabels.seller}</th>
                              <th className="px-4 py-2.5 text-right">{currentLabels.discount}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="font-bold text-foreground">
                              <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 line-through">
                                RM {product.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                                {product.promotion !== null && product.promotion !== undefined && product.promotion < product.price
                                  ? `RM ${product.promotion.toFixed(2)}`
                                  : '-'
                                }
                              </td>
                              <td className="px-4 py-3 text-primary font-extrabold">
                                {product.sellerPrice !== null && product.sellerPrice !== undefined && product.sellerPrice > 0
                                  ? `RM ${product.sellerPrice.toFixed(2)}`
                                  : '-'
                                }
                              </td>
                              <td className="px-4 py-3 text-green-500 font-extrabold text-right">
                                {product.sellerPrice !== null && product.sellerPrice !== undefined && product.sellerPrice > 0 && product.sellerPrice < product.price
                                  ? `RM ${(product.price - product.sellerPrice).toFixed(2)}`
                                  : '-'
                                }
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-6 flex flex-col gap-4">
                {/* Quantity Control */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.productDetail.selectQuantity}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-zinc-200 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-300 dark:border-zinc-700">
                      <button 
                        onClick={decrement}
                        disabled={localQty === 0}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-black text-lg">{localQty}</span>
                      <button 
                        onClick={increment}
                        disabled={localQty >= maxAvailable}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-zinc-900 hover:brightness-110 transition-all shadow-md disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:text-zinc-500 disabled:shadow-none disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full mt-2">
                  {/* Chat Now Button */}
                  <button
                    onClick={generateInquiryMessage}
                    className="flex flex-col items-center justify-center gap-1.5 shrink-0 w-[80px] sm:w-[90px] h-[60px] bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-green-500 transition-all active:scale-95"
                  >
                    <MessageCircle size={24} strokeWidth={2.5} className="text-green-500" /> 
                    <span className="text-[10px] sm:text-[11px] font-black tracking-wide leading-none text-center">
                      {locale === 'zh' ? '联系客服' : locale === 'ms' ? 'Sembang' : 'Chat Now'}
                    </span>
                  </button>

                  {/* Add Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={localQty === 0 || stock <= 0 || maxAvailable === 0}
                    className="flex flex-col items-center justify-center gap-1.5 shrink-0 w-[80px] sm:w-[90px] h-[60px] bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-primary transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
                  >
                    <ShoppingCart size={24} strokeWidth={2.5} className="text-primary" /> 
                    <span className="text-[10px] sm:text-[11px] font-black tracking-wide leading-none text-center">
                      {stock <= 0 ? 'Out' : maxAvailable <= 0 ? 'Limit' : t.productDetail.addToCart}
                    </span>
                  </button>

                  {/* Buy Now Button */}
                  <button
                    onClick={() => {
                      setIsWhatsAppTermsAgreed(false);
                      setIsCheckoutOpen(true);
                    }}
                    disabled={localQty === 0 || stock <= 0}
                    className="flex-1 h-[60px] bg-primary text-zinc-900 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:shadow-none active:scale-[0.98]"
                  >
                    {locale === 'zh' ? '立即购买' : locale === 'ms' ? 'Beli Sekarang' : 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 text-zinc-500">
              <CheckCircle size={14} className={stock > 0 ? "text-green-500" : "text-red-500"} />
              <span className="text-xs font-medium">{stock} {t.productDetail.inStockSuffix}</span>
            </div>
          </div>
        </div>

        {/* ── SECTIONS ─────────────────────────────────────────────────── */}
        
        <div className="space-y-12">
          
          {/* 1. Description Section */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl p-8 md:p-10 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-8 border-l-4 border-primary pl-4">
              <h2 className="text-2xl font-black tracking-tight uppercase">{t.productDetail.description}</h2>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t.productDetail.productDetails}</h4>
                <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                  <p>{t.productDetail.code}: {product.code?.toUpperCase() || product.id.toUpperCase()}</p>
                  <p>{t.productDetail.name}: {translatedName}</p>
                  <p>{t.productDetail.type}: {translatedCategory}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t.productDetail.productDescription}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium whitespace-pre-wrap">
                  {translatedDesc}
                </p>
              </div>
            </div>
          </section>

          {/* 2. Video Demonstration Section */}
          {embedUrl && (
            <section className="bg-white dark:bg-zinc-900 rounded-2xl p-8 md:p-10 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-8 border-l-4 border-primary pl-4">
                <h2 className="text-2xl font-black tracking-tight uppercase">{t.productDetail.videoDemo}</h2>
              </div>
              
              <div className="w-full">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border aspect-video bg-black shadow-primary/5">
                  <iframe 
                    className="w-full h-full"
                    src={embedUrl}
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
      <AnimatePresence>
        {isViewerOpen && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsViewerOpen(false)}
          >
            {/* Close Button */}
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[110]"
              onClick={() => setIsViewerOpen(false)}
            >
              <X size={40} />
            </button>

            {/* Viewer Content */}
            <div 
              className="relative max-w-7xl w-full h-full flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
              >
                <div 
                  className="absolute inset-0 z-10" 
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
                
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <img 
                    src={images[activeImageIdx]} 
                    alt={translatedName}
                    className="max-w-full max-h-full object-contain shadow-2xl pointer-events-none select-none rounded-lg"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                  />
                  {/* Centered Watermark Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <img 
                      src={settings?.watermarkUrl || "/transparent-Background.png"} 
                      className="w-[70%] h-[70%] max-h-[70vh] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                      alt="" 
                      draggable={false}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <p className="text-white/40 text-xs mt-4 font-black uppercase tracking-[0.3em] select-none">
              {t.productDetail.protectedHint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <textarea 
                        rows={3}
                        className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold resize-none"
                        placeholder={t.cart.checkout.notesPlaceholder}
                        value={orderDetails.notes}
                        onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-12 flex flex-col gap-4">
                     <div className="flex justify-end mb-2">
                       <button
                         type="button"
                         onClick={() => setIsGuideOpen(true)}
                         className="flex items-center gap-1.5 text-zinc-500 hover:text-primary transition-colors text-xs font-black uppercase tracking-widest"
                       >
                         <HelpCircle size={14} strokeWidth={3} />
                         {locale === 'zh' ? '下单指南' : locale === 'ms' ? 'Panduan Pesanan' : 'Ordering Guide'}
                       </button>
                     </div>

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
                          "w-full py-5 px-4 mb-2 bg-primary text-zinc-900 rounded-[20px] font-black text-lg transition-all flex justify-center items-center gap-2",
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
                       {t.cart.checkout.total}: RM {finalTotalPrice.toFixed(2)}
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
                    className="w-full mt-10 py-5 bg-primary text-zinc-900 rounded-[20px] font-black text-lg transition-all shadow-xl hover:shadow-primary/20 hover:brightness-110 active:scale-[0.98]"
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
                className="w-auto h-auto max-w-full max-h-[85vh] object-contain z-10"
              />
              {/* Centered Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <img 
                  src={settings?.watermarkUrl || "/transparent-Background.png"} 
                  className="w-[70%] h-[70%] max-h-[70vh] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                  alt="" 
                  draggable={false}
                />
              </div>
            </div>
          </div>
        )}
    </>
  );
}

export async function getStaticPaths() {
  const products = await prisma.product.findMany({
    select: { id: true }
  });
  
  const paths = products.map((p) => ({
    params: { id: p.id },
  }));

  return { paths, fallback: true };
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });
  
  if (!product) {
    return { notFound: true };
  }

  let categoryObj = null;
  if (product.category) {
    categoryObj = await prisma.category.findUnique({
      where: { name: product.category }
    });
  }
  
  return {
    props: { 
      product: JSON.parse(JSON.stringify(product)), // serialize dates
      categoryZh: categoryObj?.nameZh || null,
      categoryMs: categoryObj?.nameMs || null
    },
    revalidate: 10, // revalidate every 10 seconds for real-time feel
  };
}
