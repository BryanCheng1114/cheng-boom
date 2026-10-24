import React from 'react';
import { useRouter } from 'next/router';
import { CheckCircle2, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { OrderCompletionDetails } from './OrderCompletionDetails';

interface OrderCompleteProps {
  details?: OrderCompletionDetails | null;
}

export function OrderComplete({ details }: OrderCompleteProps) {
  const router = useRouter();
  const { locale } = useTranslation();
  const isCash = details?.paymentMethod === 'Cash on Delivery';
  const paymentStatus = isCash
    ? (locale === 'zh' ? '货到付款' : locale === 'ms' ? 'Tunai Semasa Penghantaran' : 'Cash on Delivery')
    : (locale === 'zh' ? '已付款' : locale === 'ms' ? 'Dibayar' : 'Paid');

  return (
    <div className="mx-auto flex w-full max-w-2xl animate-in zoom-in-95 flex-col items-center justify-center pb-12 duration-500 sm:pb-16">
      <div className="w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative overflow-hidden px-6 pb-7 pt-9 text-center sm:px-10 sm:pb-9 sm:pt-12">
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/3 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 sm:h-24 sm:w-24">
            <CheckCircle2 className="h-11 w-11 text-white sm:h-12 sm:w-12" strokeWidth={1.8} />
          </div>
          <h2 className="relative text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {isCash
              ? (locale === 'zh' ? '订单成功' : locale === 'ms' ? 'Pesanan Berjaya' : 'Order Successful')
              : (locale === 'zh' ? '付款成功' : locale === 'ms' ? 'Pembayaran Berjaya' : 'Payment Successful')}
          </h2>
          <p className="relative mt-2 text-sm text-zinc-600 sm:text-base">
            {isCash
              ? (locale === 'zh' ? '您选择了货到付款。' : locale === 'ms' ? 'Kaedah tunai semasa penghantaran dipilih.' : 'Cash on Delivery method selected.')
              : <>{locale === 'zh' ? '已成功付款' : locale === 'ms' ? 'Berjaya dibayar' : 'Successfully Paid'}{details && <> <span className="font-semibold text-zinc-900">RM {details.totalAmount.toFixed(2)}</span></>}</>}
          </p>
          {isCash && details && <p className="mt-1 text-sm font-medium text-zinc-800">{locale === 'zh' ? '付款方式：货到付款' : locale === 'ms' ? 'Kaedah: Tunai semasa penghantaran' : 'Payment method: Cash on Delivery'}</p>}
        </div>

        {details && (
          <div className="mx-5 mb-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:mx-8 sm:mb-8 sm:p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">{locale === 'zh' ? '费用明细' : locale === 'ms' ? 'Butiran Bayaran' : 'Details'}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4"><span className="text-zinc-500">{locale === 'zh' ? '商品金额' : locale === 'ms' ? 'Harga item' : 'Item price'}</span><span className="font-medium text-zinc-900">RM {details.itemPrice.toFixed(2)}</span></div>
              {details.deliveryMode === 'Delivery' && <div className="flex items-center justify-between gap-4"><span className="text-zinc-500">{locale === 'zh' ? '运费' : locale === 'ms' ? 'Caj penghantaran' : 'Shipping'}</span><span className="font-medium text-zinc-700">{locale === 'zh' ? '稍后计算' : locale === 'ms' ? 'Akan dikira kemudian' : '-'}</span></div>}
              {details.productDiscount > 0 && <div className="flex items-center justify-between gap-4"><span className="text-zinc-500">{locale === 'zh' ? '折扣' : locale === 'ms' ? 'Diskaun' : 'Discount'}</span><span className="font-medium text-zinc-900">-RM {details.productDiscount.toFixed(2)}</span></div>}
              {details.sellerDiscount > 0 && <div className="flex items-center justify-between gap-4"><span className="text-zinc-500">{locale === 'zh' ? '卖家折扣' : locale === 'ms' ? 'Diskaun penjual' : 'Seller discount'}</span><span className="font-medium text-zinc-900">-RM {details.sellerDiscount.toFixed(2)}</span></div>}
              <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-3"><span className="font-semibold text-zinc-900">{locale === 'zh' ? '总金额' : locale === 'ms' ? 'Jumlah Keseluruhan' : 'Grand Total'}</span><span className="font-bold text-zinc-900">RM {details.totalAmount.toFixed(2)}</span></div>
              {details.deliveryMode === 'Delivery' && <p className="text-xs leading-relaxed text-zinc-500">{locale === 'zh' ? '运费不包含在总额内，将稍后确认。' : locale === 'ms' ? 'Caj penghantaran tidak termasuk dalam jumlah dan akan disahkan kemudian.' : 'Shipping is not included in the total and will be confirmed later.'}</p>}
              <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-3"><span className="font-semibold text-zinc-900">{locale === 'zh' ? '状态' : locale === 'ms' ? 'Status' : 'Status'}</span><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isCash ? 'border-zinc-300 bg-white text-zinc-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{paymentStatus}</span></div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 px-5 pb-6 sm:flex-row sm:justify-center sm:px-8 sm:pb-8">
          <button onClick={() => router.push('/shop')} className="flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100">
            <ArrowLeft className="h-4 w-4" />{locale === 'zh' ? '继续购物' : locale === 'ms' ? 'Teruskan Membeli-belah' : 'Continue Shopping'}
          </button>
          <button onClick={() => router.push('/')} className="flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
            <Home className="h-4 w-4" />{locale === 'zh' ? '返回首页' : locale === 'ms' ? 'Kembali ke Laman Utama' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}
