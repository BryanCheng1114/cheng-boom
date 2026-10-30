import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Save, Upload, Image as ImageIcon, Building, Phone, Mail, MapPin,
  Loader2, CheckCircle2, X, Share2, Globe, Smartphone, Camera,
  Undo2, Copy, Download, ExternalLink, QrCode, RefreshCw, CreditCard,
  Check, Trash2, Eye
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useBusiness } from '../../context/BusinessContext';
import { useLanguage } from '../../context/LanguageContext';

const BusinessSetupPage = () => {
  const { t } = useLanguage();
  const { settings, refreshSettings } = useBusiness();
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('http://localhost:3000');
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebsiteUrl(window.location.origin);
    }
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: formData.businessName || 'My Store',
          text: 'Check out our store!',
          url: websiteUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('business-qr-code') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'store-qr-code.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRefreshQR = () => {
    setIsRefreshingQR(true);
    setTimeout(() => setIsRefreshingQR(false), 800);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Upload failed');
      }
      const data = await res.json();
      const imageUrl = data.url || data.urls?.[0];
      if (!imageUrl) throw new Error('No image URL returned');
      setFormData((prev: any) => ({ ...prev, [fieldName]: imageUrl }));
      setIsDirty(true);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`${t('upload_failed')}${error?.message ? `: ${error.message}` : ''}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleRemoveImage = (fieldName: string) => {
    setFormData((prev: any) => ({ ...prev, [fieldName]: null }));
    setIsDirty(true);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.businessName?.trim()) newErrors.businessName = t('business_name_required');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('invalid_email');
    if (formData.phone && !/^\+?\d{8,15}$/.test(formData.phone.replace(/\s+/g, ''))) newErrors.phone = t('invalid_phone');
    if (formData.whatsapp && !/^\+?\d{8,15}$/.test(formData.whatsapp.replace(/\s+/g, ''))) newErrors.whatsapp = t('invalid_whatsapp');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/business-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await refreshSettings();
        setShowSuccessModal(true);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(settings);
    setIsDirty(false);
    setErrors({});
  };

  const renderImageField = (fieldName: string, label: string, altText: string, emptyLabel = 'No image selected') => {
    const imageUrl = formData[fieldName];

    return (
      <div className="space-y-2">
        <label className="block text-[13px] font-semibold text-slate-800">{label}</label>
        <div className="grid grid-cols-1 gap-4 border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-[minmax(0,260px)_1fr] md:items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => imageUrl && setImagePreview({ url: imageUrl, title: label })}
              disabled={!imageUrl}
              aria-label={imageUrl ? `Preview ${label}` : `${label} preview unavailable`}
              className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden border border-slate-300 bg-white p-3 transition-colors hover:border-sky-600 disabled:cursor-default disabled:hover:border-slate-300"
            >
              {imageUrl ? (
                <img src={imageUrl} alt={altText} className="h-full w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-xs font-medium text-slate-400">
                  <ImageIcon size={24} />
                  {emptyLabel}
                </span>
              )}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => handleRemoveImage(fieldName)}
                aria-label={`Remove ${label}`}
                title={`Remove ${label}`}
                className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <Trash2 size={17} />
              </button>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${imageUrl ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="font-medium">{imageUrl ? t('image_uploaded') : t('no_image_uploaded')}</span>
            </div>
            <p className="text-xs leading-5 text-slate-500">{imageUrl ? t('image_uploaded_hint') : t('image_empty_hint')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-sky-700 bg-sky-700 px-4 text-xs font-medium text-white transition-colors hover:bg-sky-800">
                {isUploading[fieldName] ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {isUploading[fieldName] ? t('uploading_label') : imageUrl ? t('replace_image') : t('upload_image')}
                <input
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(e, fieldName)}
                  disabled={isUploading[fieldName]}
                  className="sr-only"
                />
              </label>
              {imageUrl && (
                <>
                  <button
                    type="button"
                    onClick={() => setImagePreview({ url: imageUrl, title: label })}
                    className="inline-flex min-h-10 items-center gap-2 border border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <Eye size={14} /> {t('preview_label')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title={t('business_setup') || 'Business Setup'} hideTitle={true}>
      <div className="w-full space-y-6 pb-10 min-h-screen">

        <header className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('business_setup') || 'Business Setup'}</h1>
            <span className="text-xs font-normal text-slate-700">[ {t('access_label')} ]</span>
          </div>
          <p className="text-xs text-slate-600">{t('business_setup_breadcrumb')} /</p>
        </header>

        {/* Proportional Grid Layout */}
        <div className="grid grid-cols-1 gap-6">

          {/* COLUMN 1 */}
          <div className="contents">
            {/* Branding Card */}
            <div id="branding" className="order-1 bg-white border border-slate-200 rounded-none p-6 shadow-sm scroll-mt-6">
              <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-200">
                <div className="w-9 h-9 bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                  <ImageIcon size={14} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{t('branding')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('branding_desc')}</p>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">{t('business_name')}</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName || ''}
                    onChange={handleChange}
                    className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                    placeholder={t('business_name_placeholder')}
                  />
                  {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {renderImageField('logoUrl', t('main_logo'), t('main_logo'))}
                  {renderImageField('watermarkUrl', t('transparent_logo'), t('transparent_logo'))}
                </div>
              </div>
            </div>

            {/* Social Media Links Card */}
            <div id="socialMedia" className="order-5 bg-white border border-slate-200 rounded-none p-6 shadow-sm scroll-mt-6">
              <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-200">
                <div className="w-9 h-9 bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                  <Share2 size={14} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{t('social_media')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('social_media_desc')}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                    <Globe size={14} className="text-sky-600"/> Facebook
                  </div>
                  <div className="flex items-center border border-slate-300 bg-white transition-colors focus-within:border-sky-600 focus-within:ring-1 focus-within:ring-sky-600">
                    <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-500 whitespace-nowrap select-none">
                      facebook.com/
                    </span>
                    <input
                      type="text"
                      name="facebook"
                      value={formData.facebook || ''}
                      onChange={handleChange}
                      placeholder={t('username_placeholder')}
                      className="min-w-0 flex-1 px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                    <Camera size={14} className="text-sky-600"/> Instagram
                  </div>
                  <div className="flex items-center border border-slate-300 bg-white transition-colors focus-within:border-sky-600 focus-within:ring-1 focus-within:ring-sky-600">
                    <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-500 whitespace-nowrap select-none">
                      instagram.com/
                    </span>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram || ''}
                      onChange={handleChange}
                      placeholder={t('username_placeholder')}
                      className="min-w-0 flex-1 px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                    <Smartphone size={14} className="text-slate-800"/> TikTok
                  </div>
                  <div className="flex items-center border border-slate-300 bg-white transition-colors focus-within:border-sky-600 focus-within:ring-1 focus-within:ring-sky-600">
                    <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-500 whitespace-nowrap select-none">
                      tiktok.com/@
                    </span>
                    <input
                      type="text"
                      name="tiktok"
                      value={formData.tiktok || ''}
                      onChange={handleChange}
                      placeholder={t('username_placeholder')}
                      className="min-w-0 flex-1 px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="bg-sky-50/50 p-4 flex items-start gap-3 border border-sky-100">
                    <Share2 size={14} className="text-sky-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-medium text-sky-700 leading-relaxed">
                      {t('social_media_tip')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="contents">
            {/* Business Information Card */}
            <div id="businessInfo" className="order-2 bg-white border border-slate-200 rounded-none p-6 shadow-sm scroll-mt-6">
              <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-200">
                <div className="w-9 h-9 bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                  <Building size={14} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{t('business_info')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('business_info_desc')}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                    <Phone size={14} className="text-slate-400"/> {t('phone_number')}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.phone?.startsWith('+65') ? '+65' : '+60'}
                      onChange={(e) => {
                        setFormData({...formData, phone: e.target.value + (formData.phone?.replace(/^\+6[05]/, '') || '')});
                        setIsDirty(true);
                      }}
                      className="w-[100px] border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                    >
                      <option value="+60">MY +60</option>
                      <option value="+65">SG +65</option>
                    </select>
                    <input
                      type="text"
                      value={formData.phone?.replace(/^\+6[05]/, '') || ''}
                      onChange={(e) => {
                        setFormData({...formData, phone: (formData.phone?.startsWith('+65') ? '+65' : '+60') + e.target.value});
                        setIsDirty(true);
                      }}
                      className="flex-1 border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                    <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                    <Mail size={14} className="text-slate-400"/> {t('email_address')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                    <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                    <Smartphone size={14} className="text-slate-400"/> {t('whatsapp_number')}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.whatsapp?.startsWith('+65') ? '+65' : '+60'}
                      onChange={(e) => {
                        setFormData({...formData, whatsapp: e.target.value + (formData.whatsapp?.replace(/^\+6[05]/, '') || '')});
                        setIsDirty(true);
                      }}
                      className="w-[100px] border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                    >
                      <option value="+60">MY +60</option>
                      <option value="+65">SG +65</option>
                    </select>
                    <input
                      type="text"
                      value={formData.whatsapp?.replace(/^\+6[05]/, '') || ''}
                      onChange={(e) => {
                        setFormData({...formData, whatsapp: (formData.whatsapp?.startsWith('+65') ? '+65' : '+60') + e.target.value});
                        setIsDirty(true);
                      }}
                      className="flex-1 border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                  {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                    <MapPin size={14} className="text-slate-400"/> {t('business_address')}
                  </label>
                  <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    rows={4}
                    placeholder="e.g. Lot 1234, Parkcity Commerce Square, 97000 Bintulu, Sarawak"
                    className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600 resize-none placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1.5 leading-relaxed">
                    <span className="text-sky-500 mt-0.5">📍</span>
                    <span>{t('map_location_hint')}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Promote Business Card */}
            <div id="promoteBusiness" className="order-4 bg-white border border-slate-200 rounded-none p-6 shadow-sm scroll-mt-6">
              <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-200">
                <div className="w-9 h-9 bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                  <QrCode size={14} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{t('promote_business')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('promote_business_desc')}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">{t('website_link')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex min-h-12 flex-1 items-center border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 truncate">
                      {websiteUrl}
                    </div>
                    <button
                      onClick={() => window.open(websiteUrl, '_blank')}
                      className="inline-flex min-h-12 w-12 shrink-0 items-center justify-center border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2 lg:pt-7">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {copySuccess ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                    {copySuccess ? t('copied') : t('copy_link')}
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-sky-700 bg-sky-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-800"
                  >
                    <Share2 size={14} />
                    {t('share_forward')}
                  </button>
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 items-start gap-6 border-t border-slate-200 pt-6 md:grid-cols-[auto_1fr]">
                  <div className="flex flex-col">
                    <span className="mb-2 text-[13px] font-semibold text-slate-800">{t('store_qr_code')}</span>
                    <div className="border border-slate-300 bg-white p-3">
                      {isRefreshingQR ? (
                        <div className="flex h-[180px] w-[180px] items-center justify-center bg-slate-50">
                          <Loader2 className="animate-spin text-sky-500" size={24} />
                        </div>
                      ) : (
                        <QRCodeCanvas
                          id="business-qr-code"
                          value={websiteUrl}
                          size={180}
                          level="H"
                          includeMargin={false}
                          imageSettings={formData.logoUrl ? {
                            src: formData.logoUrl,
                            x: undefined, y: undefined, height: 36, width: 36, excavate: true, crossOrigin: "anonymous",
                          } : undefined}
                          className="rounded-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex h-full flex-col justify-center gap-3">
                    <p className="text-sm font-medium text-slate-700">{t('share_your_store')}</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleDownloadQR}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Download size={14} /> {t('download_qr')}
                      </button>
                      <button
                        onClick={handleRefreshQR}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <RefreshCw size={14} className={isRefreshingQR ? "animate-spin" : ""} /> {t('refresh')}
                      </button>
                    </div>
                    <div>
                      <div className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4">
                        <QrCode size={16} className="mt-0.5 shrink-0 text-slate-500" />
                        <p className="text-xs font-medium leading-relaxed text-slate-600">
                          {t('qr_code_tip')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3 */}
          <div className="contents">
            {/* Payment Settings Card */}
            <div id="paymentSettings" className="order-3 bg-white border border-slate-200 rounded-none p-6 shadow-sm scroll-mt-6">
              <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-200">
                <div className="w-9 h-9 bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                  <CreditCard size={14} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{t('payment_settings')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('payment_settings_desc')}</p>
                </div>
              </div>

              <div className="mt-6">
                {renderImageField('bankTransferImage', t('bank_transfer_qr'), 'Bank transfer QR code', t('upload_image'))}
              </div>
            </div>
          </div>

        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600" aria-live="polite">
            {isDirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-sky-600" />
                {t('unsaved_changes')}
              </>
            ) : (
              <>
                <Check size={15} className="text-emerald-600" />
                {t('all_changes_saved')}
              </>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving || !isDirty}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 size={16} />
              {t('discard_changes')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-sky-700 bg-sky-700 px-6 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {t('save_changes')}
            </button>
          </div>
        </div>
      </div>

      {imagePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm" onClick={() => setImagePreview(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${imagePreview.title} preview`}
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col border border-slate-300 bg-white p-4 shadow-2xl md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-semibold text-slate-800">{imagePreview.title} {t('preview_modal_title_suffix')}</h2>
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                aria-label={t('close_image_preview')}
                className="inline-flex h-9 w-9 items-center justify-center border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-50 p-3">
              <img src={imagePreview.url} alt={imagePreview.title} className="max-h-[78vh] max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowSuccessModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-none shadow-xl p-8 text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
            >
              <X size={20} />
            </button>
            <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('saved_successfully')}</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">
              {t('saved_successfully_desc')}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-[#2563EB] text-white rounded-none font-medium text-sm hover:bg-[#1D4ED8] transition-colors shadow-sm"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BusinessSetupPage;
