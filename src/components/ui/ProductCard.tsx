import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../cart/CartProvider';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useFlyToCart } from './FlyToCartProvider';
import { useBusiness } from '../../context/BusinessContext';
import { useRef, useState } from 'react';

export interface ProductCardProps {
  id: string;
  code?: string | null;
  name: string;
  price: number;
  images: string[];
  category: string;
  categoryZh?: string | null;
  categoryMs?: string | null;
  nameZh?: string | null;
  nameMs?: string | null;
  stock?: number;
  promotion?: number | null;
  sellerPrice?: number | null;
  boxPrice?: number | null;
  itemsPerBox?: number | null;
  boxSellerPrice?: number | null;
  boxPromotion?: number | null;
  bundleQuantity?: number | null;
  bundlePrice?: number | null;
  bundleSellerPrice?: number | null;
  bundlePromotion?: number | null;
  createdAt?: string | Date;
}

export function ProductCard({ id, code, name, nameZh, nameMs, price, promotion, sellerPrice, boxPrice, itemsPerBox, boxSellerPrice, boxPromotion, bundleQuantity, bundlePrice, bundleSellerPrice, bundlePromotion, images = [], category, categoryZh, categoryMs, stock = 0, createdAt }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { flyToCart } = useFlyToCart();
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const imageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const cardT = {
    new: { en: 'New', zh: '新品', ms: 'Baru' },
    buy: { en: 'Buy', zh: '立即购买', ms: 'Beli' },
    addToCart: { en: 'Add to cart', zh: '加入购物车', ms: 'Tambah troli' },
    learnMore: { en: 'Learn more', zh: '了解更多', ms: 'Ketahui lanjut' },
    save: { en: 'Save', zh: '节省', ms: 'Jimat' },
  };
  const ct = (key: keyof typeof cardT) => cardT[key][locale as 'en'|'zh'|'ms'] || cardT[key].en;

  const isNew = createdAt && (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24) < 30;

  // Translation helpers
  const translatedName: string = (((locale === 'zh' && nameZh) ? nameZh : (locale === 'ms' && nameMs) ? nameMs : null) || (t.products as any)?.[id]?.name || name) as string;

  const catKey = category.toLowerCase().replace(/\s+/g, '');
  const translatedCategory: string = (((locale === 'zh' && categoryZh) ? categoryZh : (locale === 'ms' && categoryMs) ? categoryMs : null) || t.shopCategories[catKey] || t.shopCategories[category] || category) as string;

  const cartItem = items.find((item) => item.id === id);
  const quantity = cartItem?.quantity || 0;

  const isOutOfStock = stock <= 0;
  
  // Seller Logic
  const isSeller = typeof window !== 'undefined' && (
    localStorage.getItem('user_role') === 'Seller' || 
    JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller'
  );
  
  let activePrice = price;
  let hasDiscount = false;
  let strikeThroughPrice: number | undefined = undefined;

  if (isSeller) {
    if (sellerPrice !== null && sellerPrice !== undefined && sellerPrice > 0) {
      activePrice = sellerPrice;
      if (sellerPrice < price) {
        hasDiscount = true;
        strikeThroughPrice = price;
      }
    } else {
      // Fallback to promo if no sellerPrice is set
      const hasPromo = promotion !== null && promotion !== undefined && promotion < price;
      if (hasPromo) {
        activePrice = promotion as number;
        hasDiscount = true;
        strikeThroughPrice = price;
      }
    }
  } else {
    const hasPromo = promotion !== null && promotion !== undefined && promotion < price;
    if (hasPromo) {
      activePrice = promotion as number;
      hasDiscount = true;
      strikeThroughPrice = price;
    }
  }

  let activeBoxPrice = boxPrice;
  let hasBoxDiscount = false;
  let strikeThroughBoxPrice: number | undefined = undefined;

  if (activeBoxPrice) {
    if (isSeller) {
      if (boxSellerPrice !== null && boxSellerPrice !== undefined && boxSellerPrice > 0) {
        activeBoxPrice = boxSellerPrice;
        if (boxSellerPrice < boxPrice!) {
          hasBoxDiscount = true;
          strikeThroughBoxPrice = boxPrice!;
        }
      } else {
        const hasPromo = boxPromotion !== null && boxPromotion !== undefined && boxPromotion < boxPrice!;
        if (hasPromo) {
          activeBoxPrice = boxPromotion as number;
          hasBoxDiscount = true;
          strikeThroughBoxPrice = boxPrice!;
        }
      }
    } else {
      const hasPromo = boxPromotion !== null && boxPromotion !== undefined && boxPromotion < boxPrice!;
      if (hasPromo) {
        activeBoxPrice = boxPromotion as number;
        hasBoxDiscount = true;
        strikeThroughBoxPrice = boxPrice!;
      }
    }
  }
  
  let activeBundlePrice = bundlePrice;
  let hasBundleDiscount = false;
  let strikeThroughBundlePrice: number | undefined = undefined;

  if (activeBundlePrice) {
    if (isSeller) {
      if (bundleSellerPrice !== null && bundleSellerPrice !== undefined && bundleSellerPrice > 0) {
        activeBundlePrice = bundleSellerPrice;
        if (bundleSellerPrice < bundlePrice!) {
          hasBundleDiscount = true;
          strikeThroughBundlePrice = bundlePrice!;
        }
      } else {
        const hasPromo = bundlePromotion !== null && bundlePromotion !== undefined && bundlePromotion < bundlePrice!;
        if (hasPromo) {
          activeBundlePrice = bundlePromotion as number;
          hasBundleDiscount = true;
          strikeThroughBundlePrice = bundlePrice!;
        }
      }
    } else {
      const hasPromo = bundlePromotion !== null && bundlePromotion !== undefined && bundlePromotion < bundlePrice!;
      if (hasPromo) {
        activeBundlePrice = bundlePromotion as number;
        hasBundleDiscount = true;
        strikeThroughBundlePrice = bundlePrice!;
      }
    }
  }

  const singleSavingsPercent = hasDiscount && strikeThroughPrice ? Math.round(((strikeThroughPrice - activePrice) / strikeThroughPrice) * 100) : 0;
  const boxSavingsPercent = hasBoxDiscount && strikeThroughBoxPrice && activeBoxPrice ? Math.round(((strikeThroughBoxPrice - activeBoxPrice) / strikeThroughBoxPrice) * 100) : 0;
  const bundleSavingsPercent = hasBundleDiscount && strikeThroughBundlePrice && activeBundlePrice ? Math.round(((strikeThroughBundlePrice - activeBundlePrice) / strikeThroughBundlePrice) * 100) : 0;
  
  const discountPercent = Math.max(singleSavingsPercent, boxSavingsPercent, bundleSavingsPercent);

  // Dynamic Pricing Calculations for Shopee Style
  const hasBoxPricing = !!(boxPrice && itemsPerBox && itemsPerBox > 1);
  const hasBundlePricing = !!(bundlePrice && bundleQuantity && bundleQuantity > 1);
  
  const minPrice = Math.min(activePrice, hasBoxPricing ? activeBoxPrice! : activePrice, hasBundlePricing ? activeBundlePrice! : activePrice);
  const maxPrice = Math.max(activePrice, hasBoxPricing ? activeBoxPrice! : activePrice, hasBundlePricing ? activeBundlePrice! : activePrice);
  
  const effectiveSingleStrike = strikeThroughPrice || activePrice;
  const effectiveBoxStrike = strikeThroughBoxPrice || activeBoxPrice || activePrice;
  const effectiveBundleStrike = strikeThroughBundlePrice || activeBundlePrice || activePrice;
  
  const minOriginal = Math.min(effectiveSingleStrike, hasBoxPricing ? effectiveBoxStrike : effectiveSingleStrike, hasBundlePricing ? effectiveBundleStrike : effectiveSingleStrike);
  const maxOriginal = Math.max(effectiveSingleStrike, hasBoxPricing ? effectiveBoxStrike : effectiveSingleStrike, hasBundlePricing ? effectiveBundleStrike : effectiveSingleStrike);
  
  const hasAnyDiscount = hasDiscount || hasBoxDiscount || hasBundleDiscount;

  const displayImage = images[0] || '';

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity < stock) {
      addItem({ id, cartItemId: id, code, name: translatedName, price: activePrice, originalPrice: strikeThroughPrice, image: displayImage, stock });
      if (imageRef.current && displayImage) {
        flyToCart(displayImage, imageRef.current);
      }
    }
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity > 0) {
      updateQuantity(id, quantity - 1);
    }
  };



  const [selectedQty, setSelectedQty] = useState(1);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push({ pathname: '/checkout', query: { buy: id, qty: selectedQty } }, undefined, { shallow: false });
  };

  return (
    <Link href={`/shop/${id}`} className="group block h-full">
      <div className={`relative h-full flex flex-col bg-zinc-100 border border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden transition-all duration-300 ${isOutOfStock ? 'opacity-75' : ''}`}>
        
        {/* NEW tag */}

        {isNew && !isOutOfStock && (
          <div className="absolute top-5 left-5 z-30 font-extrabold text-primary text-[13px] tracking-wide">
            {ct('new')}
          </div>
        )}

        {/* Image Container */}
        <div ref={imageRef} className="relative h-[11rem] sm:h-[19rem] w-full bg-white overflow-hidden shrink-0 flex items-center justify-center group/img">
          {/* Product Image */}
          <div
            className={`absolute inset-0 z-10 w-full h-full bg-contain bg-no-repeat bg-center transition-transform duration-700 ease-out ${!isOutOfStock && 'group-hover/img:scale-105'}`}
            style={{ backgroundImage: `url(${displayImage})`, backgroundPosition: 'center' }}
          />
          
          {/* Centered Watermark Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <img 
              src={settings?.watermarkUrl || "/transparent-Background.png"} 
              className="w-[85%] h-[85%] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
              alt="" 
              draggable={false}
            />
          </div>
        </div>
        
       <div className="px-3 sm:px-6 pb-3 sm:pb-5 pt-2 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
          <div className="flex flex-col justify-start">
            <h3 className="font-medium text-[13px] sm:text-[16px] text-zinc-900 transition-colors line-clamp-2 leading-snug tracking-wide h-[38px] sm:h-[46px] overflow-hidden">
              {translatedName}
            </h3>
          </div>
          
          <div className="mt-auto flex flex-col gap-4">
            {/* Price Line */}
            <div className="flex flex-col gap-1 sm:gap-1.5 w-full">
              <div className="flex items-center flex-wrap gap-1 mt-auto">
                <span className="text-[13px] sm:text-[19px] font-bold text-primary mr-1 whitespace-nowrap tracking-tight">
                  {minPrice === maxPrice ? `RM${minPrice.toFixed(2)}` : `RM${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`}
                </span>
                {hasAnyDiscount && minOriginal && (
                  <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 line-through whitespace-nowrap">
                    {minOriginal === maxOriginal ? `RM${minOriginal.toFixed(2)}` : `RM${minOriginal.toFixed(2)} - ${maxOriginal.toFixed(2)}`}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:gap-3 mt-1">
              {/* Quantity Selector */}
              <div
                className="flex items-center justify-between w-full bg-white rounded-full border border-zinc-200 shadow-sm px-2 py-1.5"
                onClick={(e) => e.preventDefault()}
              >
                {/* Minus */}
                <button
                  disabled={isOutOfStock || selectedQty <= 1}
                  onClick={(e) => { e.preventDefault(); setSelectedQty(q => Math.max(1, q - 1)); }}
                  className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] shrink-0 rounded-full border-2 border-zinc-300 bg-white flex items-center justify-center text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-zinc-50 active:scale-90 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <Minus size={12} strokeWidth={3} />
                </button>

                {/* Count */}
                <span className="flex-1 text-center font-bold text-[13px] sm:text-[15px] text-zinc-900 select-none tabular-nums">
                  {selectedQty}
                </span>

                {/* Plus */}
                <button
                  disabled={isOutOfStock}
                  onClick={(e) => { e.preventDefault(); setSelectedQty(q => q + 1); }}
                  className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] shrink-0 rounded-full bg-primary border-2 border-primary flex items-center justify-center text-black hover:brightness-110 active:scale-90 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-1.5 sm:py-2.5 rounded-full bg-primary text-black font-bold text-[11px] sm:text-sm transition-all hover:brightness-110 border-[1.5px] border-primary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ct('buy')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
