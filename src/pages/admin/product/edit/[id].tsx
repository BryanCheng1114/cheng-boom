
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronRight, Image as ImageIcon, Video, X, HelpCircle, AlertTriangle, Save } from 'lucide-react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../../../context/LanguageContext';

const EditProductPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isSaving, setIsSaving] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [initialImages, setInitialImages] = useState<string[]>([]);
  // Duplicate router removed
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const stockRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    sellerAPrice: '',
    sellerBPrice: '',
    itemsPerBox: '',
    bundleQuantity: '',
    sellerABoxPrice: '',
    sellerBBoxPrice: '',
    sellerABundlePrice: '',
    sellerBBundlePrice: '',
    status: 'Live',
  });

  const handleAutoGenerateCode = async () => {
    if (!formData.name.trim()) {
      alert(t('please_input_name_auto_gen'));
      return;
    }
    
    try {
      const initials = formData.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      const res = await fetch(`/api/products/generate-code?prefix=${initials}`);
      const data = await res.json();
      if (data.code) {
        setFormData(prev => ({ ...prev, code: data.code }));
        if (fieldErrors.code) setFieldErrors(p => ({ ...p, code: '' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch('/api/categories')
        ]);
        
        if (prodRes.ok) {
          const data = await prodRes.json();
          const cats = await catRes.json();
          setCategories(cats);
          
          const loadedData = {
            name: data.name || '',
            code: data.code || '',
            nameZh: data.nameZh || '',
            nameMs: data.nameMs || '',
            description: data.description || '',
            descriptionZh: data.descriptionZh || '',
            descriptionMs: data.descriptionMs || '',
            category: data.category || '',
            videoUrl: data.videoUrl || '',
            stock: String(data.stock || '0'),
            sellerAPrice: String(data.sellerAPrice ?? data.price ?? '0'),
            sellerBPrice: String(data.sellerBPrice ?? data.price ?? '0'),
            itemsPerBox: String(data.itemsPerBox || ''),
            bundleQuantity: String(data.bundleQuantity || ''),
            sellerABoxPrice: String(data.sellerABoxPrice ?? data.boxPrice ?? ''),
            sellerBBoxPrice: String(data.sellerBBoxPrice ?? data.boxPrice ?? ''),
            sellerABundlePrice: String(data.sellerABundlePrice ?? data.bundlePrice ?? ''),
            sellerBBundlePrice: String(data.sellerBBundlePrice ?? data.bundlePrice ?? ''),
            status: data.status || 'Live',
          };
          setFormData(loadedData);
          setInitialFormData(loadedData);
          
          if (data.images) {
            setPreviews(data.images);
            setUploadedImages(data.images);
            setInitialImages(data.images);
          }
        } else {
          alert(t('product_not_found') || 'Product not found');
          router.push('/admin/product');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, t]);


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (previews.length + files.length > 10) {
      alert(t('max_10_images'));
      return;
    }

    setIsLoading(true);
    if (fieldErrors.image) setFieldErrors(p => ({ ...p, image: '' }));
    
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 10 * 1024 * 1024) {
        alert(`${files[i].name} exceeds 10MB limit`);
        continue;
      }
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
    if (uploadedImages.length === 0) errors.image = t('err_image_required') || 'Image required';
    if (!formData.name.trim()) errors.name = t('err_name_required') || 'Name required';
    if (!formData.category) errors.category = t('err_category_required') || 'Category required';
    if (!formData.code.trim()) errors.code = t('err_code_required') || 'Code required';
    if (!formData.description.trim()) errors.description = t('err_description_required') || 'Description is required';
    if (!formData.stock) errors.stock = t('err_stock_required') || 'Stock required';
    if (!formData.sellerAPrice) errors.sellerAPrice = 'Seller A single-item price is required';
    if (!formData.sellerBPrice) errors.sellerBPrice = 'Seller B single-item price is required';

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to the first error field
      const firstKey = Object.keys(errors)[0];
      const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
        image: imageRef,
        name: nameRef,
        category: categoryRef,
        code: codeRef,
        description: nameRef, // Scroll to nameRef for description
        stock: stockRef,
        sellerAPrice: priceRef,
        sellerBPrice: priceRef,
      };
      refMap[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
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
      alert('Failed to update product');
    } finally {
      setIsSaving(false);
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


  if (isLoading) {
    return (
      <AdminLayout title={t('edit_product') || 'Edit Product'}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] animate-pulse">{t('loading_product_data') || 'LOADING PRODUCT...'}</p>
        </div>
      </AdminLayout>
    );
  }

  const localizedProductName = language === 'zh' && formData.nameZh ? formData.nameZh : (language === 'ms' && formData.nameMs ? formData.nameMs : formData.name);

  return (
    <AdminLayout title={`${t('edit_product') || 'Edit Product'}: ${localizedProductName}`} hideTitle>
      <div className="relative w-full pb-8">
        <form onSubmit={handleSubmit} className="relative space-y-6">
          <header className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('edit_product') || 'Edit Product'}: {localizedProductName}</h1>
              <span className="text-xs text-slate-700">[ {t('inventory_modification_screen')} ]</span>
            </div>
            <p className="text-xs text-slate-600">{t('inventory_product_information_breadcrumb')} /</p>
          </header>
          <Link href="/admin/product" className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <ArrowLeft size={17} /> {t('back_to_product_screen')}
          </Link>

          {Object.keys(fieldErrors).length > 0 && (
            <div className="flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              <AlertTriangle size={18} className="shrink-0" />{t('fill_required_fields_err') || 'Please fill in all required fields marked in red.'}
            </div>
          )}

          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <h2 className="border-b border-slate-200 pb-4 text-lg font-semibold text-slate-800">{t('product_info') || 'Product Information'}</h2>
              <div className="space-y-6 pt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div ref={nameRef} className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-800">{t('product_name_en')} <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={(e) => { handleChange(e); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }} className={`w-full border px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.name ? 'border-red-500' : 'border-slate-300'}`} placeholder="e.g. Thunder Clap" />
                    {fieldErrors.name && <p className="text-xs font-medium text-red-600">⚠ {fieldErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-800">{t('chinese_translation') || 'Chinese Translation'} <span className="font-normal text-slate-500">({t('product_optional')})</span></label>
                    <input type="text" name="nameZh" value={formData.nameZh} onChange={handleChange} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="e.g. 雷霆万钧" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div ref={categoryRef} className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-800">{t('categories')} <span className="text-red-500">*</span></label>
                    <select name="category" value={formData.category} onChange={(e) => { handleChange(e); if (fieldErrors.category) setFieldErrors(p => ({ ...p, category: '' })); }} className={`w-full border px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.category ? 'border-red-500' : 'border-slate-300'}`}>
                      <option value="">{t('choose_category')}</option>
                      {categories.map(cat => {
                        const catName = language === 'zh' && cat.nameZh ? cat.nameZh : (language === 'ms' && cat.nameMs ? cat.nameMs : cat.name);
                        return <option key={cat.id} value={cat.name}>{catName}</option>;
                      })}
                    </select>
                    {fieldErrors.category && <p className="text-xs font-medium text-red-600">⚠ {fieldErrors.category}</p>}
                  </div>
                  <div ref={codeRef} className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-800">{t('product_code') || 'Product Code'} <span className="text-red-500">*</span></label>
                    <div className="relative flex gap-2">
                      <input type="text" name="code" value={formData.code} onChange={(e) => { handleChange(e); if (fieldErrors.code) setFieldErrors(p => ({ ...p, code: '' })); }} className={`w-full border py-3 pl-4 pr-24 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.code ? 'border-red-500' : 'border-slate-300'}`} placeholder="e.g. TC00001" />
                      <button type="button" onClick={handleAutoGenerateCode} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50">{t('auto_gen') || 'Auto-Gen'}</button>
                    </div>
                    {fieldErrors.code && <p className="text-xs font-medium text-red-600">⚠ {fieldErrors.code}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-800">{t('description_en')} <span className="text-red-500">*</span></label>
                    <textarea name="description" value={formData.description} onChange={(e) => { handleChange(e); if (fieldErrors.description) setFieldErrors(p => ({ ...p, description: '' })); }} rows={3} className={`w-full resize-none border px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.description ? 'border-red-500' : 'border-slate-300'}`} placeholder="Product details..." />
                    {fieldErrors.description && <p className="text-xs font-medium text-red-600">⚠ {fieldErrors.description}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-800">{t('chinese_translation') || 'Chinese Translation'} <span className="font-normal text-slate-500">({t('product_optional')})</span></label>
                    <textarea name="descriptionZh" value={formData.descriptionZh} onChange={handleChange} rows={3} className="w-full resize-none border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="产品详情..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-6 lg:grid-cols-2">
                  <div ref={imageRef} className="space-y-3">
                    <div className="flex items-center justify-between"><label className="text-[13px] font-semibold text-slate-800">{t('product_images_title')} <span className="text-red-500">*</span></label><span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">{previews.length}/10</span></div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex min-h-24 w-full items-center justify-between gap-4 border border-dashed bg-slate-50 px-5 py-4 text-left transition-colors hover:border-sky-600 hover:bg-sky-50 ${fieldErrors.image ? 'border-red-500' : 'border-slate-300'}`}>
                      <span className="flex items-center gap-3"><span className="border border-slate-200 bg-white p-2 text-slate-600"><ImageIcon size={20} /></span><span><span className="block text-sm font-medium text-slate-800">{t('product_image_select_hint')}</span><span className="mt-1 block text-xs text-slate-500">{t('product_image_requirements')}</span></span></span>
                      <span className="shrink-0 border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700">{t('inventory_browse')}</span>
                    </button>
                    <input type="file" multiple accept="image/png,image/jpeg" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    {fieldErrors.image && <p className="text-xs font-medium text-red-600">⚠ {fieldErrors.image}</p>}
                    <AnimatePresence>{previews.length > 0 && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-3 pt-1">{previews.map((src, idx) => <div key={idx} className="group relative aspect-square overflow-hidden border border-slate-200"><img src={src} alt={`${t('inventory_preview_image')} ${idx + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => removeImage(idx)} aria-label={t('inventory_remove_image').replace('{number}', String(idx + 1))} className="absolute right-1 top-1 bg-black/60 p-1 text-white opacity-0 hover:bg-red-600 group-hover:opacity-100"><X size={12} /></button></div>)}</motion.div>}</AnimatePresence>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-[13px] font-semibold text-slate-800"><Video size={15} className="text-slate-500" />{t('youtube_link_optional') || 'YouTube Video Link'} <span className="font-normal text-slate-500">({t('product_optional')})</span></label><div className="flex items-center gap-3"><button type="button" onMouseEnter={() => setShowYoutubeGuide(true)} onMouseLeave={() => setShowYoutubeGuide(false)} className="text-slate-400 hover:text-sky-700" aria-label={t('product_youtube_help')}><HelpCircle size={15} /></button><a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-xs font-medium text-sky-700 hover:text-sky-800">{t('open_youtube') || 'Open YouTube'} ↗</a></div></div>
                      <input type="text" name="videoUrl" value={formData.videoUrl} onChange={handleChange} className="w-full border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="https://youtube.com/watch?v=..." />
                      <AnimatePresence>{showYoutubeGuide && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-lg"><p className="mb-2 font-semibold text-slate-800">{t('how_to_add_video') || 'How to Add Video'}</p><p>{t('youtube_step1') || 'Open YouTube, choose a video, copy its URL, and paste it above.'}</p></motion.div>}</AnimatePresence>
                    </div>
                    <div className="space-y-2"><label htmlFor="product-status" className="text-[13px] font-semibold text-slate-800">{t('listing_status') || 'Listing Status'}</label><select id="product-status" value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"><option value="Live">{t('live_products') || 'Live'}</option><option value="Hold">{t('hold') || 'On-hold'}</option><option value="Deactive">{t('deactive') || 'Deactive'}</option></select></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-2 border-b border-slate-200 pb-4 text-lg font-semibold text-slate-800">{t('product_pricing_title')}</h2>
              <div ref={stockRef} className="mb-5 max-w-sm space-y-2"><label className="text-xs font-semibold text-slate-800">{t('total_stock') || 'Total Stock'} <span className="text-red-500">*</span></label><input type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} className={`w-full border bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.stock ? 'border-red-500' : 'border-slate-300'}`} placeholder="0" /></div>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2"><label className="text-xs font-semibold text-slate-800">{t('items_per_box') || 'Items Per Box'} <span className="font-normal text-slate-500">({t('product_optional_shared')})</span></label><input type="number" min="2" name="itemsPerBox" value={formData.itemsPerBox} onChange={handleChange} className="w-full border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="e.g. 12" /></div>
                <div className="space-y-2"><label className="text-xs font-semibold text-slate-800">{t('items_per_bundle') || 'Items Per Bundle'} <span className="font-normal text-slate-500">({t('product_optional_shared')})</span></label><input type="number" min="2" name="bundleQuantity" value={formData.bundleQuantity} onChange={handleChange} className="w-full border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="e.g. 4" /></div>
              </div>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {(['A', 'B'] as const).map((group) => {
                  const singleField = group === 'A' ? 'sellerAPrice' : 'sellerBPrice';
                  const boxField = group === 'A' ? 'sellerABoxPrice' : 'sellerBBoxPrice';
                  const bundleField = group === 'A' ? 'sellerABundlePrice' : 'sellerBBundlePrice';
                  return <div key={group} className="space-y-4 border border-slate-200 bg-slate-50/60 p-5">
                    <div className="border-b border-slate-200 pb-3"><h3 className="text-base font-semibold text-slate-900">{group === 'A' ? t('product_seller_a_pricing') : t('product_seller_b_pricing')}</h3><p className="mt-1 text-xs text-slate-500">{t('product_single_price_required')}</p></div>
                    <div ref={group === 'A' ? priceRef : undefined} className="space-y-2"><label className="text-xs font-semibold text-slate-800">{t('product_single_item_price')} <span className="text-red-500">*</span></label><input type="number" min="0" step="0.01" name={singleField} value={formData[singleField]} onChange={handleChange} className={`w-full border bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors[singleField] ? 'border-red-500' : 'border-slate-300'}`} placeholder="0.00" /></div>
                    <details className="group border-t border-slate-200 pt-3"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-700"><span>{t('product_per_box_price')} <span className="ml-1 text-xs font-normal text-slate-500">{t('product_optional')}</span></span><ChevronDown size={16} className="text-slate-500 transition-transform group-open:rotate-180" /></summary><div className="pt-3"><input aria-label={`${t('product_per_box_price')} - ${t(group === 'A' ? 'inventory_seller_a' : 'inventory_seller_b')}`} type="number" min="0" step="0.01" name={boxField} value={formData[boxField]} onChange={handleChange} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="0.00" /></div></details>
                    <details className="group border-t border-slate-200 pt-3"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-700"><span>{t('product_bundle_price')} <span className="ml-1 text-xs font-normal text-slate-500">{t('product_optional')}</span></span><ChevronDown size={16} className="text-slate-500 transition-transform group-open:rotate-180" /></summary><div className="pt-3"><input aria-label={`${t('product_bundle_price')} - ${t(group === 'A' ? 'inventory_seller_a' : 'inventory_seller_b')}`} type="number" min="0" step="0.01" name={bundleField} value={formData[bundleField]} onChange={handleChange} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="0.00" /></div></details>
                  </div>;
                })}
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={() => router.push('/admin/product')} disabled={isSaving} className="border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">{t('cancel') || 'Cancel'}</button>
            <button type="submit" disabled={isSaving || !initialFormData || (JSON.stringify(formData) === JSON.stringify(initialFormData) && JSON.stringify(uploadedImages) === JSON.stringify(initialImages))} className="flex items-center gap-2 bg-sky-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
              {isSaving ? <div className="h-4 w-4 animate-spin border-2 border-white/20 border-t-white" /> : <><Save size={16} />{t('save_changes') || 'Save Changes'}</>}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditProductPage;
