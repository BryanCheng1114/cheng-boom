import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Image as ImageIcon, Video, Package, Tag, Info, DollarSign, X, Upload, Plus as PlusIcon } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';

const UploadProductPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nameZh: '',
    nameMs: '',
    description: '',
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
    if (uploadedImages.length === 0) {
      alert('Please upload at least one image');
      return;
    }
    if (!formData.category) {
      alert('Please select a category');
      return;
    }
    if (!formData.code || !formData.code.trim()) {
      alert('Product code is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: uploadedImages,
        }),
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
    <AdminLayout title="Upload Product">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin/product" className="p-3 hover:bg-zinc-500/10 text-zinc-500 rounded-full transition-all">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900">Upload New Item</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Section */}
          <div className="bg-white dark:bg-zinc-900/40 p-8 rounded-[48px] border dark:border-white/10 border-zinc-100 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><ImageIcon size={18} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Visual Assets</h2>
            </div>
            
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-48 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 dark:bg-black/20 bg-zinc-50 dark:border-white/10 border-zinc-200 cursor-pointer hover:border-yellow-500/50 transition-all group"
              >
                <div className="p-4 bg-zinc-950 rounded-2xl text-zinc-500 group-hover:text-yellow-500 transition-colors">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Click to Select Multiple Images</p>
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
                      <span className="text-[8px] font-black uppercase tracking-widest mt-2">Add More</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Video size={14} className="text-zinc-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">YouTube Video Link</label>
                </div>
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
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Product Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product English Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Product Name (English) *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm" 
                  placeholder="e.g. Thunder Clap"
                  required
                />
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Category *</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm cursor-pointer"
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Product Code */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Product Code (Unique) *</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="flex-1 px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm" 
                    placeholder="e.g. TC00001"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="px-6 py-4 bg-zinc-850 hover:bg-zinc-800 text-white hover:text-yellow-500 font-bold text-[10px] uppercase tracking-wider rounded-2xl transition-all border border-zinc-700/50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Auto-Gen</span>
                  </button>
                </div>
              </div>

              {/* Chinese Translation */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Chinese Translation (optional)</label>
                <input 
                  type="text" 
                  name="nameZh"
                  value={formData.nameZh || ''}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm" 
                  placeholder="e.g. 雷霆万钧"
                />
              </div>

              {/* Malay Translation */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Malay Translation (optional)</label>
                <input 
                  type="text" 
                  name="nameMs"
                  value={formData.nameMs || ''}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm" 
                  placeholder="e.g. Tepukan Petir"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Item Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold min-h-[120px] dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-sm" 
                  placeholder="Detail information..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white dark:bg-zinc-900/40 p-8 rounded-[48px] border dark:border-white/10 border-zinc-100 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><DollarSign size={18} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Inventory & Commerce</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Quantity Stock */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={14} className="text-zinc-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Quantity Stock</label>
                </div>
                <input 
                  type="number" 
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 text-sm" 
                  required
                />
              </div>

              {/* Original Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={14} className="text-zinc-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Original Price (RM)</label>
                </div>
                <input 
                  type="text" 
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 text-sm" 
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Seller Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-zinc-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Seller Price (RM)</label>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Sale Price (RM)</label>
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

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-5 bg-yellow-500 text-zinc-950 rounded-[24px] font-bold text-sm hover:brightness-110 transition-all shadow-2xl shadow-yellow-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              'CONFIRM UPLOAD'
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default UploadProductPage;
