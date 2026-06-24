import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function Custom404() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl shadow-zinc-200/50 border border-zinc-100">
        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShoppingBag size={32} />
        </div>
        
        <h1 className="text-4xl font-black text-zinc-900 mb-4 tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-zinc-800 mb-3">Page Not Found</h2>
        <p className="text-zinc-500 text-sm mb-10 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link 
          href="/" 
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold text-sm py-4 rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
