import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlyingItem {
  id: number;
  imageUrl: string;
  sourceRect: DOMRect;
  targetRect: DOMRect;
}

interface FlyToCartContextType {
  flyToCart: (imageUrl: string, sourceElement: HTMLElement) => void;
  registerCelebrationTrigger: (callback: () => void) => void;
}

const FlyToCartContext = createContext<FlyToCartContextType | undefined>(undefined);

export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [trigger, setTrigger] = useState<(() => void) | null>(null);

  const registerCelebrationTrigger = useCallback((callback: () => void) => {
    setTrigger(() => callback);
  }, []);

  const flyToCart = useCallback((imageUrl: string, sourceElement: HTMLElement) => {
    const targetElement = document.getElementById('navbar-cart-btn');
    if (!targetElement) return;

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const newItem: FlyingItem = {
      id: Date.now(),
      imageUrl,
      sourceRect,
      targetRect,
    };

    setFlyingItems((prev) => [...prev, newItem]);

    // Remove item after animation and trigger celebration
    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== newItem.id));
      if (trigger) trigger();
    }, 800); // Sync with animation duration
  }, [trigger]);

  return (
    <FlyToCartContext.Provider value={{ flyToCart, registerCelebrationTrigger }}>
      {children}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <AnimatePresence>
          {flyingItems.map((item) => (
            <motion.img
              key={item.id}
              src={item.imageUrl}
              initial={{
                position: 'fixed',
                top: item.sourceRect.top,
                left: item.sourceRect.left,
                width: item.sourceRect.width,
                height: item.sourceRect.height,
                opacity: 0.8,
                borderRadius: '1rem',
                zIndex: 100,
              }}
              animate={{
                top: item.targetRect.top + 10,
                left: item.targetRect.left + 10,
                width: 20,
                height: 20,
                opacity: 0,
                scale: 0.5,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1], // Custom cubic bezier for a "swoosh" effect
              }}
              className="object-cover"
            />
          ))}
        </AnimatePresence>
      </div>
    </FlyToCartContext.Provider>
  );
}

export function useFlyToCart() {
  const context = useContext(FlyToCartContext);
  if (!context) {
    throw new Error('useFlyToCart must be used within a FlyToCartProvider');
  }
  return context;
}
