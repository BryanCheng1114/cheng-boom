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
  const transparentFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [preview, setPreview] = useState('');
  const [uploadedImage, setUploadedImage] = useState('');
  
  const [transparentPreview, setTransparentPreview] = useState('');
  const [uploadedTransparentImage, setUploadedTransparentImage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nameZh: '',
    nameMs: '',
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

  const handleTransparentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setErrorMsg('');

    const data = new FormData();
    data.append('files', files[0]);

    // Local Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) setTransparentPreview(event.target.result as string);
    };
    reader.readAsDataURL(files[0]);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.urls && result.urls.length > 0) {
        setUploadedTransparentImage(result.urls[0]);
        setTransparentPreview(result.urls[0]);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to upload transparent image. Please try again.');
      setTransparentPreview('');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    setPreview('');
    setUploadedImage('');
  };

  const removeTransparentImage = () => {
    setTransparentPreview('');
    setUploadedTransparentImage('');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData(prev => ({ ...prev, name: value }));
    } else if (name === 'code') {
      const cleanCode = value.replace(/[^a-zA-Z0-9-_]/g, '');
      setFormData(prev => ({ ...prev, code: cleanCode }));
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
          transparentImage: uploadedTransparentImage || null,
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin/product" className="p-3 hover:bg-zinc-500/10 text-zinc-500 rounded-full transition-all">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black italic uppercase tracking-tight  text-zinc-900">{t('upload_new_category')}</h1>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white  p-12 rounded-[48px] border  border-zinc-100 shadow-xl text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-[28px] flex items-center justify-center mx-auto border border-green-500/20">
              <CheckCircle size={40} />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-black italic uppercase tracking-tight  text-zinc-900">{t('category_created')}</h4>
              <p className="text-zinc-500  text-sm max-w-md mx-auto">
                {formData.name}
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/product')}
              className="px-10 py-4 bg-yellow-500 text-zinc-950 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-yellow-500/10"
            >
              {t('done_return')}
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {errorMsg && (
              <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500  text-sm font-semibold">
                <AlertTriangle size={18} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Visual Assets */}
            <div className="bg-white  p-8 rounded-[48px] border  border-zinc-100 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                  <ImageIcon size={18} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('visual_assets')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Banner Image */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('upload_banner') || 'Banner Image'}</h4>
                  <div className="relative h-72 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4  bg-zinc-50  border-zinc-200 overflow-hidden">
                    {preview ? (
                      <>
                        <img src={preview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-all backdrop-blur-sm">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              !isLoading && fileInputRef.current?.click();
                            }}
                            className="w-16 h-16 bg-white text-zinc-900 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-2xl"
                            title="Re-upload Image"
                          >
                            <Upload size={24} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div 
                        className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-yellow-500/50 transition-all group"
                        onClick={() => !isLoading && fileInputRef.current?.click()}
                      >
                        <div className="p-4 bg-zinc-950 rounded-2xl text-zinc-500 group-hover:text-yellow-500 transition-colors">
                          <Upload size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Banner Image</p>
                          <p className="text-[9px] text-zinc-500 mt-1 font-medium italic">Max 10MB. PNG, JPG.</p>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden" 
                    />
                  </div>
                </div>

                {/* Transparent Image */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Transparent Image</h4>
                  <div className="relative h-72 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4  bg-zinc-50  border-zinc-200 overflow-hidden">
                    {transparentPreview ? (
                      <>
                        <div className="absolute inset-0 bg-zinc-800" />
                        <img src={transparentPreview} className="w-full h-full object-contain relative z-10" />
                        <div className="absolute inset-0 z-20 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-all backdrop-blur-sm">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              !isLoading && transparentFileInputRef.current?.click();
                            }}
                            className="w-16 h-16 bg-white text-zinc-900 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-2xl"
                            title="Re-upload Image"
                          >
                            <Upload size={24} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div 
                        className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-yellow-500/50 transition-all group"
                        onClick={() => !isLoading && transparentFileInputRef.current?.click()}
                      >
                        <div className="p-4 bg-zinc-950 rounded-2xl text-zinc-500 group-hover:text-yellow-500 transition-colors">
                          <Upload size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Transparent Image</p>
                          <p className="text-[9px] text-zinc-500 mt-1 font-medium italic">Max 10MB. PNG recommended.</p>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={transparentFileInputRef}
                      onChange={handleTransparentFileSelect}
                      className="hidden" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Identity */}
            <div className="bg-white  p-8 rounded-[48px] border  border-zinc-100 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Info size={18} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('category_identity')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category English Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('category_name_en')} *</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    disabled={isLoading}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Skyline"
                    className="w-full px-6 py-4 rounded-2xl border outline-none font-bold  bg-zinc-100  border-zinc-200  text-zinc-900 focus:border-yellow-500 transition-all text-sm"
                  />
                </div>

                {/* Category URL Code */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('category_code')} *</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="code"
                      required
                      disabled={isLoading}
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="e.g. FW00001"
                      className="flex-1 px-6 py-4 rounded-2xl border outline-none font-bold  bg-zinc-100  border-zinc-200  text-zinc-900 focus:border-yellow-500 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="px-6 py-4 bg-zinc-800 hover:bg-zinc-750 text-white hover:text-yellow-500 font-bold text-[10px] uppercase tracking-wider rounded-2xl transition-all border border-zinc-700/50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <span>{t('auto_gen')}</span>
                    </button>
                  </div>
                </div>

                {/* Chinese Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('chinese_translation')}</label>
                  <input 
                    type="text" 
                    name="nameZh"
                    disabled={isLoading}
                    value={formData.nameZh}
                    onChange={handleChange}
                    placeholder="e.g. 高空烟花"
                    className="w-full px-6 py-4 rounded-2xl border outline-none font-bold  bg-zinc-100  border-zinc-200  text-zinc-900 focus:border-yellow-500 transition-all text-sm"
                  />
                </div>



              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => router.push('/admin/product')}
                disabled={isLoading}
                className="w-1/3 py-4 bg-zinc-200  text-zinc-600  rounded-[24px] font-bold text-sm hover:bg-zinc-300 :bg-zinc-700 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button 
                type="submit" 
                disabled={isLoading || !formData.name.trim() || !formData.code.trim()}
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
        )}
      </div>
    </AdminLayout>
  );
};

export default UploadCategoryPage;
