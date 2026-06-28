import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Image as ImageIcon, Package, Info, X, Upload, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';

const UploadCategoryPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [preview, setPreview] = useState('');
  const [uploadedImage, setUploadedImage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nameZh: '',
    nameMs: '',
    description: '',
    displayOrder: 0,
    status: 'Live',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setErrorMsg('');

    const data = new FormData();
    data.append('files', files[0]);

    // Local Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) setPreview(event.target.result as string);
    };
    reader.readAsDataURL(files[0]);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.urls && result.urls.length > 0) {
        setUploadedImage(result.urls[0]);
        setPreview(result.urls[0]);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to upload banner image. Please try again.');
      setPreview('');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    setPreview('');
    setUploadedImage('');
  };

  const handleAutoGenerateCode = async () => {
    if (!formData.name.trim()) {
      setErrorMsg('Please input Category Name first to auto-generate code.');
      return;
    }

    try {
      // 1. Extract first two alphabetic letters, capitalized
      let letters = formData.name.trim().replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
      if (letters.length < 2) {
        letters = letters.padEnd(2, 'W'); // e.g. "F" -> "FW"
      }
      
      // 2. Fetch all existing categories to get current length and ensure uniqueness
      const res = await fetch('/api/categories');
      const categories = await res.json();
      
      // 3. Format next unique suffix (e.g. "00001", "00002", etc.)
      const count = categories.length;
      const nextNum = (count + 1).toString().padStart(5, '0');
      const generated = `${letters}${nextNum}`;

      setFormData(prev => ({ ...prev, code: generated }));
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to auto-generate category code.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData(prev => ({ ...prev, name: value }));
    } else if (name === 'code') {
      const cleanCode = value.replace(/[^a-zA-Z0-9-_]/g, '');
      setFormData(prev => ({ ...prev, code: cleanCode }));
    } else if (name === 'displayOrder') {
      setFormData(prev => ({ ...prev, displayOrder: value ? Number(value) : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Category Name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setErrorMsg('Category Code is required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: uploadedImage || null,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(result.error || 'Failed to create category.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title={t('upload_new_category')}>
      <div className="w-full pb-24 relative">

        {/* Top Info Box */}
        <div className="bg-white p-5 rounded-[20px] border border-zinc-200 shadow-sm mb-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-zinc-900">Create New Category</h2>
            <p className="text-[13px] text-zinc-500 mt-1">Add a new product category to organize your inventory and help customers find products easily.</p>
          </div>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[32px] border border-zinc-200/80 shadow-sm text-center space-y-6 max-w-2xl mx-auto mt-12"
          >
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-[24px] flex items-center justify-center mx-auto border border-green-500/20">
              <CheckCircle size={40} />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-bold tracking-tight text-zinc-900">Category Created!</h4>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                {formData.name} has been created successfully.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/category')}             
              className="px-10 py-4 bg-orange-500 text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              Done & Return
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative">
            {errorMsg && (
              <div className="flex items-center gap-3 p-5 bg-red-50 text-red-500 text-sm font-semibold rounded-2xl border border-red-100">
                <AlertTriangle size={18} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column */}
              <div className="flex-1 space-y-6">
                {/* Basic Details */}
                <div className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm">
                  <h3 className="text-[16px] font-bold text-zinc-900 mb-6">Category Information</h3>
                  <div className="space-y-6">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-zinc-800">Category Name (English) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input 
                            type="text" 
                            name="name"
                            required
                            disabled={isLoading}
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Track Jacket"
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-50 text-indigo-500 rounded-md flex items-center justify-center text-xs font-bold">
                            A
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-zinc-800">Category Code (URL Key) <span className="text-red-500">*</span></label>
                        <div className="flex gap-2 relative">
                          <input 
                            type="text" 
                            name="code"
                            required
                            disabled={isLoading}
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="e.g. FW00001"
                            className="flex-1 pl-4 pr-24 py-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAutoGenerateCode}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-orange-500 font-bold text-[12px] hover:bg-orange-50 rounded-md transition-all"
                          >
                            Auto-Gen
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-400">Unique code for category URL (no spaces, use - or _)</p>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-zinc-800">Chinese Translation (optional)</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            name="nameZh"
                            disabled={isLoading}
                            value={formData.nameZh}
                            onChange={handleChange}
                            placeholder="e.g. 高空烟花"
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-zinc-100 text-zinc-500 rounded-md flex items-center justify-center">
                            <span className="text-[10px] font-bold">文A</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-zinc-800">Display Order (optional)</label>
                        <input 
                          type="number" 
                          name="displayOrder"
                          disabled={isLoading}
                          value={formData.displayOrder}
                          onChange={handleChange}
                          placeholder="0"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white"
                        />
                        <p className="text-[11px] text-zinc-400">Lower numbers appear first</p>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-800">Category Description (optional)</label>
                      <div className="relative">
                        <textarea
                          name="description"
                          disabled={isLoading}
                          value={formData.description}
                          onChange={handleChange}
                          maxLength={200}
                          placeholder="Enter a short description about this category..."
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-400 transition-all text-[14px] text-zinc-900 bg-white min-h-[130px] resize-none"
                        />
                        <div className="absolute bottom-3 right-3 text-[11px] font-medium text-zinc-400">
                          {formData.description?.length || 0} / 200
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Setting */}
                <div className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold text-zinc-900">On-Hold Category</h3>
                      <p className="text-[13px] text-zinc-500 mt-1">Hide this category and all its products from the frontend.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Hold' ? 'Live' : 'Hold' }))}
                      className={`relative w-[48px] h-7 rounded-full transition-colors shrink-0 ${formData.status === 'Hold' ? 'bg-orange-500' : 'bg-zinc-200'}`}
                    >
                      <div className={`absolute top-[2px] w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-all ${formData.status === 'Hold' ? 'left-[22px]' : 'left-[2px]'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 space-y-6">
                {/* Visual Assets */}
                <div className="bg-white p-6 md:p-8 rounded-[20px] border border-zinc-200 shadow-sm flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-[16px] font-bold text-zinc-900">Category Photo</h3>
                    <p className="text-[13px] text-zinc-500 mt-1">Upload a photo that represents this category</p>
                  </div>
                  
                  <div className="relative h-[180px] border border-dashed rounded-[20px] flex flex-col items-center justify-center gap-4 bg-zinc-50/50 border-zinc-300 overflow-hidden shrink-0">
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-zinc-50 transition-all group"
                      onClick={() => !isLoading && fileInputRef.current?.click()}
                    >
                      <div className="text-zinc-400 group-hover:text-zinc-600 transition-colors">
                        <Upload size={28} strokeWidth={1.5} />
                      </div>
                      <div className="text-center px-6">
                        <p className="text-[13px] font-semibold text-zinc-700">Drag & drop your image here</p>
                        <p className="text-[13px] text-zinc-500 mt-1">or click to browse</p>
                        <p className="text-[11px] text-zinc-400 mt-3 font-medium">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden" 
                    />
                  </div>

                  <div className="mt-8 flex-1 flex flex-col">
                    <h4 className="text-[14px] font-bold text-zinc-900 mb-4">Image Preview</h4>
                    <div className="flex-1 bg-zinc-50 rounded-[16px] flex items-center justify-center min-h-[140px] border border-zinc-100 mb-6 relative overflow-hidden">
                      {preview ? (
                        <>
                          <img src={preview} className="absolute inset-0 w-full h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-white/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-all backdrop-blur-sm">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                !isLoading && fileInputRef.current?.click();
                              }}
                              className="w-12 h-12 bg-white text-zinc-900 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all border border-zinc-100"
                              title="Re-upload Image"
                            >
                              <Upload size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-300">
                          <ImageIcon size={36} strokeWidth={1.5} />
                          <span className="text-[12px] font-medium text-zinc-400">Image preview will appear here</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-orange-50 rounded-[16px] p-5 border border-orange-100">
                      <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.45.62 2.84 1.5 3.5.76.76 1.23 1.52 1.41 2.5"></path></svg>
                        <span className="text-[13px] font-bold">Tips</span>
                      </div>
                      <p className="text-[12px] text-orange-700/80 leading-relaxed font-medium">
                        Use a clear image that best represents the category.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-white/80 backdrop-blur-md border-t border-zinc-200 p-4">
              <div className="w-full flex items-center justify-end gap-4 px-6">
                <button 
                  type="button" 
                  onClick={() => router.push('/admin/category')}
                  disabled={isLoading}
                  className="px-8 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold text-[13px] hover:bg-zinc-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || !formData.name.trim() || !formData.code.trim()}
                  className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold text-[13px] hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      Confirm Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default UploadCategoryPage;
