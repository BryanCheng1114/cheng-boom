import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Image as ImageIcon, Upload, AlertTriangle, Plus, Save, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';

const UploadCategoryPage = () => {
  const router = useRouter();
  const { t, language: locale } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  
  const [uploadedImage, setUploadedImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nameZh: '',
    nameMs: '',
    description: '',
    displayOrder: 0,
    showInCategoryBar: null as boolean | null,
    showInAppBar: null as boolean | null,
    status: '',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedFile = /\.(png|jpe?g)$/i.test(file.name);
    if (!allowedFile) {
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
    setUploadedImage('');
    setImagePreview(URL.createObjectURL(file));
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
        setImagePreview(result.urls[0]);
        setSelectedImageName(file.name);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to upload banner image. Please try again.');
      setSelectedImageName('');
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
    if (!formData.status) {
      setErrorMsg('Please select whether this category is on hold.');
      return;
    }
    if (formData.showInCategoryBar === null || formData.showInAppBar === null) {
      setErrorMsg('Please select the visibility for both category locations.');
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
        setShowContinuePrompt(true);
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
    <AdminLayout title={t('upload_new_category')} hideTitle>
      <div className="w-full pb-8 relative">
          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <header className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('upload_new_category') || 'Upload New Category'}</h1>
                <span className="text-xs font-normal text-slate-700">[ {t('new_entry_screen')} ]</span>
              </div>
              <p className="text-xs text-slate-600">{t('category_info')} /</p>
            </header>
            <Link href="/admin/category" className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
              <ArrowLeft size={17} />
              {t('back_to_category_screen')}
            </Link>
            {errorMsg && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                <AlertTriangle size={18} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 items-start">
              {/* Left Column */}
              <div className="min-w-0 space-y-6">
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
                            className="w-full pl-4 pr-12 py-3 border border-slate-300 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors text-sm text-slate-800 bg-white"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium">
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
                            className="flex-1 pl-4 pr-24 py-3 border border-slate-300 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors text-sm text-slate-800 bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAutoGenerateCode}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sky-700 font-medium text-xs hover:bg-sky-50 transition-colors"
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
                          <label className="text-[13px] font-medium text-slate-700">{t('display_order_optional')}</label>
                          <input type="number" name="displayOrder" min={0} step={1} disabled={isLoading} value={formData.displayOrder} onChange={handleChange} placeholder="0" className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" />
                          <p className="text-[11px] text-slate-500">{locale === 'zh' ? '请输入 0 或更大的整数。数字越小越靠前；相同数字按名称排序。' : locale === 'ms' ? 'Masukkan nombor bulat 0 atau lebih. Nombor lebih kecil dipaparkan dahulu; nombor sama disusun mengikut nama.' : 'Use a whole number (0 or higher). Lower numbers appear first; ties are sorted by name.'}</p>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label htmlFor="category-status" className="block text-[13px] font-medium text-slate-700">{t('category_status')} <span className="text-rose-500">*</span></label>
                          <select id="category-status" value={formData.status} required disabled={isLoading} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))} className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600">
                            <option value="">{t('please_select')}</option><option value="Live">{t('live')}</option><option value="Hold">{t('hold')}</option>
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
                        <select id="shop-visibility" value={formData.showInCategoryBar === null ? '' : formData.showInCategoryBar ? 'Yes' : 'No'} required disabled={isLoading} onChange={(e) => setFormData((prev) => ({ ...prev, showInCategoryBar: e.target.value === '' ? null : e.target.value === 'Yes' }))} className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600">
                          <option value="">{t('please_select')}</option><option value="Yes">{t('yes')}</option><option value="No">{t('no_label')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="top-navigation-visibility" className="block text-sm font-medium text-slate-700">{locale === 'zh' ? '显示在顶部导航栏' : locale === 'ms' ? 'Tunjukkan dalam bar navigasi atas' : 'Show in top navigation'} <span className="text-rose-500">*</span></label>
                        <select id="top-navigation-visibility" value={formData.showInAppBar === null ? '' : formData.showInAppBar ? 'Yes' : 'No'} required disabled={isLoading} onChange={(e) => setFormData((prev) => ({ ...prev, showInAppBar: e.target.value === '' ? null : e.target.value === 'Yes' }))} className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600">
                          <option value="">{t('please_select')}</option><option value="Yes">{t('yes')}</option><option value="No">{t('no_label')}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      {formData.showInAppBar === true && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">{t('category_photo') || 'Category Photo'}</label>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                            <div className="flex min-h-11 items-center gap-2 border border-slate-300 bg-white px-3 text-sm text-slate-600">
                              <ImageIcon size={16} className="shrink-0 text-slate-400" />
                              <span className="truncate">{selectedImageName || t('select_category_image_hint')}</span>
                            </div>
                            <button type="button" onClick={() => !isLoading && fileInputRef.current?.click()} disabled={isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 border border-sky-700 bg-sky-700 px-5 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:opacity-50">
                              <Upload size={16} /> {t('browse')}
                            </button>
                            <input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                          </div>
                          {imagePreview && (
                            <figure className="mt-4 border border-slate-200 bg-slate-50 p-3">
                              <figcaption className="mb-2 text-xs font-semibold text-slate-600">{t('image_preview')} · {selectedImageName}</figcaption>
                              <img src={imagePreview} alt={selectedImageName || t('image_preview')} className="max-h-56 w-full object-contain" />
                            </figure>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
            </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button 
                  type="button" 
                  onClick={() => router.push('/admin/category')}
                  disabled={isLoading}
                  className="px-4 sm:px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || !formData.name.trim() || !formData.code.trim()}
                  className="justify-center px-4 sm:px-7 py-3 bg-sky-700 text-white font-medium text-sm hover:bg-sky-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {t('data_entry_confirm')}
                    </>
                  )}
                </button>
            </div>
          </form>
        {showContinuePrompt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="continue-category-title" className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700"><Save size={19} /></div>
              <h2 id="continue-category-title" className="text-lg font-semibold text-slate-800">{t('category_created')}</h2>
              <p className="mt-2 text-sm text-slate-600">{t('continue_adding_category')}</p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => router.push('/admin/category')} className="border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">{t('no_return_categories')}</button>
                <button type="button" onClick={() => { setFormData({ name: '', code: '', nameZh: '', nameMs: '', description: '', displayOrder: 0, showInCategoryBar: null, showInAppBar: null, status: '' }); setSelectedImageName(''); setUploadedImage(''); setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; setErrorMsg(''); setShowContinuePrompt(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 border border-sky-700 bg-sky-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-800"><Plus size={16} /> {t('yes_add_another_category')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UploadCategoryPage;
