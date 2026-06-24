import React, { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { InlineCheckoutDetails } from '../components/checkout/InlineCheckoutDetails';
import { OrderComplete } from '../components/checkout/OrderComplete';
import { useTranslation } from '../hooks/useTranslation';

export default function CheckoutPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const fetchProduct = async () => {
      const buyId = router.query.buy as string;
      const qtyStr = router.query.qty as string;
      
      if (!buyId) {
        router.replace('/shop');
        return;
      }
      
      const qty = parseInt(qtyStr, 10) || 1;
      setQuantity(qty);

      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const products = await res.json();
          const found = products.find((p: any) => p.id === buyId);
          if (found) {
            setProduct(found);
          } else {
            router.replace('/shop');
          }
        }
      } catch (err) {
        console.error('Failed to fetch product for checkout:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [router.isReady, router.query]);

  const checkoutData = useMemo(() => {
    if (!product) return null;

    const isSeller = typeof window !== 'undefined' && (
      localStorage.getItem('user_role') === 'Seller' || 
      JSON.parse(localStorage.getItem('user') || '{}').role === 'Seller'
    );

    let activePrice = product.price;
    let strikeThroughPrice: number | undefined = undefined;

    if (isSeller) {
      if (product.sellerPrice && product.sellerPrice > 0) {
        activePrice = product.sellerPrice;
        if (product.sellerPrice < product.price) strikeThroughPrice = product.price;
      } else if (product.promotion !== null && product.promotion !== undefined && product.promotion < product.price) {
        activePrice = product.promotion;
        strikeThroughPrice = product.price;
      }
    } else {
      if (product.promotion !== null && product.promotion !== undefined && product.promotion < product.price) {
        activePrice = product.promotion;
        strikeThroughPrice = product.price;
      }
    }

    let computedDiscountPercent = 0;
    let computedIsFreeShipping = false;
    let computedSellerLevelName = '';

    if (typeof window !== 'undefined') {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      if (userObj?.role === 'Seller' && userObj?.sellerLevel) {
        computedDiscountPercent = userObj.sellerLevel.discountPercent || 0;
        computedIsFreeShipping = userObj.sellerLevel.freeShipping || false;
        computedSellerLevelName = userObj.sellerLevel.name || '';
      }
    }

    const baseTotalPrice = activePrice * quantity;
    const computedTotalOriginalPrice = (strikeThroughPrice || activePrice) * quantity;
    const computedTotalDiscount = baseTotalPrice * (computedDiscountPercent / 100);
    const computedFinalTotalPrice = baseTotalPrice - computedTotalDiscount;

    let singleTranslatedName = (locale === 'zh' && product.nameZh) ? product.nameZh : (locale === 'ms' && product.nameMs) ? product.nameMs : null;
    singleTranslatedName = singleTranslatedName || (t.products as any)?.[product.id]?.name || product.name;

    const cartItems = [{
      id: product.id,
      productId: product.id,
      name: singleTranslatedName,
      price: activePrice,
      originalPrice: strikeThroughPrice || activePrice,
      quantity,
      image: product.images?.[0],
      variant: null,
      itemsPerBox: null
    }];

    const cartTotals = {
      totalPrice: computedFinalTotalPrice,
      totalOriginalPrice: computedTotalOriginalPrice,
      totalDiscount: computedTotalDiscount,
      discountPercent: computedDiscountPercent,
      sellerLevelName: computedSellerLevelName,
      isFreeShipping: computedIsFreeShipping
    };

    return { cartItems, cartTotals };
  }, [product, quantity, locale, t.products]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
      <div className="pt-32 pb-16 px-4 max-w-6xl mx-auto flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!product || !checkoutData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{t.nav?.checkout || 'Checkout'} - Cheng-BOOM</title>
      </Head>

      <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto min-h-[calc(100vh-80px)]">
        {isSuccess ? (
          <OrderComplete />
        ) : (
          <InlineCheckoutDetails
            cartItems={checkoutData.cartItems}
            cartTotals={checkoutData.cartTotals}
            clearCart={() => {}} // Not applicable for single buy
            onBack={() => router.back()}
            onSuccess={() => {
              setIsSuccess(true);
            }}
            onStockError={(productName) => {
              alert(locale === 'zh' ? `库存不足: ${productName}` : locale === 'ms' ? `Stok tidak mencukupi untuk ${productName}` : `Insufficient stock for ${productName}`);
            }}
          />
        )}
      </main>
    </div>
  );
}
