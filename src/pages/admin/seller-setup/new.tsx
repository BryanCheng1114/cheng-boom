import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Check, Copy, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';

type PricingGroup = 'A' | 'B';

export default function AddCustomerAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sellerPricing, setSellerPricing] = useState<PricingGroup>('A');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; pricing: PricingGroup } | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | 'all' | null>(null);

  const returnTo = '/admin/seller-setup';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, sellerPricing }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to create the account.');
      setCreatedCredentials({ email: result.email || email.trim().toLowerCase(), password, pricing: sellerPricing });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create the account.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyCredentials = async (field: 'email' | 'password' | 'all') => {
    if (!createdCredentials) return;
    const text = field === 'email'
      ? createdCredentials.email
      : field === 'password'
        ? createdCredentials.password
        : `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField((current) => current === field ? null : current), 1800);
    } catch {
      setError('Could not access the clipboard. Please select and copy the details manually.');
    }
  };

  return (
    <AdminLayout title="Add Customer" hideTitle>
      <div className="w-full space-y-6 text-slate-700">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">Add Customer</h1>
            <span className="text-xs font-normal text-slate-600">[ New Seller Account ]</span>
          </div>
          <p className="mt-1 text-xs text-slate-600">Seller Account Information /</p>
          <button type="button" onClick={() => router.push(returnTo)} className="mt-4 inline-flex items-center gap-2 border border-slate-400 bg-transparent px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-sky-700 hover:bg-sky-50 hover:text-sky-800">
            <ArrowLeft size={16} /> Back to Seller Accounts
          </button>
        </header>

        {createdCredentials ? (
          <section className="w-full space-y-6 border border-emerald-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex items-start gap-4 border-b border-slate-200 pb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Check size={21} strokeWidth={2.5} /></span>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Seller account created</h2>
                <p className="mt-1 text-sm text-slate-500">Seller {createdCredentials.pricing} pricing is assigned. Copy the sign-in details and send them to the seller.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {([
                { key: 'email' as const, label: 'Email address', value: createdCredentials.email },
                { key: 'password' as const, label: 'Temporary password', value: createdCredentials.password },
              ]).map((credential) => (
                <div key={credential.key} className="min-w-0 border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{credential.label}</p>
                  <div className="flex items-center gap-3">
                    <code className="min-w-0 flex-1 break-all text-sm font-semibold text-slate-900">{credential.value}</code>
                    <button type="button" onClick={() => copyCredentials(credential.key)} className="inline-flex shrink-0 items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800">
                      {copiedField === credential.key ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === credential.key ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => router.push(returnTo)} className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <ArrowLeft size={16} /> Back to Seller Accounts
              </button>
              <button type="button" onClick={() => copyCredentials('all')} className="inline-flex items-center justify-center gap-2 border border-sky-800 bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800">
                {copiedField === 'all' ? <Check size={16} /> : <Copy size={16} />}
                {copiedField === 'all' ? 'Sign-in details copied' : 'Copy email and password'}
              </button>
            </div>
            <p aria-live="polite" className="text-xs text-slate-500">The password is shown here only after creation. It is stored securely as a hash.</p>
            {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
          </section>
        ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-6 border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label htmlFor="customer-email" className="mb-2 block text-sm font-semibold text-slate-800">Email address</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="customer-email"
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="customer@example.com"
                  className="w-full border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">The customer will use this email to sign in. Their display name starts as the part before @.</p>
            </div>

            <div>
              <label htmlFor="customer-password" className="mb-2 block text-sm font-semibold text-slate-800">Temporary password</label>
              <div className="relative">
                <LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="customer-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  className="w-full border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters, including a number and a special character.</p>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-semibold text-slate-800">Seller pricing</legend>
            <p className="mb-3 text-xs text-slate-500">Choose which seller price group this account belongs to.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['A', 'B'] as const).map((group) => (
                <label key={group} className={`flex cursor-pointer items-center gap-3 border p-4 transition-colors ${sellerPricing === group ? 'border-sky-700 bg-sky-50 ring-1 ring-sky-700' : 'border-slate-300 bg-white hover:border-sky-300'}`}>
                  <input type="radio" name="sellerPricing" value={group} checked={sellerPricing === group} onChange={() => setSellerPricing(group)} className="h-4 w-4 accent-sky-700" />
                  <span className="flex h-9 w-9 items-center justify-center bg-white text-sky-800"><ShieldCheck size={18} /></span>
                  <span><span className="block text-sm font-semibold text-slate-800">Seller {group}</span><span className="block text-xs text-slate-500">Price group {group}</span></span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => router.push(returnTo)} className="border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 border border-sky-800 bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {isSaving ? 'Creating account…' : 'Create account'}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">The password is saved securely. Share the sign-in email and temporary password with the customer directly.</p>
        </form>
        )}
      </div>
    </AdminLayout>
  );
}
