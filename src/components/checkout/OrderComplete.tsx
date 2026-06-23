import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export function OrderComplete() {
  const { locale } = useTranslation();

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white border-double border-[6px] border-zinc-200/60 rounded-[40px] shadow-sm overflow-hidden flex flex-col items-center justify-center p-12 sm:p-24 text-center">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-500/10 rounded-full flex items-center justify-center mb-8 text-green-500">
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16" strokeWidth={2} />
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4 tracking-tight">
          {locale === 'zh' ? '订单已成功提交！' : locale === 'ms' ? 'Pesanan Berjaya Dibuat!' : 'Order Successfully Placed!'}
        </h2>
        
        <p className="text-base sm:text-lg text-zinc-500 font-medium mb-12 max-w-md mx-auto leading-relaxed">
          {locale === 'zh' 
            ? '我们的系统已成功接收您的订单！请耐心等待，我们将在24小时内准备您的订单并在WhatsApp上回复您。感谢您的购买与支持！' 
            : locale === 'ms' 
            ? 'Sistem kami telah berjaya menerima pesanan anda! Sila berikan kami masa sehingga 24 jam untuk menyediakan pesanan anda dan membalas mesej WhatsApp anda. Terima kasih atas kesabaran dan sokongan anda!' 
            : 'Our system has successfully received your order! Please allow up to 24 hours for us to prepare everything and reply to your WhatsApp message. We appreciate your patience and thank you for shopping with us!'}
        </p>

        <Link 
          href="/shop" 
          className="px-10 py-4 bg-zinc-900 text-white rounded-full font-black text-sm sm:text-base hover:bg-zinc-800 transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20"
        >
          {locale === 'zh' ? '继续购物' : locale === 'ms' ? 'Teruskan Membeli-belah' : 'CONTINUE SHOPPING'} <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
