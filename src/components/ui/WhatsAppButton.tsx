import Image from 'next/image';
import { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const WHATSAPP_NUMBER = '601112269835';

export function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { t } = useTranslation();

  // Pre-filled message — covers the most common questions shoppers ask
  const DEFAULT_MESSAGE = encodeURIComponent(
    t.floating.whatsapp.defaultMessage || `Hello! 👋 I found your store online and I'm interested in your fireworks products.\n\nCould you help me with the following:\n\n1. 🎆 What fireworks do you have available?\n2. 💰 What are the current prices?\n3. 🕐 What are your operating hours?\n4. 📦 Do you offer delivery or only self-pickup?\n5. 🎉 Can I get a package deal for a special event?\n\nThank you!`
  );

  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${DEFAULT_MESSAGE}`;

  return (
    <>
      {/* Message preview bubble */}
      {showPreview && (
        <div className="fixed bottom-28 right-4 sm:right-6 z-50 w-72 animate-fade-in-up">
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-4">
            {/* Close */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3 pr-6">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Cheng-BOOM</p>
                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  {t.floating.whatsapp.online}
                </p>
              </div>
            </div>

            {/* Message bubble */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl rounded-tl-none p-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-1">
              <p>{t.floating.whatsapp.greeting}</p>
              <p>{t.floating.whatsapp.q1}</p>
              <p>{t.floating.whatsapp.q2}</p>
              <p>{t.floating.whatsapp.q3}</p>
              <p>{t.floating.whatsapp.q4}</p>
            </div>

            {/* CTA */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => setShowPreview(false)}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] shadow-lg shadow-green-500/30"
            >
              <MessageCircle size={16} />
              {t.floating.whatsapp.chatBtn}
            </a>

            {/* Pointer arrow */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200 dark:border-zinc-700 rotate-45" />
          </div>
        </div>
      )}

      {/* Floating button */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2">

        {/* Tooltip label */}
        {showTooltip && !showPreview && (
          <div className="bg-primary text-zinc-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-4 duration-300 uppercase tracking-widest border border-primary/20 flex items-center h-7">
            {t.floating.whatsapp.chatWithUs}
          </div>
        )}

        <button
          onClick={() => setShowPreview(!showPreview)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label={t.floating.whatsapp.chatBtn}
          className="relative w-16 h-16 rounded-full shadow-2xl shadow-green-500/40 hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden group"
        >
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDelay: '0.4s' }} />

          {/* Icon image */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-green-500 group-hover:brightness-110 transition-all">
            <Image
              src="/whatsapp-call-icon-psd-editable_314999-3666.avif"
              alt="Chat on WhatsApp"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        </button>
      </div>
    </>
  );
}
