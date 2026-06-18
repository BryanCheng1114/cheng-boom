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

        {/* LANGUAGE SETTING */}
        <div className="space-y-6">
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]  text-zinc-900">{t('language_pref')}</h3>
            <div className="h-1 w-8 bg-blue-500 rounded-full mt-1.5 opacity-50" />
          </div>
          
          <div className="flex p-1.5 bg-zinc-100  rounded-full relative w-full max-w-2xl">
            {/* Sliding background indicator */}
            <div 
              className="absolute top-1.5 bottom-1.5 rounded-full bg-white  shadow-sm transition-all duration-300 ease-out border border-zinc-200 "
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
                      ? 'text-blue-600 ' 
                      : 'text-zinc-500 hover:text-zinc-700 :text-zinc-300'
                  }`}
                >
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${isSelected ? 'bg-blue-100 ' : 'bg-zinc-200 '}`}>
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
