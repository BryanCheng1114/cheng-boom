import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  Save, Upload, Image as ImageIcon, Building, Phone, Mail, MapPin, 
  Loader2, CheckCircle2, X, HelpCircle, Share2, Globe, Smartphone, Camera, 
  Undo2, Copy, Download, ExternalLink, QrCode, RefreshCw, Send, CreditCard,
  Store, Tag, Check, Trash2, LayoutList, Medal
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
  const [activeTab, setActiveTab] = useState('branding');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Use a stable website URL
  const websiteUrl = 'http://localhost:3000';

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

    setIsUploading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData((prev: any) => ({ ...prev, [fieldName]: data.url }));
      setIsDirty(true);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
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
    if (!formData.businessName?.trim()) newErrors.businessName = t('business_name_required') || 'Required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('invalid_email') || 'Invalid format';
    if (formData.phone && !/^\+?\d{8,15}$/.test(formData.phone.replace(/\s+/g, ''))) newErrors.phone = t('invalid_phone') || 'Invalid format';
    if (formData.whatsapp && !/^\+?\d{8,15}$/.test(formData.whatsapp.replace(/\s+/g, ''))) newErrors.whatsapp = t('invalid_whatsapp') || 'Invalid format';
    
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
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(settings);
    setIsDirty(false);
    setErrors({});
  };

  const isSectionComplete = (section: string) => {
    switch (section) {
      case 'branding':
        return !!formData.businessName;
      case 'businessInfo':
        return !!formData.phone || !!formData.email || !!formData.whatsapp || !!formData.address;
      case 'paymentSettings':
        return !!formData.bankTransferImage;
      case 'promoteBusiness':
        return true; // Always available since it relies on system URL
      case 'socialMedia':
        return !!formData.facebook || !!formData.instagram || !!formData.tiktok;
      default:
        return false;
    }
  };

  const completionStatus = [
    { id: 'branding', label: 'Branding', icon: <Tag size={14}/> },
    { id: 'businessInfo', label: 'Business Information', icon: <Building size={14}/> },
    { id: 'paymentSettings', label: 'Payment Settings', icon: <CreditCard size={14}/> },
    { id: 'promoteBusiness', label: 'Promote Business', icon: <Send size={14}/> },
    { id: 'socialMedia', label: 'Social Media Links', icon: <Share2 size={14}/> },
  ];

  const FONTS = [
    { name: 'Impact',           label: 'Bold Impact',       style: "Impact, 'Arial Black', sans-serif" },
    { name: 'Playfair Display', label: 'Elegant Serif',     style: "Georgia, 'Times New Roman', serif" },
    { name: 'Bebas Neue',       label: 'Modern Strong',     style: "'Arial Black', 'Arial Bold', sans-serif" },
    { name: 'Pacifico',         label: 'Friendly Script',   style: "'Comic Sans MS', 'Bradley Hand', cursive" },
    { name: 'Montserrat',       label: 'Clean Geometric',   style: "'Trebuchet MS', 'Lucida Grande', sans-serif" },
    { name: 'Poppins',          label: 'Poppins SemiBold',  style: "'Poppins', sans-serif" },
  ];

  const selectedFont = FONTS.find(f => f.name === (formData.businessFont || 'Poppins')) || FONTS[5];

  return (
    <AdminLayout title={t('business_setup') || 'Business Setup'} hideTitle={true}>
      <div className="w-full space-y-6 pb-32 min-h-screen">
        
        {/* Header Description & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Business Setup</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Manage your business identity, contact information and customer-facing details.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-zinc-200">
              {isDirty ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-zinc-700 font-medium text-xs">Unsaved changes</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center"><Check size={10} className="text-green-600"/></div>
                  <span className="text-zinc-700 font-medium text-xs">All changes saved</span>
                </>
              )}
            </div>
            <button
              onClick={handleCancel}
              disabled={isSaving || !isDirty}
              className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-medium text-sm hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Undo2 size={16} />
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl font-medium text-sm hover:bg-[#e66000] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-[16px] border border-zinc-200 p-1 flex flex-wrap gap-1 shadow-sm">
          {[
            { id: 'branding', label: 'Branding', icon: <Tag size={16}/> },
            { id: 'businessInfo', label: 'Business Information', icon: <LayoutList size={16}/> },
            { id: 'paymentSettings', label: 'Payment Settings', icon: <CreditCard size={16}/> },
            { id: 'promoteBusiness', label: 'Promote Business', icon: <Send size={16}/> },
            { id: 'socialMedia', label: 'Social Media Links', icon: <Share2 size={16}/> },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-4 py-2.5 rounded-[12px] flex items-center gap-2 text-sm font-medium transition-colors ${tab.id === activeTab ? 'text-[#FF6B00] bg-orange-50/50' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Proportional Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* COLUMN 1 */}
          <div className="space-y-6 flex flex-col min-w-0 lg:col-span-5">
            {/* Branding Card */}
            <div id="branding" className="bg-white border border-zinc-200 rounded-[20px] p-6 shadow-sm scroll-mt-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center text-orange-500 shrink-0 mt-0.5">
                  <ImageIcon size={14} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Branding</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Manage how your business appears to your customers.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-2">Business Name</label>
                  <input 
                    type="text" 
                    name="businessName"
                    value={formData.businessName || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="e.g. Cheng-BOOM"
                  />
                  {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-2">Main Logo</label>
                    <div className="flex flex-col gap-3">
                      <div className="w-full aspect-square bg-zinc-50/50 border border-zinc-200 rounded-2xl flex items-center justify-center p-2 overflow-hidden">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Main Logo" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium">No Logo</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <button className="w-full h-[42px] px-4 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium text-xs hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                            {isUploading['logoUrl'] ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14} />}
                            Change Logo
                          </button>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'logoUrl')}
                            disabled={isUploading['logoUrl']}
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                        {formData.logoUrl && (
                          <button 
                            onClick={() => handleRemoveImage('logoUrl')}
                            className="w-[42px] h-[42px] flex items-center justify-center bg-white border border-zinc-200 text-zinc-500 hover:text-red-500 rounded-xl transition-colors shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-2">Transparent Logo (Optional)</label>
                    <div className="flex flex-col gap-3">
                      <div className="w-full aspect-square bg-zinc-50/50 border border-zinc-200 rounded-2xl flex items-center justify-center p-2 overflow-hidden">
                        {formData.watermarkUrl ? (
                          <img src={formData.watermarkUrl} alt="Watermark" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium">No Logo</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <button className="w-full h-[42px] px-4 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium text-xs hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                            {isUploading['watermarkUrl'] ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14} />}
                            Change Logo
                          </button>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'watermarkUrl')}
                            disabled={isUploading['watermarkUrl']}
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                        {formData.watermarkUrl && (
                          <button 
                            onClick={() => handleRemoveImage('watermarkUrl')}
                            className="w-[42px] h-[42px] flex items-center justify-center bg-white border border-zinc-200 text-zinc-500 hover:text-red-500 rounded-xl transition-colors shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links Card */}
            <div id="socialMedia" className="bg-white border border-zinc-200 rounded-[20px] p-6 shadow-sm flex-1 flex flex-col scroll-mt-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-6 h-6 rounded-md bg-pink-100 flex items-center justify-center text-pink-500 shrink-0 mt-0.5">
                  <Share2 size={14} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Social Media Links</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Connect your social media accounts.</p>
                </div>
              </div>

              <div className="space-y-4 flex flex-col flex-1">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                    <Globe size={14} className="text-blue-600"/> Facebook
                  </div>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                    <span className="bg-zinc-50 border-r border-zinc-200 px-3 py-2.5 text-xs text-zinc-500 font-medium whitespace-nowrap select-none">
                      facebook.com/
                    </span>
                    <input 
                      type="text" 
                      name="facebook" 
                      value={formData.facebook || ''} 
                      onChange={handleChange} 
                      placeholder="username"
                      className="flex-1 px-3 py-2.5 text-xs font-medium text-zinc-900 focus:outline-none placeholder:text-zinc-400" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                    <Camera size={14} className="text-pink-600"/> Instagram
                  </div>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden focus-within:border-pink-500 transition-colors">
                    <span className="bg-zinc-50 border-r border-zinc-200 px-3 py-2.5 text-xs text-zinc-500 font-medium whitespace-nowrap select-none">
                      instagram.com/
                    </span>
                    <input 
                      type="text" 
                      name="instagram" 
                      value={formData.instagram || ''} 
                      onChange={handleChange} 
                      placeholder="username"
                      className="flex-1 px-3 py-2.5 text-xs font-medium text-zinc-900 focus:outline-none placeholder:text-zinc-400" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                    <Smartphone size={14} className="text-zinc-800"/> TikTok
                  </div>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden focus-within:border-zinc-800 transition-colors">
                    <span className="bg-zinc-50 border-r border-zinc-200 px-3 py-2.5 text-xs text-zinc-500 font-medium whitespace-nowrap select-none">
                      tiktok.com/@
                    </span>
                    <input 
                      type="text" 
                      name="tiktok" 
                      value={formData.tiktok || ''} 
                      onChange={handleChange} 
                      placeholder="username"
                      className="flex-1 px-3 py-2.5 text-xs font-medium text-zinc-900 focus:outline-none placeholder:text-zinc-400" 
                    />
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <div className="bg-pink-50/50 rounded-xl p-3 flex items-start gap-2 border border-pink-100">
                    <Share2 size={14} className="text-pink-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-medium text-pink-700 leading-relaxed">
                      Adding your social links helps build trust and directs store traffic to your platforms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="space-y-6 flex flex-col min-w-0 lg:col-span-4">
            {/* Business Information Card */}
            <div id="businessInfo" className="bg-white border border-zinc-200 rounded-[20px] p-6 shadow-sm scroll-mt-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                  <Building size={14} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Business Information</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Your contact details and business address.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 flex items-center gap-2 mb-2">
                    <Phone size={14} className="text-zinc-400"/> Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select 
                      value={formData.phone?.startsWith('+65') ? '+65' : '+60'}
                      onChange={(e) => {
                        setFormData({...formData, phone: e.target.value + (formData.phone?.replace(/^\+6[05]/, '') || '')});
                        setIsDirty(true);
                      }}
                      className="w-[100px] bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-orange-500"
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
                      className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 flex items-center gap-2 mb-2">
                    <Mail size={14} className="text-zinc-400"/> Email Address
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email || ''} 
                    onChange={handleChange} 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500" 
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 flex items-center gap-2 mb-2">
                    <Smartphone size={14} className="text-zinc-400"/> WhatsApp Number
                  </label>
                  <div className="flex gap-2">
                    <select 
                      value={formData.whatsapp?.startsWith('+65') ? '+65' : '+60'}
                      onChange={(e) => {
                        setFormData({...formData, whatsapp: e.target.value + (formData.whatsapp?.replace(/^\+6[05]/, '') || '')});
                        setIsDirty(true);
                      }}
                      className="w-[100px] bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-orange-500"
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
                      className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                  {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-zinc-400"/> Business Address
                  </label>
                  <textarea 
                    name="address" 
                    value={formData.address || ''} 
                    onChange={handleChange} 
                    rows={4} 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-orange-500 resize-none" 
                  />
                </div>
              </div>
            </div>

            {/* Promote Business Card */}
            <div id="promoteBusiness" className="bg-white border border-zinc-200 rounded-[20px] p-6 shadow-sm flex-1 flex flex-col scroll-mt-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                  <QrCode size={14} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Promote Business</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Share your store link or QR code with customers.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-2">Website Link</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-700 truncate">
                      {websiteUrl}
                    </div>
                    <button 
                      onClick={() => window.open(websiteUrl, '_blank')}
                      className="w-10 h-10 shrink-0 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleCopyLink}
                    className="flex-[2] py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium text-xs hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {copySuccess ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                    {copySuccess ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex-[3] py-2.5 bg-[#8b5cf6] text-white rounded-xl font-medium text-xs hover:bg-[#7c3aed] transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 size={14} />
                    Share & Forward
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-auto pt-5">
                  <div className="bg-white p-2 rounded-2xl shadow-sm border border-zinc-200 shrink-0">
                    {isRefreshingQR ? (
                      <div className="w-[84px] h-[84px] flex items-center justify-center bg-zinc-50 rounded-xl">
                        <Loader2 className="animate-spin text-purple-500" size={20} />
                      </div>
                    ) : (
                      <QRCodeCanvas 
                        id="business-qr-code"
                        value={websiteUrl}
                        size={84}
                        level="H"
                        includeMargin={false}
                        imageSettings={formData.logoUrl ? {
                          src: formData.logoUrl,
                          x: undefined, y: undefined, height: 20, width: 20, excavate: true, crossOrigin: "anonymous",
                        } : undefined}
                        className="rounded-xl"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <button 
                      onClick={handleDownloadQR}
                      className="w-full py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium text-xs hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Download QR
                    </button>
                    <button 
                      onClick={handleRefreshQR}
                      className="w-full py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium text-xs hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} className={isRefreshingQR ? "animate-spin" : ""} /> Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3 */}
          <div className="space-y-6 flex flex-col min-w-0 lg:col-span-3">
            {/* Payment Settings Card */}
            <div id="paymentSettings" className="bg-white border border-zinc-200 rounded-[20px] p-6 shadow-sm flex-1 flex flex-col scroll-mt-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <CreditCard size={14} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Payment Settings</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Configure your bank account or payment details.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-semibold text-zinc-700 flex items-center gap-2 mt-auto pt-2">
                  DuitNow / Bank Transfer / QR
                  <HelpCircle size={14} className="text-zinc-400" />
                </label>
                
                <div className="relative aspect-[4/3] bg-zinc-50/50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center overflow-hidden">
                  {formData.bankTransferImage ? (
                    <img src={formData.bankTransferImage} alt="Bank Transfer Details" className="h-full w-full object-contain p-4" />
                  ) : (
                    <>
                      {isUploading['bankTransferImage'] ? <Loader2 className="animate-spin text-zinc-400 mb-2" size={24} /> : <Upload className="text-zinc-300 mb-2" size={24} />}
                      <span className="text-xs font-medium text-zinc-500">Upload Image</span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button className="w-full py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium text-xs hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                      {isUploading['bankTransferImage'] ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14} />}
                      Change Image
                    </button>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'bankTransferImage')}
                      disabled={isUploading['bankTransferImage']}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                  {formData.bankTransferImage && (
                    <button 
                      onClick={() => handleRemoveImage('bankTransferImage')}
                      className="w-[42px] h-[42px] shrink-0 flex items-center justify-center bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-white border border-zinc-200 rounded-[20px] p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center text-[#FF6B00] shrink-0 mt-0.5">
                  <Store size={14} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Quick Summary</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Overview of your current business setup.</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {completionStatus.map(item => {
                  const complete = isSectionComplete(item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 text-xs font-semibold text-zinc-700">
                        <div className="text-zinc-400">{item.icon}</div>
                        {item.label}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${complete ? 'text-green-500' : 'text-zinc-400'}`}>
                        {complete ? 'Completed' : 'Pending'}
                        <CheckCircle2 size={14} className={complete ? 'text-green-500' : 'text-zinc-300'} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-orange-50/50 rounded-xl p-4 flex items-start gap-3 border border-orange-100/50">
                <Medal size={20} className="text-[#FF6B00] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-zinc-900 mb-0.5">Great! Your business profile is complete.</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                    Keep your information up to date for the best customer experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowSuccessModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-3xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 transition-colors rounded-full hover:bg-zinc-100"
            >
              <X size={20} />
            </button>
            <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">{t('saved_successfully') || 'Saved Successfully'}</h3>
            <p className="text-sm text-zinc-500 mb-8 font-medium">
              {t('saved_successfully_desc') || 'Your business settings have been successfully updated.'}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-[#FF6B00] text-white rounded-xl font-medium text-sm hover:bg-[#e66000] transition-colors shadow-sm"
            >
              {t('close') || 'Close'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BusinessSetupPage;
