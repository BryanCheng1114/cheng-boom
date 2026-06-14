import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { prisma } from '../../lib/prisma';
import { useCart } from '../../components/cart/CartProvider';
import { ArrowLeft, ShoppingCart, Plus, Minus, CheckCircle, Maximize2, X, Loader2, Package, User, Phone, CreditCard, MapPin, Check, MessageCircle, HelpCircle, Zap, Share2, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { SharedCheckoutModal } from '../../components/checkout/SharedCheckoutModal';
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
  const [selectedVariant, setSelectedVariant] = useState<'Single' | 'Box' | null>(null);
  const [showVariantError, setShowVariantError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);


  const cartItemIdSingle = `${product?.id}-Single`;
  const cartItemSingleQty = items.find((item) => item.cartItemId === cartItemIdSingle)?.quantity || 0;
  
  const cartItemIdBox = `${product?.id}-Box`;
  const cartItemBoxQty = items.find((item) => item.cartItemId === cartItemIdBox)?.quantity || 0;
  
  const totalItemsInCart = cartItemSingleQty + (cartItemBoxQty * (product?.itemsPerBox || 1));
  const baseStock = product?.stock || 0;
  const trueRemainingStock = baseStock; // Do not deduct cart items live

  const maxAvailableSingle = trueRemainingStock;
  let maxAvailableBox = 0;
  if (product?.itemsPerBox && product.itemsPerBox > 1) {
    maxAvailableBox = Math.floor(trueRemainingStock / product.itemsPerBox);
  }

  const currentMaxAvailable = selectedVariant === 'Box' ? maxAvailableBox : (selectedVariant === 'Single' ? maxAvailableSingle : 0);

  // Sync / Clamp local selection if it exceeds max available stock
  useEffect(() => {
    if (selectedVariant && localQty > currentMaxAvailable) {
      setLocalQty(currentMaxAvailable);
    }
  }, [currentMaxAvailable, localQty, selectedVariant]);

  // Auto-select Single if no Box pricing is available
  useEffect(() => {
    const hasBoxPricing = !!(product?.boxPrice && product?.itemsPerBox && product?.itemsPerBox > 1);
    if (!hasBoxPricing && maxAvailableSingle > 0) {
      if (!selectedVariant) setSelectedVariant('Single');
      if (localQty === 0) setLocalQty(1);
    }
  }, [product, maxAvailableSingle, selectedVariant, localQty]);

  // Auto-open checkout if navigated with ?buy=true
  useEffect(() => {
    if (router.isReady && router.query.buy === 'true' && maxAvailableSingle > 0) {
      if (localQty === 0) setLocalQty(1);
      setSelectedVariant('Single');
      setIsCheckoutOpen(true);
      // Clean up URL
      const { buy, ...restQuery } = router.query;
      router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.buy, maxAvailableSingle]);


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
    if (product.sellerPrice && product.sellerPrice > 0) {
      activePrice = product.sellerPrice;
      if (product.sellerPrice < product.price) {
        hasDiscount = true;
        strikeThroughPrice = product.price;
      }
    } else if (product.promotion !== null && product.promotion !== undefined && product.promotion < product.price) {
      activePrice = product.promotion as number;
      hasDiscount = true;
      strikeThroughPrice = product.price;
    }
  } else {
    if (product.promotion !== null && product.promotion !== undefined && product.promotion < product.price) {
      activePrice = product.promotion as number;
      hasDiscount = true;
      strikeThroughPrice = product.price;
    }
  }

  const savings = hasDiscount ? (product.price - activePrice) : 0;

  let activeBoxPrice = product.boxPrice;
  let hasBoxDiscount = false;
  let strikeThroughBoxPrice: number | undefined = undefined;

  if (activeBoxPrice && product.itemsPerBox && product.itemsPerBox > 1) {
    if (isSeller) {
      if (product.boxSellerPrice && product.boxSellerPrice > 0) {
        activeBoxPrice = product.boxSellerPrice;
        if (product.boxSellerPrice < product.boxPrice!) {
          hasBoxDiscount = true;
          strikeThroughBoxPrice = product.boxPrice!;
        }
      } else if (product.boxPromotion !== null && product.boxPromotion !== undefined && product.boxPromotion < product.boxPrice!) {
        activeBoxPrice = product.boxPromotion as number;
        hasBoxDiscount = true;
        strikeThroughBoxPrice = product.boxPrice!;
      }
    } else {
      if (product.boxPromotion !== null && product.boxPromotion !== undefined && product.boxPromotion < product.boxPrice!) {
        activeBoxPrice = product.boxPromotion as number;
        hasBoxDiscount = true;
        strikeThroughBoxPrice = product.boxPrice!;
      }
    }
  }

  const boxSavings = hasBoxDiscount && strikeThroughBoxPrice && activeBoxPrice ? (strikeThroughBoxPrice - activeBoxPrice) : 0;



  const handleWhatsAppShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const priceToDisplay = currentDisplayPrice || minPrice;
    const msg = `Check out ${translatedName} for RM${priceToDisplay.toFixed(2)}. Get it on Cheng-BOOM now! ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setShowVariantError(true);
      return;
    }
    if (localQty <= 0) return;

    if (localQty > 0 && localQty <= currentMaxAvailable) {
      if (imageRef.current) {
        flyToCart(images[activeImageIdx] || '', imageRef.current);
      }
      
      addItem({ 
        id: product.id,
        cartItemId: `${product.id}-${selectedVariant}`,
        variant: selectedVariant,
        itemsPerBox: product.itemsPerBox,
        code: product.code,
        name: translatedName, 
        price: selectedVariant === 'Single' ? activePrice : activeBoxPrice!, 
        originalPrice: selectedVariant === 'Single' ? strikeThroughPrice : strikeThroughBoxPrice, 
        image: images[activeImageIdx] || '',
        stock: currentMaxAvailable // Limit to remaining available stock for this variant
      }, localQty);
      
      // Reset after add
      setSelectedVariant(null);
      setLocalQty(0);
    }
  };

  const handleBuyNow = () => {
    if (!selectedVariant) {
      setShowVariantError(true);
      return;
    }
    if (localQty <= 0) return;
    setIsCheckoutOpen(true);
  };

  const increment = () => { if (localQty < currentMaxAvailable) setLocalQty(prev => prev + 1); };
  const decrement = () => { if (localQty > 1) setLocalQty(prev => prev - 1); };

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

  const generateInquiryMessage = () => {
    const cleanNumber = (settings?.whatsapp || '601112269835').replace(/\D/g, '');
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentImage = product.images?.[activeImageIdx] || product.images?.[0];
    const imageUrl = currentImage ? (currentImage.startsWith('http') ? currentImage : `${origin}${currentImage}`) : '';
    
    let msg = '';
    if (locale === 'zh') {
      msg = `${url}\n\n您好，我想了解关于以下产品的信息：\n\n*产品名称:* ${translatedName}\n*产品编号:* ${product.code || product.id}\n*图片链接:* ${imageUrl}\n\n我需要更多关于这个产品的信息，请问可以提供更多详细资料或确认是否有库存吗？`;
    } else if (locale === 'ms') {
      msg = `${url}\n\nHai, saya ingin bertanya tentang produk ini:\n\n*Nama Produk:* ${translatedName}\n*Kod Produk:* ${product.code || product.id}\n*Pautan Gambar:* ${imageUrl}\n\nSaya perlukan maklumat lanjut tentang item ini, bolehkah anda bantu saya atau sahkan stok?`;
    } else {
      msg = `${url}\n\nHi, I would like to inquire about this item:\n\n*Product Name:* ${translatedName}\n*Product Code:* ${product.code || product.id}\n*Image Link:* ${imageUrl}\n\nI need more information about this item. Could you please provide more details or let me know if it's available?`;
    }
    
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // YouTube Embed Logic
  const videoId = product.videoUrl?.split('v=')[1]?.split('&')[0] || product.videoUrl?.split('youtu.be/')[1];
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  const images = product.images || [];

  // Dynamic Pricing Calculations for Shopee Style
  const hasBoxPricing = !!(product.boxPrice && product.itemsPerBox && product.itemsPerBox > 1);
  
  const minPrice = hasBoxPricing ? Math.min(activePrice, activeBoxPrice!) : activePrice;
  const maxPrice = hasBoxPricing ? Math.max(activePrice, activeBoxPrice!) : activePrice;
  
  const effectiveSingleStrike = strikeThroughPrice || activePrice;
  const effectiveBoxStrike = strikeThroughBoxPrice || activeBoxPrice || activePrice;
  const minOriginal = hasBoxPricing ? Math.min(effectiveSingleStrike, effectiveBoxStrike) : effectiveSingleStrike;
  const maxOriginal = hasBoxPricing ? Math.max(effectiveSingleStrike, effectiveBoxStrike) : effectiveSingleStrike;
  
  const hasAnyDiscount = hasDiscount || hasBoxDiscount;
  
  const currentDisplayPrice = selectedVariant === 'Single' ? activePrice : selectedVariant === 'Box' ? activeBoxPrice! : null;
  const currentStrikePrice = selectedVariant === 'Single' ? strikeThroughPrice : selectedVariant === 'Box' ? strikeThroughBoxPrice : null;
  
  const singleSavingsPercent = hasDiscount && strikeThroughPrice ? Math.round(((strikeThroughPrice - activePrice) / strikeThroughPrice) * 100) : 0;
  const boxSavingsPercent = hasBoxDiscount && strikeThroughBoxPrice && activeBoxPrice ? Math.round(((strikeThroughBoxPrice - activeBoxPrice) / strikeThroughBoxPrice) * 100) : 0;
  const maxSavingsPercent = Math.max(singleSavingsPercent, boxSavingsPercent);

  return (
    <>
      <Head>
        <title>{`${translatedName} - Cheng-BOOM`}</title>
        <meta property="og:title" content={translatedName || 'Product Details'} />
        <meta property="og:description" content={translatedDesc ? (translatedDesc.length > 150 ? translatedDesc.substring(0, 150) + '...' : translatedDesc) : 'Check out this product on Cheng-BOOM'} />
        <meta property="og:image" content={images[0] ? (images[0].startsWith('http') ? images[0] : `https://cheng-boom.com${images[0]}`) : ''} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="product" />
      </Head>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Breadcrumb */}
        <Link href={router.query.from === 'cart' ? '/cart' : '/shop'} className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-10 group text-sm font-medium">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          {router.query.from === 'cart' ? (locale === 'zh' ? '返回购物车' : locale === 'ms' ? 'Kembali ke Troli' : 'Back to Cart') : t.productDetail.backToCollection}
        </Link>
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-12 items-start bg-white dark:bg-zinc-900 rounded-2xl p-8 md:p-10 border border-border shadow-sm">
          
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
              
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-normal leading-tight mb-4">
                {translatedName}
              </h1>
            </div>

            {/* Unified Pricing Card (Shopee Style) */}
            <div className="rounded-2xl p-2 mb-8 space-y-8">
              
              {/* Dynamic Price Header */}
              {isSeller ? (() => {
                const labelsMap = {
                  en: { original: 'Original Price', promo: 'Promotion', seller: 'Seller Price', discount: 'Discount', title: 'Seller Pricing Analysis' },
                  zh: { original: '原价', promo: '促销价', seller: '卖家价', discount: '折扣', title: '卖家价格对比分析' },
                  ms: { original: 'Harga Asal', promo: 'Promosi', seller: 'Harga Penjual', discount: 'Diskaun', title: 'Analisis Harga Penjual' }
                };
                const currentLabels = labelsMap[locale as 'en' | 'zh' | 'ms'] || labelsMap.en;

                return (
                  <div className="relative flex flex-col justify-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] py-4 px-5 rounded-xl overflow-hidden">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">
                      {currentLabels.title}
                    </p>
                    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse min-w-[320px]">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-extrabold border-b border-zinc-200 dark:border-zinc-800">
                              <th className="px-4 py-2.5">Variant</th>
                              <th className="px-4 py-2.5">{currentLabels.original}</th>
                              <th className="px-4 py-2.5">{currentLabels.promo}</th>
                              <th className="px-4 py-2.5">{currentLabels.seller}</th>
                              <th className="px-4 py-2.5 text-right">{currentLabels.discount}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className={`font-bold text-foreground border-b border-zinc-100 dark:border-zinc-800/50 ${selectedVariant === 'Single' ? 'bg-primary/5' : ''}`}>
                              <td className="px-4 py-3">Single</td>
                              <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 line-through">RM {product.price.toFixed(2)}</td>
                              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{product.promotion !== null && product.promotion !== undefined && product.promotion < product.price ? `RM ${product.promotion.toFixed(2)}` : '-'}</td>
                              <td className="px-4 py-3 text-primary font-extrabold">{product.sellerPrice !== null && product.sellerPrice !== undefined && product.sellerPrice > 0 ? `RM ${product.sellerPrice.toFixed(2)}` : '-'}</td>
                              <td className="px-4 py-3 text-green-500 font-extrabold text-right">{product.sellerPrice !== null && product.sellerPrice !== undefined && product.sellerPrice > 0 && product.sellerPrice < product.price ? `RM ${(product.price - product.sellerPrice).toFixed(2)}` : '-'}</td>
                            </tr>
                            {hasBoxPricing && (
                              <tr className={`font-bold text-foreground ${selectedVariant === 'Box' ? 'bg-primary/5' : ''}`}>
                                <td className="px-4 py-3">Box</td>
                                <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 line-through">RM {product.boxPrice!.toFixed(2)}</td>
                                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{product.boxPromotion !== null && product.boxPromotion !== undefined && product.boxPromotion < product.boxPrice! ? `RM ${product.boxPromotion.toFixed(2)}` : '-'}</td>
                                <td className="px-4 py-3 text-primary font-extrabold">{product.boxSellerPrice !== null && product.boxSellerPrice !== undefined && product.boxSellerPrice > 0 ? `RM ${product.boxSellerPrice.toFixed(2)}` : '-'}</td>
                                <td className="px-4 py-3 text-green-500 font-extrabold text-right">{product.boxSellerPrice !== null && product.boxSellerPrice !== undefined && product.boxSellerPrice > 0 && product.boxSellerPrice < product.boxPrice! ? `RM ${(product.boxPrice! - product.boxSellerPrice).toFixed(2)}` : '-'}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })() : (
              <div className="relative flex flex-col justify-center py-2">
                <div className="flex flex-wrap items-end gap-3">
                  {/* Strike Through Range or Specific */}
                  {currentDisplayPrice ? (
                    currentStrikePrice && (
                      <span className="text-lg text-zinc-400 line-through decoration-red-500/50 mb-0.5">
                        RM {currentStrikePrice.toFixed(2)}
                      </span>
                    )
                  ) : (
                    hasAnyDiscount && (
                      <span className="text-lg text-zinc-400 line-through decoration-red-500/50 mb-0.5">
                        {minOriginal === maxOriginal ? `RM ${minOriginal.toFixed(2)}` : `RM ${minOriginal.toFixed(2)} - RM ${maxOriginal.toFixed(2)}`}
                      </span>
                    )
                  )}

                  {/* Active Price Range or Specific */}
                  <span className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
                    {currentDisplayPrice ? (
                      `RM ${currentDisplayPrice.toFixed(2)}`
                    ) : (
                      minPrice === maxPrice ? `RM ${minPrice.toFixed(2)}` : `RM ${minPrice.toFixed(2)} - RM ${maxPrice.toFixed(2)}`
                    )}
                  </span>
                  
                  {/* Discount Pill */}
                  {currentDisplayPrice ? (
                    currentStrikePrice && (
                      <span className="text-xs font-bold text-primary mb-1 ml-1 bg-primary/10 px-2 py-0.5 rounded-sm">
                        {selectedVariant === 'Single' ? `-${singleSavingsPercent}%` : `-${boxSavingsPercent}%`}
                      </span>
                    )
                  ) : (
                    hasAnyDiscount && maxSavingsPercent > 0 && (
                      <span className="text-xs font-bold text-primary mb-1 ml-1 bg-primary/10 px-2 py-0.5 rounded-sm">
                        {minPrice === maxPrice ? `-${maxSavingsPercent}%` : `Up to -${maxSavingsPercent}%`}
                      </span>
                    )
                  )}
                </div>
              </div>

              )}
              <div className={cn(
                "flex flex-col gap-6 transition-colors duration-300",
                showVariantError ? "bg-red-50/50 dark:bg-red-950/20 p-4 -mx-4 rounded-xl border border-red-100 dark:border-red-900/30" : ""
              )}>
              {/* Options Selector */}
              {hasBoxPricing && (
                <div className="flex flex-row items-center gap-4">
                  <span className="text-sm font-medium text-zinc-400 w-16">
                    {locale === 'zh' ? '选项' : locale === 'ms' ? 'Pilihan' : 'Option'}:
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setSelectedVariant('Single');
                        setLocalQty(1);
                        setShowVariantError(false);
                      }}
                      className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all relative overflow-hidden ${selectedVariant === 'Single' ? 'border-2 border-primary text-black bg-white dark:bg-white shadow-sm' : 'border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-primary hover:text-primary'}`}
                    >
                      {locale === 'zh' ? '单品' : locale === 'ms' ? 'Satu' : 'Single Item'}
                      {selectedVariant === 'Single' && (
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary flex items-end justify-end" style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}>
                          <Check size={10} className="text-white mb-[1px] mr-[1px]" strokeWidth={4} />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVariant('Box');
                        setLocalQty(1);
                        setShowVariantError(false);
                      }}
                      className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all relative overflow-hidden flex items-center gap-2 ${selectedVariant === 'Box' ? 'border-2 border-primary text-black bg-white dark:bg-white shadow-sm' : 'border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-primary hover:text-primary'}`}
                    >
                      {locale === 'zh' ? '整盒' : locale === 'ms' ? 'Kotak' : 'Per Box'}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${selectedVariant === 'Box' ? 'bg-primary/20 text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                        {product.itemsPerBox} {locale === 'zh' ? '件' : locale === 'ms' ? 'Item' : 'Items'}
                      </span>
                      {selectedVariant === 'Box' && (
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary flex items-end justify-end" style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}>
                          <Check size={10} className="text-white mb-[1px] mr-[1px]" strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex flex-row items-center gap-4">
                <span className="text-sm font-medium text-zinc-400 w-16">
                  {locale === 'zh' ? '数量' : locale === 'ms' ? 'Kuantiti' : 'Quantity'}:
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl w-fit overflow-hidden">
                    <button 
                      onClick={decrement}
                      disabled={localQty <= 1 || !selectedVariant}
                      className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed border-r border-zinc-300 dark:border-zinc-700"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-14 text-center font-bold text-base bg-white dark:bg-zinc-950 h-10 flex items-center justify-center">{selectedVariant ? localQty : 0}</span>
                    <button 
                      onClick={increment}
                      disabled={localQty >= currentMaxAvailable || !selectedVariant}
                      className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed border-l border-zinc-300 dark:border-zinc-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 text-zinc-500 mt-2">
                <CheckCircle size={16} className={trueRemainingStock > 0 ? "text-green-500" : "text-red-500"} />
                <span className="text-sm font-medium">{trueRemainingStock} {t.productDetail.inStockSuffix}</span>
              </div>

              {showVariantError && (
                <div className="text-red-500 text-sm font-medium">
                  {locale === 'zh' ? '请先选择商品选项' : locale === 'ms' ? 'Sila pilih variasi produk dahulu' : 'Please select product variation first'}
                </div>
              )}
              </div>

              {/* Action Buttons (Shopee Style) */}
              <div className="pt-4 flex items-center gap-3 w-full">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-[54px] bg-white text-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium text-base hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
                >
                  <ShoppingCart size={18} /> {t.productDetail.addToCart}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 h-[54px] bg-primary text-zinc-900 rounded-xl font-bold text-base hover:brightness-110 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {locale === 'zh' ? '立即购买' : locale === 'ms' ? 'Beli Sekarang' : 'Buy Now'}
                </button>
              </div>

            </div>

            {/* Footer Row: Share */}
            <div className="flex items-center justify-end w-full pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/50">
              {/* Share Feature */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-400">Share:</span>
                <button 
                  onClick={handleWhatsAppShare}
                  className="w-8 h-8 rounded-full hover:scale-110 transition-transform flex items-center justify-center overflow-hidden drop-shadow-sm"
                  title="Share to WhatsApp"
                >
                  <img src="/whatsapp-call-icon-psd-editable_314999-3666.avif" alt="WhatsApp" className="w-full h-full object-contain" />
                </button>
                <button 
                  onClick={handleCopyLink}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-foreground transition-colors flex items-center justify-center"
                  title="Copy Link"
                >
                  {isCopied ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTIONS ─────────────────────────────────────────────────── */}
        
        <div className="space-y-12">
          
          {/* 1. Description Section */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl p-8 md:p-10 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-8 border-l-4 border-primary pl-4">
              <h2 className="text-2xl font-bold tracking-tight uppercase">{t.productDetail.description}</h2>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{t.productDetail.productDetails}</h4>
                <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                  <p>{t.productDetail.code}: {product.code?.toUpperCase() || product.id.toUpperCase()}</p>
                  <p>{t.productDetail.name}: {translatedName}</p>
                  <p>{t.productDetail.type}: {translatedCategory}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{t.productDetail.productDescription}</h4>
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
                <h2 className="text-2xl font-bold tracking-tight uppercase">{t.productDetail.videoDemo}</h2>
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
          <SharedCheckoutModal
            mode="single"
            product={product}
            quantity={localQty}
            onClose={() => setIsCheckoutOpen(false)}
          />
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
