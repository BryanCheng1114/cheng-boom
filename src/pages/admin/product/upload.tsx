import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Video, Package, Tag, Info, DollarSign, X, Upload, Plus as PlusIcon, HelpCircle } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';

const UploadProductPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const stockRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showYoutubeGuide, setShowYoutubeGuide] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nameZh: '',
    nameMs: '',
    description: '',
    descriptionZh: '',
    descriptionMs: '',
    category: '',
    videoUrl: '',
    stock: '',
    price: '',
    sellerPrice: '',
    promotion: '',
  });

  const handleAutoGenerateCode = async () => {
    if (!formData.name.trim()) {
      alert('Please input Product Name first to auto-generate code.');
      return;
    }

    try {
      // 1. Extract first two alphabetic letters, capitalized
      let letters = formData.name.trim().replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
      if (letters.length < 2) {
        letters = letters.padEnd(2, 'P'); // e.g. "T" -> "TP" for Product
      }
      
      // 2. Fetch all existing products to get current count
      const res = await fetch('/api/products');
      const products = await res.json();
      
      // 3. Format next unique suffix
      const count = products.length;
      const nextNum = (count + 1).toString().padStart(5, '0');
      const generated = `${letters}${nextNum}`;

      setFormData(prev => ({ ...prev, code: generated }));
    } catch (err) {
      console.error(err);
      alert('Failed to auto-generate product code.');
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('files', files[i]);
      // Local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setPreviews(prev => [...prev, e.target!.result as string]);
      };
      reader.readAsDataURL(files[i]);
    }

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.urls) {
        setUploadedImages(prev => [...prev, ...result.urls]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload images');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build field-level errors
    const errors: Record<string, string> = {};
    if (uploadedImages.length === 0) errors.image = t('err_image_required');
    if (!formData.name.trim()) errors.name = t('err_name_required');
    if (!formData.category) errors.category = t('err_category_required');
    if (!formData.code.trim()) errors.code = t('err_code_required');
    if (!formData.stock) errors.stock = t('err_stock_required');
    if (!formData.price) errors.price = t('err_price_required');

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to the first error field
      const firstKey = Object.keys(errors)[0];
      const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
        image: imageRef,
        name: nameRef,
        category: categoryRef,
        code: codeRef,
        stock: stockRef,
        price: priceRef,
      };
      refMap[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, images: uploadedImages }),
      });
      if (response.ok) {
        router.push('/admin/product');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'code') {
      const cleanCode = value.replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase();
      setFormData(prev => ({ ...prev, code: cleanCode }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <AdminLayout title={t('upload_new_item')}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin/product" className="p-3 hover:bg-zinc-500/10 text-zinc-500 rounded-full transition-all">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900">{t('upload_new_item')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Section */}
          <div className="bg-white dark:bg-zinc-900/40 p-8 rounded-[48px] border dark:border-white/10 border-zinc-100 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><ImageIcon size={18} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('visual_assets')}</h2>
            </div>
            
            <div className="space-y-6">
              <div ref={imageRef}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-48 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 dark:bg-black/20 bg-zinc-50 cursor-pointer hover:border-yellow-500/50 transition-all group ${
                    fieldErrors.image ? 'border-red-500 dark:border-red-500 animate-pulse' : 'dark:border-white/10 border-zinc-200'
                  }`}
                >
                  <div className="p-4 bg-zinc-950 rounded-2xl text-zinc-500 group-hover:text-yellow-500 transition-colors">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('click_select_images')}</p>
                    <p className="text-[9px] text-zinc-500 mt-1 font-medium italic">Max 10MB per file. PNG, JPG supported.</p>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden" 
                  />
                </div>
                {fieldErrors.image && (
                  <p className="text-red-500 text-xs font-bold mt-2 ml-2 flex items-center gap-1">⚠ {fieldErrors.image}</p>
                )}
              </div>

              {/* Previews */}
              <AnimatePresence>
                {previews.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  >
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border dark:border-white/10 group">
                        <img src={src} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed dark:border-white/5 flex flex-col items-center justify-center text-zinc-500 hover:text-yellow-500 hover:border-yellow-500/50 transition-all"
                    >
                      <PlusIcon size={20} />
                      <span className="text-[8px] font-black uppercase tracking-widest mt-2">{t('add_more')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Video size={14} className="text-zinc-500" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('youtube_link')}</label>
                    <button 
                      type="button"
                      onMouseEnter={() => setShowYoutubeGuide(true)}
                      onMouseLeave={() => setShowYoutubeGuide(false)}
                      className="text-zinc-400 hover:text-yellow-500 transition-colors ml-1 outline-none"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </div>
                  <a 
                    href="https://youtube.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] font-black uppercase tracking-widest text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all flex items-center gap-1 hover:gap-2 group"
                  >
                    {t('open_youtube')} <ChevronRight size={12} strokeWidth={3} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>

                <AnimatePresence>
                  {showYoutubeGuide && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 bottom-full left-0 mb-2 w-[600px] bg-zinc-900 border border-white/10 rounded-[32px] p-8 shadow-2xl pointer-events-none"
                    >
                      <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-3">{t('how_to_add_video')}</h4>
                      <div className="space-y-4">
                        <div className="flex gap-4 text-zinc-300 text-xs font-bold items-center">
                          <span className="w-6 h-6 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">1</span>
                          <p>{t('yt_step_1')}</p>
                        </div>
                        <div className="flex gap-4 text-zinc-300 text-xs font-bold items-center">
                          <span className="w-6 h-6 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">2</span>
                          <p>{t('yt_step_2')}</p>
                        </div>
                        <div className="flex gap-4 text-zinc-300 text-xs font-bold items-center">
                          <span className="w-6 h-6 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">3</span>
                          <p>{t('yt_step_3')}</p>
                        </div>
                        <div className="flex gap-4 text-zinc-300 text-xs font-bold items-center">
                          <span className="w-6 h-6 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">4</span>
                          <p>{t('yt_step_4')}</p>
                        </div>
                      </div>
                      <div className="mt-6 bg-zinc-800/50 rounded-2xl overflow-hidden border border-white/5 p-2">
                        <img src="/youtube1.png" alt="YouTube Tutorial Guide" className="w-full h-auto rounded-xl object-contain" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input 
                  type="text" 
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all" 
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-zinc-900/40 p-8 rounded-[48px] border dark:border-white/10 border-zinc-100 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Info size={18} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('product_identity')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product English Name */}
              <div ref={nameRef} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('product_name_en')} *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={(e) => { handleChange(e); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm ${
                    fieldErrors.name ? 'border-red-500 dark:border-red-500' : 'dark:border-white/5 border-zinc-200'
                  }`}
                  placeholder="e.g. Thunder Clap"
                />
                {fieldErrors.name && <p className="text-red-500 text-xs font-bold ml-2 flex items-center gap-1">⚠ {fieldErrors.name}</p>}
              </div>

              {/* Chinese Translation */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('chinese_translation')}</label>
                <input 
                  type="text" 
                  name="nameZh"
                  value={formData.nameZh || ''}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm" 
                  placeholder="e.g. 雷霆万钧"
                />
              </div>

              {/* Category Select */}
              <div ref={categoryRef} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('categories')} *</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={(e) => { handleChange(e); if (fieldErrors.category) setFieldErrors(p => ({ ...p, category: '' })); }}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm cursor-pointer ${
                    fieldErrors.category ? 'border-red-500 dark:border-red-500' : 'dark:border-white/5 border-zinc-200'
                  }`}
                >
                  <option value="">{t('choose_category')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                {fieldErrors.category && <p className="text-red-500 text-xs font-bold ml-2 flex items-center gap-1">⚠ {fieldErrors.category}</p>}
              </div>

              {/* Product Code */}
              <div ref={codeRef} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('category_code')} *</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="code"
                    value={formData.code}
                    onChange={(e) => { handleChange(e); if (fieldErrors.code) setFieldErrors(p => ({ ...p, code: '' })); }}
                    className={`flex-1 px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm ${
                      fieldErrors.code ? 'border-red-500 dark:border-red-500' : 'dark:border-white/5 border-zinc-200'
                    }`}
                    placeholder="e.g. TC00001"
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="px-6 py-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-500 font-bold text-[10px] uppercase tracking-wider rounded-2xl transition-all border border-zinc-300/50 dark:border-zinc-700/50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>{t('auto_gen')}</span>
                  </button>
                </div>
                {fieldErrors.code && <p className="text-red-500 text-xs font-bold ml-2 flex items-center gap-1">⚠ {fieldErrors.code}</p>}
              </div>



              <div className="md:col-span-2 space-y-8 mt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('item_description')} (EN)</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl border outline-none font-medium leading-relaxed min-h-[140px] dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm" 
                    placeholder="Detailed English description..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('item_description')} (ZH)</label>
                  <textarea 
                    name="descriptionZh"
                    value={formData.descriptionZh || ''}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl border outline-none font-medium leading-relaxed min-h-[140px] dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm" 
                    placeholder="中文描述..."
                  />
                </div>


              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white dark:bg-zinc-900/40 p-8 rounded-[48px] border dark:border-white/10 border-zinc-100 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><DollarSign size={18} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('inventory_commerce')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Quantity Stock */}
              <div ref={stockRef} className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={14} className="text-zinc-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{t('quantity_stock')}</label>
                </div>
                <input 
                  type="number" 
                  name="stock"
                  value={formData.stock}
                  onChange={(e) => { handleChange(e); if (fieldErrors.stock) setFieldErrors(p => ({ ...p, stock: '' })); }}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:text-white text-zinc-900 focus:border-yellow-500 text-sm ${
                    fieldErrors.stock ? 'border-red-500 dark:border-red-500' : 'dark:border-white/5 border-zinc-200'
                  }`}
                  placeholder="0"
                />
                {fieldErrors.stock && <p className="text-red-500 text-xs font-bold ml-2 flex items-center gap-1">⚠ {fieldErrors.stock}</p>}
              </div>

              {/* Original Price */}
              <div ref={priceRef} className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={14} className="text-zinc-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{t('original_price')}</label>
                </div>
                <input 
                  type="text" 
                  name="price"
                  value={formData.price}
                  onChange={(e) => { handleChange(e); if (fieldErrors.price) setFieldErrors(p => ({ ...p, price: '' })); }}
                  className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:text-white text-zinc-900 focus:border-yellow-500 text-sm ${
                    fieldErrors.price ? 'border-red-500 dark:border-red-500' : 'dark:border-white/5 border-zinc-200'
                  }`}
                  placeholder="0.00"
                />
                {fieldErrors.price && <p className="text-red-500 text-xs font-bold ml-2 flex items-center gap-1">⚠ {fieldErrors.price}</p>}
              </div>

              {/* Seller Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-zinc-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{t('seller_price')}</label>
                </div>
                <input 
                  type="text" 
                  name="sellerPrice"
                  value={formData.sellerPrice}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 text-sm" 
                  placeholder="Optional"
                />
              </div>

              {/* Sale Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{t('sale_price')}</label>
                </div>
                <input 
                  type="text" 
                  name="promotion"
                  value={formData.promotion}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-red-500 text-sm" 
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => router.push('/admin/product')}
              disabled={isLoading}
              className="w-1/3 py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-[24px] font-bold text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-2/3 py-5 bg-yellow-500 text-zinc-950 rounded-[24px] font-bold text-sm hover:brightness-110 transition-all shadow-2xl shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                t('confirm_upload')
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default UploadProductPage;
