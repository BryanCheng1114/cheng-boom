import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Check,
  Smartphone,
  Shield,
  Bell,
  Globe
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const SettingsPage = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.theme) setTheme(data.theme);
        }
      } catch (err) {}
    };
    fetchProfile();
  }, []);

  const updateTheme = async (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    setIsUpdating(true);
    try {
      await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
      // Force reload to sync layout theme immediately
      window.location.reload();
    } catch (err) {} finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div className="space-y-10">
        {/* Theme Selection Module */}
        <div className="border dark:border-white/10 border-zinc-100 rounded-[48px] p-10 md:p-14 shadow-2xl dark:bg-zinc-900/20 bg-white">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                {theme === 'dark' ? <Moon size={28} /> : <Sun size={28} />}
              </div>
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900">Visual Appearance</h2>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">Personalize your terminal experience</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button onClick={() => updateTheme('dark')} className={`relative p-8 rounded-[32px] border-2 text-left transition-all duration-500 group ${theme === 'dark' ? 'dark:bg-zinc-950 bg-zinc-900 border-yellow-500 shadow-lg' : 'bg-zinc-100 border-transparent hover:border-zinc-300'}`}>
                <div className="flex justify-between items-start mb-10">
                  <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-400 group-hover:text-yellow-500 transition-colors"><Moon size={32} /></div>
                  {theme === 'dark' && <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-zinc-950"><Check size={14} strokeWidth={4} /></div>}
                </div>
                <h3 className={`text-xl font-black italic uppercase mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-700'}`}>Midnight Protocol</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">Deep blacks and vibrant glows for high-performance nocturnal sessions.</p>
              </button>

              <button onClick={() => updateTheme('light')} className={`relative p-8 rounded-[32px] border-2 text-left transition-all duration-500 group ${theme === 'light' ? 'bg-white border-yellow-500 shadow-lg' : 'bg-zinc-100 border-transparent hover:border-zinc-300'}`}>
                <div className="flex justify-between items-start mb-10">
                  <div className="p-4 rounded-2xl bg-white text-zinc-400 group-hover:text-yellow-500 transition-colors shadow-sm"><Sun size={32} /></div>
                  {theme === 'light' && <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-zinc-950"><Check size={14} strokeWidth={4} /></div>}
                </div>
                <h3 className={`text-xl font-black italic uppercase mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-400'}`}>Daylight Clarity</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">Crisp whites and sharp contrasts for maximum focus during daytime operations.</p>
              </button>
            </div>

            <div className="mt-12 flex items-center gap-4 px-6 py-4 bg-zinc-500/5 rounded-2xl border border-white/5 italic">
              <Smartphone size={16} className="text-yellow-500" />
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                {isUpdating ? 'Synchronizing with database...' : 'Theme preferences are automatically synced across all nodes.'}
              </p>
            </div>
          </div>
        </div>

        {/* Other Settings Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Security', desc: 'Manage access keys & sessions', icon: Shield },
            { label: 'Notifications', desc: 'Email & system alert triggers', icon: Bell },
            { label: 'Localization', desc: 'Currency & language defaults', icon: Globe },
          ].map((item) => (
            <div key={item.label} className="p-8 border dark:border-white/5 border-zinc-100 rounded-[32px] dark:bg-zinc-900/30 bg-white group cursor-not-allowed opacity-60">
              <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-zinc-500 mb-6 group-hover:text-yellow-500 transition-colors">
                <item.icon size={22} />
              </div>
              <h4 className="font-black italic uppercase text-sm dark:text-white text-zinc-900 mb-1">{item.label}</h4>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
