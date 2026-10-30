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

  const videoId = product.videoUrl?.split('v=')[1]?.split('&')[0] || product.videoUrl?.split('youtu.be/')[1];
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  // Localized Product Name
  const localizedName = language === 'zh' && product.nameZh ? product.nameZh : language === 'ms' && product.nameMs ? product.nameMs : product.name;

  // Localized Category Name
  const activeCategoryObj = categories.find(c => c.name === product.category);
  const localizedCategory = language === 'zh' && activeCategoryObj?.nameZh ? activeCategoryObj.nameZh : language === 'ms' && activeCategoryObj?.nameMs ? activeCategoryObj.nameMs : product.category;



  return (
    <AdminLayout title={getTranslatedText(product.name, product.nameZh, product.nameMs)} hideTitle>
      <div className="w-full pb-8">

        {/* Top Bar: Back + Actions */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{getTranslatedText(product.name, product.nameZh, product.nameMs)}</h1>
              <span className="text-xs font-normal text-slate-700">[ {t('inventory_item_details')} ]</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">{t('inventory_product_information_breadcrumb')} /</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/product" className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
              <ChevronLeft size={16} /> {t('back_to_inventory')}
            </Link>
            <Link
              href={`/shop/${product.id}`}
              target="_blank"
              className="flex items-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50"
            >
              <ExternalLink size={14} /> {t('view_live_store')}
            </Link>
            <Link
              href={`/admin/product/edit/${product.id}`}
              className="flex items-center gap-2 border border-sky-700 bg-sky-700 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-sky-800"
            >
              <Edit size={14} /> {t('edit_product')}
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 border border-red-200 bg-white px-4 py-2.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              <Trash2 size={14} /> {t('delete')}
            </button>
          </div>
        </div>

        {/* Main: Image Left | Info Right */}
        <div className="mb-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">

          {/* LEFT — Image Gallery */}
          <div className="flex flex-col gap-4 h-full">
            <div className="relative min-h-[360px] flex-1 cursor-zoom-in overflow-hidden border border-slate-200 bg-slate-100 shadow-sm group" onClick={() => product.images?.[activeImageIdx] && setLightboxOpen(true)}>
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
                        ? 'border-sky-700 shadow-sm'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
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
            <div className="relative overflow-hidden border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="absolute -bottom-4 -right-4 opacity-[0.04]">
                <Package size={140} className=" text-zinc-900" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-4 mt-8">
                  <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <Tag size={15} className="text-sky-700" />
                    <span>{getTranslatedCategory(product.category)}</span>
                  </div>
                </div>
                <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-slate-900">
                  {getTranslatedText(product.name, product.nameZh, product.nameMs)}
                </h2>
                <p className="mt-2 font-mono text-sm text-slate-500">#{product.code}</p>
              </div>
            </div>

            {/* Stock & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Package size={11} className="text-blue-500" /> {t('stock_level')}
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {product.stock}
                  <span className="text-xs not-italic font-bold text-zinc-500 uppercase ml-1.5">{t('units')}</span>
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-5 shadow-sm">
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
            <div className="border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                <DollarSign size={14} className="text-sky-700" /> {t('pricing_structure')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-xs font-semibold text-slate-600">{t('inventory_seller_a')} · {t('inventory_single_item')}</span><span className="text-lg font-bold text-slate-900">RM {Number(product.sellerAPrice).toFixed(2)}</span></div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-xs font-semibold text-slate-600">{t('inventory_seller_b')} · {t('inventory_single_item')}</span><span className="text-lg font-bold text-sky-700">RM {Number(product.sellerBPrice).toFixed(2)}</span></div>
                {product.itemsPerBox && <div className="flex items-center justify-between text-xs"><span className="text-slate-600">{t('inventory_per_box_count').replace('{count}', String(product.itemsPerBox))}</span><span className="font-semibold text-slate-800">A: {product.sellerABoxPrice != null ? `RM ${Number(product.sellerABoxPrice).toFixed(2)}` : '—'} · B: {product.sellerBBoxPrice != null ? `RM ${Number(product.sellerBBoxPrice).toFixed(2)}` : '—'}</span></div>}
                {product.bundleQuantity && <div className="flex items-center justify-between text-xs"><span className="text-slate-600">{t('inventory_bundle_count').replace('{count}', String(product.bundleQuantity))}</span><span className="font-semibold text-slate-800">A: {product.sellerABundlePrice != null ? `RM ${Number(product.sellerABundlePrice).toFixed(2)}` : '—'} · B: {product.sellerBBundlePrice != null ? `RM ${Number(product.sellerBBundlePrice).toFixed(2)}` : '—'}</span></div>}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Description + Video */}
        <div className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="border border-slate-200 bg-slate-50 p-2 text-sky-700"><Info size={16} /></div>
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('item_description')}</h4>
            </div>
            <p className=" text-zinc-600 font-medium leading-relaxed text-sm whitespace-pre-wrap">
              {getTranslatedText(product.description, product.descriptionZh, product.descriptionMs) || t('no_description')}
            </p>
            <div className="mt-8 pt-6 border-t  border-zinc-200 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">
              <Clock size={12} />
              <span>{t('last_updated')}: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {embedUrl && (
            <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 md:px-8">
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
              className="bg-white  border border-zinc-200  rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 ">
                <h3 className="text-lg font-black text-zinc-900 ">
                  {t('delete')}
                </h3>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-zinc-400 hover:text-zinc-900 :text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 text-left">
                <p className="text-zinc-600  font-medium">
                  {t('confirm_delete_product')}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200  :bg-zinc-700 text-zinc-900  transition-colors"
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
