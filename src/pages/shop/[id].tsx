import Head from 'next/head';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { prisma } from '../../lib/prisma';
import { useCart } from '../../components/cart/CartProvider';
import { ArrowLeft, ShoppingCart, Plus, Minus, CheckCircle, Maximize2, X, Loader2, Package, User, Phone, CreditCard, MapPin, Check, MessageCircle, HelpCircle, Zap, Share2, Link as LinkIcon, Home, ChevronRight, ShieldCheck, Truck, Award, Headset , Heart} from 'lucide-react';
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
  const [selectedVariant, setSelectedVariant] = useState<'Single' | 'Box' | 'Bundle' | null>(null);
  const [showVariantError, setShowVariantError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'video'>('description');
  const [pricingGroup, setPricingGroup] = useState<'A' | 'B'>('A');

  useEffect(() => {
    if (!isViewerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('product-image-viewer-open');
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsViewerOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('product-image-viewer-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isViewerOpen]);

  useEffect(() => {
    const syncPricingGroup = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        setPricingGroup(user?.role === 'Seller' && user?.sellerPricing === 'B' ? 'B' : 'A');
      } catch {
        setPricingGroup('A');
      }
    };
    syncPricingGroup();
    window.addEventListener('storage', syncPricingGroup);
    window.addEventListener('user-updated', syncPricingGroup);
    return () => {
      window.removeEventListener('storage', syncPricingGroup);
      window.removeEventListener('user-updated', syncPricingGroup);
    };
  }, []);


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
  let maxAvailableBundle = 0;
  if (product?.bundleQuantity && product.bundleQuantity > 1) {
    maxAvailableBundle = Math.floor(trueRemainingStock / product.bundleQuantity);
  }

  const currentMaxAvailable = selectedVariant === 'Box' ? maxAvailableBox : selectedVariant === 'Bundle' ? maxAvailableBundle : (selectedVariant === 'Single' ? maxAvailableSingle : 0);

  // Sync / Clamp local selection if it exceeds max available stock
  useEffect(() => {
    if (selectedVariant && localQty > currentMaxAvailable) {
      setLocalQty(currentMaxAvailable);
    }
  }, [currentMaxAvailable, localQty, selectedVariant]);

  // Auto-select Single if no Box pricing is available
  useEffect(() => {
    const availableBoxPrice = pricingGroup === 'B' ? (product?.sellerBBoxPrice ?? product?.sellerABoxPrice) : product?.sellerABoxPrice;
    const hasBoxPricing = !!(availableBoxPrice && product?.itemsPerBox && product?.itemsPerBox > 1);
    if (!hasBoxPricing && maxAvailableSingle > 0) {
      if (!selectedVariant) setSelectedVariant('Single');
      if (localQty === 0) setLocalQty(1);
    }
  }, [product, maxAvailableSingle, selectedVariant, localQty, pricingGroup]);

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

  const isSeller = typeof window !== 'undefined' && (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null')?.role === 'Seller'; }
    catch { return false; }
  })();
  const activePrice = pricingGroup === 'B' ? (product.sellerBPrice ?? product.sellerAPrice ?? product.price) : (product.sellerAPrice ?? product.price);
  const strikeThroughPrice = pricingGroup === 'B' && activePrice < (product.sellerAPrice ?? product.price) ? (product.sellerAPrice ?? product.price) : undefined;
  const hasDiscount = strikeThroughPrice !== undefined;
  const savings = hasDiscount ? strikeThroughPrice! - activePrice : 0;

  const activeBoxPrice = pricingGroup === 'B' ? (product.sellerBBoxPrice ?? product.sellerABoxPrice ?? product.boxPrice) : (product.sellerABoxPrice ?? product.boxPrice);
  const strikeThroughBoxPrice = pricingGroup === 'B' && activeBoxPrice != null && product.sellerABoxPrice != null && activeBoxPrice < product.sellerABoxPrice ? product.sellerABoxPrice : undefined;
  const hasBoxDiscount = strikeThroughBoxPrice !== undefined;

  const boxSavings = hasBoxDiscount && strikeThroughBoxPrice && activeBoxPrice ? (strikeThroughBoxPrice - activeBoxPrice) : 0;

  const activeBundlePrice = pricingGroup === 'B' ? (product.sellerBBundlePrice ?? product.sellerABundlePrice ?? product.bundlePrice) : (product.sellerABundlePrice ?? product.bundlePrice);
  const strikeThroughBundlePrice = pricingGroup === 'B' && activeBundlePrice != null && product.sellerABundlePrice != null && activeBundlePrice < product.sellerABundlePrice ? product.sellerABundlePrice : undefined;
  const hasBundleDiscount = strikeThroughBundlePrice !== undefined;

  const bundleSavings = hasBundleDiscount && strikeThroughBundlePrice && activeBundlePrice ? (strikeThroughBundlePrice - activeBundlePrice) : 0;



  const handleWhatsAppShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const priceToDisplay = currentDisplayPrice || minPrice;
    let msg = `Check out ${translatedName} for RM${priceToDisplay.toFixed(2)}. Get it on Cheng-BOOM now! ${url}`;
    if (locale === 'zh') {
      msg = `快来看看 ${translatedName}，只需 RM${priceToDisplay.toFixed(2)}。立即在 Cheng-BOOM 购买！${url}`;
    } else if (locale === 'ms') {
      msg = `Lihat ${translatedName} untuk RM${priceToDisplay.toFixed(2)}. Dapatkannya di Cheng-BOOM sekarang! ${url}`;
    }
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
        itemsPerBox: selectedVariant === 'Box' ? product.itemsPerBox : selectedVariant === 'Bundle' ? product.bundleQuantity : 1,
        code: product.code,
        name: translatedName, 
        price: selectedVariant === 'Single' ? activePrice : selectedVariant === 'Box' ? activeBoxPrice! : activeBundlePrice!, 
        originalPrice: selectedVariant === 'Single' ? strikeThroughPrice : selectedVariant === 'Box' ? strikeThroughBoxPrice : strikeThroughBundlePrice, 
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
  const hasBoxPricing = !!(activeBoxPrice && product.itemsPerBox && product.itemsPerBox > 1);
  const hasBundlePricing = !!(activeBundlePrice && product.bundleQuantity && product.bundleQuantity > 1);
  
  const minPrice = Math.min(activePrice, hasBoxPricing ? activeBoxPrice! : activePrice, hasBundlePricing ? activeBundlePrice! : activePrice);
  const maxPrice = Math.max(activePrice, hasBoxPricing ? activeBoxPrice! : activePrice, hasBundlePricing ? activeBundlePrice! : activePrice);
  
  const effectiveSingleStrike = strikeThroughPrice || activePrice;
  const effectiveBoxStrike = strikeThroughBoxPrice || activeBoxPrice || activePrice;
  const effectiveBundleStrike = strikeThroughBundlePrice || activeBundlePrice || activePrice;
  
  const minOriginal = Math.min(effectiveSingleStrike, hasBoxPricing ? effectiveBoxStrike : effectiveSingleStrike, hasBundlePricing ? effectiveBundleStrike : effectiveSingleStrike);
  const maxOriginal = Math.max(effectiveSingleStrike, hasBoxPricing ? effectiveBoxStrike : effectiveSingleStrike, hasBundlePricing ? effectiveBundleStrike : effectiveSingleStrike);
  
  const hasAnyDiscount = hasDiscount || hasBoxDiscount || hasBundleDiscount;
  
  const currentDisplayPrice = selectedVariant === 'Single' ? activePrice : selectedVariant === 'Box' ? activeBoxPrice! : selectedVariant === 'Bundle' ? activeBundlePrice! : null;
  const currentStrikePrice = selectedVariant === 'Single' ? strikeThroughPrice : selectedVariant === 'Box' ? strikeThroughBoxPrice : selectedVariant === 'Bundle' ? strikeThroughBundlePrice : null;
  
  const singleSavingsPercent = hasDiscount && strikeThroughPrice ? Math.round(((strikeThroughPrice - activePrice) / strikeThroughPrice) * 100) : 0;
  const boxSavingsPercent = hasBoxDiscount && strikeThroughBoxPrice && activeBoxPrice ? Math.round(((strikeThroughBoxPrice - activeBoxPrice) / strikeThroughBoxPrice) * 100) : 0;
  const bundleSavingsPercent = hasBundleDiscount && strikeThroughBundlePrice && activeBundlePrice ? Math.round(((strikeThroughBundlePrice - activeBundlePrice) / strikeThroughBundlePrice) * 100) : 0;
  const maxSavingsPercent = Math.max(singleSavingsPercent, boxSavingsPercent, bundleSavingsPercent);

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
      <div className="min-h-screen bg-white pt-[calc(56px+env(safe-area-inset-top,0px))] md:pt-0">
        <div
          className="product-detail-topbar fixed inset-x-0 top-0 z-[120] flex items-center px-4 pb-3 text-white shadow-md md:hidden"
          style={{
            height: 'calc(56px + env(safe-area-inset-top, 0px))',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            boxSizing: 'border-box',
            background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else void router.push('/shop');
            }}
            aria-label={locale === 'zh' ? '返回' : locale === 'ms' ? 'Kembali' : 'Go back'}
            className="-ml-2 mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/15 active:bg-white/20"
          >
            <ArrowLeft size={23} strokeWidth={2.5} />
          </button>
          <span className="absolute left-1/2 max-w-[65%] -translate-x-1/2 truncate text-center text-sm font-semibold tracking-wide">
            {product.code?.toUpperCase() || product.id.toUpperCase()}
          </span>
        </div>
        
        {/* Top Header: Breadcrumb & Share */}
        <div className="w-full hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

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
              <>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  {locale === 'zh' ? '所有分类' : locale === 'ms' ? 'Semua Kategori' : 'All Categories'}
                </Link>
                <ChevronRight size={14} className="text-zinc-600" />
                <Link href={`/shop?category=${catKey}`} className="hover:text-primary transition-colors">
                  {translatedCategory || (locale === 'zh' ? '商店' : locale === 'ms' ? 'Kedai' : 'Shop')}
                </Link>
              </>
            )}
            <ChevronRight size={14} className="text-zinc-600" />
            <span className="text-zinc-900 font-bold truncate max-w-[200px] sm:max-w-xs">{translatedName}</span>
          </div>

                  </div>
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 pt-0 pb-8 sm:px-6 lg:px-8 md:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 items-start">
          
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
                    className={`relative w-20 h-20 rounded-none overflow-hidden border-2 transition-all shrink-0 bg-zinc-900 ${
                      activeImageIdx === idx ? 'border-zinc-800 scale-105 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
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
              className="flex-1 aspect-square min-h-0 rounded-xl overflow-hidden bg-[#f9f9f9] border-none cursor-zoom-in group relative"
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImageIdx]}
                    alt={translatedName}
                    className="absolute inset-0 z-10 w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02] p-8 mix-blend-multiply"
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
              <div className="absolute top-4 left-4 z-40 bg-white border border-zinc-200 text-zinc-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                  {locale === 'zh' ? '热销产品' : locale === 'ms' ? 'Paling Laris' : 'Best Seller'}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none z-30">
                <div className="bg-black/50 backdrop-blur-md p-4 rounded-full text-white">
                  <Maximize2 size={32} />
                </div>
              </div>
              {/* Share Buttons inside Image */}
              <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-2 rounded-full border border-white/60 shadow-sm">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest hidden sm:inline mr-1">{locale === 'zh' ? '分享' : locale === 'ms' ? 'Kongsi' : 'Share'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(); }}
                  className="w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform flex items-center justify-center drop-shadow-sm bg-white border border-zinc-700/50"
                  title="Share to WhatsApp"
                >
                  <img src="/whatsapp-call-icon-psd-editable_314999-3666.avif" alt="WhatsApp" className="w-full h-full object-cover scale-[1.15]" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                  className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors flex items-center justify-center"
                  title="Copy Link"
                >
                  {isCopied ? <Check size={14} className="text-green-500" /> : <LinkIcon size={14} />}
                </button>
              </div>
            </div>
          </div>
          </div>

          {/* RIGHT: Info Section */}
          <div className="w-full flex flex-col h-full">
            <div className="flex flex-col justify-start mb-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#222222] tracking-tight leading-tight mb-2 font-normal">
                {translatedName}
              </h1>
            </div>

            {/* Unified Pricing Card (Shopee Style) */}
            <div className="mb-4 space-y-4">
              
              {/* Dynamic Price Header */}
              {isSeller ? (
              <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 shadow-sm md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-2 md:shadow-none">
                <div className="absolute inset-y-0 left-0 w-1 bg-[#d52b20] md:hidden" />
                <p className="mb-1 pl-1 text-[11px] font-bold uppercase tracking-[0.14em] text-red-700 md:pl-0 md:normal-case md:tracking-normal md:text-zinc-700">
                  {locale === 'zh' ? '价格' : locale === 'ms' ? 'Harga' : 'Price'}
                </p>
                <div className="flex flex-wrap items-baseline gap-2 pl-1">
                  {currentStrikePrice != null && <span className="text-sm text-zinc-400 line-through">RM {currentStrikePrice.toFixed(2)}</span>}
                  <span className="text-2xl font-black tracking-tight text-black">{currentDisplayPrice != null ? `RM ${currentDisplayPrice.toFixed(2)}` : '—'}</span>
                </div>
              </div>
              ) : (
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
                  <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight md:text-black">
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
                        {selectedVariant === 'Single' ? `-${singleSavingsPercent}%` : selectedVariant === 'Box' ? `-${boxSavingsPercent}%` : `-${bundleSavingsPercent}%`}
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
                {(hasBoxPricing || hasBundlePricing) && (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-bold text-zinc-900 mb-2">
                    {locale === 'zh' ? '选项' : locale === 'ms' ? 'Saiz' : 'Size:'}
                    </span>
                    <div className="flex flex-wrap gap-3 w-full">
                      <button
                        onClick={() => {
                          setSelectedVariant('Single');
                          setLocalQty(1);
                          setShowVariantError(false);
                        }}
                        className={`h-12 px-6 rounded-full border transition-all flex items-center justify-center text-sm font-bold flex-1 min-w-[120px] ${selectedVariant === 'Single' ? 'border-orange-500 bg-orange-100 text-orange-950 shadow-md ring-1 ring-orange-500/50' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                      >
                        {locale === 'zh' ? '单品' : locale === 'ms' ? 'Satu' : 'Single'}
                      </button>
                      
                      {hasBundlePricing && (
                        <button
                          onClick={() => {
                            setSelectedVariant('Bundle');
                            setLocalQty(1);
                            setShowVariantError(false);
                          }}
                          className={`h-12 px-6 rounded-full border transition-all flex items-center justify-center text-sm font-bold flex-1 min-w-[120px] ${selectedVariant === 'Bundle' ? 'border-orange-500 bg-orange-100 text-orange-950 shadow-md ring-1 ring-orange-500/50' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                        >
                          {locale === 'zh' ? `套装 (${product.bundleQuantity} 件)` : locale === 'ms' ? `Set (${product.bundleQuantity} Item)` : `Bundle Set (${product.bundleQuantity} Items)`}
                        </button>
                      )}

                      {hasBoxPricing && (
                        <button
                          onClick={() => {
                            setSelectedVariant('Box');
                            setLocalQty(1);
                            setShowVariantError(false);
                          }}
                          className={`h-12 px-6 rounded-full border transition-all flex items-center justify-center text-sm font-bold flex-1 min-w-[120px] ${selectedVariant === 'Box' ? 'border-orange-500 bg-orange-100 text-orange-950 shadow-md ring-1 ring-orange-500/50' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                        >
                          {locale === 'zh' ? `整箱 (${product.itemsPerBox} 件)` : locale === 'ms' ? `Kotak (${product.itemsPerBox} Item)` : `Box (${product.itemsPerBox} Items)`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                
                {/* Unified Action Row */}
                <div className="flex items-center gap-3 w-full mt-6 pb-6 border-b border-zinc-100">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between w-[150px] bg-white rounded-full border border-zinc-200 shadow-sm px-2 py-1.5 shrink-0" onClick={(e) => e.preventDefault()}>
                    <button 
                      onClick={decrement}
                      disabled={localQty <= 1 || !selectedVariant}
                      className="w-[36px] h-[36px] shrink-0 rounded-full border-2 border-zinc-300 bg-white flex items-center justify-center text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-zinc-50 active:scale-90 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="flex-1 text-center font-bold text-[15px] text-zinc-900 select-none tabular-nums">{selectedVariant ? localQty : 0}</span>
                    <button 
                      onClick={increment}
                      disabled={localQty >= currentMaxAvailable || !selectedVariant}
                      className="w-[36px] h-[36px] shrink-0 rounded-full bg-zinc-900 border-2 border-zinc-900 flex items-center justify-center text-white hover:bg-primary hover:border-primary hover:text-zinc-900 active:scale-90 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 h-[52px] bg-[#3c304a] text-white rounded-full font-semibold text-[13px] tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-[0.98] uppercase"
                  >
                    {t.productDetail?.addToCart || (locale === 'zh' ? '加入购物车' : locale === 'ms' ? 'Tambah ke Troli' : 'ADD TO CART')}
                  </button>

                  
                </div>

                {showVariantError && (
                  <div className="text-red-500 text-sm font-medium mt-2">
                    {locale === 'zh' ? '请先选择商品选项' : locale === 'ms' ? 'Sila pilih variasi produk dahulu' : 'Please select product variation first'}
                  </div>
                )}

                {/* Availability */}
                <div className="flex items-center justify-center gap-2 text-zinc-500 mt-4 px-2 w-full">
                  <CheckCircle size={14} className={trueRemainingStock > 0 ? "text-green-500" : "text-red-500"} />
                  <span className="text-xs font-medium">{trueRemainingStock} {locale === 'zh' ? '件库存 — 现货供应' : locale === 'ms' ? 'unit dalam stok — Sedia untuk dihantar' : 'units in stock — Ready to deliver'}</span>
                </div>

                {/* Guarantees Box - Borderless style */}
                <div className="mt-8 bg-[#f9f9f9] rounded-[14px] py-6 px-2 sm:px-4 flex flex-row items-center justify-between w-full">
                  <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <ShieldCheck size={24} className="text-zinc-700" strokeWidth={1.5} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-zinc-700 leading-tight">{locale === 'zh' ? '100% 正品' : locale === 'ms' ? '100% Asli' : '100% Original'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <Truck size={24} className="text-zinc-700" strokeWidth={1.5} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-zinc-700 leading-tight">{locale === 'zh' ? '快速发货' : locale === 'ms' ? 'Pantas' : 'Fast Delivery'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <Award size={24} className="text-zinc-700" strokeWidth={1.5} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-zinc-700 leading-tight">{locale === 'zh' ? '顶级品质' : locale === 'ms' ? 'Kualiti Terbaik' : 'Top Quality'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <Headset size={24} className="text-zinc-700" strokeWidth={1.5} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-zinc-700 leading-tight">{locale === 'zh' ? '全天候支持' : locale === 'ms' ? 'Sokongan 24/7' : '24/7 Support'}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Removed the old footer row because share features are now overlaid on the image */}
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────────── */}
        <div className="mt-8 mb-16">
          {/* Tab Bar */}
          <div className="flex items-center gap-8 border-b border-zinc-200 overflow-x-auto whitespace-nowrap scrollbar-hide pb-[1px]">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-4 text-[15px] font-bold transition-colors relative shrink-0 ${
                activeTab === 'description' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              {t.productDetail.description || 'Description'}
              {activeTab === 'description' && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-zinc-900" />
              )}
            </button>
            {embedUrl && (
              <button
                onClick={() => setActiveTab('video')}
                className={`pb-4 text-[15px] font-bold transition-colors relative shrink-0 ${
                  activeTab === 'video' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                {t.productDetail.videoDemo || 'Video Demo'}
                {activeTab === 'video' && (
                  <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-zinc-900" />
                )}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="py-8 min-h-[200px]">
            {activeTab === 'description' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{t.productDetail.productDetails}</h4>
                  <div className="space-y-1 text-sm text-zinc-600 font-medium">
                    <p>{t.productDetail.code}: {product.code?.toUpperCase() || product.id.toUpperCase()}</p>
                    <p>{t.productDetail.name}: {translatedName}</p>
                    <p>{t.productDetail.type}: {translatedCategory}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{t.productDetail.productDescription}</h4>
                  <div className="text-zinc-600 leading-relaxed space-y-4 w-full text-[15px]">
                    {translatedDesc?.split('\n').map((line: string, i: number) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'video' && embedUrl && (
              <div className="w-full animate-in fade-in duration-500">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black shadow-sm border border-zinc-200">
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
            )}
          </div>
        </div>
      </div>
      </div>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isViewerOpen && images.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex cursor-zoom-out items-center justify-center overflow-hidden bg-black"
              style={{ position: 'fixed', inset: 0, zIndex: 2147483000, height: '100dvh', background: '#000' }}
              onClick={() => setIsViewerOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="relative flex h-full w-full select-none items-center justify-center"
              >
                <img
                  src={images[activeImageIdx]}
                  alt={translatedName}
                  className="pointer-events-none h-full w-full select-none object-contain"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

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

export async function getServerSideProps({ params }: { params?: { id?: string } }) {
  const id = params?.id;
  if (!id) return { notFound: true };
  const product = await prisma.product.findUnique({
    where: { id },
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
  };
}
