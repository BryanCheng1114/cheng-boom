import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Check,
  Globe,
  Monitor,
  Layout as LayoutIcon,
  Languages,
  Save,
  CheckCircle2,
  Clock
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from 'next-themes';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (newTheme?: string, newLang?: string) => {
    setIsUpdating(true);
    const targetTheme = newTheme || theme;
    const targetLang = newLang || language;
    
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          theme: targetTheme, 
          language: targetLang 
        }),
      });
      
      if (res.ok) {
        if (newTheme) setTheme(newTheme);
        if (newLang) setLanguage(newLang as any);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminLayout title={t('settings')}>
      <div className="max-w-4xl pt-6 space-y-10">
        {/* THEME SETTING */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] dark:text-white text-zinc-900">{t('appearance')}</h3>
              <div className="h-1 w-8 bg-yellow-500 rounded-full mt-1.5 opacity-50" />
            </div>
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[9px] font-black uppercase tracking-widest"
                >
                  <CheckCircle2 size={12} />
                  {t('synced')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { id: 'dark', label: t('midnight_protocol'), icon: Moon, desc: 'Optimized for low-light focus' },
              { id: 'light', label: t('daylight_clarity'), icon: Sun, desc: 'Enhanced daytime visibility' },
            ].map((opt) => (
              <button 
                key={opt.id}
                onClick={() => handleSave(opt.id, undefined)}
                className={`group flex items-center justify-between p-5 rounded-[24px] border-2 transition-all duration-500 ${
                  theme === opt.id 
                    ? 'bg-zinc-900 dark:bg-zinc-950 border-yellow-500 shadow-xl shadow-yellow-500/10 scale-[1.02]' 
                    : 'bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-white/5 hover:border-yellow-500/20 hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`p-3 rounded-xl transition-all duration-500 ${theme === opt.id ? 'bg-yellow-500 text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-yellow-500'}`}>
                    <opt.icon size={20} />
                  </div>
                  <div>
                    <h4 className={`text-[11px] font-black uppercase italic tracking-wider ${theme === opt.id ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`}>{opt.label}</h4>
                    <p className="text-[9px] font-bold text-zinc-500 opacity-50 uppercase tracking-tighter">{opt.desc}</p>
                  </div>
                </div>
                {theme === opt.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-zinc-950">
                    <Check size={14} strokeWidth={4} />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent" />

        {/* LANGUAGE SETTING */}
        <div className="space-y-6">
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] dark:text-white text-zinc-900">{t('language_pref')}</h3>
            <div className="h-1 w-8 bg-blue-500 rounded-full mt-1.5 opacity-50" />
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {[
              { id: 'en', label: t('english'), sub: 'International' },
              { id: 'zh', label: t('chinese'), sub: '中文界面' },
              { id: 'ms', label: t('malay'), sub: 'Bahasa Melayu' },
            ].map((lang) => (
              <button 
                key={lang.id}
                onClick={() => handleSave(undefined, lang.id)}
                className={`group flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all duration-500 gap-3 relative overflow-hidden ${
                  language === lang.id 
                    ? 'bg-blue-500/5 border-blue-500 shadow-xl shadow-blue-500/5 scale-[1.02]' 
                    : 'bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-white/5 hover:border-blue-500/20 hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-500 ${language === lang.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-blue-500'}`}>
                  {lang.id.toUpperCase()}
                </div>
                <div className="text-center">
                  <h4 className={`text-[11px] font-black uppercase italic tracking-wider ${language === lang.id ? 'dark:text-white text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`}>{lang.label}</h4>
                  <p className="text-[9px] font-bold text-zinc-500 opacity-50 uppercase tracking-tighter">{lang.sub}</p>
                </div>
                {language === lang.id && (
                  <motion.div initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-4 right-4 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={4} />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center gap-3 pt-2">
          <Clock size={12} className="text-zinc-500" />
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {isUpdating ? t('syncing') : t('synced')}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
