import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../cart/CartProvider';
import { Plus, Minus, ShoppingCart, Flame, Loader2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useFlyToCart } from './FlyToCartProvider';
import { useBusiness } from '../../context/BusinessContext';
import { useEffect, useRef, useState } from 'react';

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
  sellerBPrice?: number | null;
  boxPrice?: number | null;
  itemsPerBox?: number | null;
  boxSellerPrice?: number | null;
  sellerBBoxPrice?: number | null;
  boxPromotion?: number | null;
  bundleQuantity?: number | null;
  bundlePrice?: number | null;
  bundleSellerPrice?: number | null;
  sellerBBundlePrice?: number | null;
  bundlePromotion?: number | null;
  createdAt?: string | Date;
  mobileView?: 'list' | 'grid';
}

export function ProductCard({ id, code, name, nameZh, nameMs, price, promotion, sellerPrice, sellerBPrice, boxPrice, itemsPerBox, boxSellerPrice, sellerBBoxPrice, boxPromotion, bundleQuantity, bundlePrice, bundleSellerPrice, sellerBBundlePrice, bundlePromotion, images = [], stock = 0, createdAt, mobileView = 'grid' }: ProductCardProps) {
  const router = useRouter();
  const { items, addItem, updateQuantity } = useCart();
  const { flyToCart } = useFlyToCart();
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const imageRef = useRef<HTMLDivElement>(null);
  const listImageRef = useRef<HTMLDivElement>(null);
  const openingDetailsRef = useRef(false);
  const [user, setUser] = useState<any>(null);
  const [isOpeningDetails, setIsOpeningDetails] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      try { setUser(JSON.parse(localStorage.getItem('user') || 'null')); }
      catch { setUser(null); }
    };
    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('user-updated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-updated', syncUser);
    };
  }, []);

  useEffect(() => {
    const resetOpeningState = () => {
      openingDetailsRef.current = false;
      setIsOpeningDetails(false);
    };
    router.events.on('routeChangeError', resetOpeningState);
    return () => router.events.off('routeChangeError', resetOpeningState);
  }, [router.events]);

  const cardT = {
    new: { en: 'New', zh: '新品', ms: 'Baru' },
  };
  const ct = (key: keyof typeof cardT) => cardT[key][locale as 'en'|'zh'|'ms'] || cardT[key].en;

  const isNew = createdAt && (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24) < 30;
  const isHotSale = promotion !== null && promotion !== undefined && promotion > 0 && promotion < price;
  const newBadge = isNew ? ct('new') : '';

  // Translation helpers
  const translatedName: string = (((locale === 'zh' && nameZh) ? nameZh : (locale === 'ms' && nameMs) ? nameMs : null) || (t.products as any)?.[id]?.name || name) as string;

  const cartItem = items.find((item) => item.id === id);
  const quantity = cartItem?.quantity || 0;

  const isOutOfStock = stock <= 0;
  
  // Seller Logic
  const isSeller = user?.role === 'Seller';
  const pricingGroup = isSeller && user?.sellerPricing === 'B' ? 'B' : 'A';
  const groupPrice = pricingGroup === 'B' ? sellerBPrice : sellerPrice;
  const groupBoxPrice = pricingGroup === 'B' ? sellerBBoxPrice : boxSellerPrice;
  const groupBundlePrice = pricingGroup === 'B' ? sellerBBundlePrice : bundleSellerPrice;
  
  let activePrice = groupPrice ?? price;
  let strikeThroughPrice: number | undefined = undefined;

  if (isSeller) {
    if (groupPrice !== null && groupPrice !== undefined && groupPrice > 0) {
      activePrice = groupPrice;
      if (groupPrice < price) {
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

  const hasActiveDiscount = strikeThroughPrice !== undefined && strikeThroughPrice > activePrice;

  let activeBoxPrice = boxPrice;

  if (activeBoxPrice) {
    if (isSeller) {
      if (groupBoxPrice !== null && groupBoxPrice !== undefined && groupBoxPrice > 0) {
        activeBoxPrice = groupBoxPrice;
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
      if (groupBundlePrice !== null && groupBundlePrice !== undefined && groupBundlePrice > 0) {
        activeBundlePrice = groupBundlePrice;
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
  
  const displayImage = images[0] || '';

  const openDetailsFromCard = (event: React.MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a, button')) return;
    if (openingDetailsRef.current) return;
    openingDetailsRef.current = true;
    setIsOpeningDetails(true);
    void router.push(`/shop/${encodeURIComponent(id)}`).then((didNavigate) => {
      if (!didNavigate) {
        openingDetailsRef.current = false;
        setIsOpeningDetails(false);
      }
    }).catch(() => {
      openingDetailsRef.current = false;
      setIsOpeningDetails(false);
    });
  };

  const handleDetailsLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (openingDetailsRef.current) {
      event.preventDefault();
      return;
    }
    openingDetailsRef.current = true;
    setIsOpeningDetails(true);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity < stock) {
      addItem({ id, cartItemId: id, code, name: translatedName, price: activePrice, originalPrice: strikeThroughPrice, image: displayImage, stock });
      const imageTarget = window.matchMedia('(max-width: 767px)').matches && mobileView === 'list'
        ? listImageRef.current
        : imageRef.current;
      if (imageTarget && displayImage) {
        flyToCart(displayImage, imageTarget);
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
    <>
    {mobileView === 'list' && (
      <article onClick={openDetailsFromCard} className={`group relative flex min-h-[142px] cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm md:hidden ${isOutOfStock ? 'opacity-75' : ''}`}>
        <Link href={`/shop/${id}`} onClick={handleDetailsLinkClick} className="relative block w-[38%] min-w-[112px] max-w-[150px] shrink-0 overflow-hidden bg-zinc-50">
          <div className="relative h-full min-h-[142px] w-full overflow-hidden">
            <div ref={listImageRef} className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: displayImage ? `url(${displayImage})` : undefined }} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <img src={settings?.watermarkUrl || '/transparent-Background.png'} className="h-[82%] w-[82%] select-none object-contain opacity-25 mix-blend-multiply" alt="" draggable={false} />
            </div>
            {isHotSale && <Flame aria-label="Hot sale" className="absolute left-2 top-2 z-30 h-5 w-5 fill-orange-500 text-orange-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" strokeWidth={2.5} />}
          </div>
        </Link>
        <div className="flex min-w-0 flex-1 flex-col p-2.5">
          <div className="line-clamp-3 min-h-[60px] text-[16px] font-semibold leading-[1.25] text-zinc-900">
            {newBadge && <span className="mr-1.5 inline-block rounded bg-emerald-600 px-1.5 py-0.5 align-baseline text-[11px] font-bold leading-tight text-white">{newBadge}</span>}
            <Link href={`/shop/${id}`} onClick={handleDetailsLinkClick} className="inline">{translatedName}</Link>
          </div>
          <div className="mt-auto flex items-end justify-between gap-1.5 pt-2">
            <div className="min-w-0">
              {hasActiveDiscount && strikeThroughPrice !== undefined ? (
                <>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-rose-600">{locale === 'zh' ? '折扣价' : locale === 'ms' ? 'Diskaun' : 'Discount'}</p>
                  <p className="text-[11px] font-medium leading-tight text-zinc-400 line-through decoration-zinc-400">RM {strikeThroughPrice.toFixed(2)}</p>
                  <p className="text-[19px] font-black leading-tight tracking-tight text-rose-600">RM {activePrice.toFixed(2)}</p>
                </>
              ) : (
                <>
                  {isSeller && sellerPrice !== null && sellerPrice !== undefined && sellerPrice > 0 && (
                    <p className="text-[11px] font-semibold leading-tight text-zinc-500">{locale === 'zh' ? '卖家价' : locale === 'ms' ? 'Harga Penjual' : 'Seller Price'}</p>
                  )}
                  <p className="text-[15px] font-extrabold leading-tight text-rose-600">RM {activePrice.toFixed(2)}</p>
                </>
              )}
            </div>
            {quantity === 0 ? (
              <button type="button" onClick={handleAdd} disabled={isOutOfStock} className="flex h-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 px-2 text-[12px] font-bold whitespace-nowrap text-white transition-colors hover:bg-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                {locale === 'zh' ? '加入购物车' : locale === 'ms' ? 'Tambah ke Troli' : 'Add to Cart'}
              </button>
            ) : (
              <div className="flex h-8 shrink-0 items-center gap-0.5 rounded-md border border-zinc-300 bg-zinc-50 px-0.5">
                <button type="button" onClick={handleMinus} aria-label={`Remove one ${translatedName}`} className="flex h-7 w-7 items-center justify-center rounded text-zinc-700 hover:bg-zinc-200"><Minus size={14} strokeWidth={2.5} /></button>
                <span className="min-w-[18px] text-center text-xs font-bold tabular-nums text-zinc-900">{quantity}</span>
                <button type="button" onClick={handleAdd} disabled={quantity >= stock} aria-label={`Add one ${translatedName}`} className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40"><Plus size={14} strokeWidth={2.5} /></button>
              </div>
            )}
          </div>
        </div>
        {isOpeningDetails && <div className="absolute inset-0 z-40 flex items-center justify-center gap-2 bg-white/85 text-sm font-semibold text-zinc-800 backdrop-blur-[2px]" role="status"><Loader2 size={18} className="animate-spin text-[#d52b20]" />{locale === 'zh' ? '正在打开商品…' : locale === 'ms' ? 'Membuka produk…' : 'Opening item…'}</div>}
      </article>
    )}
    <article onClick={openDetailsFromCard} className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-100/90 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-zinc-200 hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] ${mobileView === 'list' ? 'hidden md:flex' : ''} ${isOutOfStock ? 'opacity-75' : ''}`}>
      <Link href={`/shop/${id}`} onClick={handleDetailsLinkClick} className="block min-w-0">
        <div ref={imageRef} className="group/img relative aspect-[1.28/1] w-full overflow-hidden bg-[#fafafc]">
          <div
            className="absolute inset-0 z-10 h-full w-full bg-contain bg-center bg-no-repeat transition-transform duration-500 ease-out group-hover/img:scale-105"
            style={{ backgroundImage: displayImage ? `url(${displayImage})` : undefined }}
          />
          {isHotSale && <Flame aria-label="Hot sale" className="absolute left-2 top-2 z-30 h-5 w-5 fill-orange-500 text-orange-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" strokeWidth={2.5} />}
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
          <h3 className="line-clamp-2 min-h-10 text-[14px] font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-red-700 sm:min-h-12 sm:text-base">
            {newBadge && <span className="mr-1 inline-block rounded bg-emerald-600 px-1.5 py-0.5 align-baseline text-[11px] font-bold leading-tight text-white">{newBadge}</span>}
            {translatedName}
          </h3>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-1.5 bg-white px-3 pb-3 pt-1 sm:px-3.5 sm:pb-3.5">
        <div className="min-w-0">
          <div className="min-w-0">
            {hasActiveDiscount && strikeThroughPrice !== undefined ? (
              <>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-rose-600">{isSeller && sellerPrice !== null && sellerPrice !== undefined && sellerPrice > 0 && sellerPrice < price ? (locale === 'zh' ? '卖家价' : locale === 'ms' ? 'Harga Penjual' : 'Seller Price') : (locale === 'zh' ? '折扣价' : locale === 'ms' ? 'Diskaun' : 'Discount')}</p>
                <p className="truncate text-[10px] font-medium leading-tight text-zinc-400 line-through">RM {strikeThroughPrice.toFixed(2)}</p>
                <p className="truncate text-[17px] font-black leading-tight tracking-tight text-rose-600 sm:text-lg">RM {minPrice.toFixed(2)}</p>
              </>
            ) : (
              <>
                {isSeller && sellerPrice !== null && sellerPrice !== undefined && sellerPrice > 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{locale === 'zh' ? '卖家价' : locale === 'ms' ? 'Harga Penjual' : 'Seller Price'}</p>
                )}
                <p className="truncate text-[15px] font-extrabold tracking-tight text-zinc-900 sm:text-base">RM {minPrice.toFixed(2)}</p>
              </>
            )}
          </div>
        </div>

        {quantity === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="inline-flex h-8 min-w-14 shrink-0 items-center justify-center rounded-full bg-zinc-900 px-4 text-white shadow-sm transition-all hover:bg-zinc-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-16"
            aria-label={`${locale === 'zh' ? '添加' : locale === 'ms' ? 'Tambah' : 'Add'} ${translatedName} to cart`}
            title={locale === 'zh' ? '加入购物车' : locale === 'ms' ? 'Tambah ke troli' : 'Add to cart'}
          >
            <ShoppingCart size={16} strokeWidth={2.2} className="sm:h-[17px] sm:w-[17px]" />
          </button>
        ) : (
          <div className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-zinc-300 bg-zinc-50 p-1 sm:h-10 sm:gap-1.5" aria-label={`${quantity} in cart`}>
            <button
              type="button"
              onClick={handleMinus}
              aria-label={`Remove one ${translatedName}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-200 active:scale-90 sm:h-8 sm:w-8"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="min-w-[18px] text-center text-xs font-bold tabular-nums text-zinc-900 sm:min-w-[20px]">{quantity}</span>
            <button
              type="button"
              onClick={handleAdd}
              disabled={quantity >= stock}
              aria-label={`Add one ${translatedName}`}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
      {isOpeningDetails && <div className="absolute inset-0 z-40 flex items-center justify-center gap-2 rounded-2xl bg-white/85 text-sm font-semibold text-zinc-800 backdrop-blur-[2px]" role="status"><Loader2 size={18} className="animate-spin text-[#d52b20]" />{locale === 'zh' ? '正在打开商品…' : locale === 'ms' ? 'Membuka produk…' : 'Opening item…'}</div>}
    </article>
    </>
  );
}
