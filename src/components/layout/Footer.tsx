import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, MessageCircle, Mail, MapPin, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';


const WHATSAPP_NUMBER = '601112269835';
const DISPLAY_NUMBER  = '+60 111-226-9835';
const EMAIL           = 'hello@cheng-boom.test';

export function Footer() {
  const { t, locale } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Defined inside component so they can use t.*
  const quickLinks = [
    { href: '/shop',      label: t.nav.shopAll },
    { href: '/#shop-categories', label: t.footer.shopByCategory },
    { href: '/about',         label: t.nav.aboutUs },
    { href: '/about/history', label: t.footer.ourHistory },
    { href: '/contact',       label: t.nav.contact },
  ];

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
  };

  return (
    <footer className="bg-gray-50 dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 mt-auto transition-colors duration-300">

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* ---- Column 1: Brand ---- */}
          <div className="space-y-6 flex flex-col">
            <Link href="/" className="flex flex-col items-start gap-4 group">
              <div className="relative w-48 h-24 sm:w-64 sm:h-32 transition-transform duration-500 group-hover:scale-105">
                <Image
                  src="/transparent-Background.png"
                  alt="Cheng-BOOM Logo"
                  fill
                  sizes="(max-width: 768px) 192px, 256px"
                  className="object-contain object-left drop-shadow-[0_0_20px_rgba(255,165,0,0.3)] filter transition-all duration-500 group-hover:drop-shadow-[0_0_30px_rgba(255,165,0,0.5)]"
                  priority
                />
              </div>
              <span 
                className="font-black text-3xl italic tracking-wider bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 origin-left inline-block pr-2"
                style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
              >
                Cheng-BOOM
              </span>
            </Link>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>

          {/* ---- Column 2: Quick Links ---- */}
          <div className="space-y-5">
            <h3 className="text-zinc-900 dark:text-white font-bold text-sm tracking-widest uppercase">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map(({ href, label }) => (
                <li key={`${href}-${label}`}>
                  <Link
                    href={href}
                    className="flex items-center gap-1.5 text-sm transition-colors group
                      text-zinc-500 hover:text-primary
                      dark:text-zinc-400 dark:hover:text-primary"
                  >
                    <ChevronRight
                      size={14}
                      className="text-zinc-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all
                        dark:text-zinc-600 dark:group-hover:text-primary"
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ---- Column 3: Categories ---- */}
          <div className="space-y-5">
            <h3 className="text-zinc-900 dark:text-white font-bold text-sm tracking-widest uppercase">
              {t.footer.categories}
            </h3>
            <ul className="space-y-3">
              {(categories.length > 0 ? categories : [
                { id: '1', name: 'Fireworks' },
                { id: '2', name: 'Firecrackers' },
                { id: '3', name: 'Fountain' },
                { id: '4', name: 'Handheld' },
                { id: '5', name: 'Skyline' },
                { id: '6', name: 'Spinning' },
                { id: '7', name: 'Pop Pop' },
                { id: '8', name: 'Dragon Pili' },
                { id: '9', name: 'Soundcloud' },
              ]).map((cat) => {
                const key = cat.key || cat.name.toLowerCase().replace(/\s+/g, '');
                
                let label = cat.name;
                if (locale === 'zh' && cat.nameZh) label = cat.nameZh;
                else if (locale === 'ms' && cat.nameMs) label = cat.nameMs;
                else label = (t.shopCategories as any)[key] || cat.name;

                return (
                  <li key={cat.id}>
                    <Link
                      href={`/shop?category=${key}`}
                      className="flex items-center gap-1.5 text-sm transition-colors group
                        text-zinc-500 hover:text-primary
                        dark:text-zinc-400 dark:hover:text-primary"
                    >
                      <ChevronRight
                        size={14}
                        className="text-zinc-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all
                          dark:text-zinc-600 dark:group-hover:text-primary"
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ---- Column 4: Contact Us ---- */}
          <div className="space-y-5">
            <h3 className="text-zinc-900 dark:text-white font-bold text-sm tracking-widest uppercase">
              {t.footer.contactUs}
            </h3>
            <ul className="space-y-4">

              {/* Phone / WhatsApp */}
              <li>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-3 transition-colors group w-full text-left
                    text-zinc-500 hover:text-green-600
                    dark:text-zinc-400 dark:hover:text-green-400"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                    bg-green-100 group-hover:bg-green-200
                    dark:bg-green-500/10 dark:group-hover:bg-green-500/20"
                  >
                    <Phone size={15} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{DISPLAY_NUMBER}</span>
                </button>
              </li>

              {/* WhatsApp link */}
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 transition-colors group
                    text-zinc-500 hover:text-green-600
                    dark:text-zinc-400 dark:hover:text-green-400"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                    bg-green-100 group-hover:bg-green-200
                    dark:bg-green-500/10 dark:group-hover:bg-green-500/20"
                  >
                    <MessageCircle size={15} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{t.footer.whatsapp}</span>
                </a>
              </li>

              {/* Email */}
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="flex items-center gap-3 transition-colors group
                    text-zinc-500 hover:text-primary
                    dark:text-zinc-400 dark:hover:text-primary"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                    bg-yellow-100 group-hover:bg-yellow-200
                    dark:bg-primary/10 dark:group-hover:bg-primary/20"
                  >
                    <Mail size={15} className="text-yellow-600 dark:text-primary" />
                  </div>
                  <span className="text-sm font-medium">{EMAIL}</span>
                </a>
              </li>


            </ul>
          </div>

        </div>
      </div>

      {/* ---- Bottom Bar ---- */}
      <div className="border-t border-gray-200 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
          <p className="text-zinc-400 dark:text-zinc-600 text-xs">{t.footer.orderNote}</p>
        </div>
      </div>
    </footer>
  );
}
