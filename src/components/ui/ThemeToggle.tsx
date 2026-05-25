import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Placeholder to avoid layout shift
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-primary bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 hover:border-primary/30 hover:bg-white dark:hover:bg-zinc-900 shadow-sm hover:shadow-md hover:shadow-primary/10 transition-all duration-300"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun strokeWidth={1.5} size={20} /> : <Moon strokeWidth={1.5} size={20} />}
    </button>
  );
}
