import { useRouter } from 'next/router';
import en from '../utils/locales/en.json';
import zh from '../utils/locales/zh.json';
import ms from '../utils/locales/ms.json';

const dictionaries: Record<string, any> = {
  en,
  zh,
  ms,
};

export function useTranslation() {
  const router = useRouter();
  const { locale, defaultLocale } = router;

  const currentLocale = locale || defaultLocale || 'en';
  const t = dictionaries[currentLocale] || dictionaries['en'];

  return { t, locale: currentLocale };
}
