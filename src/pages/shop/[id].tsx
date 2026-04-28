import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { getProductById, getProducts } from '../../utils/mockData';
import { useCart } from '../../components/cart/CartProvider';
import { ArrowLeft, ShoppingCart, Plus, Minus, CheckCircle, Play, Info, Video, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from '../../hooks/useTranslation';
import { useFlyToCart } from '../../components/ui/FlyToCartProvider';
import { useRef } from 'react';

export default function ProductDetail({ product }: { product: ReturnType<typeof getProductById> }) {
  const router = useRouter();
  const { items, addItem, updateQuantity } = useCart();
  const { flyToCart } = useFlyToCart();
  const { t } = useTranslation();
  const [localQty, setLocalQty] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Handle fallback state for static generation
  if (router.isFallback) {
    return <div className="min-h-screen flex items-center justify-center">{t.productDetail.loading}</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">{t.productDetail.notFound}</h1>
        <Link href="/shop" className="text-primary hover:underline">{t.shop.returnToShop}</Link>
      </div>
    );
  }

  const cartItem = items.find(item => item.id === product.id);
  const stock = (product as any).stock || 0;
  const originalPrice = (product as any).originalPrice;
  const hasDiscount = originalPrice && originalPrice > product.price;
  const savings = hasDiscount ? (originalPrice - product.price) : 0;

  const handleAddToCart = () => {
    if (localQty > 0) {
      if (imageRef.current) {
        flyToCart(product.image, imageRef.current);
      }
      // Logic to add specific amount
      for(let i = 0; i < localQty; i++) {
        addItem({ 
          id: product.id, 
          name: translatedName, 
          price: product.price, 
          originalPrice: (product as any).originalPrice, 
          image: product.image 
        });
      }
      setLocalQty(0);
    }
  };

  const increment = () => {
    if (localQty < stock) setLocalQty(prev => prev + 1);
  };
  
  const decrement = () => {
    if (localQty > 0) setLocalQty(prev => prev - 1);
  };

  // @ts-ignore
  const translatedName     = (t.products as any)?.[product.id]?.name || product.name;
  // @ts-ignore
  const translatedDesc     = (t.products as any)?.[product.id]?.desc || product.description;
  // @ts-ignore
  const translatedCategory = t.shopCategories[product.category] || product.category;

  // YouTube Embed Logic
  const youtubeUrl = "https://www.youtube.com/watch?v=CWYKpwlVGso";
  const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <>
      <Head>
        <title>{`${translatedName} - Cheng-BOOM`}</title>
      </Head>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Breadcrumb */}
        <Link href="/shop" className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-10 group text-sm font-medium">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          {t.productDetail.backToCollection}
        </Link>
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20 items-start">
          
          {/* LEFT: Image Section */}
          <div className="w-full">
            <div 
              ref={imageRef}
              onClick={() => setIsViewerOpen(true)}
              className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 bg-zinc-100 dark:bg-zinc-900 border border-border/50 cursor-zoom-in group relative"
            >
              <img
                src={product.image}
                alt={translatedName}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onContextMenu={(e) => e.preventDefault()}
                draggable="false"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                  <Maximize2 size={32} />
                </div>
              </div>
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-primary text-zinc-900 px-3 py-1.5 rounded-xl font-black text-xs shadow-xl animate-bounce z-20">
                  {t.productDetail.sale}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Info Section */}
          <div className="w-full flex flex-col justify-start">
            <div className="flex flex-col justify-start mb-8">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black tracking-widest uppercase mb-4 w-fit border border-primary/20">
                {translatedCategory}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                {translatedName}
              </h1>
            </div>

            {/* Pricing Card */}
            <div className="bg-zinc-50 dark:bg-white/5 rounded-2xl p-6 border border-border/50 mb-8">
              <div className="flex flex-wrap items-end gap-3 mb-2">
                {hasDiscount && (
                  <span className="text-lg text-zinc-400 line-through decoration-red-500/50 mb-0.5">
                    RM {originalPrice?.toFixed(2)}
                  </span>
                )}
                <span className="text-3xl font-black text-foreground tracking-tighter">
                  RM {product.price.toFixed(2)}
                </span>
                
                {hasDiscount && (
                  <span className="text-xs font-bold text-green-500 mb-1 ml-1 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    {t.productDetail.save} RM {savings.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {/* Quantity Control */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.productDetail.selectQuantity}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-zinc-200 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-300 dark:border-zinc-700">
                      <button 
                        onClick={decrement}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all text-zinc-600 dark:text-zinc-300 disabled:opacity-30"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-black text-lg">{localQty}</span>
                      <button 
                        onClick={increment}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-zinc-900 hover:brightness-110 transition-all shadow-md"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={localQty === 0}
                  className="w-full py-4 bg-primary text-zinc-900 rounded-xl font-black text-lg hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:shadow-none active:scale-[0.98]"
                >
                  <ShoppingCart size={20} strokeWidth={3} /> 
                  {t.productDetail.addToCart}
                </button>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 text-zinc-500">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-xs font-medium">{stock} {t.productDetail.inStockSuffix}</span>
            </div>
          </div>
        </div>

        {/* ── SECTIONS ─────────────────────────────────────────────────── */}
        
        <div className="space-y-12">
          
          {/* 1. Description Section */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl p-8 md:p-10 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-8 border-l-4 border-primary pl-4">
              <h2 className="text-2xl font-black tracking-tight uppercase">{t.productDetail.description}</h2>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t.productDetail.productDetails}</h4>
                <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                  <p>{t.productDetail.code}: {product.id.toUpperCase()}</p>
                  <p>{t.productDetail.name}: {translatedName}</p>
                  <p>{t.productDetail.type}: {translatedCategory}</p>
                  <p>{t.productDetail.quantity}: 1 {t.productDetail.perPack}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t.productDetail.productDescription}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                  {translatedDesc} / {t.productDetail.qualityNote}
                </p>
              </div>
            </div>
          </section>

          {/* 2. Video Demonstration Section */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl p-8 md:p-10 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-8 border-l-4 border-primary pl-4">
              <h2 className="text-2xl font-black tracking-tight uppercase">{t.productDetail.videoDemo}</h2>
            </div>
            
            <div className="w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border aspect-video bg-black shadow-primary/5">
                <iframe 
                  className="w-full h-full"
                  src={embedUrl}
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </section>

        </div>
      </div>
      <AnimatePresence>
        {isViewerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
            onClick={() => setIsViewerOpen(false)}
          >
            {/* Close Button */}
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
              onClick={() => setIsViewerOpen(false)}
            >
              <X size={40} />
            </button>

            {/* Viewer Content */}
            <div 
              className="relative max-w-5xl w-full h-full flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full h-full flex items-center justify-center p-8"
              >
                {/* Download Protection Layers */}
                <div 
                  className="absolute inset-0 z-10" 
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
                
                <img 
                  src={product.image} 
                  alt={translatedName}
                  className="max-w-full max-h-full object-contain shadow-2xl pointer-events-none select-none"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
              </motion.div>
            </div>

            {/* Hint */}
            <p className="text-white/40 text-sm mt-4 font-medium select-none">
              {t.productDetail.protectedHint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Next.js standard static generation functions for dynamic routes
export async function getStaticPaths() {
  const products = getProducts();
  const paths = products.map((p) => ({
    params: { id: p.id },
  }));

  return { paths, fallback: true };
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);
  
  if (!product) {
    return { notFound: true };
  }
  
  return {
    props: { product },
    revalidate: 60, // revalidate every 60 seconds
  };
}
