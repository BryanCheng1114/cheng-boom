import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { LogOut, Shield, LayoutDashboard, Settings, Package, Users } from 'lucide-react';

const AdminDashboard = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout');
      router.push('/admin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      <Head>
        <title>Admin Dashboard | Cheng-BOOM Control Center</title>
      </Head>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0a0a] border-r border-white/5 z-50 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <span className="font-bold tracking-tighter text-xl text-orange-500">CHENG-BOOM</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-600/10 text-orange-500 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] transition-all">
            <LayoutDashboard size={18} />
            <span className="font-medium text-sm">Overview</span>
          </button>
          
          {/* Placeholder items */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all group">
            <Package size={18} className="group-hover:text-orange-500 transition-colors" />
            <span className="font-medium text-sm">Products</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all group">
            <Users size={18} className="group-hover:text-orange-500 transition-colors" />
            <span className="font-medium text-sm">Customers</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all group">
            <Settings size={18} className="group-hover:text-orange-500 transition-colors" />
            <span className="font-medium text-sm">Settings</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-8 min-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
              Control Center
            </h1>
            <p className="text-white/40 text-sm">Welcome back, Admin. System operational.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Server Live</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" 
                alt="Avatar" 
                className="w-8 h-8 opacity-80"
              />
            </div>
          </div>
        </header>

        {/* Empty State / Grid Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="h-32 bg-[#0a0a0a] border border-white/5 rounded-xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield size={48} />
              </div>
              <div className="h-2 w-12 bg-white/5 rounded-full mb-4 overflow-hidden">
                <div className="h-full w-2/3 bg-orange-600 shadow-[0_0_10px_#f97316]" />
              </div>
              <div className="h-4 w-24 bg-white/5 rounded" />
            </motion.div>
          ))}
        </div>

        <div className="h-[400px] w-full bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-12 border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-white/20">
            <LayoutDashboard size={32} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Dashboard Ready</h2>
          <p className="text-white/40 max-w-sm">
            The control center is initialized. You can now start building your management widgets here.
          </p>
        </div>
      </main>

      {/* Background Grid/Laser Effect */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
      </div>
    </div>
  );
};

export default AdminDashboard;
