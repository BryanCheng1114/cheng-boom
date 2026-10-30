import { useEffect, useState } from 'react';
import { PlusSquare, Share2, Smartphone, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const DISMISSED_KEY = 'cheng-boom-add-to-home-dismissed';

export function AddToHomeScreenGuide({ className = '' }: { className?: string }) {
  const { locale } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    setIsIOS(iosDevice);
    try {
      setVisible(isMobile && !isStandalone && localStorage.getItem(DISMISSED_KEY) !== 'true');
    } catch {
      setVisible(isMobile && !isStandalone);
    }

    const handleInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', handleInstalled);
    return () => window.removeEventListener('appinstalled', handleInstalled);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Keep the dismissal for this page session when storage is unavailable.
    }
  };

  if (!visible) return null;

  const title = locale === 'zh' ? '添加到主屏幕' : locale === 'ms' ? 'Tambah ke Skrin Utama' : 'Add to Home Screen';
  const instruction = locale === 'zh'
    ? (isIOS ? '在 Safari 中轻点分享，然后选择“添加到主屏幕”。' : '打开浏览器菜单，然后选择“添加到主屏幕”或“安装应用”。')
    : locale === 'ms'
      ? (isIOS ? 'Dalam Safari, tekan Kongsi, kemudian Tambah ke Skrin Utama.' : 'Buka menu pelayar, kemudian pilih Tambah ke Skrin Utama atau Pasang aplikasi.')
      : (isIOS ? 'In Safari, tap Share, then Add to Home Screen.' : 'Open your browser menu, then choose Add to Home Screen or Install app.');

  return (
    <div className={`my-3 px-4 md:my-0 md:px-0 ${className}`}>
    <aside className="relative w-full rounded-2xl bg-gradient-to-r from-[#e23a2b] via-[#d52b20] to-[#b51f26] p-4 text-white shadow-[0_8px_22px_rgba(181,31,38,0.2)] md:hidden" aria-label={title}>
      <div className="flex items-start gap-3 pr-8">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
          <Smartphone size={21} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold leading-5">{title}</h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-medium leading-5 text-white/90">
            {isIOS && locale === 'en' ? (
              <>
                <span>In Safari, tap</span>
                <span className="inline-flex items-center gap-1 font-bold text-white"><Share2 size={14} />Share</span>
                <span>then</span>
                <span className="inline-flex items-center gap-1 font-bold text-white"><PlusSquare size={14} />Add to Home Screen.</span>
              </>
            ) : (
              <>
                <span>{instruction}</span>
                {isIOS && <span className="inline-flex items-center gap-1.5"><Share2 size={14} /><PlusSquare size={14} /></span>}
              </>
            )}
          </p>
        </div>
      </div>
      <button type="button" onClick={dismiss} aria-label={locale === 'zh' ? '关闭添加到主屏幕提示' : locale === 'ms' ? 'Tutup panduan tambah ke skrin utama' : 'Close Add to Home Screen guide'} className="absolute right-3 top-3 rounded-full p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
        <X size={20} className="text-white/80 transition-colors hover:text-white" />
      </button>
    </aside>
    </div>
  );
}
