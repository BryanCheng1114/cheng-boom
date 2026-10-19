import Link from 'next/link';
import { useCart } from '../cart/CartProvider';
import { Plus, Minus } from 'lucide-react';
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
  bundleQuantity?: number | null;
  bundlePrice?: number | null;
  bundleSellerPrice?: number | null;
  bundlePromotion?: number | null;
  createdAt?: string | Date;
}

export function ProductCard({ id, code, name, nameZh, nameMs, price, promotion, sellerPrice, boxPrice, itemsPerBox, boxSellerPrice, boxPromotion, bundleQuantity, bundlePrice, bundleSellerPrice, bundlePromotion, images = [], stock = 0, createdAt }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { flyToCart } = useFlyToCart();
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const imageRef = useRef<HTMLDivElement>(null);

  const cardT = {
    new: { en: 'New', zh: '新品', ms: 'Baru' },
    add: { en: 'Add', zh: '添加', ms: 'Tambah' },
  };
  const ct = (key: keyof typeof cardT) => cardT[key][locale as 'en'|'zh'|'ms'] || cardT[key].en;

  const isNew = createdAt && (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24) < 30;

  // Translation helpers
  const translatedName: string = (((locale === 'zh' && nameZh) ? nameZh : (locale === 'ms' && nameMs) ? nameMs : null) || (t.products as any)?.[id]?.name || name) as string;

  const cartItem = items.find((item) => item.id === id);
  const quantity = cartItem?.quantity || 0;

  const isOutOfStock = stock <= 0;
  
  // Seller Logic
  const isSeller = typeof window !== 'undefined' && (
    localStorage.getItem('user_role') === 'Seller' || 
    JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller'
  );
  
  let activePrice = price;
  let strikeThroughPrice: number | undefined = undefined;

  if (isSeller) {
    if (sellerPrice !== null && sellerPrice !== undefined && sellerPrice > 0) {
      activePrice = sellerPrice;
      if (sellerPrice < price) {
        strikeThroughPrice = price;
      }
    } else {
      // Fallback to promo if no sellerPrice is set
      const hasPromo = promotion !== null && promotion !== undefined && promotion < price;
      if (hasPromo) {
        activePrice = promotion as number;
        strikeThroughPrice = price;
      }
    }
  } else {
    const hasPromo = promotion !== null && promotion !== undefined && promotion < price;
    if (hasPromo) {
      activePrice = promotion as number;
      strikeThroughPrice = price;
    }
  }

  let activeBoxPrice = boxPrice;

  if (activeBoxPrice) {
    if (isSeller) {
      if (boxSellerPrice !== null && boxSellerPrice !== undefined && boxSellerPrice > 0) {
        activeBoxPrice = boxSellerPrice;
      } else {
        const hasPromo = boxPromotion !== null && boxPromotion !== undefined && boxPromotion < boxPrice!;
        if (hasPromo) {
          activeBoxPrice = boxPromotion as number;
        }
      }
    } else {
      const hasPromo = boxPromotion !== null && boxPromotion !== undefined && boxPromotion < boxPrice!;
      if (hasPromo) {
        activeBoxPrice = boxPromotion as number;
      }
    }
  }
  
  let activeBundlePrice = bundlePrice;

  if (activeBundlePrice) {
    if (isSeller) {
      if (bundleSellerPrice !== null && bundleSellerPrice !== undefined && bundleSellerPrice > 0) {
        activeBundlePrice = bundleSellerPrice;
      } else {
        const hasPromo = bundlePromotion !== null && bundlePromotion !== undefined && bundlePromotion < bundlePrice!;
        if (hasPromo) {
          activeBundlePrice = bundlePromotion as number;
        }
      }
    } else {
      const hasPromo = bundlePromotion !== null && bundlePromotion !== undefined && bundlePromotion < bundlePrice!;
      if (hasPromo) {
        activeBundlePrice = bundlePromotion as number;
      }
    }
  }

  // Dynamic Pricing Calculations for Shopee Style
  const hasBoxPricing = !!(boxPrice && itemsPerBox && itemsPerBox > 1);
  const hasBundlePricing = !!(bundlePrice && bundleQuantity && bundleQuantity > 1);
  
  const minPrice = Math.min(activePrice, hasBoxPricing ? activeBoxPrice! : activePrice, hasBundlePricing ? activeBundlePrice! : activePrice);
  const maxPrice = Math.max(activePrice, hasBoxPricing ? activeBoxPrice! : activePrice, hasBundlePricing ? activeBundlePrice! : activePrice);
  
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

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100/90 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-zinc-200 hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] ${isOutOfStock ? 'opacity-75' : ''}`}>
      {isNew && !isOutOfStock && (
        <span className="absolute left-2.5 top-2.5 z-30 rounded-md border border-amber-300 bg-amber-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-900 shadow-sm sm:left-3 sm:top-3 sm:text-[10px]">
          {ct('new')}
        </span>
      )}

      <Link href={`/shop/${id}`} className="block min-w-0">
        <div ref={imageRef} className="group/img relative aspect-[1.28/1] w-full overflow-hidden bg-[#fafafc]">
          <div
            className="absolute inset-0 z-10 h-full w-full bg-contain bg-center bg-no-repeat transition-transform duration-500 ease-out group-hover/img:scale-105"
            style={{ backgroundImage: displayImage ? `url(${displayImage})` : undefined }}
          />
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <img
              src={settings?.watermarkUrl || '/transparent-Background.png'}
              className="h-[82%] w-[82%] select-none object-contain opacity-25 mix-blend-multiply transition-opacity duration-300 group-hover/img:opacity-35"
              alt=""
              draggable={false}
            />
          </div>
          <span className="absolute bottom-2 right-2 z-30 rounded-md border border-white/80 bg-white/90 px-2 py-1 text-[9px] font-medium text-zinc-600 shadow-sm backdrop-blur-sm sm:bottom-2.5 sm:right-2.5 sm:px-2.5 sm:text-[10px]">
            {locale === 'zh' ? '库存' : locale === 'ms' ? 'Stok' : 'Stock'}: <span className="font-bold text-zinc-900">{stock}</span>
          </span>
        </div>
        <div className="bg-white px-3 pb-1 pt-2.5 sm:px-3.5 sm:pt-3">
          <h3 className="line-clamp-2 min-h-9 text-[12px] font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-red-700 sm:min-h-11 sm:text-sm">
            {translatedName}
          </h3>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-1.5 bg-white px-3 pb-3 pt-1 sm:px-3.5 sm:pb-3.5">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-extrabold tracking-tight text-zinc-900 sm:text-sm">
            {minPrice === maxPrice ? `RM ${minPrice.toFixed(2)}` : `RM ${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)}`}
          </p>
        </div>

        {quantity === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg bg-amber-400 px-3 text-[11px] font-bold text-zinc-900 shadow-sm transition-all hover:bg-amber-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:px-3.5 sm:text-xs"
            aria-label={`${ct('add')} ${translatedName} to cart`}
          >
            {ct('add')}
          </button>
        ) : (
          <div className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 p-0.5 sm:h-9 sm:gap-1.5 sm:p-1" aria-label={`${quantity} in cart`}>
            <button
              type="button"
              onClick={handleMinus}
              aria-label={`Remove one ${translatedName}`}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-amber-200 active:scale-90 sm:h-7 sm:w-7"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="min-w-[18px] text-center text-xs font-bold tabular-nums text-zinc-900 sm:min-w-[20px]">{quantity}</span>
            <button
              type="button"
              onClick={handleAdd}
              disabled={quantity >= stock}
              aria-label={`Add one ${translatedName}`}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400 text-zinc-900 transition-colors hover:bg-amber-300 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 sm:h-7 sm:w-7"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
