import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Image as ImageIcon, Info, X, Upload, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../../../context/LanguageContext';

const EditCategoryPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transparentFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    status: 'Live',
  });

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      const res = await fetch('/api/categories');
      const categories = await res.json();
      const category = categories.find((c: any) => c.id === id);
      if (category) {
        setFormData({
          name: category.name || '',
          code: category.code || '',
          nameZh: category.nameZh || '',
          nameMs: category.nameMs || '',
          status: category.status || 'Live',
        });
        if (category.originalImage || category.image) {
          const imageToSet = category.originalImage || (category.image !== '/example.png' ? category.image : '');
          if (imageToSet && imageToSet !== '/example.png') {
            setUploadedImage(imageToSet);
            setPreview(imageToSet);
          }
        }
        if (category.transparentImage) {
          setUploadedTransparentImage(category.transparentImage);
          setTransparentPreview(category.transparentImage);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load category data.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setErrorMsg('');

    const data = new FormData();
    data.append('files', files[0]);

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
      let letters = formData.name.trim().replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
      if (letters.length < 2) {
        letters = letters.padEnd(2, 'W');
      }
      
      const res = await fetch('/api/categories');
      const categories = await res.json();
      
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
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: uploadedImage || null,
          transparentImage: uploadedTransparentImage || null,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        router.push('/admin/category?updated=true');
      } else {
        setErrorMsg(result.error || 'Failed to update category.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/admin/category');
      } else {
        const result = await response.json();
        setErrorMsg(result.error || 'Failed to delete category.');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error occurred while deleting.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout title="Edit Category">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/admin/category" className="p-3 hover:bg-zinc-500/10 text-zinc-500 rounded-full transition-all">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-3xl font-black italic uppercase tracking-tight  text-zinc-900">Edit Category</h1>
          </div>
          <button 
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
          >
            <Trash2 size={16} />
            Delete Category
          </button>
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
              <h4 className="text-2xl font-black italic uppercase tracking-tight  text-zinc-900">Category Updated</h4>
              <p className="text-zinc-500  text-sm max-w-md mx-auto">
                {formData.name} has been updated successfully.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/product/category')}              
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

            {/* Status Setting */}
            <div className="bg-white p-8 rounded-[48px] border border-zinc-100 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                  <AlertTriangle size={18} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Category Status</h2>
              </div>
              <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-200">
                <div>
                  <h3 className="text-[14px] font-bold text-zinc-800 tracking-wide">On-Hold Category</h3>
                  <p className="text-[12px] font-medium text-zinc-500 mt-1">Hide this category and all its products from the frontend.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Hold' ? 'Live' : 'Hold' }))}
                  className={`relative w-14 h-8 rounded-full transition-colors ${formData.status === 'Hold' ? 'bg-orange-500' : 'bg-zinc-300'}`}
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${formData.status === 'Hold' ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => router.push('/admin/category')}
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
                  "Update Category"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowDeleteModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[48px] p-12 text-center shadow-2xl"
              >
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                  <AlertTriangle size={40} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4 text-white">Permanent Deletion</h3>
                <p className="text-zinc-400 font-medium mb-10 leading-relaxed">
                  Are you sure you want to delete this category? 
                  <br/><br/>
                  <span className="text-white font-bold">After delete, all the products under this category will be hidden</span> 
                  because they are no longer associated with a valid category. You will need to re-assign them to a new category to make them live again.
                </p>
                
                <div className="flex gap-4">
                  <button 
                    disabled={isDeleting}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Confirm Delete"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default EditCategoryPage;
