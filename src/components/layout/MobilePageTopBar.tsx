import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

export function MobilePageTopBar({ title, locale }: { title: string; locale: string }) {
  const router = useRouter();

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-[160] flex items-center justify-center px-4 text-center text-white shadow-md md:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          boxSizing: 'border-box',
          background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else void router.push('/profile');
          }}
          aria-label={locale === 'zh' ? '返回' : locale === 'ms' ? 'Kembali' : 'Go back'}
          className="absolute left-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:bg-white/20"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <span className="max-w-[70%] truncate text-base font-semibold tracking-wide">{title}</span>
      </div>
      <style jsx global>{`
        @media (max-width: 767px) {
          .with-mobile-page-topbar {
            padding-top: calc(56px + env(safe-area-inset-top, 0px)) !important;
          }
        }
      `}</style>
    </>
  );
}
