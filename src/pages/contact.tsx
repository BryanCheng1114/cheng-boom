import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { CheckCircle2, Mail, Phone } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { MobilePageTopBar } from '../components/layout/MobilePageTopBar';
import { useBusiness } from '../context/BusinessContext';
import { AddToHomeScreenGuide } from '../components/ui/AddToHomeScreenGuide';

export default function Contact() {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();

  const [formData, setFormData] = useState({ message: '' });
  const [sender, setSender] = useState({ name: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadSender = async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (!savedUser?.id) return;

        setSender({ name: savedUser.name || '', email: savedUser.email || '' });
        const response = await fetch(`/api/customers/${savedUser.id}`);
        if (!response.ok) return;

        const profile = await response.json();
        setSender({ name: profile.name || savedUser.name || '', email: profile.email || savedUser.email || '' });
      } catch (error) {
        console.error('Failed to load contact sender details:', error);
      }
    };

    loadSender();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = sender.email.trim();
    const name = sender.name.trim() || email.split('@')[0];
    if (!email) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
      return;
    }

    setStatus('loading');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message: formData.message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setStatus('success');
      setFormData({ message: '' });
      
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <>
      <Head>
        <title>{`${t.nav.contact || 'Contact Us'} - Cheng-BOOM`}</title>
      </Head>
      <MobilePageTopBar title={t.nav.contact || 'Contact Us'} locale={locale} />

      <div
        className="with-mobile-page-topbar bg-white min-h-screen pb-[calc(122px+env(safe-area-inset-bottom))] md:!pt-0 md:pb-0"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' }}
      >
        <AddToHomeScreenGuide className="mx-auto max-w-7xl" />
        <section
          className="relative hidden md:flex min-h-[252px] flex-col items-center justify-center border-b border-zinc-100 bg-gradient-to-br from-[#e23a2b] via-[#d52b20] to-[#b51f26] bg-cover bg-top bg-no-repeat pt-12 pb-8"
        >
          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-md">
              {locale === 'zh' ? '与我们取得联系' : locale === 'ms' ? 'Berhubung dengan kami' : 'Get in touch with us'}
            </h1>
            <p className="text-white/90 text-xl max-w-2xl mx-auto font-medium drop-shadow-sm">
              {locale === 'zh' ? '请填写下表或在您方便时联系我们。' : locale === 'ms' ? 'Isi borang di bawah atau hubungi kami pada bila-bila masa.' : 'Fill out the form below or reach us at your convenience.'}
            </p>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 pt-6 pb-0 md:py-24">

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-1 lg:gap-12">
            
            {/* Left Column: Form */}
            <div className="order-2 lg:order-2">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    {locale === 'zh' ? '留言' : locale === 'ms' ? 'Mesej' : 'Message'}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ message: e.target.value })}
                    placeholder={locale === 'zh' ? '输入您的留言' : locale === 'ms' ? 'Masukkan Mesej Anda' : 'Enter Your Message'}
                    required
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-4 mt-2 text-white font-bold rounded-full shadow-[0_6px_18px_rgba(181,31,38,0.22)] transition-all hover:brightness-95 active:scale-[0.99] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)' }}
                >
                  {status === 'loading' 
                    ? (locale === 'zh' ? '发送中...' : locale === 'ms' ? 'Sedang Dihantar...' : 'Sending...') 
                    : (locale === 'zh' ? '发送请求' : locale === 'ms' ? 'Hantar Permintaan Anda' : 'Send Your Request')}
                </button>
                
                {status === 'success' && (
                  <p className="text-green-600 font-medium text-center mt-2">
                    {locale === 'zh' ? '您的留言已成功发送！' : locale === 'ms' ? 'Mesej anda telah berjaya dihantar!' : 'Your message has been sent successfully!'}
                  </p>
                )}
                {status === 'error' && (
                  <p className="text-red-500 font-medium text-center mt-2">
                    {!sender.email
                      ? (locale === 'zh' ? '无法读取您的账户电子邮件。请重新登录后再试。' : locale === 'ms' ? 'E-mel akaun anda tidak dapat dimuatkan. Sila log masuk semula dan cuba lagi.' : 'Your account email could not be loaded. Please sign in again and retry.')
                      : (locale === 'zh' ? '留言发送失败。请重试或通过 WhatsApp 联系我们。' : locale === 'ms' ? 'Gagal menghantar mesej. Sila cuba lagi atau hubungi kami melalui WhatsApp.' : 'Failed to send message. Please try again or contact us via WhatsApp.')}
                  </p>
                )}
              </form>

            </div>

            {/* Right Column: Services List */}
            <div className="flex flex-col order-1 lg:order-1">
              <h3 className="text-xl font-bold text-zinc-900 mb-8">
                {locale === 'zh' ? '通过我们，您可以：' : locale === 'ms' ? 'Dengan perkhidmatan kami, anda boleh:' : 'With our services you can:'}
              </h3>
              
              <ul className="flex flex-col gap-6">
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 font-medium leading-relaxed">
                    {locale === 'zh' ? '体验优质的高端烟花产品' : locale === 'ms' ? 'Alami produk bunga api premium' : 'Experience premium quality fireworks'}
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 font-medium leading-relaxed">
                    {locale === 'zh' ? '获得专业的安全燃放指导' : locale === 'ms' ? 'Dapatkan panduan keselamatan profesional' : 'Receive professional safety guidance'}
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 font-medium leading-relaxed">
                    {locale === 'zh' ? '为您的庆典增添难忘的回忆' : locale === 'ms' ? 'Tambah kenangan yang tidak dapat dilupakan untuk sambutan anda' : 'Add unforgettable memories to your celebrations'}
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 font-medium leading-relaxed">
                    {locale === 'zh' ? '享受快速可靠的同城配送服务' : locale === 'ms' ? 'Nikmati penghantaran tempatan yang cepat dan boleh dipercayai' : 'Enjoy fast and reliable local delivery'}
                  </span>
                </li>
              </ul>

              <div className="hidden md:block mt-8 border-t border-zinc-200 pt-6">
                <h4 className="mb-4 text-base font-bold text-zinc-900">
                  {locale === 'zh' ? '您也可以通过以下方式联系我们' : locale === 'ms' ? 'Anda juga boleh menghubungi kami melalui' : 'You can also Contact Us via'}
                </h4>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {settings?.email && (
                    <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 transition-colors hover:text-[#b51f26]">
                      <Mail size={17} className="text-[#d52b20]" />
                      {settings.email}
                    </a>
                  )}
                  {(settings?.phone || settings?.whatsapp) && (
                    <a href={`tel:${settings.phone || settings.whatsapp}`} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 transition-colors hover:text-[#b51f26]">
                      <Phone size={17} className="text-[#d52b20]" />
                      {settings.phone || settings.whatsapp}
                    </a>
                  )}
                </div>
              </div>
              
              {/* Mobile Divider */}
              <div className="w-full h-px bg-zinc-200 mt-10 lg:hidden" />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
