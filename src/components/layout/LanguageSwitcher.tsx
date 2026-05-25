import { useRouter } from 'next/router';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ms', label: 'Bahasa Melayu' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === (router.locale || router.defaultLocale)) || languages[0];

  const handleSelect = (code: string) => {
    setIsOpen(false);
    router.push(router.pathname, router.asPath, { locale: code });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-primary bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 hover:border-primary/30 hover:bg-white dark:hover:bg-zinc-900 shadow-sm hover:shadow-md hover:shadow-primary/10 transition-all duration-300"
        aria-label="Select Language"
      >
        <Globe strokeWidth={1.5} size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                currentLang.code === lang.code ? "text-primary font-bold" : "text-foreground"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
