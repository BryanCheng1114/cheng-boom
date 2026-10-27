import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarDays, Loader2, Plus, Search, ShieldCheck } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';

type SellerAccount = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  sellerPricing: 'A' | 'B' | null;
  isActive: boolean;
  createdAt: string;
};

export default function SellerSetupPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [sellers, setSellers] = useState<SellerAccount[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sellers')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load seller accounts');
        setSellers(await response.json());
      })
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredSellers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sellers;
    return sellers.filter((seller) =>
      [seller.name, seller.email, seller.phone, seller.sellerPricing, seller.id]
        .some((value) => String(value || '').toLowerCase().includes(query)),
    );
  }, [sellers, search]);

  return (
    <AdminLayout title={t('seller_setup')} hideTitle>
      <div className="space-y-6 text-slate-700">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('seller_setup_title')}</h1>
            <p className="mt-1 text-xs text-slate-600">{t('seller_setup_desc')}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/seller-setup/new')}
            className="inline-flex items-center justify-center gap-2 border border-sky-800 bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800"
          >
            <Plus size={16} /> Add Customer
          </button>
        </header>

        <section className="overflow-hidden border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-medium tracking-tight text-slate-800">Seller account list</h2>
              <p className="mt-1 text-xs text-slate-500">{sellers.length} account{sellers.length === 1 ? '' : 's'}</p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search seller accounts"
                className="w-full border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-600"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sky-700" size={28} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-slate-200 bg-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-700">Account</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-700">Email</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-700">Seller pricing</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-700">Created</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSellers.map((seller) => (
                    <tr
                      key={seller.id}
                      onClick={() => router.push(`/admin/seller-setup/${seller.id}`)}
                      className="cursor-pointer transition-colors odd:bg-white even:bg-slate-50 hover:bg-sky-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-800"><ShieldCheck size={17} /></span>
                          <span className="text-sm font-semibold text-slate-800">{seller.name || 'Seller account'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{seller.email || '—'}</td>
                      <td className="px-5 py-4">
                        {seller.sellerPricing ? (
                          <span className="inline-flex items-center border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">Seller {seller.sellerPricing}</span>
                        ) : <span className="text-sm text-slate-400">Not assigned</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2"><CalendarDays size={14} className="text-slate-400" />{new Date(seller.createdAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </td>
                      <td className="px-5 py-4"><span className={`border px-2.5 py-1 text-xs font-medium ${seller.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{seller.isActive ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                  {filteredSellers.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-500">{sellers.length ? 'No seller accounts match your search.' : 'No seller accounts yet. Use Add Customer to create one.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
