import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Video, Package, Tag, Info, DollarSign, Save, X, Upload, Plus as PlusIcon, HelpCircle } from 'lucide-react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import Link from 'next/link';

const EditProductPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showYoutubeGuide, setShowYoutubeGuide] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [initialImages, setInitialImages] = useState<string[]>([]);

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
    status: 'Live',
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
          
          setFormData({
            name: data.name || '',
            code: data.code || '',
            nameZh: data.nameZh || '',
            nameMs: data.nameMs || '',
            description: data.description || '',
            category: data.category || '',
            videoUrl: data.videoUrl || '',
            stock: String(data.stock || '0'),
            price: String(data.price || '0'),
            sellerPrice: String(data.sellerPrice || ''),
            promotion: String(data.promotion || ''),
            status: data.status || 'Live',
          });
          
          if (data.images) {
            setPreviews(data.images);
            setUploadedImages(data.images);
            setInitialImages(data.images);
          }
          setInitialFormData({
            name: data.name || '',
            code: data.code || '',
            nameZh: data.nameZh || '',
            nameMs: data.nameMs || '',
            description: data.description || '',
            category: data.category || '',
            videoUrl: data.videoUrl || '',
            stock: String(data.stock || '0'),
            price: String(data.price || '0'),
            sellerPrice: String(data.sellerPrice || ''),
            promotion: String(data.promotion || ''),
            status: data.status || 'Live',
          });
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

    fetchData();
  }, [id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSaving(true);
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('files', files[i]);
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
      setIsSaving(false);
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

    setIsSaving(true);

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
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
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] animate-pulse">Loading Product Data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit: ${formData.name}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin/product" className="p-3 hover:bg-zinc-500/10 text-zinc-500 rounded-full transition-all">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900">Modify Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Status Badge */}
          <div className="flex justify-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Listing Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="px-6 py-3 rounded-xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500 transition-all text-xs uppercase tracking-widest"
              >
                <option value="Live">Live</option>
                <option value="Hold">Hold</option>
                <option value="Deactive">Deactive</option>
              </select>
            </div>
          </div>

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
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Click to Upload New Images</p>
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

              <div className="space-y-2 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Video size={14} className="text-zinc-500" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">YouTube Video Link</label>
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
                    Open YouTube <ChevronRight size={12} strokeWidth={3} className="opacity-70 group-hover:opacity-100 transition-opacity" />
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
                      <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-3">How to Add Video</h4>
                      <div className="space-y-4">
                        <div className="flex gap-4 text-zinc-300 text-xs font-bold items-center">
                          <span className="w-6 h-6 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">1</span>
                          <p>Click "Open YouTube" to visit youtube.com</p>
                        </div>
                        <div className="flex gap-4 text-zinc-300 text-xs font-bold items-center">
                          <span className="w-6 h-6 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">2</span>
                          <p>Find and open the video you want to display</p>
                        </div>
                        <div className="flex gap-4 text-zinc-300 text-xs font-bold items-center">
                          <span className="w-6 h-6 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">3</span>
                          <p>Copy the URL from the browser address bar</p>
                        </div>
                        <div className="flex gap-4 text-zinc-300 text-xs font-bold items-center">
                          <span className="w-6 h-6 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">4</span>
                          <p>Paste the copied link into this input box</p>
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
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Product Code (Unique)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="code"
                    value={formData.code}
                    readOnly
                    className="flex-1 px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-zinc-500 text-zinc-400 cursor-not-allowed transition-all text-sm opacity-70" 
                    placeholder="e.g. TC00001"
                  />
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

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/product')}
              className="flex-1 py-6 bg-zinc-500/10 text-zinc-500 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-zinc-500/20 transition-all"
            >
              Cancel Changes
            </button>
            <button
              type="submit"
              disabled={isSaving || !initialFormData || (
                JSON.stringify(formData) === JSON.stringify(initialFormData) &&
                JSON.stringify(uploadedImages) === JSON.stringify(initialImages)
              )}
              className="flex-[2] py-6 bg-yellow-500 text-zinc-950 rounded-3xl font-black uppercase tracking-[0.5em] text-xs hover:brightness-110 transition-all shadow-2xl shadow-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-4"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Update Product Listing'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditProductPage;
