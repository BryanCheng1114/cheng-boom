import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Upload, Trash2, CheckCircle, AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../../../context/LanguageContext';

const EditCategoryPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t, language: locale } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [uploadedImage, setUploadedImage] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nameZh: '',
    nameMs: '',
    description: '',
    displayOrder: 0,
    showInCategoryBar: true,
    showInAppBar: true,
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
          description: category.description || '',
          displayOrder: category.displayOrder || 0,
          showInCategoryBar: category.showInCategoryBar !== false,
          showInAppBar: category.showInAppBar !== false,
          status: category.status || 'Live',
        });
        if (category.originalImage || category.image) {
          const imageToSet = category.originalImage || (category.image !== '/example.png' ? category.image : '');
          if (imageToSet && imageToSet !== '/example.png') {
            setUploadedImage(imageToSet);
            setSelectedImageName(imageToSet.split('/').pop() || 'Current category image');
          }
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
    const file = files[0];
    if (!/\.(png|jpe?g)$/i.test(file.name)) {
      setErrorMsg('Please select a PNG or JPG image.');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('The image must be 10MB or smaller.');
      e.target.value = '';
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSelectedImageName(file.name);

    const data = new FormData();
    data.append('files', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.urls && result.urls.length > 0) {
        setUploadedImage(result.urls[0]);
        setSelectedImageName(file.name);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to upload category image. Please try again.');
      setSelectedImageName(uploadedImage.split('/').pop() || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoGenerateCode = async () => {
    if (!formData.name.trim()) {
      setErrorMsg(t('please_input_category_name_auto_gen') || 'Please input Category Name first to auto-generate code.');
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
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
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
    <AdminLayout title={t('edit_category') || 'Edit Category'} hideTitle>
      <div className="w-full pb-8 relative">
        <header className="mb-6 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('edit_category') || 'Edit Category'}</h1>
            <span className="text-xs font-normal text-slate-700">[ Modification Screen ]</span>
          </div>
          <p className="text-xs text-slate-600">Category Information /</p>
        </header>

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
              <h4 className="text-2xl font-bold tracking-tight text-zinc-900">{t('category_updated') || 'Category Updated!'}</h4>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                {formData.name} has been updated successfully.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/category')}             
              className="px-10 py-4 bg-orange-500 text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              {t('done_return') || 'Done & Return'}
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/admin/category" className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"><ArrowLeft size={16} /> Back to Category Screen</Link>
              <button type="button" onClick={() => setShowDeleteModal(true)} className="inline-flex items-center gap-2 border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50"><Trash2 size={14} /> {t('delete_category_btn') || 'Delete Category'}</button>
            </div>
            {errorMsg && (
              <div className="flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                <AlertTriangle size={18} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {/* Left Column */}
              <div className="flex-1 space-y-6">
                {/* Basic Details */}
                <div className="bg-white p-6 md:p-8 border border-slate-200 shadow-sm">
                  <h2 className="border-b border-slate-200 pb-4 text-lg font-semibold text-slate-800">{t('category_info') || 'Category Information'}</h2>
                  <div className="mt-6 space-y-6">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-zinc-800">{t('category_name_en') || 'Category Name (English)'} <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input 
                            type="text" 
                            name="name"
                            required
                            disabled={isLoading}
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={locale === 'zh' ? '例如：外套' : locale === 'ms' ? 'cth. Jaket' : 'e.g. Track Jacket'}
                            className="w-full border border-slate-300 bg-white py-3 pl-4 pr-12 text-sm text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center bg-slate-100 text-xs font-medium text-slate-500">
                            A
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-zinc-800">{t('category_code_url') || 'Category Code (URL Key)'} <span className="text-red-500">*</span></label>
                        <div className="flex gap-2 relative">
                          <input 
                            type="text" 
                            name="code"
                            required
                            disabled={isLoading}
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="e.g. FW00001"
                            className="flex-1 border border-slate-300 bg-white py-3 pl-4 pr-24 text-sm text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                          />
                          <button
                            type="button"
                            onClick={handleAutoGenerateCode}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-50"
                          >
                            {t('auto_gen') || 'Auto-Gen'}
                          </button>
                        </div>
                        <p className="text-[11px] font-medium text-zinc-500">{t('category_code_desc') || 'Unique code for category URL (no spaces, use - or _)'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-slate-700">{t('chinese_translation_optional') || 'Chinese Translation (optional)'}</label>
                          <div className="relative">
                            <input type="text" name="nameZh" disabled={isLoading} value={formData.nameZh} onChange={handleChange} placeholder={locale === 'ms' ? 'cth. Bunga Api' : 'e.g. 高空烟花'} className="w-full border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600" />
                            <div className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center bg-slate-100 text-slate-500"><span className="text-[10px] font-medium">文A</span></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-slate-700">{locale === 'zh' ? '显示顺序（可选）' : locale === 'ms' ? 'Susunan Paparan (pilihan)' : 'Display Position (optional)'}</label>
                          <input type="number" name="displayOrder" min={0} step={1} disabled={isLoading} value={formData.displayOrder} onChange={handleChange} placeholder="0" className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" />
                          <p className="text-[11px] text-slate-500">{locale === 'zh' ? '请输入 0 或更大的整数。数字越小越靠前；相同数字按名称排序。' : locale === 'ms' ? 'Masukkan nombor bulat 0 atau lebih. Nombor lebih kecil dipaparkan dahulu; nombor sama disusun mengikut nama.' : 'Use a whole number (0 or higher). Lower numbers appear first; ties are sorted by name.'}</p>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label htmlFor="category-status" className="block text-[13px] font-medium text-slate-700">Category Status <span className="text-rose-500">*</span></label>
                          <select id="category-status" value={formData.status} required disabled={isLoading} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))} className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600">
                            <option value="">Please select</option><option value="Live">Live</option><option value="Hold">On hold</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-slate-700">{t('category_desc_optional') || 'Category Description (optional)'}</label>
                          <div className="relative">
                            <textarea name="description" disabled={isLoading} value={formData.description} onChange={handleChange} maxLength={200} placeholder={locale === 'zh' ? '输入关于此分类的简短描述...' : locale === 'ms' ? 'Masukkan penerangan ringkas...' : 'Enter a short description about this category...'} className="min-h-[130px] w-full resize-none border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600" />
                            <div className="absolute bottom-3 right-3 text-[11px] font-medium text-slate-400">{formData.description?.length || 0} / 200</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <h2 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800 md:px-8">{locale === 'zh' ? '分类显示位置' : locale === 'ms' ? 'Lokasi Paparan Kategori' : 'Category Visibility'}</h2>
                  <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-8">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="shop-visibility" className="block text-sm font-medium text-slate-700">{locale === 'zh' ? '显示在商店分类标签' : locale === 'ms' ? 'Tunjukkan dalam tab kategori kedai' : 'Show in shop category tabs'} <span className="text-rose-500">*</span></label>
                        <select id="shop-visibility" value={formData.showInCategoryBar ? 'Yes' : 'No'} required disabled={isLoading} onChange={(e) => setFormData((prev) => ({ ...prev, showInCategoryBar: e.target.value === 'Yes' }))} className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600">
                          <option value="Yes">Yes</option><option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="top-navigation-visibility" className="block text-sm font-medium text-slate-700">{locale === 'zh' ? '显示在顶部导航栏' : locale === 'ms' ? 'Tunjukkan dalam bar navigasi atas' : 'Show in top navigation'} <span className="text-rose-500">*</span></label>
                        <select id="top-navigation-visibility" value={formData.showInAppBar ? 'Yes' : 'No'} required disabled={isLoading} onChange={(e) => setFormData((prev) => ({ ...prev, showInAppBar: e.target.value === 'Yes' }))} className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600">
                          <option value="Yes">Yes</option><option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      {formData.showInAppBar && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">{t('category_photo') || 'Category Photo'}</label>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                            <div className="flex min-h-11 items-center gap-2 border border-slate-300 bg-white px-3 text-sm text-slate-600">
                              <ImageIcon size={16} className="shrink-0 text-slate-400" />
                              <span className="truncate">{selectedImageName || 'Please select a single file (PNG or JPG, limit 10MB)'}</span>
                            </div>
                            <button type="button" onClick={() => !isLoading && fileInputRef.current?.click()} disabled={isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 border border-sky-700 bg-sky-700 px-5 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:opacity-50">
                              <Upload size={16} /> Browse
                            </button>
                            <input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={() => router.push('/admin/category')} disabled={isLoading} className="border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
                  {t('cancel') || 'Cancel'}
                </button>
                <button type="submit" disabled={isLoading || !formData.name.trim() || !formData.code.trim()} className="flex items-center gap-2 bg-sky-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {isLoading ? <><span className="h-4 w-4 animate-spin border-2 border-white/20 border-t-white" />{t('saving') || 'Saving...'}</> : <><Save size={16} />{t('update_category') || 'Update Category'}</>}
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
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-white border border-zinc-200 rounded-[24px] p-8 text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{t('delete_category_title') || 'Delete Category?'}</h3>
                <p className="text-zinc-500 font-medium mb-6">
                  {t('delete_category_q') || 'Are you sure you want to delete'} <span className="font-bold text-zinc-800">"{formData.name}"</span>? {t('delete_category_warn_2') || 'After deletion, all products under this category will be hidden'} because they are no longer associated with a valid category.
                </p>
                
                <div className="flex gap-3">
                  <button 
                    disabled={isDeleting}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 rounded-xl text-[13px] font-bold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-all"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button 
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="flex-1 py-3 rounded-xl text-[13px] font-bold bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (t('confirm_delete') || 'Confirm Delete')}
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
