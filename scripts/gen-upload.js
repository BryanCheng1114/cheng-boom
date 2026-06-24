const fs = require('fs');
const path = require('path');

const uploadCode = `
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Video, Package, Tag, Info, DollarSign, X, Upload, Plus as PlusIcon, HelpCircle, Activity, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
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
    price: '',
    sellerPrice: '',
    promotion: '',
    boxPrice: '',
    itemsPerBox: '',
    boxSellerPrice: '',
    boxPromotion: '',
    bundleQuantity: '',
    bundlePrice: '',
    bundleSellerPrice: '',
    bundlePromotion: '',
    status: 'Live',
  });

  const handleAutoGenerateCode = async () => {
    if (!formData.name.trim()) {
      alert(t('please_input_name_auto_gen'));
      return;
    }
    
    try {
      const initials = formData.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      const res = await fetch(\`/api/products/generate-code?prefix=\${initials}\`);
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
        alert(\`\${files[i].name} exceeds 10MB limit\`);
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
      <div className="max-w-7xl mx-auto pb-24 relative">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin/product" className="p-3 hover:bg-zinc-500/10 text-zinc-500 rounded-full transition-all">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-zinc-900">{t('upload_new_item')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {Object.keys(fieldErrors).length > 0 && (
            <div className="flex items-center gap-3 p-5 bg-red-50 text-red-500 text-sm font-semibold rounded-2xl border border-red-100">
              <AlertTriangle size={18} className="shrink-0" />
              Please fill in all required fields marked in red.
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column */}
            <div className="flex-1 space-y-6">
              
              {/* Basic Details */}
              <div className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm">
                <h3 className="text-[16px] font-bold text-zinc-900 mb-6">Product Information</h3>
                <div className="space-y-6">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div ref={nameRef} className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">{t('product_name_en')} <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={(e) => { handleChange(e); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }}
                        className={\`w-full px-4 py-3 rounded-xl border outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white \${
                          fieldErrors.name ? 'border-red-500' : 'border-zinc-200'
                        }\`}
                        placeholder="e.g. Thunder Clap"
                      />
                      {fieldErrors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">⚠ {fieldErrors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">{t('chinese_translation')} (optional)</label>
                      <input 
                        type="text" 
                        name="nameZh"
                        value={formData.nameZh}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white" 
                        placeholder="e.g. 雷霆万钧"
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
                        className={\`w-full px-4 py-3 rounded-xl border outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white cursor-pointer \${
                          fieldErrors.category ? 'border-red-500' : 'border-zinc-200'
                        }\`}
                      >
                        <option value="">{t('choose_category')}</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                      {fieldErrors.category && <p className="text-red-500 text-[11px] font-semibold mt-1">⚠ {fieldErrors.category}</p>}
                    </div>

                    <div ref={codeRef} className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">Product Code <span className="text-red-500">*</span></label>
                      <div className="flex gap-2 relative">
                        <input 
                          type="text" 
                          name="code"
                          value={formData.code}
                          onChange={(e) => { handleChange(e); if (fieldErrors.code) setFieldErrors(p => ({ ...p, code: '' })); }}
                          className={\`flex-1 pl-4 pr-24 py-3 rounded-xl border outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white \${
                            fieldErrors.code ? 'border-red-500' : 'border-zinc-200'
                          }\`}
                          placeholder="e.g. TC00001"
                        />
                        <button
                          type="button"
                          onClick={handleAutoGenerateCode}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-orange-500 font-bold text-[12px] hover:bg-orange-50 rounded-md transition-all"
                        >
                          Auto-Gen
                        </button>
                      </div>
                      {fieldErrors.code && <p className="text-red-500 text-[11px] font-semibold mt-1">⚠ {fieldErrors.code}</p>}
                    </div>
                  </div>
                  
                  {/* Descriptions */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-zinc-800">{t('description_en')} (optional)</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white resize-none" 
                      placeholder="Product details..."
                    />
                  </div>
                </div>
              </div>

              {/* Single Pricing & Stock */}
              <div className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm">
                <h3 className="text-[16px] font-bold text-zinc-900 mb-6">Single Item Pricing & Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div ref={stockRef} className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Total Stock <span className="text-red-500">*</span></label>
                    <input 
                      type="number" min="0" name="stock" value={formData.stock} onChange={handleChange}
                      className={\`w-full px-4 py-3 rounded-xl border outline-none text-[14px] bg-white \${fieldErrors.stock ? 'border-red-500' : 'border-zinc-200'}\`} placeholder="0"
                    />
                  </div>
                  <div ref={priceRef} className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Normal Price ($) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange}
                      className={\`w-full px-4 py-3 rounded-xl border outline-none text-[14px] bg-white \${fieldErrors.price ? 'border-red-500' : 'border-zinc-200'}\`} placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Agent Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" name="sellerPrice" value={formData.sellerPrice} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Promo Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" name="promotion" value={formData.promotion} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Box Pricing */}
              <div className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm">
                <h3 className="text-[16px] font-bold text-zinc-900 mb-6">Per Box Pricing (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Items Per Box</label>
                    <input 
                      type="number" min="0" name="itemsPerBox" value={formData.itemsPerBox} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Box Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" name="boxPrice" value={formData.boxPrice} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Box Agent Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" name="boxSellerPrice" value={formData.boxSellerPrice} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Box Promo Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" name="boxPromotion" value={formData.boxPromotion} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              {/* Bundle Pricing */}
              <div className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm">
                <h3 className="text-[16px] font-bold text-zinc-900 mb-6">Bundle Set Pricing (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Items Per Bundle</label>
                    <input 
                      type="number" min="0" name="bundleQuantity" value={formData.bundleQuantity} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="e.g. 4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Bundle Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" name="bundlePrice" value={formData.bundlePrice} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="100.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Bundle Agent Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" name="bundleSellerPrice" value={formData.bundleSellerPrice} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="90.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-zinc-800">Bundle Promo Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" name="bundlePromotion" value={formData.bundlePromotion} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[14px] bg-white" placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="w-full lg:w-[360px] xl:w-[400px] space-y-6">
              
              {/* Images */}
              <div ref={imageRef} className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-zinc-900">Visual Assets <span className="text-red-500">*</span></h3>
                  <span className="text-[11px] font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">{previews.length}/10</span>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={\`h-48 border-2 border-dashed rounded-[16px] flex flex-col items-center justify-center gap-3 bg-zinc-50 cursor-pointer hover:border-yellow-500/50 transition-all group \${
                    fieldErrors.image ? 'border-red-500 animate-pulse' : 'border-zinc-200'
                  }\`}
                >
                  <div className="p-3 bg-white shadow-sm rounded-xl text-zinc-400 group-hover:text-yellow-500 transition-colors">
                    <ImageIcon size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-bold text-zinc-600">Click to upload images</p>
                    <p className="text-[10px] text-zinc-400 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  <input 
                    type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" 
                  />
                </div>
                {fieldErrors.image && <p className="text-red-500 text-xs font-bold mt-2">⚠ {fieldErrors.image}</p>}

                <AnimatePresence>
                  {previews.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-3 gap-3 mt-4"
                    >
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 group">
                          <img src={src} className="w-full h-full object-cover" />
                          <button 
                            type="button" onClick={() => removeImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Youtube Link */}
                <div className="mt-6 pt-6 border-t border-zinc-100 space-y-2">
                  <label className="text-[12px] font-semibold text-zinc-800 flex items-center justify-between">
                    <span>Youtube Video Link</span>
                    <HelpCircle size={14} className="text-zinc-400 cursor-pointer hover:text-yellow-500" />
                  </label>
                  <input 
                    type="text" 
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-[13px] bg-zinc-50" 
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>

              {/* Listing Status */}
              <div className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm">
                <h3 className="text-[16px] font-bold text-zinc-900 mb-4">Listing Status</h3>
                
                <div className="flex flex-col gap-2">
                  {['Live', 'Hold', 'Deactive'].map((status) => {
                    const isActive = formData.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status }))}
                        className={\`flex items-center gap-3 p-4 rounded-xl border transition-all text-left \${
                          isActive 
                            ? status === 'Live' ? 'bg-green-50/50 border-green-500 shadow-sm shadow-green-500/10' 
                            : status === 'Hold' ? 'bg-orange-50/50 border-orange-500 shadow-sm shadow-orange-500/10' 
                            : 'bg-red-50/50 border-red-500 shadow-sm shadow-red-500/10'
                            : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                        }\`}
                      >
                        <div className={\`w-4 h-4 rounded-full border-2 flex items-center justify-center \${
                          isActive 
                            ? status === 'Live' ? 'border-green-500' : status === 'Hold' ? 'border-orange-500' : 'border-red-500'
                            : 'border-zinc-300'
                        }\`}>
                          {isActive && <div className={\`w-2 h-2 rounded-full \${status === 'Live' ? 'bg-green-500' : status === 'Hold' ? 'bg-orange-500' : 'bg-red-500'}\`} />}
                        </div>
                        <span className={\`text-[13px] font-bold \${
                          isActive 
                            ? status === 'Live' ? 'text-green-700' : status === 'Hold' ? 'text-orange-700' : 'text-red-700'
                            : 'text-zinc-600'
                        }\`}>
                          {t(status === 'Live' ? 'live_products' : status === 'Hold' ? 'hold' : 'deactive')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Actions */}
          <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-white/80 backdrop-blur-md border-t border-zinc-200 p-4">
            <div className="w-full flex items-center justify-end gap-4 px-6">
              <button 
                type="button" 
                onClick={() => router.push('/admin/product')}
                disabled={isLoading}
                className="px-8 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold text-[13px] hover:bg-zinc-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold text-[13px] hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={16} />
                    Confirm Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default UploadProductPage;
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'pages', 'admin', 'product', 'upload.tsx'), uploadCode);
console.log('Upload page generated!');
