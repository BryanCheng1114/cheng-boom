import { useRouter } from 'next/router';
import en from '../utils/locales/en.json';
import zh from '../utils/locales/zh.json';

const dictionaries: Record<string, any> = {
  en,
  zh,
};

export function useTranslation() {
  const router = useRouter();
  const { locale, defaultLocale } = router;

  const currentLocale = locale || defaultLocale || 'en';
  const t = dictionaries[currentLocale] || dictionaries['en'];

  return { t, locale: currentLocale };
}
