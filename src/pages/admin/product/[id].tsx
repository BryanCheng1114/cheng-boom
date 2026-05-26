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
  Info,
  X,
  ZoomIn
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';

const AdminProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { language, t } = useLanguage();

  const getTranslatedText = (en: string, zh?: string, ms?: string) => {
    if (language === 'zh' && zh) return zh;
    if (language === 'ms' && ms) return ms;
    return en;
  };

  const getTranslatedCategory = (categoryId: string) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId || c.name === categoryId);
    if (!category) return categoryId;
    return getTranslatedText(category.name, category.nameZh, category.nameMs);
  };

  const getTranslatedStatus = (status: string) => {
    if (status === 'Live') return t('live_products');
    if (status === 'Hold') return t('hold');
    if (status === 'Deactive') return t('deactive');
    return status || '-';
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch('/api/categories')
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProduct(prodData);
        } else {
          alert(t('product_not_found'));
          router.push('/admin/product');
          return;
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/admin/product');
      } else {
        alert(t('failed_delete_product'));
      }
    } catch (error) {
      console.error(error);
      alert(t('failed_delete_product'));
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title={t('loading')}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] animate-pulse">{t('fetching_product_details')}</p>
        </div>
      </AdminLayout>
    );
  }

  if (!product) return null;

  const hasPromotion = product.promotion !== null && product.promotion !== undefined && product.promotion < product.price;
  const activePrice = hasPromotion ? product.promotion : product.price;
  const videoId = product.videoUrl?.split('v=')[1]?.split('&')[0] || product.videoUrl?.split('youtu.be/')[1];
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  // Localized Product Name
  const localizedName = language === 'zh' && product.nameZh ? product.nameZh : language === 'ms' && product.nameMs ? product.nameMs : product.name;

  // Localized Category Name
  const activeCategoryObj = categories.find(c => c.name === product.category);
  const localizedCategory = language === 'zh' && activeCategoryObj?.nameZh ? activeCategoryObj.nameZh : language === 'ms' && activeCategoryObj?.nameMs ? activeCategoryObj.nameMs : product.category;



  return (
    <AdminLayout title={getTranslatedText(product.name, product.nameZh, product.nameMs)}>
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
            <span className="text-[10px] font-black uppercase tracking-widest">{t('back_to_inventory')}</span>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/shop/${product.id}`}
              target="_blank"
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
            >
              <ExternalLink size={14} /> {t('view_live_store')}
            </Link>
            <Link
              href={`/admin/product/edit/${product.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-500/10 border border-zinc-500/20 text-zinc-600 dark:text-zinc-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-500/20 transition-all"
            >
              <Edit size={14} /> {t('edit_product')}
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
            >
              <Trash2 size={14} /> {t('delete')}
            </button>
          </div>
        </div>

        {/* Main: Image Left | Info Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-stretch">

          {/* LEFT — Image Gallery */}
          <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-0 rounded-[40px] overflow-hidden dark:bg-zinc-900/40 bg-zinc-100 border dark:border-white/5 border-zinc-200 relative group shadow-2xl cursor-zoom-in" onClick={() => product.images?.[activeImageIdx] && setLightboxOpen(true)}>
              {product.images && product.images[activeImageIdx] ? (
                <>
                  <img
                    src={product.images[activeImageIdx]}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="p-3 bg-black/60 rounded-2xl backdrop-blur-sm">
                      <ZoomIn size={24} className="text-white" />
                    </div>
                  </div>
                </>
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
                <div className="flex flex-wrap items-center gap-4 mt-8">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-2xl border border-yellow-500/20 shadow-sm">
                    <Tag size={16} className="text-yellow-500" />
                    <span className="font-semibold">{getTranslatedCategory(product.category)}</span>
                  </div>
                </div>
                <h1 className="text-4xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900 leading-tight mt-4">
                  {getTranslatedText(product.name, product.nameZh, product.nameMs)}
                </h1>
                <p className="text-zinc-500 font-medium text-lg mt-2 font-mono">#{product.code}</p>
              </div>
            </div>

            {/* Stock & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div className="dark:bg-zinc-900/40 bg-zinc-50 p-6 rounded-[24px] border dark:border-white/5 border-zinc-200">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Package size={11} className="text-blue-500" /> {t('stock_level')}
                </p>
                <p className="text-3xl font-black italic dark:text-white text-zinc-900">
                  {product.stock}
                  <span className="text-xs not-italic font-bold text-zinc-500 uppercase ml-1.5">{t('units')}</span>
                </p>
              </div>
              <div className="dark:bg-zinc-900/40 bg-zinc-50 p-6 rounded-[24px] border dark:border-white/5 border-zinc-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`p-2 rounded-xl ${
                    product.status === 'Live' ? 'bg-emerald-500/10 text-emerald-500' :
                    product.status === 'Hold' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    <CheckCircle size={16} />
                  </div>
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('col_status')}</h4>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black tracking-tight ${
                    product.status === 'Live' ? 'text-emerald-500' :
                    product.status === 'Hold' ? 'text-orange-500' :
                    'text-red-500'
                  }`}>
                    {getTranslatedStatus(product.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="dark:bg-zinc-900/40 bg-zinc-50 p-8 rounded-[32px] border dark:border-white/5 border-zinc-200 shadow-xl">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                <DollarSign size={11} className="text-yellow-500" /> {t('pricing_structure')}
              </p>
              <div className="mb-5 pb-5 border-b dark:border-white/5 border-zinc-200 flex items-end justify-between">
                <div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mb-1">{t('active_price')}</p>
                  <h2 className="text-5xl font-black italic text-yellow-500 tracking-tighter">RM {activePrice.toFixed(2)}</h2>
                </div>
                {hasPromotion && (
                  <div className="text-right">
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">{t('you_save')}</p>
                    <span className="text-xl font-black text-green-500">- RM {(product.price - product.promotion).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">{t('original_price').replace(' (RM)', '')}</span>
                  <span className={hasPromotion ? 'line-through text-zinc-400 dark:text-zinc-600' : 'dark:text-zinc-300 text-zinc-700'}>RM {product.price.toFixed(2)}</span>
                </div>
                {product.sellerPrice !== null && product.sellerPrice !== undefined && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">{t('seller_price').replace(' (RM)', '')}</span>
                    <span className="text-blue-500">RM {product.sellerPrice.toFixed(2)}</span>
                  </div>
                )}
                {hasPromotion && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">{t('promo_price')}</span>
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
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('item_description')}</h4>
            </div>
            <p className="dark:text-zinc-400 text-zinc-600 font-medium leading-relaxed text-sm whitespace-pre-wrap">
              {getTranslatedText(product.description, product.descriptionZh, product.descriptionMs) || t('no_description')}
            </p>
            <div className="mt-8 pt-6 border-t dark:border-white/5 border-zinc-200 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">
              <Clock size={12} />
              <span>{t('last_updated')}: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {embedUrl && (
            <div className="dark:bg-zinc-900/40 bg-zinc-50 rounded-[40px] overflow-hidden border dark:border-white/5 border-zinc-200 shadow-xl">
              <div className="px-10 py-6 border-b dark:border-white/5 border-zinc-200 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-xl"><VideoIcon size={16} /></div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('live_demonstration')}</h3>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title={t('product_demo')}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && product.images?.[activeImageIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={22} />
            </button>

            {/* Image counter */}
            {product.images.length > 1 && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                {activeImageIdx + 1} / {product.images.length}
              </div>
            )}

            {/* Main image */}
            <motion.img
              key={activeImageIdx}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={product.images[activeImageIdx]}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Prev / Next arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); setActiveImageIdx(i => (i - 1 + product.images.length) % product.images.length); }}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); setActiveImageIdx(i => (i + 1) % product.images.length); }}
                >
                  <ChevronLeft size={22} className="rotate-180" />
                </button>
              </>
            )}

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3" onClick={(e) => e.stopPropagation()}>
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIdx === i ? 'border-yellow-500 scale-110' : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Screen Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800/50">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  {t('delete')}
                </h3>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 text-left">
                <p className="text-zinc-600 dark:text-zinc-300 font-medium">
                  {t('confirm_delete_product')}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminLayout>

  );
};

export default AdminProductDetail;
