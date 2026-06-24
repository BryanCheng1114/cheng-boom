import React, { useState } from 'react';
import Head from 'next/head';
import { Mail, Phone, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';

export default function Contact() {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus('loading');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <>
      <Head>
        <title>{`${t.nav.contact || 'Contact Us'} - Cheng-BOOM`}</title>
      </Head>

      <div className="bg-white min-h-screen">

        {/* ── HERO BANNER ─────────────────────────────────────────── */}
        <section
          className="relative flex flex-col items-center justify-center pt-24 pb-12 md:pt-32 md:pb-16 bg-cover sm:bg-[length:100%_auto] bg-top bg-no-repeat border-b border-zinc-100 bg-[#8b1517]"
          style={{ backgroundImage: 'url(/shop2.png)' }}
        >
          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/80 mb-6 drop-shadow-sm">
              {locale === 'zh' ? '联系我们' : locale === 'ms' ? 'HUBUNGI KAMI' : 'CONTACT US'}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-md">
              {locale === 'zh' ? '与我们取得联系' : locale === 'ms' ? 'Berhubung dengan kami' : 'Get in touch with us'}
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto font-medium drop-shadow-sm">
              {locale === 'zh' ? '请填写下表或在您方便时联系我们。' : locale === 'ms' ? 'Isi borang di bawah atau hubungi kami pada bila-bila masa.' : 'Fill out the form below or reach us at your convenience.'}
            </p>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 py-16 md:py-24">
          <div className="mb-16"></div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Left Column: Form */}
            <div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    {locale === 'zh' ? '姓名' : locale === 'ms' ? 'Nama' : 'Name'}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={locale === 'zh' ? '您的姓名' : locale === 'ms' ? 'Nama anda' : 'Your name'}
                    required
                    className="w-full px-4 py-3.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    {locale === 'zh' ? '电子邮件' : locale === 'ms' ? 'E-mel' : 'Email'}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={locale === 'zh' ? '输入您的电子邮件' : locale === 'ms' ? 'Masukkan E-mel Anda' : 'Enter Your Email'}
                    required
                    className="w-full px-4 py-3.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    {locale === 'zh' ? '留言' : locale === 'ms' ? 'Mesej' : 'Message'}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
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
                  className="w-full py-4 mt-2 bg-[#1A1F24] hover:bg-black text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
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
                    {locale === 'zh' ? '留言发送失败。请重试或通过 WhatsApp 联系我们。' : locale === 'ms' ? 'Gagal menghantar mesej. Sila cuba lagi atau hubungi kami melalui WhatsApp.' : 'Failed to send message. Please try again or contact us via WhatsApp.'}
                  </p>
                )}
              </form>

              {/* Alternative Contact Methods */}
              <div className="mt-16 pt-8 border-t border-zinc-100">
                <p className="font-bold text-zinc-900 mb-6">{locale === 'zh' ? '您也可以通过以下方式联系我们' : locale === 'ms' ? 'Anda juga boleh Hubungi Kami melalui' : 'You can also Contact Us via'}</p>
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                  
                  <a href={`mailto:${settings?.email || 'contact@cheng-boom.com'}`} className="flex items-center gap-4 group cursor-pointer transition-transform hover:-translate-y-0.5">
                    <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center bg-white shadow-sm group-hover:border-zinc-900 transition-colors">
                      <Mail className="w-4 h-4 text-zinc-700 group-hover:text-zinc-900 transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
                      {settings?.email || 'contact@cheng-boom.com'}
                    </span>
                  </a>

                  <a href={`tel:${(settings?.phone || '+60 111-226-9835').replace(/[^0-9+]/g, '')}`} className="flex items-center gap-4 group cursor-pointer transition-transform hover:-translate-y-0.5">
                    <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center bg-white shadow-sm group-hover:border-zinc-900 transition-colors">
                      <Phone className="w-4 h-4 text-zinc-700 group-hover:text-zinc-900 transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
                      {settings?.phone || '+60 111-226-9835'}
                    </span>
                  </a>

                </div>
              </div>
            </div>

            {/* Right Column: Services List */}
            <div className="flex flex-col">
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
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
