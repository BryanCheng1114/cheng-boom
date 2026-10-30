import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ClipboardList, ShoppingBag, ShoppingCart, UserRound } from 'lucide-react';
import { useCart } from '../cart/CartProvider';
import { useTranslation } from '../../hooks/useTranslation';

export function MobileNavigation() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { totalItems } = useCart();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkUser = () => setIsSignedIn(Boolean(localStorage.getItem('user')));
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('user-updated', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('user-updated', checkUser);
    };
  }, []);

  const labels = locale === 'zh'
    ? { shop: '商店', cart: '购物车', order: '订单', profile: '我的', signInPrompt: '登录，享受更多！', signIn: '登录' }
    : locale === 'ms'
    ? { shop: 'Kedai', cart: 'Troli', order: 'Pesanan', profile: 'Profil', signInPrompt: 'Log masuk untuk lebih banyak!', signIn: 'Log Masuk' }
    : { shop: 'Shop', cart: 'Cart', order: 'Order', profile: 'Profile', signInPrompt: 'Sign in and enjoy more!', signIn: 'Sign in' };
  const items = [
    { key: 'shop', label: labels.shop, href: '/shop', icon: ShoppingBag, active: router.pathname.startsWith('/shop') },
    { key: 'cart', label: labels.cart, href: '/cart', icon: ShoppingCart, active: router.pathname === '/cart' },
    { key: 'order', label: labels.order, href: isSignedIn ? '/profile?tab=orders' : '/login', icon: ClipboardList, active: router.pathname === '/profile' && router.query.tab === 'orders' },
    { key: 'profile', label: labels.profile, href: isSignedIn ? '/profile' : '/login', icon: UserRound, active: ['/profile', '/login'].includes(router.pathname) && router.query.tab !== 'orders' },
  ];

  return (
    <div className="mobile-navigation fixed inset-x-0 bottom-0 z-[150] bg-white md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {!isSignedIn && (
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-100 px-4">
          <p className="text-[13px] font-semibold text-zinc-700">{labels.signInPrompt}</p>
          <Link href="/login" className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700">
            {labels.signIn}
          </Link>
        </div>
      )}
      <nav aria-label="Mobile navigation" className="grid h-[66px] grid-cols-4 border-t border-zinc-200 bg-white shadow-[0_-4px_18px_rgba(0,0,0,0.06)]">
        {items.map(({ key, label, href, icon: Icon, active }) => (
          <Link key={label} href={href} aria-current={active ? 'page' : undefined} className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset ${active ? 'text-black' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <span id={key === 'cart' ? 'mobile-nav-cart-btn' : undefined} className={`relative flex h-9 w-11 items-center justify-center rounded-full transition-colors ${active ? 'text-black' : 'text-zinc-500'}`}>
              <Icon size={22} strokeWidth={active ? 2.15 : 1.8} />
              {key === 'cart' && totalItems > 0 && <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-amber-400 px-1 text-[9px] font-extrabold leading-none text-zinc-950">{totalItems}</span>}
            </span>
            <span className={`text-[10px] ${active ? 'font-bold text-black' : 'font-medium'}`}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
