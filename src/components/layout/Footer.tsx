import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { QRCodeCanvas } from 'qrcode.react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useBusiness } from '../../context/BusinessContext';

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export function Footer() {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [siteUrl, setSiteUrl] = useState('https://cheng-boom.test');

  const DISPLAY_NUMBER  = settings?.phone || '+60 111-226-9835';
  const EMAIL           = settings?.email || 'hello@cheng-boom.test';
  const businessName = settings?.businessName || 'Cheng-BOOM';

  useEffect(() => {
    setSiteUrl(window.location.origin);
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const quickLinks = [
    { href: '/shop',      label: t.nav.shopAll || 'Shop All' },
    { href: '/about',     label: t.nav.aboutUs || 'About Us' },
    { href: '/contact',   label: t.nav.contact || 'Contact Us' },
  ];

  const currentLocale = router.locale || router.defaultLocale || 'en';
  const nextLocale = currentLocale === 'en' ? 'zh' : 'en';

  const toggleLanguage = () => {
    router.push(router.pathname, router.asPath, { locale: nextLocale });
  };

  return (
    <footer className="bg-[#191919] text-[#b0b0b0] mt-auto border-t border-zinc-800">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* ---- Column 1: SUPPORT ---- */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-base tracking-wide uppercase">
              SUPPORT
            </h3>
            <ul className="space-y-4">
              {quickLinks.map(({ href, label }) => (
                <li key={`${href}-${label}`}>
                  <Link
                    href={href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ---- Column 2: CATEGORIES ---- */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-base tracking-wide uppercase">
              {t.footer?.categories || 'CATEGORIES'}
            </h3>
            <ul className="space-y-4">
              {(categories.length > 0 ? categories : [
                { id: '1', name: 'Fireworks' },
                { id: '2', name: 'Firecrackers' },
                { id: '3', name: 'Fountain' },
                { id: '4', name: 'Handheld' },
                { id: '5', name: 'Skyline' },
              ]).slice(0, 8).map((cat) => {
                const key = cat.key || cat.name.toLowerCase().replace(/\s+/g, '');
                
                let label = cat.name;
                if (locale === 'zh' && cat.nameZh) label = cat.nameZh;
                else if (locale === 'ms' && cat.nameMs) label = cat.nameMs;
                else label = (t.shopCategories as any)?.[key] || cat.name;

                return (
                  <li key={cat.id}>
                    <Link
                      href={`/shop?category=${key}`}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ---- Column 3: CONTACT US ---- */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-base tracking-wide uppercase">
              {t.footer?.contactUs || 'CONTACT US'}
            </h3>
            <ul className="space-y-4">
              <li>
                <a href={`mailto:${EMAIL}`} className="text-sm hover:text-white transition-colors flex flex-col group">
                  <span className="mb-1 text-sm text-[#b0b0b0]">E-mail</span>
                  <span className="text-white group-hover:text-gray-300 transition-colors text-base font-medium">{EMAIL}</span>
                </a>
              </li>
              <li>
                <div className="text-sm flex flex-col mt-4">
                  <span className="mb-1 text-sm text-[#b0b0b0]">Call us:</span>
                  <span className="text-white text-base font-medium">{DISPLAY_NUMBER}</span>
                </div>
              </li>
            </ul>
          </div>

          {/* ---- Column 4: Follow Us ---- */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-base tracking-wide uppercase">
              FOLLOW US
            </h3>
            <div className="flex items-center gap-4">
              {settings?.facebook && (
                <a
                  href={settings.facebook.startsWith('http') ? settings.facebook : `https://facebook.com/${settings.facebook}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                >
                  <FacebookIcon />
                </a>
              )}
              {settings?.instagram && (
                <a
                  href={settings.instagram.startsWith('http') ? settings.instagram : `https://instagram.com/${settings.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                >
                  <InstagramIcon />
                </a>
              )}
              {settings?.tiktok && (
                <a
                  href={settings.tiktok.startsWith('http') ? settings.tiktok : `https://tiktok.com/@${settings.tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                >
                  <TikTokIcon />
                </a>
              )}
              {(!settings?.facebook && !settings?.instagram && !settings?.tiktok) && (
                <>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
                    <FacebookIcon />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
                    <InstagramIcon />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
                    <TikTokIcon />
                  </a>
                </>
              )}
            </div>

            <div className="pt-4">
              <h4 className="text-white font-bold text-sm mb-3">Instant Access</h4>
              <div className="p-4 border border-white/10 rounded-xl bg-black/20 max-w-sm flex items-center gap-5 hover:bg-black/30 transition-colors">
                <div className="p-2 bg-white rounded-xl shrink-0">
                  <QRCodeCanvas 
                    value={siteUrl}
                    size={75}
                    level="L"
                    includeMargin={false}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-white font-bold text-base mb-1.5">Visit Website</span>
                  <span className="text-xs leading-relaxed text-[#b0b0b0]">Scan this QR code with your phone to quickly access our store anytime.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ---- Bottom Bar ---- */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10">
            <div className="flex flex-col gap-1.5">
              <p className="text-white font-medium text-sm">
                Copyright &copy; {new Date().getFullYear()} {businessName}. All Rights Reserved.
              </p>
              <p className="text-xs text-[#808080]">
                Notice: There is no payment gateway available on this website. All transactions are handled separately.
              </p>
            </div>
            
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2.5 text-white hover:text-gray-300 transition-colors group shrink-0"
            >
              <span className="text-sm font-medium">Malaysia / {locale === 'zh' ? '中文' : 'English'}</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Globe size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
