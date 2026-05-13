import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../cart/CartProvider';
import { ShoppingCart, Plus, Minus, AlertTriangle, Package } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useFlyToCart } from './FlyToCartProvider';
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
}

export function ProductCard({ id, code, name, nameZh, nameMs, price, promotion, sellerPrice, images = [], category, categoryZh, categoryMs, stock = 0 }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { flyToCart } = useFlyToCart();
  const { t, locale } = useTranslation();
  const imageRef = useRef<HTMLDivElement>(null);

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
  
  const discountPercent = hasDiscount 
    ? Math.round(((price - activePrice) / price) * 100) 
    : 0;

  const displayImage = images[0] || '';

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity < stock) {
      addItem({ id, code, name: translatedName, price: activePrice, originalPrice: strikeThroughPrice, image: displayImage, stock });
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
    <Link href={`/shop/${id}`} className="group block h-full">
      <div className={`h-full flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] hover:-translate-y-1 ${isOutOfStock ? 'opacity-75' : 'hover:border-primary/50'}`}>
        
        {/* Image Container */}
        <div ref={imageRef} className="relative h-56 w-full overflow-hidden bg-muted shrink-0">
          <div
            className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out ${!isOutOfStock && 'group-hover:scale-110'}`}
            style={{ backgroundImage: `url(${displayImage})` }}
          />
          
          {/* Top Right: Discount */}
          {hasDiscount && !isOutOfStock && (
            <div className="absolute top-3 right-3">
              <div className="bg-primary text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-1 animate-bounce-subtle">
                🔥 {t.productCard.save} {discountPercent}%
              </div>
            </div>
          )}

          {/* Bottom Right: Stock Status & Watermark Stack */}
          <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2 z-20">
            {/* Dynamic Small Watermark */}
            <div className="pointer-events-none w-12 h-12 opacity-80 mr-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
              <img 
                src="/transparent-Background.png" 
                className="w-full h-full object-contain select-none" 
                alt="" 
                draggable={false}
              />
            </div>
            {isOutOfStock ? (
              <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter shadow-lg flex items-center gap-1.5 border border-red-500/50">
                <AlertTriangle size={12} className="animate-pulse" />
                {t.productCard.outOfStock}
              </div>
            ) : (
              <div className="bg-zinc-900/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-2 border border-white/10 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {stock} {t.productCard.inStock}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {translatedName}
            </h3>
          </div>
          
          <div className="mt-auto pt-3 border-t border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2">
              <div className="flex flex-col min-w-0">
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                    RM {strikeThroughPrice?.toFixed(2)}
                  </span>
                )}
                <span className="text-lg font-black text-foreground tracking-tighter break-words">
                  RM {activePrice.toFixed(2)}
                </span>
              </div>
              
              <div className={`flex shrink-0 items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-full p-0.5 border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-sm shadow-inner ${isOutOfStock && 'opacity-50 grayscale'}`}>
                {quantity > 0 ? (
                  <button
                    onClick={handleMinus}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-600 shadow-sm transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                ) : (
                  <div className="w-7 h-7 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                    <ShoppingCart size={13} />
                  </div>
                )}
                
                <span className="w-6 text-center font-bold text-xs text-foreground">
                  {quantity}
                </span>

                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock || quantity >= stock}
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-all active:scale-95 ${isOutOfStock || quantity >= stock 
                    ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                    : 'bg-primary text-zinc-900 hover:brightness-110 shadow-[0_0_12px_rgba(245,158,11,0.5)]'}`}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
