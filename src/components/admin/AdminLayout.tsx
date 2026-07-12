import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  LogOut, 
  LayoutDashboard, 
  Package, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag,
  Building,
  Award,
  TrendingUp,
  Sidebar,
  Layers,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
  hideTitle?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, headerActions, hideTitle }) => {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.language && language !== data.language) setLanguage(data.language);
        }
      } catch (err) {}
    };
    fetchProfile();
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#f8f9fc]" />;
  }

  const navItems = [
    { name: t('dashboard') || 'Dashboard', key: 'dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('revenue') || 'Revenue', key: 'revenue', path: '/admin/revenue', icon: TrendingUp },
    { name: t('category') || 'Category', key: 'category', path: '/admin/category', icon: Layers },
    { name: t('inventory') || 'Inventory', path: '/admin/product', icon: Package },
    { name: t('orders') || 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: t('customers') || 'Customers', path: '/admin/customer', icon: Users },
    { name: t('seller_setup') || 'Seller Setup', key: 'seller-setup', path: '/admin/seller-setup', icon: Award },
    { name: t('business_setup') || 'Business Setup', key: 'business-setup', path: '/admin/business-setup', icon: Building },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await fetch('/api/admin/logout');
      router.push('/admin');
    } catch (error) {}
  };

  return (
    <div className="min-h-screen font-sans bg-[#f8f9fc] text-zinc-900 flex">
      <Head>
        <title>{`${title} | Cheng-BOOM Admin`}</title>
      </Head>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out bg-[#1A1F2C] border-r border-[#1A1F2C]"
      >
        {/* Top Header */}
        <div className="h-20 flex items-center justify-between px-6">
          {!isCollapsed && (
            <span className="font-bold text-2xl text-white tracking-wide">
              {t('admin_title') || 'Admin'}
            </span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={`p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          >
            <ChevronLeft size={20} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 space-y-2 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = router.pathname.startsWith(item.path);
            return (
              <Link key={item.key} href={item.path}>
                <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                  <div className="shrink-0">
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {!isCollapsed && (
                    <span className="text-sm whitespace-nowrap">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto">
          {/* Language Toggle */}
          <div className="px-4 pb-4 space-y-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <div className="shrink-0">
                <Globe size={20} strokeWidth={2} />
              </div>
              {!isCollapsed && (
                <span className="text-sm whitespace-nowrap">{language === 'en' ? 'English' : '中文'}</span>
              )}
            </button>
          </div>

          {/* Admin Avatar & Logout */}
          <div className="border-t border-white/10 p-4">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{t('admin_title') || 'Admin'}</span>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider">{t('super_admin') || 'Super Admin'}</span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <button 
                  onClick={handleLogout} 
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
            
            {/* If collapsed, show logout on a separate row just below avatar for easy access, or just keep it simple */}
            {isCollapsed && (
              <div className="mt-4 flex justify-center">
                 <button 
                  onClick={handleLogout} 
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.main 
        animate={{ marginLeft: isCollapsed ? 80 : 280 }} 
        className="flex-1 min-h-screen p-8 transition-all duration-300 ease-in-out bg-white"
      >
        {!hideTitle && (
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
            </motion.div>
            {headerActions && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {headerActions}
              </motion.div>
            )}
          </header>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
          {children}
        </motion.div>
      </motion.main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{t('confirm_logout') || 'Confirm Logout'}</h3>
              <p className="text-sm text-zinc-500 mb-8 font-medium">
                {t('logout_message') || 'Are you sure you want to log out of the admin panel? You will need to sign in again to access the dashboard.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition-colors text-sm"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors text-sm shadow-sm shadow-red-500/20"
                >
                  {t('yes_logout') || 'Yes, Log out'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        body { font-family: 'Outfit', sans-serif; background-color: #ffffff; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 20px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.2); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AdminLayout;
