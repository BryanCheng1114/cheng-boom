import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  LogOut, 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  Package, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag,
  Building,
  Award,
  TrendingUp,
  Sidebar
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

import { useTheme } from 'next-themes';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => {
    setMounted(true);
    // Initialize theme and language from DB once on mount
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.theme && theme !== data.theme) setTheme(data.theme);
          if (data.language && language !== data.language) setLanguage(data.language);
        }
      } catch (err) {}
    };
    fetchProfile();
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#02040a]" />;
  }

  const navItems = [
    { name: t('dashboard'), key: 'dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('revenue'), key: 'revenue', path: '/admin/revenue', icon: TrendingUp },
    { name: t('inventory'), key: 'inventory', path: '/admin/product', icon: Package },
    { name: t('orders'), key: 'orders', path: '/admin/orders', icon: ShoppingBag },
    { name: t('customers'), key: 'customers', path: '/admin/customer', icon: Users },
    { name: t('seller_setup') || 'Seller Setup', key: 'seller-setup', path: '/admin/seller-setup', icon: Award },
    { name: t('business_setup') || 'Business Setup', key: 'business-setup', path: '/admin/business-setup', icon: Building },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout');
      router.push('/admin');
    } catch (error) {}
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-700 ease-in-out ${
      theme === 'dark' ? 'bg-[#02040a] text-zinc-100' : 'bg-[#f8f9fc] text-zinc-900'
    }`}>
      <Head>
        <title>{`${title} | Cheng-BOOM Admin`}</title>
      </Head>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 88 : 280 }}
        className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-r shadow-2xl ${
          theme === 'dark' 
          ? 'bg-[#080a0f]/80 backdrop-blur-xl border-white/5 shadow-black/50' 
          : 'bg-white/90 backdrop-blur-xl border-zinc-200 shadow-zinc-200/50'
        }`}
      >
        <div className={`h-24 flex items-center px-7 overflow-hidden border-b transition-colors duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-zinc-100'}`}>
          <div className="flex items-center justify-between min-w-max w-full">
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="flex flex-col"
              >
                <span className={`font-black tracking-[0.15em] text-lg italic leading-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  {t('management') || 'MANAGEMENT'}
                </span>
              </motion.div>
            )}
            <button 
              title={isCollapsed ? "Open sidebar" : "Close sidebar"}
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-500 hover:text-zinc-900'} ${isCollapsed ? 'mx-auto' : ''}`}
            >
              <Sidebar size={22} strokeWidth={2} />
            </button>
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-3">
          <LayoutGroup>
            {navItems.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <Link key={item.key} href={item.path}>
                  <div className={`w-full flex items-center gap-4 px-4 py-4 rounded-[22px] transition-all relative group overflow-hidden cursor-pointer ${isActive ? 'text-yellow-500 font-bold' : 'text-zinc-500 hover:text-zinc-400'}`}>
                    {isActive && (
                      <motion.div layoutId="activeNav" className="absolute inset-0 bg-yellow-500/10 border border-yellow-500/30" style={{ borderRadius: '22px' }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                    <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}><item.icon size={22} strokeWidth={isActive ? 2.5 : 2} /></div>
                    {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 font-bold text-sm tracking-wide whitespace-nowrap">{item.name}</motion.span>}
                  </div>
                </Link>
              );
            })}
          </LayoutGroup>
        </nav>

        <div className={`p-4 border-t transition-colors duration-500 space-y-2 ${theme === 'dark' ? 'border-white/5 bg-[#05060a]/50' : 'border-zinc-100 bg-zinc-50/50'}`}>
          <Link href="/admin/settings">
            <div className={`w-full flex items-center gap-4 px-4 py-4 rounded-[22px] transition-all relative group overflow-hidden cursor-pointer ${router.pathname === '/admin/settings' ? 'text-yellow-500 font-bold' : 'text-zinc-500 hover:text-zinc-400'}`}>
              {router.pathname === '/admin/settings' && (
                <div className="absolute inset-0 bg-yellow-500/10 border border-yellow-500/30" style={{ borderRadius: '22px' }} />
              )}
              <div className={`relative z-10 transition-transform duration-300 ${router.pathname === '/admin/settings' ? 'scale-110' : 'group-hover:scale-110'}`}>
                <SettingsIcon size={22} strokeWidth={router.pathname === '/admin/settings' ? 2.5 : 2} />
              </div>
              {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 font-bold text-sm tracking-wide whitespace-nowrap">{t('settings')}</motion.span>}
            </div>
          </Link>

          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-[22px] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all group overflow-hidden">
            <LogOut size={22} className="shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
            {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-sm tracking-wide whitespace-nowrap">{t('logout')}</motion.span>}
          </button>
        </div>
      </motion.aside>

      <motion.main animate={{ marginLeft: isCollapsed ? 88 : 280 }} className="min-h-screen p-8 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
        <header className="mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className={`text-4xl font-black tracking-tight italic mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h1>
          </motion.div>
          <div className={`w-full h-[1px] ${theme === 'dark' ? 'bg-white/10' : 'bg-zinc-200'}`} />
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
          {children}
        </motion.div>
      </motion.main>

      <style jsx global>{`
        body { font-family: 'Outfit', sans-serif; }
        body { background-color: ${theme === 'dark' ? '#02040a' : '#f8f9fc'}; overflow-x: hidden; transition: background-color 0.7s ease; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}; border-radius: 20px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(250, 204, 21, 0.3); }
      `}</style>
    </div>
  );
};

export default AdminLayout;
