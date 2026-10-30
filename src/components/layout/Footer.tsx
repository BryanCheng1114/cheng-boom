import { useRouter } from 'next/router';
import { useTranslation } from '../../hooks/useTranslation';
import { useBusiness } from '../../context/BusinessContext';

export function Footer() {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const router = useRouter();
  const businessName = settings?.businessName || 'Cheng-BOOM';
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto hidden border-t border-zinc-200 bg-zinc-50 text-zinc-600 md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-zinc-800">
          {t.footer?.copyright
            ? `${t.footer.copyright} © ${year} ${businessName}. ${t.footer.allRightsReserved}`
            : `Copyright © ${year} ${businessName}. All Rights Reserved.`}
        </p>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white p-1" aria-label="Language">
          {([
            { code: 'en', label: 'EN' },
            { code: 'zh', label: '中文' },
          ] as const).map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => {
                if (locale !== language.code) void router.push(router.pathname, router.asPath, { locale: language.code });
              }}
              aria-pressed={locale === language.code}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${locale === language.code ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              {language.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
