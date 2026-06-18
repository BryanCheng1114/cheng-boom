import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { prisma } from '../../lib/prisma';
import { useCart } from '../../components/cart/CartProvider';
import { ArrowLeft, ShoppingCart, Plus, Minus, CheckCircle, Maximize2, X, Loader2, Package, User, Phone, CreditCard, MapPin, Check, MessageCircle, HelpCircle, Zap, Share2, Link as LinkIcon, Home, ChevronRight, ShieldCheck, Truck, Award, Headset } from 'lucide-react';
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
        
        {/* Top Header: Breadcrumb & Share */}
        <div className="hidden lg:flex items-center justify-between gap-4 mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide pb-2 flex-1">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Home size={16} />
              {locale === 'zh' ? '主页' : locale === 'ms' ? 'Laman Utama' : 'Home Page'}
            </Link>
            <ChevronRight size={14} className="text-zinc-600" />
            {router.query.from === 'cart' ? (
              <Link href="/cart" className="hover:text-primary transition-colors">
                {locale === 'zh' ? '购物车' : locale === 'ms' ? 'Troli Beli-belah Saya' : 'My Shopping Cart'}
              </Link>
            ) : (
              <Link href={`/shop?category=${catKey}`} className="hover:text-primary transition-colors">
                {translatedCategory || (locale === 'zh' ? '商店' : locale === 'ms' ? 'Kedai' : 'Shop')}
              </Link>
            )}
            <ChevronRight size={14} className="text-zinc-600" />
            <span className="text-zinc-100 truncate max-w-[200px] sm:max-w-xs">{translatedName}</span>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center gap-2 pb-2 shrink-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden sm:inline mr-1">Share</span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(); }}
              className="w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform flex items-center justify-center drop-shadow-sm bg-white border border-zinc-700/50"
              title="Share to WhatsApp"
            >
              <img src="/whatsapp-call-icon-psd-editable_314999-3666.avif" alt="WhatsApp" className="w-full h-full object-cover scale-[1.15]" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
              className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center justify-center"
              title="Copy Link"
            >
              {isCopied ? <Check size={14} className="text-green-500" /> : <LinkIcon size={14} />}
            </button>
          </div>
        </div>
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 items-stretch bg-white dark:bg-[#111111] rounded-2xl p-6 lg:p-8 border border-zinc-800/50 shadow-sm">
          
          {/* LEFT: Image Section */}
          <div className="relative w-full lg:h-full">
            <div className="static lg:absolute lg:inset-0 flex gap-4 h-full">
              {/* Vertical Thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide shrink-0 h-full max-h-[500px] lg:max-h-none pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-zinc-900 ${
                      activeImageIdx === idx ? 'border-primary shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div 
              ref={imageRef}
              onClick={() => setIsViewerOpen(true)}
              className="flex-1 aspect-square lg:aspect-auto lg:h-full min-h-0 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-white border border-zinc-200 dark:border-zinc-200 cursor-zoom-in group relative"
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImageIdx]}
                    alt={translatedName}
                    className="absolute inset-0 z-10 w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02] p-2 md:p-4"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                  />
                  {/* Centered Watermark Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <img 
                      src={settings?.watermarkUrl || "/transparent-Background.png"} 
                      className="w-[70%] h-[70%] object-contain opacity-10 select-none mix-blend-multiply transition-all duration-700" 
                      alt="" 
                      draggable={false}
                    />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                  <Package size={64} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none z-30">
                <div className="bg-black/50 backdrop-blur-md p-4 rounded-full text-white">
                  <Maximize2 size={32} />
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* RIGHT: Info Section */}
          <div className="w-full flex flex-col h-full">
            <div className="flex flex-col justify-start mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-normal leading-tight mb-2 line-clamp-2">
                {translatedName}
              </h1>
            </div>

            {/* Unified Pricing Card (Shopee Style) */}
            <div className="mb-4 space-y-4">
              
              {/* Dynamic Price Header */}
              {isSeller ? (() => {
                const labelsMap = {
                  en: { original: 'Original Price', promo: 'Promotion', seller: 'Seller Price', discount: 'Discount', title: 'Seller Pricing Analysis' },
                  zh: { original: '原价', promo: '促销价', seller: '卖家价', discount: '折扣', title: '卖家价格对比分析' },
                  ms: { original: 'Harga Asal', promo: 'Promosi', seller: 'Harga Penjual', discount: 'Diskaun', title: 'Analisis Harga Penjual' }
                };
                const currentLabels = labelsMap[locale as 'en' | 'zh' | 'ms'] || labelsMap.en;

                return (
                  <div className="relative flex flex-col justify-center">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 px-1">
                      {currentLabels.title}
                    </p>
                    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                      <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse min-w-[280px]">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-extrabold border-b border-zinc-200 dark:border-zinc-800">
                              <th className="px-2 sm:px-4 py-2.5">Variant</th>
                              <th className="px-2 sm:px-4 py-2.5">{currentLabels.original}</th>
                              <th className="px-2 sm:px-4 py-2.5">{currentLabels.promo}</th>
                              <th className="px-2 sm:px-4 py-2.5">{currentLabels.seller}</th>
                              <th className="px-2 sm:px-4 py-2.5 text-right">{currentLabels.discount}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className={`font-bold text-foreground border-b border-zinc-100 dark:border-zinc-800/50 ${selectedVariant === 'Single' ? 'bg-primary/5' : ''}`}>
                              <td className="px-2 sm:px-4 py-3">Single</td>
                              <td className="px-2 sm:px-4 py-3 text-zinc-400 dark:text-zinc-500 line-through">RM {product.price.toFixed(2)}</td>
                              <td className="px-2 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400">{product.promotion !== null && product.promotion !== undefined && product.promotion < product.price ? `RM ${product.promotion.toFixed(2)}` : '-'}</td>
                              <td className="px-2 sm:px-4 py-3 text-primary font-extrabold">{product.sellerPrice !== null && product.sellerPrice !== undefined && product.sellerPrice > 0 ? `RM ${product.sellerPrice.toFixed(2)}` : '-'}</td>
                              <td className="px-2 sm:px-4 py-3 text-green-500 font-extrabold text-right">{product.sellerPrice !== null && product.sellerPrice !== undefined && product.sellerPrice > 0 && product.sellerPrice < product.price ? `RM ${(product.price - product.sellerPrice).toFixed(2)}` : '-'}</td>
                            </tr>
                            {hasBoxPricing && (
                              <tr className={`font-bold text-foreground ${selectedVariant === 'Box' ? 'bg-primary/5' : ''}`}>
                                <td className="px-2 sm:px-4 py-3">Box</td>
                                <td className="px-2 sm:px-4 py-3 text-zinc-400 dark:text-zinc-500 line-through">RM {product.boxPrice!.toFixed(2)}</td>
                                <td className="px-2 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400">{product.boxPromotion !== null && product.boxPromotion !== undefined && product.boxPromotion < product.boxPrice! ? `RM ${product.boxPromotion.toFixed(2)}` : '-'}</td>
                                <td className="px-2 sm:px-4 py-3 text-primary font-extrabold">{product.boxSellerPrice !== null && product.boxSellerPrice !== undefined && product.boxSellerPrice > 0 ? `RM ${product.boxSellerPrice.toFixed(2)}` : '-'}</td>
                                <td className="px-2 sm:px-4 py-3 text-green-500 font-extrabold text-right">{product.boxSellerPrice !== null && product.boxSellerPrice !== undefined && product.boxSellerPrice > 0 && product.boxSellerPrice < product.boxPrice! ? `RM ${(product.boxPrice! - product.boxSellerPrice).toFixed(2)}` : '-'}</td>
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
                  <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
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
              {/* Divider removed as requested */}

              <div className={cn(
                "flex flex-col gap-4 transition-colors duration-300",
                showVariantError ? "bg-red-50/50 dark:bg-red-950/20 p-4 -mx-4 rounded-xl border border-red-100 dark:border-red-900/30" : ""
              )}>
                {/* Options Selector */}
                {hasBoxPricing && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                      Variation
                    </span>
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() => {
                          setSelectedVariant('Single');
                          setLocalQty(1);
                          setShowVariantError(false);
                        }}
                        className={`flex flex-row items-center justify-center px-6 py-2.5 rounded-lg transition-all relative overflow-hidden border ${selectedVariant === 'Single' ? 'border-primary bg-white' : 'border-zinc-800 bg-[#111111] hover:border-zinc-700'}`}
                      >
                        <span className={`text-sm relative z-10 ${selectedVariant === 'Single' ? 'text-black font-medium' : 'text-zinc-400 font-medium'}`}>
                          {locale === 'zh' ? '单品' : locale === 'ms' ? 'Satu' : 'Single Item'}
                        </span>
                        {selectedVariant === 'Single' && (
                          <>
                            <div className="absolute bottom-0 right-0 w-0 h-0 border-solid border-b-[24px] border-l-[24px] border-b-primary border-l-transparent border-t-0 border-r-0 z-0" />
                            <Check size={12} className="absolute bottom-[2px] right-[2px] text-white stroke-[4] z-10" />
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVariant('Box');
                          setLocalQty(1);
                          setShowVariantError(false);
                        }}
                        className={`flex flex-row items-center justify-center px-6 py-2.5 rounded-lg transition-all relative overflow-hidden border ${selectedVariant === 'Box' ? 'border-primary bg-white' : 'border-zinc-800 bg-[#111111] hover:border-zinc-700'}`}
                      >
                        <div className="flex items-center gap-2 relative z-10">
                          <span className={`text-sm ${selectedVariant === 'Box' ? 'text-black font-medium' : 'text-zinc-400 font-medium'}`}>
                            {locale === 'zh' ? '整盒' : locale === 'ms' ? 'Kotak' : 'Per Box'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ${selectedVariant === 'Box' ? 'bg-zinc-100 text-zinc-500' : 'bg-[#1a1a1a] text-zinc-500'}`}>
                            {product.itemsPerBox} {locale === 'zh' ? '件' : locale === 'ms' ? 'Items' : 'Items'}
                          </span>
                        </div>
                        {selectedVariant === 'Box' && (
                          <>
                            <div className="absolute bottom-0 right-0 w-0 h-0 border-solid border-b-[24px] border-l-[24px] border-b-primary border-l-transparent border-t-0 border-r-0 z-0" />
                            <Check size={12} className="absolute bottom-[2px] right-[2px] text-white stroke-[4] z-10" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    Quantity
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-zinc-800 rounded-xl overflow-hidden bg-[#111111] h-12">
                      <button 
                        onClick={decrement}
                        disabled={localQty <= 1 || !selectedVariant}
                        className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center font-semibold text-sm text-white h-12 flex items-center justify-center border-x border-zinc-800 bg-[#111111]">{selectedVariant ? localQty : 0}</span>
                      <button 
                        onClick={increment}
                        disabled={localQty >= currentMaxAvailable || !selectedVariant}
                        className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="flex items-center gap-2 text-zinc-500 mt-1">
                  <CheckCircle size={14} className={trueRemainingStock > 0 ? "text-green-500" : "text-red-500"} />
                  <span className="text-xs font-medium">{trueRemainingStock} {t.productDetail.inStockSuffix} — Ready to deliver</span>
                </div>

                {showVariantError && (
                  <div className="text-red-500 text-sm font-medium">
                    {locale === 'zh' ? '请先选择商品选项' : locale === 'ms' ? 'Sila pilih variasi produk dahulu' : 'Please select product variation first'}
                  </div>
                )}
                
                {/* Guarantees Box */}
                <div className="mt-2 bg-[#171717] border border-zinc-800/80 rounded-[14px] py-4 px-4 grid grid-cols-2 gap-y-4 md:flex md:flex-row items-center md:justify-between shadow-sm w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                      <ShieldCheck size={14} className="text-zinc-300" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-[11px] font-bold text-zinc-100 whitespace-nowrap leading-tight">100% Original</span>
                      <span className="text-[9px] md:text-[10px] text-zinc-400 whitespace-nowrap leading-tight">Products</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                      <Truck size={14} className="text-zinc-300" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-[11px] font-bold text-zinc-100 whitespace-nowrap leading-tight">Fast Delivery</span>
                      <span className="text-[9px] md:text-[10px] text-zinc-400 whitespace-nowrap leading-tight">Nationwide</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                      <Award size={14} className="text-zinc-300" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-[11px] font-bold text-zinc-100 whitespace-nowrap leading-tight">Top Quality</span>
                      <span className="text-[9px] md:text-[10px] text-zinc-400 whitespace-nowrap leading-tight">Guaranteed</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                      <Headset size={14} className="text-zinc-300" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-[11px] font-bold text-zinc-100 whitespace-nowrap leading-tight">Support</span>
                      <span className="text-[9px] md:text-[10px] text-zinc-400 whitespace-nowrap italic leading-tight">24/7</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col gap-4 w-full mt-auto">
                <div className="flex flex-col-reverse md:flex-row items-center gap-3 md:gap-4 w-full">
                  <button
                    onClick={handleAddToCart}
                    className="w-full md:flex-1 h-[56px] bg-white text-black rounded-full font-black text-[15px] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
                  >
                    ADD TO CART
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="w-full md:flex-1 h-[56px] bg-primary text-black rounded-full font-black text-[15px] hover:brightness-110 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    BUY NOW
                  </button>
                </div>

                {/* Mobile Share Function */}
                <div className="flex flex-col lg:hidden mt-2">
                  <div className="w-full h-px bg-zinc-800/50 mb-4" />
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-bold text-zinc-400">Share this product</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(); }}
                        className="w-10 h-10 rounded-full overflow-hidden hover:scale-110 transition-transform flex items-center justify-center drop-shadow-sm bg-white border border-zinc-700/50"
                        title="Share to WhatsApp"
                      >
                        <img src="/whatsapp-call-icon-psd-editable_314999-3666.avif" alt="WhatsApp" className="w-full h-full object-cover scale-[1.15]" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                        className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/50 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center justify-center"
                        title="Copy Link"
                      >
                        {isCopied ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Removed the old footer row because share features are now overlaid on the image */}
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
