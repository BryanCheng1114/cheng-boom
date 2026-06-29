import React from 'react';
import { useRouter } from 'next/router';
import { CheckCircle2, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import SpotlightCard from '../ui/SpotlightCard';

export function OrderComplete() {
  const router = useRouter();
  const { locale } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 pb-16">
      <SpotlightCard
        className="w-full rounded-[40px] shadow-sm border border-zinc-100 bg-white"
        spotlightColor="rgba(0, 0, 0, 0.05)"
      >
        <div className="p-8 sm:p-12 w-full text-center relative overflow-hidden rounded-[40px]">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-[bounce_1s_ease-in-out_1]">
              <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 text-green-500" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-3 sm:mb-4">
              {locale === 'zh' ? '订单已成功提交！' : locale === 'ms' ? 'Pesanan Berjaya!' : 'Order Placed Successfully!'}
            </h2>
            
            <p className="text-zinc-500 font-medium text-sm sm:text-lg mb-6 sm:mb-8 max-w-lg leading-relaxed">
              {locale === 'zh' 
                ? '感谢您的购买。我们已经收到您的订单详情，并且正在处理中。您的订单将在24小时内开始处理。' 
                : locale === 'ms' 
                  ? 'Terima kasih atas pesanan anda. Kami telah menerima butiran pesanan anda dan sedang menyemaknya. Pesanan anda akan mula diproses dalam masa 24 jam.' 
                  : 'Thank you for your purchase. We have received your order details and are currently reviewing them. Your order will start processing within 24 hours.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => router.push('/shop')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 bg-white border-2 border-zinc-200 text-zinc-900 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                {locale === 'zh' ? '继续购物' : locale === 'ms' ? 'Teruskan Membeli-belah' : 'Continue Shopping'}
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm hover:bg-zinc-200 transition-all active:scale-95"
              >
                <Home className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                {locale === 'zh' ? '返回首页' : locale === 'ms' ? 'Kembali ke Laman Utama' : 'Back to Home'}
              </button>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
