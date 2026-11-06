import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Loader2, Phone, RefreshCw, UserRound } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';

type AccountRequest = { id: string; name: string; phone: string; referredBy: string | null; status: string; createdAt: string };
type RequestStatusFilter = 'All' | 'Pending' | 'Completed';

export default function AccountRequestsPage() {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const loadErrorMessage = isZh ? '无法加载账户申请。' : 'Unable to load account requests.';
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const copy = isZh ? {
    title: '账户申请', description: '查看新客户申请并继续创建账户。', refresh: '刷新', pending: '待处理', allRequests: '申请名单', requestCount: (count: number) => `${count} 项申请`, customer: '客户', phone: '电话号码', referredBy: '介绍人', received: '提交时间', status: '状态', action: '操作', create: '创建账户', noRequests: '目前没有账户申请', noRequestsHelp: '新客户提交申请后，会显示在这里。', noFilteredRequests: '没有符合此状态的申请', filterStatus: '筛选状态', allStatus: '全部状态', pendingStatus: '待处理', completedStatus: '已完成', notProvided: '未提供', loadError: '无法加载账户申请。',
  } : {
    title: 'Account Requests', description: 'Review new customer requests and continue to account setup.', refresh: 'Refresh', pending: 'pending', allRequests: 'Request list', requestCount: (count: number) => `${count} ${count === 1 ? 'request' : 'requests'}`, customer: 'Customer', phone: 'Phone number', referredBy: 'Referred by', received: 'Received', status: 'Status', action: 'Action', create: 'Create account', noRequests: 'No account requests yet', noRequestsHelp: 'New customer requests will appear here.', noFilteredRequests: 'No requests match this status', filterStatus: 'Filter status', allStatus: 'All statuses', pendingStatus: 'Pending', completedStatus: 'Completed', notProvided: 'Not provided', loadError: 'Unable to load account requests.',
  };

  const loadRequests = async () => {
    setError('');
    try {
      const response = await fetch('/api/account-requests');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || copy.loadError);
      setRequests(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/account-requests')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || loadErrorMessage);
        if (active) setRequests(data);
      })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : loadErrorMessage); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadErrorMessage]);

  const pendingCount = requests.filter((request) => request.status === 'Pending').length;
  const filteredRequests = statusFilter === 'All' ? requests : requests.filter((request) => request.status === statusFilter);
  const dateLocale = isZh ? 'zh-CN' : 'en-MY';
  const statusLabel = (status: string) => status === 'Pending' ? copy.pendingStatus : copy.completedStatus;

  return <AdminLayout title={copy.title} hideTitle>
    <div className="space-y-6 text-slate-700">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{copy.title}</h1>
          <p className="mt-1 text-xs text-slate-600">{copy.description}</p>
        </div>
        <button type="button" onClick={() => { setLoading(true); void loadRequests(); }} disabled={loading} className="inline-flex items-center justify-center gap-2 self-start border border-sky-800 bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 disabled:cursor-wait disabled:opacity-70 sm:self-auto">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={15} />}{copy.refresh}
        </button>
      </header>

      {error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-slate-800">{copy.allRequests}</h2>
            <p className="mt-1 text-xs text-slate-500">{copy.requestCount(filteredRequests.length)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span>{copy.filterStatus}</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RequestStatusFilter)} className="border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-600">
                <option value="All">{copy.allStatus}</option>
                <option value="Pending">{copy.pendingStatus}</option>
                <option value="Completed">{copy.completedStatus}</option>
              </select>
            </label>
            <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{pendingCount} {copy.pending}</div>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sky-700" size={28} /></div> : requests.length === 0 ? (
          <div className="border-t-0 px-5 py-14 text-center">
            <UserRound className="mx-auto text-slate-300" size={32} />
            <p className="mt-3 text-sm font-semibold text-slate-800">{copy.noRequests}</p>
            <p className="mt-1 text-xs text-slate-500">{copy.noRequestsHelp}</p>
          </div>
        ) : filteredRequests.length === 0 ? <div className="px-5 py-14 text-center text-sm text-slate-500">{copy.noFilteredRequests}</div> : <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead className="border-b border-slate-200 bg-slate-100">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-slate-700">{copy.customer}</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-700">{copy.phone}</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-700">{copy.referredBy}</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-700">{copy.received}</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-700">{copy.status}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-700">{copy.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRequests.map((request) => <tr key={request.id} className="transition-colors odd:bg-white even:bg-slate-50 hover:bg-sky-50/60">
                <td className="px-5 py-4 text-sm font-semibold text-slate-800">{request.name}</td>
                <td className="px-5 py-4"><a href={`tel:${request.phone}`} className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-slate-600 hover:text-sky-800"><Phone size={14} className="text-slate-400" />{request.phone}</a></td>
                <td className="px-5 py-4 text-sm text-slate-600">{request.referredBy || copy.notProvided}</td>
                <td className="px-5 py-4 text-sm text-slate-600"><span className="inline-flex items-center gap-2 whitespace-nowrap"><CalendarDays size={14} className="text-slate-400" />{new Date(request.createdAt).toLocaleString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></td>
                <td className="px-5 py-4"><span className={`inline-flex whitespace-nowrap border px-2.5 py-1 text-xs font-semibold ${request.status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{statusLabel(request.status)}</span></td>
                <td className="px-5 py-4 text-right"><Link href={{ pathname: '/admin/seller-setup/new', query: { requestId: request.id, name: request.name, phone: request.phone, referredBy: request.referredBy || '' } }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap border border-sky-800 bg-sky-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800">{copy.create}<ArrowRight size={15} /></Link></td>
              </tr>)}
            </tbody>
          </table>
        </div>}
      </section>
    </div>
  </AdminLayout>;
}
