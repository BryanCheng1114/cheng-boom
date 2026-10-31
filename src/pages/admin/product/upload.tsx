
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, ChevronDown, Image as ImageIcon, Video, X, HelpCircle, AlertTriangle, Save } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import { validateProductPricing } from '../../../utils/validateProductPricing';
import { useLanguage } from '../../../context/LanguageContext';

const UploadProductPage = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
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

    if (previews.length + files.length > 10) {
      alert(t('max_10_images'));
      return;
    }

    setIsLoading(true);
    if (fieldErrors.image) setFieldErrors(p => ({ ...p, image: '' }));

    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 10 * 1024 * 1024) {
        alert(`${files[i].name} ${t('exceeds_10mb_limit')}`);
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
      alert(t('failed_upload_images'));
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
    const pricingError = validateProductPricing(formData);
    if (pricingError) errors.sellerAPrice = pricingError;


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
      alert(t('failed_upload_product'));
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
    <AdminLayout title={t('upload_new_item')} hideTitle>
      <div className="relative w-full pb-8">

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <header className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('upload_new_item') || 'Upload New Item'}</h1>
              <span className="text-xs font-normal text-slate-700">[ {t('product_new_entry_screen')} ]</span>
            </div>
            <p className="text-xs text-slate-600">{t('inventory_product_information_breadcrumb')} /</p>
          </header>
          <Link href="/admin/product" className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <ArrowLeft size={17} />
            {t('back_to_product_screen')}
          </Link>
          {Object.keys(fieldErrors).length > 0 && (
            <div className="flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              <AlertTriangle size={18} className="shrink-0" />{t('fill_required_fields') || 'Please fill in all required fields marked in red.'}</div>
          )}

          <div className="flex flex-col gap-6">
            {/* Left Column */}
            <div className="space-y-6">

              {/* Basic Details */}
              <div className="border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h3 className="border-b border-slate-200 pb-4 text-lg font-semibold text-slate-800">{t('product_information') || 'Product Information'}</h3>
                <div className="space-y-6 pt-6">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div ref={nameRef} className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">{t('product_name_en')} <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => { handleChange(e); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }}
                        className={`w-full border px-4 py-3 text-[14px] text-zinc-900 outline-none transition-all focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.name ? 'border-red-500' : 'border-zinc-200'
                          }`}
                        placeholder={t("eg_thunder_clap") || "e.g. Thunder Clap"}
                      />
                      {fieldErrors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">⚠ {fieldErrors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">{t('chinese_translation_label')} <span className="font-normal text-slate-500">({t('optional')})</span></label>
                      <input
                        type="text"
                        name="nameZh"
                        value={formData.nameZh}
                        onChange={handleChange}
                        className="w-full border border-slate-300 bg-white px-4 py-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                        placeholder={t("eg_thunder_clap_zh") || "e.g. 雷霆万钧"}
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div ref={categoryRef} className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">{t('categories')} <span className="text-red-500">*</span></label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={(e) => { handleChange(e); if (fieldErrors.category) setFieldErrors(p => ({ ...p, category: '' })); }}
                        className={`w-full border px-4 py-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.category ? 'border-red-500' : 'border-zinc-200'
                          }`}
                      >
                        <option value="">{t('choose_category')}</option>
                        {categories.map(cat => {
                          const catName = language === 'zh' && cat.nameZh ? cat.nameZh : (language === 'ms' && cat.nameMs ? cat.nameMs : cat.name);
                          return <option key={cat.id} value={cat.name}>{catName}</option>;
                        })}
                      </select>
                      {fieldErrors.category && <p className="text-red-500 text-[11px] font-semibold mt-1">⚠ {fieldErrors.category}</p>}
                    </div>

                    <div ref={codeRef} className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">{t('product_code_label') || 'Product Code'}<span className="text-red-500">*</span></label>
                      <div className="flex gap-2 relative">
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={(e) => { handleChange(e); if (fieldErrors.code) setFieldErrors(p => ({ ...p, code: '' })); }}
                          className={`flex-1 border py-3 pl-4 pr-24 text-[14px] text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.code ? 'border-red-500' : 'border-zinc-200'
                            }`}
                          placeholder={t("eg_tc00001") || "e.g. TC00001"}
                        />
                        <button
                          type="button"
                          onClick={handleAutoGenerateCode}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sky-700 font-medium text-xs transition-colors hover:bg-sky-50"
                        >{t('auto_gen') || 'Auto-Gen'}</button>
                      </div>
                      {fieldErrors.code && <p className="text-red-500 text-[11px] font-semibold mt-1">⚠ {fieldErrors.code}</p>}
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div ref={nameRef} className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">{t("description_en") || "Description (English)"} <span className="text-red-500">*</span></label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) => { handleChange(e); if (fieldErrors.description) setFieldErrors(p => ({ ...p, description: '' })); }}
                        rows={3}
                        className={`w-full resize-none border px-4 py-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.description ? 'border-red-500' : 'border-zinc-200'
                          }`}
                        placeholder={t("product_details_ph") || "Product details..."}
                      />
                      {fieldErrors.description && <p className="text-red-500 text-[11px] font-semibold mt-1">⚠ {fieldErrors.description}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">{t('chinese_translation_label')} <span className="font-normal text-slate-500">({t('optional')})</span></label>
                      <textarea
                        name="descriptionZh"
                        value={formData.descriptionZh}
                        onChange={handleChange}
                        rows={3}
                        className="w-full resize-none border border-slate-300 bg-white px-4 py-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                        placeholder={t("product_details_zh_ph") || "产品详情..."}
                      />
                    </div>
                  </div>

                  {/* Product images, video link, and listing status */}
                  <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-6 lg:grid-cols-2">
                    <div ref={imageRef} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-semibold text-slate-800">{t('product_images_title')} <span className="text-red-500">*</span></label>
                        <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">{previews.length}/10</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex min-h-24 w-full items-center justify-between gap-4 border border-dashed bg-slate-50 px-5 py-4 text-left transition-colors hover:border-sky-600 hover:bg-sky-50 ${fieldErrors.image ? 'border-red-500' : 'border-slate-300'}`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="border border-slate-200 bg-white p-2 text-slate-600"><ImageIcon size={20} /></span>
                          <span>
                            <span className="block text-sm font-medium text-slate-800">{t('product_image_select_hint')}</span>
                            <span className="mt-1 block text-xs text-slate-500">{t('product_image_requirements')}</span>
                          </span>
                        </span>
                        <span className="shrink-0 border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700">{t('inventory_browse')}</span>
                      </button>
                      <input type="file" multiple accept="image/png,image/jpeg" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                      {fieldErrors.image && <p className="text-xs font-medium text-red-600">⚠ {fieldErrors.image}</p>}
                      <AnimatePresence>
                        {previews.length > 0 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-3 pt-1">
                            {previews.map((src, idx) => (
                              <div key={idx} className="group relative aspect-square overflow-hidden border border-slate-200">
                                <img src={src} alt={`Product image ${idx + 1}`} className="h-full w-full object-cover" />
                                <button type="button" onClick={() => removeImage(idx)} aria-label={t('inventory_remove_image').replace('{number}', String(idx + 1))} className="absolute right-1 top-1 bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"><X size={12} /></button>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-800"><Video size={15} className="text-slate-500" />{t('youtube_link') || 'YouTube Video Link'} <span className="font-normal text-slate-500">({t('optional')})</span></label>
                          <div className="flex items-center gap-3">
                            <button type="button" onMouseEnter={() => setShowYoutubeGuide(true)} onMouseLeave={() => setShowYoutubeGuide(false)} className="text-slate-400 transition-colors hover:text-sky-700" aria-label={t('product_youtube_help')}><HelpCircle size={15} /></button>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-xs font-medium text-sky-700 hover:text-sky-800">{t('open_youtube') || 'Open YouTube'} ↗</a>
                          </div>
                        </div>
                        <input type="text" name="videoUrl" value={formData.videoUrl} onChange={handleChange} className="w-full border border-slate-300 bg-white px-4 py-3 text-[13px] outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="https://youtube.com/watch?v=..." />
                        <AnimatePresence>
                          {showYoutubeGuide && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-lg">
                              <p className="mb-2 font-semibold text-slate-800">{t('how_to_add_video') || 'How to Add Video'}</p>
                              <p>{t('youtube_guide_step1') || 'Open YouTube, choose a video, copy its URL, and paste it above.'}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="product-status" className="text-[13px] font-semibold text-slate-800">{t('listing_status') || 'Listing Status'}</label>
                        <select id="product-status" value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600">
                          <option value="Live">{t('live_products') || 'Live'}</option>
                          <option value="Hold">{t('hold') || 'On-hold'}</option>
                          <option value="Deactive">{t('deactive') || 'Deactive'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-2 border-b border-slate-200 pb-4 text-lg font-semibold text-slate-800">{t('product_pricing_title')}</h3>
                <div ref={stockRef} className="mb-5 max-w-sm space-y-2">
                  <label className="text-[12px] font-semibold text-zinc-800">{t('total_stock') || 'Total Stock'}<span className="text-red-500">*</span></label>
                  <input type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} className={`w-full border bg-white px-4 py-3 text-[14px] outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors.stock ? 'border-red-500' : 'border-slate-300'}`} placeholder="0" />
                </div>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><label className="text-[12px] font-semibold text-zinc-800">{t('items_per_box') || 'Items Per Box'} <span className="font-normal text-slate-500">({t('product_optional_shared')})</span></label><input type="number" min="1" name="itemsPerBox" value={formData.itemsPerBox} onChange={handleChange} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="e.g. 12" /></div>
                  <div className="space-y-2"><label className="text-[12px] font-semibold text-zinc-800">{t('items_per_bundle') || 'Items Per Bundle'} <span className="font-normal text-slate-500">({t('product_optional_shared')})</span></label><input type="number" min="2" name="bundleQuantity" value={formData.bundleQuantity} onChange={handleChange} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="e.g. 4" /></div>
                </div>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {(['A', 'B'] as const).map((group) => {
                    const singleField = group === 'A' ? 'sellerAPrice' : 'sellerBPrice';
                    const boxField = group === 'A' ? 'sellerABoxPrice' : 'sellerBBoxPrice';
                    const bundleField = group === 'A' ? 'sellerABundlePrice' : 'sellerBBundlePrice';
                    return <section key={group} className="space-y-4 border border-slate-200 bg-slate-50/60 p-5">
                      <div className="border-b border-slate-200 pb-3"><h4 className="text-base font-semibold text-slate-900">{group === 'A' ? t('product_seller_a_pricing') : t('product_seller_b_pricing')}</h4><p className="mt-1 text-xs text-slate-500">{t('product_single_price_required')}</p></div>
                      <div ref={group === 'A' ? priceRef : undefined} className="space-y-2">
                        <label className="text-xs font-semibold text-slate-800">{t('product_single_item_price')}</label>
                        <input type="number" min="0" step="0.01" name={singleField} value={formData[singleField]} onChange={handleChange} className={`w-full border bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 ${fieldErrors[singleField] ? 'border-red-500' : 'border-slate-300'}`} placeholder="0.00" />
                      </div>
                      <details className="group border-t border-slate-200 pt-3"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-700"><span>{t('product_per_box_price')} <span className="ml-1 text-xs font-normal text-slate-500">{t('product_optional')}</span></span><ChevronDown size={16} className="text-slate-500 transition-transform group-open:rotate-180" /></summary><div className="pt-3"><input aria-label={`${t('product_per_box_price')} - ${t(group === 'A' ? 'inventory_seller_a' : 'inventory_seller_b')}`} type="number" min="0" step="0.01" name={boxField} value={formData[boxField]} onChange={handleChange} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="0.00" /></div></details>
                      <details className="group border-t border-slate-200 pt-3"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-700"><span>{t('product_bundle_price')} <span className="ml-1 text-xs font-normal text-slate-500">{t('product_optional')}</span></span><ChevronDown size={16} className="text-slate-500 transition-transform group-open:rotate-180" /></summary><div className="pt-3"><input aria-label={`${t('product_bundle_price')} - ${t(group === 'A' ? 'inventory_seller_a' : 'inventory_seller_b')}`} type="number" min="0" step="0.01" name={bundleField} value={formData[bundleField]} onChange={handleChange} className="w-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" placeholder="0.00" /></div></details>
                    </section>;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => router.push('/admin/product')}
              disabled={isLoading}
              className="border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-sky-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />{t('product_data_entry_confirm')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default UploadProductPage;
