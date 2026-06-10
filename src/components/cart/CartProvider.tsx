import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  cartItemId: string;
  variant?: 'Single' | 'Box';
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
  updateVariant: (id: string, variant: 'Single' | 'Box', newPrice?: number, newOriginalPrice?: number) => void;
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
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('user-updated', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('user-updated', checkUser);
    };
  }, []);

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

  const updateVariant = (cartItemId: string, variant: 'Single' | 'Box', newPrice?: number, newOriginalPrice?: number) => {
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

  let discountPercent = 0;
  let isFreeShipping = false;
  if (user?.role === 'Seller' && user?.sellerLevel) {
    discountPercent = user.sellerLevel.discountPercent || 0;
    isFreeShipping = user.sellerLevel.freeShipping || false;
  }

  const totalDiscount = baseTotalPrice * (discountPercent / 100);
  const totalPrice = baseTotalPrice - totalDiscount;

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
