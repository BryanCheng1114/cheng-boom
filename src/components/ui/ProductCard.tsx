import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../cart/CartProvider';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useFlyToCart } from './FlyToCartProvider';
import { useBusiness } from '../../context/BusinessContext';
import { useRef } from 'react';

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
  createdAt?: string | Date;
}

export function ProductCard({ id, code, name, nameZh, nameMs, price, promotion, sellerPrice, boxPrice, itemsPerBox, boxSellerPrice, boxPromotion, images = [], category, categoryZh, categoryMs, stock = 0, createdAt }: ProductCardProps) {
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
  
  const discountPercent = hasDiscount 
    ? Math.round(((price - activePrice) / price) * 100) 
    : 0;

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



  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push({ pathname: '/shop', query: { ...router.query, buy: id } }, undefined, { shallow: true, scroll: false });
  };

  return (
    <Link href={`/shop/${id}`} className="group block h-full w-full">
      <div className={`relative h-full w-full flex flex-col bg-zinc-50 dark:bg-white/5 rounded-[2rem] overflow-hidden transition-all duration-300 ${isOutOfStock ? 'opacity-75' : ''}`}>
        
        {/* NEW tag */}
        {isNew && !isOutOfStock && (
          <div className="absolute top-5 left-5 z-30 font-extrabold text-primary text-[13px] tracking-wide">
            {ct('new')}
          </div>
        )}

        {/* Image Container */}
        <div ref={imageRef} className="relative h-[19rem] w-full bg-white overflow-hidden shrink-0 flex items-center justify-center group/img">
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
        
        <div className="px-6 pb-6 pt-2 flex flex-col flex-1 justify-between gap-4">
          <div className="flex flex-col justify-start">
            <h3 className="font-medium text-[16px] text-foreground transition-colors line-clamp-2 leading-snug tracking-wide min-h-[46px]">
              {translatedName}
            </h3>
          </div>
          
          <div className="mt-auto flex flex-col gap-4">
            {/* Price Line */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                <span className="font-bold text-foreground tracking-tight truncate">
                  <span className="text-[13px] mr-0.5 font-semibold">RM</span>
                  <span className="text-[19px]">{activePrice.toFixed(2)}</span>
                </span>
                {hasDiscount && (
                  <span className="font-bold text-primary truncate ml-1">
                    <span className="text-[13px] mr-0.5 font-semibold">{ct('save')} RM</span>
                    <span className="text-[19px]">{(strikeThroughPrice! - activePrice).toFixed(2)}</span>
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-1">
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm transition-all hover:bg-yellow-400 hover:text-zinc-900 dark:hover:bg-yellow-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ct('buy')}
              </button>

              <div className="w-full py-2.5 rounded-full bg-transparent border-[1.5px] border-zinc-900 dark:border-white text-zinc-900 dark:text-white font-bold text-sm text-center transition-all hover:bg-yellow-400 hover:text-zinc-900 hover:border-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-zinc-900 dark:hover:border-yellow-400 group-active:scale-[0.98]">
                {ct('learnMore')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
