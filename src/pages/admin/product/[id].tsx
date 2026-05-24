import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Image as ImageIcon, 
  Package, 
  Tag, 
  Clock, 
  CheckCircle,
  Video as VideoIcon,
  DollarSign,
  Info
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';

const AdminProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          alert('Product not found');
          router.push('/admin/product');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/admin/product');
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Loading...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] animate-pulse">Fetching Product Details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!product) return null;

  const hasPromotion = product.promotion !== null && product.promotion !== undefined && product.promotion < product.price;
  const activePrice = hasPromotion ? product.promotion : product.price;
  const videoId = product.videoUrl?.split('v=')[1]?.split('&')[0] || product.videoUrl?.split('youtu.be/')[1];
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  return (
    <AdminLayout title={product.name}>
      <div className="max-w-7xl mx-auto pb-20">

        {/* Top Bar: Back + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <Link
            href="/admin/product"
            className="group flex items-center gap-3 text-zinc-500 hover:dark:text-white hover:text-zinc-800 transition-colors"
          >
            <div className="p-2.5 bg-zinc-500/10 rounded-xl group-hover:bg-zinc-500/20 transition-all">
              <ChevronLeft size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Inventory</span>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/shop/${product.id}`}
              target="_blank"
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
            >
              <ExternalLink size={14} /> View Live Store
            </Link>
            <Link
              href={`/admin/product/edit/${product.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-500/10 border border-zinc-500/20 text-zinc-600 dark:text-zinc-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-500/20 transition-all"
            >
              <Edit size={14} /> Edit Product
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Main: Image Left | Info Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-stretch">

          {/* LEFT — Image Gallery */}
          <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-0 rounded-[40px] overflow-hidden dark:bg-zinc-900/40 bg-zinc-100 border dark:border-white/5 border-zinc-200 relative group shadow-2xl">
              {product.images && product.images[activeImageIdx] ? (
                <img
                  src={product.images[activeImageIdx]}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <ImageIcon size={64} />
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIdx === i
                        ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 scale-105'
                        : 'border-transparent opacity-40 hover:opacity-80'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Identity + Stats + Pricing */}
          <div className="flex flex-col gap-5">

            {/* Identity Card */}
            <div className="dark:bg-zinc-900/40 bg-zinc-50 p-8 rounded-[32px] border dark:border-white/5 border-zinc-200 shadow-xl relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 opacity-[0.04]">
                <Package size={140} className="dark:text-white text-zinc-900" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-lg text-[9px] font-black tracking-widest uppercase border border-yellow-500/20">
                    {product.category}
                  </span>
                  {product.code && (
                    <span className="px-3 py-1 bg-zinc-500/10 text-zinc-500 rounded-lg text-[9px] font-black tracking-widest uppercase border border-zinc-500/20">
                      {product.code}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900 leading-tight">
                  {product.name}
                </h1>
              </div>
            </div>

            {/* Stock & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div className="dark:bg-zinc-900/40 bg-zinc-50 p-6 rounded-[24px] border dark:border-white/5 border-zinc-200">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Package size={11} className="text-blue-500" /> Stock Level
                </p>
                <p className="text-3xl font-black italic dark:text-white text-zinc-900">
                  {product.stock}
                  <span className="text-xs not-italic font-bold text-zinc-500 uppercase ml-1.5">units</span>
                </p>
              </div>
              <div className="dark:bg-zinc-900/40 bg-zinc-50 p-6 rounded-[24px] border dark:border-white/5 border-zinc-200">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-green-500" /> Visibility
                </p>
                <p className={`text-3xl font-black italic ${
                  product.status === 'Live' ? 'text-green-500' :
                  product.status === 'Hold' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {product.status}
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="dark:bg-zinc-900/40 bg-zinc-50 p-8 rounded-[32px] border dark:border-white/5 border-zinc-200 shadow-xl">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                <DollarSign size={11} className="text-yellow-500" /> Pricing Structure
              </p>
              <div className="mb-5 pb-5 border-b dark:border-white/5 border-zinc-200 flex items-end justify-between">
                <div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mb-1">Active Price</p>
                  <h2 className="text-5xl font-black italic text-yellow-500 tracking-tighter">RM {activePrice.toFixed(2)}</h2>
                </div>
                {hasPromotion && (
                  <div className="text-right">
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">You Save</p>
                    <span className="text-xl font-black text-green-500">- RM {(product.price - product.promotion).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">Base Price</span>
                  <span className={hasPromotion ? 'line-through text-zinc-400 dark:text-zinc-600' : 'dark:text-zinc-300 text-zinc-700'}>RM {product.price.toFixed(2)}</span>
                </div>
                {product.sellerPrice !== null && product.sellerPrice !== undefined && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Seller Price</span>
                    <span className="text-blue-500">RM {product.sellerPrice.toFixed(2)}</span>
                  </div>
                )}
                {hasPromotion && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Promo Price</span>
                    <span className="text-yellow-500">RM {product.promotion.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Description + Video */}
        <div className="space-y-6">
          <div className="dark:bg-zinc-900/40 bg-zinc-50 p-10 rounded-[40px] border dark:border-white/5 border-zinc-200 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl"><Info size={16} /></div>
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Description</h4>
            </div>
            <p className="dark:text-zinc-400 text-zinc-600 font-medium leading-relaxed text-sm">
              {product.description}
            </p>
            <div className="mt-8 pt-6 border-t dark:border-white/5 border-zinc-200 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">
              <Clock size={12} />
              <span>Last Updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {embedUrl && (
            <div className="dark:bg-zinc-900/40 bg-zinc-50 rounded-[40px] overflow-hidden border dark:border-white/5 border-zinc-200 shadow-xl">
              <div className="px-10 py-6 border-b dark:border-white/5 border-zinc-200 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-xl"><VideoIcon size={16} /></div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Demonstration</h3>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title="Product Demo"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminProductDetail;
