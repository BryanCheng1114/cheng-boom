import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Save, Upload, Image as ImageIcon, Building, Phone, Mail, Clock, MapPin, Loader2, CheckCircle2, X, HelpCircle, Share2, Globe, Smartphone, Camera, Undo2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

const BusinessSetupPage = () => {
  const { settings, refreshSettings } = useBusiness();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<{phone?: string, whatsapp?: string, email?: string}>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (settings && Object.keys(formData).length > 0) {
      const current = {
        businessName: formData.businessName || '',
        logoUrl: formData.logoUrl || '',
        watermarkUrl: formData.watermarkUrl || '',
        phone: formData.phone || '',
        email: formData.email || '',
        whatsapp: formData.whatsapp || '',
        address: formData.address || '',
        facebook: formData.facebook || '',
        tiktok: formData.tiktok || '',
        instagram: formData.instagram || '',
        businessFont: formData.businessFont || 'Impact',
      };
      const original = {
        businessName: settings.businessName || '',
        logoUrl: settings.logoUrl || '',
        watermarkUrl: settings.watermarkUrl || '',
        phone: settings.phone || '',
        email: settings.email || '',
        whatsapp: settings.whatsapp || '',
        address: settings.address || '',
        facebook: settings.facebook || '',
        tiktok: settings.tiktok || '',
        instagram: settings.instagram || '',
        businessFont: settings.businessFont || 'Impact',
      };
      setIsDirty(JSON.stringify(current) !== JSON.stringify(original));
    }
  }, [formData, settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const file = e.target.files[0];
      const formDataObj = new FormData();
      formDataObj.append('files', file);
      
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataObj,
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormData((prev: any) => ({ ...prev, [field]: data.urls[0] }));
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    } finally {
      setIsUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validate = () => {
    const newErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+6[05]\d{8,12}$/;

    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone format (e.g. 123456789)";
    }
    if (formData.whatsapp && !phoneRegex.test(formData.whatsapp)) {
      newErrors.whatsapp = "Invalid WhatsApp format (e.g. 123456789)";
    }

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

  return (
    <AdminLayout title="Business Setup">
      <div className="max-w-4xl mx-auto space-y-10 pb-32">
        
        {/* Header Description */}
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">System Preferences</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-2">Manage your core business identity, contact information, and public links.</p>
        </div>
        
        {/* Branding Section */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <ImageIcon size={20} />
            </div>
            <h2 className="text-xl font-black italic uppercase dark:text-white text-zinc-900">Branding</h2>
          </div>

          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Business Name</label>
                <input 
                  type="text" 
                  name="businessName"
                  value={formData.businessName || ''}
                  onChange={handleChange}
                  className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-yellow-500 transition-colors dark:text-white"
                  placeholder="e.g. Cheng-BOOM"
                />
              </div>

              {/* Font Dropdown + Preview */}
              {(() => {
                const FONTS = [
                  { name: 'Impact',           label: 'Bold Impact',       style: "Impact, 'Arial Black', sans-serif" },
                  { name: 'Playfair Display', label: 'Elegant Serif',     style: "Georgia, 'Times New Roman', serif" },
                  { name: 'Bebas Neue',       label: 'Modern Strong',     style: "'Arial Black', 'Arial Bold', sans-serif" },
                  { name: 'Pacifico',         label: 'Friendly Script',   style: "'Comic Sans MS', 'Bradley Hand', cursive" },
                  { name: 'Montserrat',       label: 'Clean Geometric',   style: "'Trebuchet MS', 'Lucida Grande', sans-serif" },
                ];
                const selectedFont = FONTS.find(f => f.name === (formData.businessFont || 'Impact')) || FONTS[0];

                return (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Business Name Font</label>
                      <select
                        value={formData.businessFont || 'Impact'}
                        onChange={(e) => setFormData({ ...formData, businessFont: e.target.value })}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm font-bold px-4 py-3 rounded-2xl focus:outline-none focus:border-yellow-500 transition-colors"
                      >
                        {FONTS.map(f => (
                          <option key={f.name} value={f.name} className="bg-white dark:bg-zinc-800">{f.label} — {f.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-zinc-500/5 border border-zinc-500/15 rounded-2xl px-5 py-4">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Preview</p>
                      <p
                        className="text-4xl font-black italic tracking-wider bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent leading-tight"
                        style={{ fontFamily: selectedFont.style }}
                      >
                        {formData.businessName || 'Cheng-BOOM'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-2">{selectedFont.label} • Applied to header and footer business name</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Main Logo Image</label>
                <div className="relative aspect-square bg-zinc-500/5 border-2 border-dashed border-zinc-500/20 rounded-3xl flex flex-col items-center justify-center hover:bg-zinc-500/10 transition-colors overflow-hidden group">
                  {formData.logoUrl ? (
                    <>
                      <img src={formData.logoUrl} alt="Main Logo" className="h-full w-full object-contain p-4" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white font-bold text-xs">Change Logo</span>
                      </div>
                  </>
                ) : (
                  <>
                    {isUploading['logoUrl'] ? <Loader2 className="animate-spin text-zinc-400 mb-2" size={24} /> : <Upload className="text-zinc-400 mb-2" size={24} />}
                    <span className="text-xs font-bold text-zinc-500">{isUploading['logoUrl'] ? 'Uploading...' : 'Upload Logo'}</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logoUrl')}
                  disabled={isUploading['logoUrl']}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 group">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Transparent Logo</label>
                <div className="relative">
                  <HelpCircle size={12} className="text-zinc-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-zinc-800 dark:bg-zinc-700 text-white text-xs font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-xl">
                    Used for watermarks on product images. Must be a PNG with a transparent background.
                  </div>
                </div>
              </div>
              <div className="relative aspect-square bg-zinc-500/5 border-2 border-dashed border-zinc-500/20 rounded-3xl flex flex-col items-center justify-center hover:bg-zinc-500/10 transition-colors overflow-hidden group">
                {formData.watermarkUrl ? (
                  <>
                    <img src={formData.watermarkUrl} alt="Watermark Logo" className="h-full w-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-bold text-xs">Change Watermark</span>
                    </div>
                  </>
                ) : (
                  <>
                    {isUploading['watermarkUrl'] ? <Loader2 className="animate-spin text-zinc-400 mb-2" size={24} /> : <Upload className="text-zinc-400 mb-2" size={24} />}
                    <span className="text-xs font-bold text-zinc-500">{isUploading['watermarkUrl'] ? 'Uploading...' : 'Upload Watermark'}</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'watermarkUrl')}
                  disabled={isUploading['watermarkUrl']}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Business Information Section */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Building size={20} />
            </div>
            <h2 className="text-xl font-black italic uppercase dark:text-white text-zinc-900">Business Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-2"><Phone size={12}/> Phone Number</label>
              <div className="flex gap-2">
                <select 
                  value={formData.phone?.startsWith('+65') ? '+65' : '+60'}
                  onChange={(e) => setFormData({...formData, phone: e.target.value + (formData.phone?.replace(/^\+6[05]/, '') || '')})}
                  className="w-28 bg-zinc-500/5 dark:bg-zinc-900 border border-zinc-500/20 rounded-2xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 dark:text-white"
                >
                  <option value="+60" className="dark:bg-zinc-900">🇲🇾 +60</option>
                  <option value="+65" className="dark:bg-zinc-900">🇸🇬 +65</option>
                </select>
                <input 
                  type="text" 
                  value={formData.phone?.replace(/^\+6[05]/, '') || ''} 
                  onChange={(e) => setFormData({...formData, phone: (formData.phone?.startsWith('+65') ? '+65' : '+60') + e.target.value})} 
                  className={`flex-1 bg-zinc-500/5 border ${errors.phone ? 'border-red-500' : 'border-zinc-500/20'} rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 dark:text-white`} 
                  placeholder="123456789"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs font-bold mt-2">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-2"><Mail size={12}/> Email Address</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={`w-full bg-zinc-500/5 border ${errors.email ? 'border-red-500' : 'border-zinc-500/20'} rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 dark:text-white`} />
              {errors.email && <p className="text-red-500 text-xs font-bold mt-2">{errors.email}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 text-green-500">WhatsApp Number</label>
              <div className="flex gap-2">
                <select 
                  value={formData.whatsapp?.startsWith('+65') ? '+65' : '+60'}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value + (formData.whatsapp?.replace(/^\+6[05]/, '') || '')})}
                  className="w-28 bg-zinc-500/5 dark:bg-zinc-900 border border-zinc-500/20 rounded-2xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-green-500 dark:text-white"
                >
                  <option value="+60" className="dark:bg-zinc-900">🇲🇾 +60</option>
                  <option value="+65" className="dark:bg-zinc-900">🇸🇬 +65</option>
                </select>
                <input 
                  type="text" 
                  value={formData.whatsapp?.replace(/^\+6[05]/, '') || ''} 
                  onChange={(e) => setFormData({...formData, whatsapp: (formData.whatsapp?.startsWith('+65') ? '+65' : '+60') + e.target.value})} 
                  className={`flex-1 bg-zinc-500/5 border ${errors.whatsapp ? 'border-red-500' : 'border-zinc-500/20'} rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-green-500 dark:text-white`} 
                  placeholder="123456789"
                />
              </div>
              {errors.whatsapp && <p className="text-red-500 text-xs font-bold mt-2">{errors.whatsapp}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-2"><MapPin size={12}/> Full Address</label>
              <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={3} className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 dark:text-white resize-none" />
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
              <Share2 size={20} />
            </div>
            <h2 className="text-xl font-black italic uppercase dark:text-white text-zinc-900">Social Media Links</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-2"><Globe size={12}/> Facebook Account</label>
              <input 
                type="text" 
                name="facebook" 
                value={formData.facebook || ''} 
                onChange={handleChange} 
                placeholder="e.g. chengboom.fireworks" 
                className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-pink-500 dark:text-white" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-2"><Camera size={12}/> Instagram Handle</label>
              <input 
                type="text" 
                name="instagram" 
                value={formData.instagram || ''} 
                onChange={handleChange} 
                placeholder="e.g. @chengboom" 
                className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-pink-500 dark:text-white" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-2"><Smartphone size={12}/> TikTok Handle</label>
              <input 
                type="text" 
                name="tiktok" 
                value={formData.tiktok || ''} 
                onChange={handleChange} 
                placeholder="e.g. @chengboom" 
                className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-pink-500 dark:text-white" 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 md:left-64 z-40 p-4 transition-transform duration-500 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-4xl mx-auto bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 px-4">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-white font-bold text-sm">Unsaved changes</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 py-3 bg-zinc-800 dark:bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Undo2 size={16} />
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="px-8 py-3 bg-yellow-500 text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow-xl shadow-yellow-500/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Confirm Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowSuccessModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={20} />
            </button>
            <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Saved Successfully</h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8">
              Your business settings have been updated and are now live.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BusinessSetupPage;
