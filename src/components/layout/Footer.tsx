import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { Phone, MessageCircle, Mail, MapPin, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useBusiness } from '../../context/BusinessContext';

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-blue-600 dark:text-blue-400">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-pink-600 dark:text-pink-400">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-black dark:text-white">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

export function Footer() {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const [categories, setCategories] = useState<any[]>([]);

  const WHATSAPP_NUMBER = settings?.whatsapp || '601112269835';
  const DISPLAY_NUMBER  = settings?.phone || '+60 111-226-9835';
  const EMAIL           = settings?.email || 'hello@cheng-boom.test';

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
    { href: '/contact',       label: t.nav.contact },
  ];

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
  };

  const FONT_MAP: Record<string, string> = {
    'Impact': "Impact, 'Arial Black', sans-serif",
    'Playfair Display': "Georgia, 'Times New Roman', serif",
    'Bebas Neue': "'Arial Black', 'Arial Bold', sans-serif",
    'Pacifico': "'Comic Sans MS', 'Bradley Hand', cursive",
    'Montserrat': "'Trebuchet MS', 'Lucida Grande', sans-serif",
  };
  const selectedFont = settings?.businessFont || 'Impact';
  const fontFamily = FONT_MAP[selectedFont] || FONT_MAP['Impact'];

  return (
    <footer className="bg-gray-50 dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 mt-auto transition-colors duration-300">

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* ---- Column 1: Brand ---- */}
          <div className="space-y-6 flex flex-col">
            <Link href="/" className="flex flex-col items-start gap-4 group">
              <div className="relative w-48 h-24 sm:w-64 sm:h-32 transition-transform duration-500 group-hover:scale-105">
                <img
                  src={settings?.watermarkUrl || "/transparent-Background.png"}
                  alt={`${settings?.businessName || 'Cheng-BOOM'} Logo`}
                  className="w-full h-full object-contain object-left drop-shadow-[0_0_20px_rgba(255,165,0,0.3)] filter transition-all duration-500 group-hover:drop-shadow-[0_0_30px_rgba(255,165,0,0.5)]"
                />
              </div>
              <span 
                className="font-black text-3xl italic tracking-wider bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 origin-left inline-block pr-2"
                style={{ fontFamily }}
              >
                {settings?.businessName || 'Cheng-BOOM'}
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
                    className="flex items-center text-sm transition-colors group
                      text-zinc-500 hover:text-primary
                      dark:text-zinc-400 dark:hover:text-primary"
                  >
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
                      className="flex items-center text-sm transition-colors group
                        text-zinc-500 hover:text-primary
                        dark:text-zinc-400 dark:hover:text-primary"
                    >
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

              {/* Instagram */}
              {settings?.instagram && (
                <li>
                  <a
                    href={settings.instagram.startsWith('http') ? settings.instagram : `https://instagram.com/${settings.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 transition-colors group
                      text-zinc-500 hover:text-pink-600
                      dark:text-zinc-400 dark:hover:text-pink-400"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                      bg-pink-100 group-hover:bg-pink-200
                      dark:bg-pink-500/10 dark:group-hover:bg-pink-500/20"
                    >
                      <InstagramIcon />
                    </div>
                    <span className="text-sm font-medium">@{settings.instagram.replace('@', '')}</span>
                  </a>
                </li>
              )}

              {/* Facebook */}
              {settings?.facebook && (
                <li>
                  <a
                    href={settings.facebook.startsWith('http') ? settings.facebook : `https://facebook.com/${settings.facebook}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 transition-colors group
                      text-zinc-500 hover:text-blue-600
                      dark:text-zinc-400 dark:hover:text-blue-400"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                      bg-blue-100 group-hover:bg-blue-200
                      dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20"
                    >
                      <FacebookIcon />
                    </div>
                    <span className="text-sm font-medium">Facebook</span>
                  </a>
                </li>
              )}

              {/* TikTok */}
              {settings?.tiktok && (
                <li>
                  <a
                    href={settings.tiktok.startsWith('http') ? settings.tiktok : `https://tiktok.com/@${settings.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 transition-colors group
                      text-zinc-500 hover:text-black
                      dark:text-zinc-400 dark:hover:text-white"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                      bg-zinc-200 group-hover:bg-zinc-300
                      dark:bg-white/10 dark:group-hover:bg-white/20"
                    >
                      <TikTokIcon />
                    </div>
                    <span className="text-sm font-medium">@{settings.tiktok.replace('@', '')}</span>
                  </a>
                </li>
              )}

            </ul>

            {settings?.address && (
              <div className="mt-4">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 transition-colors group text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                    bg-zinc-100 dark:bg-zinc-800 group-hover:bg-red-100 dark:group-hover:bg-red-500/20"
                  >
                    <MapPin size={15} className="text-zinc-600 dark:text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap flex-1 mt-1">{settings.address}</p>
                </a>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ---- Bottom Bar ---- */}
      <div className="border-t border-gray-200 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} {settings?.businessName || 'Cheng-BOOM'}. {t.footer.allRightsReserved || 'All rights reserved.'}
          </p>
          <p className="text-zinc-400 dark:text-zinc-600 text-xs">{t.footer.orderNote}</p>
        </div>
      </div>
    </footer>
  );
}
