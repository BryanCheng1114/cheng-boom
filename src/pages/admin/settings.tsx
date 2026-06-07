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

          <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-900/50 rounded-full relative w-full max-w-lg">
            {/* Sliding background indicator */}
            <div 
              className="absolute top-1.5 bottom-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-sm transition-all duration-300 ease-out border border-zinc-200 dark:border-zinc-700/50"
              style={{
                width: 'calc(50% - 6px)',
                left: theme === 'dark' ? '6px' : 'calc(50%)'
              }}
            />
            
            {[
              { id: 'dark', label: t('midnight_protocol'), icon: Moon },
              { id: 'light', label: t('daylight_clarity'), icon: Sun },
            ].map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button 
                  key={opt.id}
                  onClick={() => handleSave(opt.id, undefined)}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-full font-bold text-sm transition-colors duration-300 ${
                    isSelected 
                      ? 'text-yellow-600 dark:text-yellow-500' 
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <opt.icon size={18} strokeWidth={isSelected ? 3 : 2} />
                  <span className="uppercase tracking-widest text-[10px] sm:text-xs">{opt.label}</span>
                </button>
              );
            })}
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
          
          <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-900/50 rounded-full relative w-full max-w-2xl">
            {/* Sliding background indicator */}
            <div 
              className="absolute top-1.5 bottom-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-sm transition-all duration-300 ease-out border border-zinc-200 dark:border-zinc-700/50"
              style={{
                width: 'calc(50% - 6px)',
                left: language === 'en' ? '6px' : 'calc(50%)'
              }}
            />
            
            {[
              { id: 'en', label: t('english'), sub: 'EN' },
              { id: 'zh', label: t('chinese'), sub: 'ZH' },
            ].map((lang) => {
              const isSelected = language === lang.id;
              return (
                <button 
                  key={lang.id}
                  onClick={() => handleSave(undefined, lang.id)}
                  className={`relative z-10 flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 py-3 px-2 sm:px-6 rounded-full transition-colors duration-300 ${
                    isSelected 
                      ? 'text-blue-600 dark:text-blue-500' 
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${isSelected ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                    {lang.sub}
                  </span>
                  <span className={`uppercase tracking-widest text-[10px] sm:text-xs ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                    {lang.label}
                  </span>
                </button>
              );
            })}
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
