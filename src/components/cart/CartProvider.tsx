import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  cartItemId: string;
  variant?: 'Single' | 'Box' | 'Bundle';
  code?: string | null;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  quantity: number;
  stock?: number;
  itemsPerBox?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number, maxStockOverride?: number) => void;
  updateVariant: (id: string, variant: 'Single' | 'Box' | 'Bundle', newPrice?: number, newOriginalPrice?: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalDiscount: number;
  discountPercent: number;
  isFreeShipping: boolean;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = () => {
      try { setUser(JSON.parse(localStorage.getItem('user') || 'null')); }
      catch { setUser(null); }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('user-updated', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('user-updated', checkUser);
    };
  }, []);

  const pricingGroup = user?.role === 'Seller' && user?.sellerPricing === 'B' ? 'B' : 'A';
  const cartProductIds = [...new Set(items.map((item) => item.id))].sort().join('|');

  useEffect(() => {
    if (!isMounted || !cartProductIds) return;
    let cancelled = false;
    const refreshCartPrices = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) return;
        const products = await response.json();
        if (cancelled) return;
        const byId = new Map(products.map((product: any) => [product.id, product]));
        setItems((current) => current.map((item) => {
          const product: any = byId.get(item.id);
          if (!product) return item;
          const group = pricingGroup;
          const price = item.variant === 'Box'
            ? (group === 'B' ? product.sellerBBoxPrice : product.sellerABoxPrice) ?? product.boxPrice
            : item.variant === 'Bundle'
              ? (group === 'B' ? product.sellerBBundlePrice : product.sellerABundlePrice) ?? product.bundlePrice
              : (group === 'B' ? product.sellerBPrice : product.sellerAPrice) ?? product.price;
          if (price == null) return item;
          const basePrice = item.variant === 'Box'
            ? product.sellerABoxPrice ?? product.boxPrice
            : item.variant === 'Bundle'
              ? product.sellerABundlePrice ?? product.bundlePrice
              : product.sellerAPrice ?? product.price;
          const originalPrice = group === 'B' && basePrice > price ? basePrice : undefined;
          if (item.price === price && item.originalPrice === originalPrice) return item;
          return { ...item, price, originalPrice };
        }));
      } catch (error) {
        console.error('Failed to refresh cart pricing:', error);
      }
    };
    void refreshCartPrices();
    return () => { cancelled = true; };
  }, [cartProductIds, isMounted, pricingGroup]);

  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem('fireworks_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('fireworks_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.cartItemId === newItem.cartItemId);
      const maxStock = newItem.stock !== undefined ? newItem.stock : Infinity;
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === newItem.cartItemId
            ? { ...item, quantity: Math.min(item.quantity + quantity, maxStock) }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: Math.min(quantity, maxStock) }];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number, maxStockOverride?: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const limit = maxStockOverride !== undefined 
            ? maxStockOverride 
            : (item.stock !== undefined ? item.stock : Infinity);
          return { ...item, quantity: Math.min(quantity, limit) };
        }
        return item;
      })
    );
  };

  const updateVariant = (cartItemId: string, variant: 'Single' | 'Box' | 'Bundle', newPrice?: number, newOriginalPrice?: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const updatedItem = { ...item, variant };
          if (newPrice !== undefined) updatedItem.price = newPrice;
          if (newOriginalPrice !== undefined) updatedItem.originalPrice = newOriginalPrice;
          return updatedItem;
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalOriginalPrice = items.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const baseTotalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Seller A/B prices are the final unit prices. Do not apply legacy tier
  // discounts again on top of the assigned seller price.
  const discountPercent = 0;
  const isFreeShipping = false;
  const totalDiscount = 0;
  const totalPrice = baseTotalPrice;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updateVariant, clearCart, totalItems, totalPrice, totalOriginalPrice, totalDiscount, discountPercent, isFreeShipping }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
