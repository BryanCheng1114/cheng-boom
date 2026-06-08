import { useRouter } from 'next/router';

export function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = router.locale || router.defaultLocale || 'en';
  const nextLocale = currentLocale === 'en' ? 'zh' : 'en';
  const label = currentLocale === 'en' ? 'EN' : '中文';
  const nextLabel = nextLocale === 'en' ? 'EN' : '中文';

  const toggleLanguage = () => {
    router.push(router.pathname, router.asPath, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex h-9 items-center justify-center rounded-full bg-white/10 px-4 text-xs font-bold text-white/88 ring-1 ring-white/8 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/16 hover:text-white hover:shadow-[0_8px_22px_rgba(255,255,255,0.08)]"
      aria-label={`Switch language to ${nextLabel}`}
      title={`Switch language to ${nextLabel}`}
    >
      <span>{label}</span>
    </button>
  );
}
