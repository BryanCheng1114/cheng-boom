import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../cart/CartProvider';
import { ShoppingCart, Plus, Minus, AlertTriangle, Package } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  stock?: number;
}

export function ProductCard({ id, name, price, originalPrice, image, category, stock = 0 }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { t } = useTranslation();

  const cartItem = items.find((item) => item.id === id);
  const quantity = cartItem?.quantity || 0;

  const isOutOfStock = stock <= 0;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice! - price) / originalPrice!) * 100) 
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity < stock) {
      addItem({ id, name: translatedName, price, originalPrice, image });
    }
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity > 0) {
      updateQuantity(id, quantity - 1);
    }
  };

  // @ts-ignore
  const translatedName = (t.products as any)?.[id]?.name || name;
  // @ts-ignore
  const translatedCategory = t.shopCategories[category] || category;

  return (
    <Link href={`/shop/${id}`} className="group block h-full">
      <div className={`h-full flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] hover:-translate-y-1 ${isOutOfStock ? 'opacity-75' : 'hover:border-primary/50'}`}>
        
        {/* Image Container */}
        <div className="relative h-64 w-full overflow-hidden bg-muted shrink-0">
          <div
            className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out ${!isOutOfStock && 'group-hover:scale-110'}`}
            style={{ backgroundImage: `url(${image})` }}
          />
          
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-foreground uppercase tracking-widest shadow-sm border border-border/50 w-fit">
              {translatedCategory}
            </div>
            
            {isOutOfStock ? (
              <div className="bg-red-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1 animate-pulse">
                <AlertTriangle size={10} /> Out of Stock
              </div>
            ) : hasDiscount ? (
              <div className="bg-primary text-zinc-900 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1">
                🔥 SAVE {discountPercent}%
              </div>
            ) : null}
          </div>

          {/* Stock count badge */}
          {!isOutOfStock && (
            <div className="absolute bottom-3 right-3 bg-zinc-900/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-medium text-white/90 flex items-center gap-1.5 border border-white/10">
              <Package size={10} />
              {stock} units left
            </div>
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {translatedName}
            </h3>
          </div>
          
          <div className="mt-auto pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                    RM {originalPrice?.toFixed(2)}
                  </span>
                )}
                <span className="text-xl font-black text-foreground tracking-tight">
                  RM {price.toFixed(2)}
                </span>
              </div>
              
              <div className={`flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-full p-1 border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-sm shadow-inner ${isOutOfStock && 'opacity-50 grayscale'}`}>
                {quantity > 0 ? (
                  <button
                    onClick={handleMinus}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-600 shadow-sm transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                    <ShoppingCart size={15} />
                  </div>
                )}
                
                <span className="w-7 text-center font-bold text-sm text-foreground">
                  {quantity}
                </span>

                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock || quantity >= stock}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95 ${isOutOfStock || quantity >= stock 
                    ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                    : 'bg-primary text-zinc-900 hover:brightness-110 shadow-[0_0_12px_rgba(245,158,11,0.5)]'}`}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
