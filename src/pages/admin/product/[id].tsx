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
    <AdminLayout title={`Detail: ${product.name}`}>
      <div className="max-w-7xl mx-auto pb-20">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <Link 
            href="/admin/product" 
            className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-colors"
          >
            <div className="p-3 bg-zinc-500/10 rounded-2xl group-hover:bg-zinc-500/20 transition-all">
              <ChevronLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Inventory</span>
          </Link>

          <div className="flex gap-4 w-full md:w-auto">
            <Link 
              href={`/admin/product/edit/${product.id}`}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              <Edit size={16} /> Edit Product
            </Link>
            <button 
              onClick={handleDelete}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Visuals */}
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-square rounded-[48px] overflow-hidden dark:bg-zinc-900/40 bg-zinc-50 border dark:border-white/5 border-zinc-200 relative group">
              {product.images && product.images[activeImageIdx] ? (
                <img src={product.images[activeImageIdx]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500"><ImageIcon size={64} /></div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {product.images.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImageIdx(i)}
                    className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIdx === i ? 'border-yellow-500 scale-105 shadow-xl shadow-yellow-500/20' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {embedUrl && (
              <div className="dark:bg-zinc-900/40 bg-zinc-50 rounded-[48px] overflow-hidden border dark:border-white/5 border-zinc-200">
                <div className="p-8 border-b dark:border-white/5 border-zinc-200 flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl"><VideoIcon size={20} /></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Demonstration</h3>
                </div>
                <div className="aspect-video">
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

          {/* RIGHT COLUMN: Data */}
          <div className="lg:col-span-5 space-y-8">
            {/* Identity Card */}
            <div className="dark:bg-zinc-900/40 bg-zinc-50 p-10 rounded-[48px] border dark:border-white/5 border-zinc-200 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Package size={120} className="dark:text-white text-zinc-900" />
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-[9px] font-black tracking-widest uppercase mb-6 border border-yellow-500/20">
                  {product.category}
                </div>
                <h1 className="text-5xl font-black italic uppercase tracking-tight mb-4 dark:text-white text-zinc-900 leading-tight">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  {product.code && (
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-[9px] font-black tracking-widest uppercase border border-yellow-500/20">
                      Code: {product.code}
                    </span>
                  )}
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} /> ID: {product.id.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="dark:bg-zinc-900/40 bg-zinc-50 p-8 rounded-[32px] border dark:border-white/5 border-zinc-200">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Package size={12} className="text-blue-500" /> Stock Level
                </p>
                <h4 className="text-2xl font-black italic dark:text-white text-zinc-900">
                  {product.stock} <span className="text-sm not-italic font-bold text-zinc-500 uppercase ml-1">Units</span>
                </h4>
              </div>
              <div className="dark:bg-zinc-900/40 bg-zinc-50 p-8 rounded-[32px] border dark:border-white/5 border-zinc-200">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-500" /> Visibility
                </p>
                <h4 className="text-2xl font-black italic text-green-500">
                  {product.status}
                </h4>
              </div>
            </div>

            {/* Pricing Analytics */}
            <div className="dark:bg-zinc-900/40 bg-zinc-50 p-8 rounded-[40px] border dark:border-white/5 border-zinc-200">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <DollarSign size={12} className="text-yellow-500" /> Pricing Structure
              </p>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end pb-6 border-b dark:border-white/5 border-zinc-200">
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Current Active Price</p>
                    <h2 className="text-4xl font-black italic text-yellow-500 tracking-tighter">RM {activePrice.toFixed(2)}</h2>
                  </div>
                  {hasPromotion && (
                    <div className="text-right">
                      <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">Savings</p>
                      <span className="text-lg font-bold text-green-500">- RM {(product.price - product.promotion).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">Base Listing Price</span>
                  <span className={hasPromotion ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'dark:text-zinc-300 text-zinc-700'}>RM {product.price.toFixed(2)}</span>
                </div>
                {hasPromotion && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Promotional Sale Price</span>
                    <span className="text-yellow-500">RM {product.promotion.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Information */}
            <div className="dark:bg-zinc-900/40 bg-zinc-50 p-10 rounded-[48px] border dark:border-white/5 border-zinc-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Info size={16} /></div>
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Description</h4>
              </div>
              <p className="dark:text-zinc-400 text-zinc-600 font-medium leading-relaxed">
                {product.description}
              </p>
              
              <div className="mt-8 pt-8 border-t dark:border-white/5 border-zinc-200 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <Clock size={14} />
                <span>Last Updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <Link 
              href={`/shop/${product.id}`}
              target="_blank"
              className="flex items-center justify-center gap-4 w-full py-6 dark:bg-zinc-500/5 bg-zinc-100 hover:brightness-95 border dark:border-white/5 border-zinc-200 rounded-[32px] text-[10px] font-black uppercase tracking-widest transition-all dark:text-white text-zinc-600"
            >
              <ExternalLink size={18} /> View in Live Store
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductDetail;
