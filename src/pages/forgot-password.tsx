import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const { locale } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(locale === 'zh' ? '请输入有效的电子邮件地址。' : locale === 'ms' ? 'Sila masukkan alamat e-mel yang sah.' : 'Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to send reset link.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{locale === 'zh' ? '忘记密码 - Cheng-BOOM' : locale === 'ms' ? 'Lupa Kata Laluan - Cheng-BOOM' : 'Forgot Password - Cheng-BOOM'}</title>
      </Head>

      <div className="min-h-screen bg-black w-full overflow-hidden relative font-sans">
        
        {/* Absolute Back to Sign In Button - Always Top Left */}
        <div className="absolute top-6 left-6 z-50">
          <Link 
            href="/login"
            className="flex items-center gap-2 text-sm font-semibold text-black hover:text-black md:text-white/80 md:hover:text-white transition-colors drop-shadow-md md:drop-shadow-none"
          >
            <ArrowLeft size={16} />
            {locale === 'zh' ? '返回登录' : locale === 'ms' ? 'Kembali ke Log Masuk' : 'Back to Sign In'}
          </Link>
        </div>

        {/* Mobile Background Image */}
        <div className="absolute inset-0 md:hidden z-0">
          <Image 
            src="/login_signin.jpg"
            alt="Background"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        </div>

        {/* --- SPLIT SCREEN LAYOUT --- */}
        <div className="w-full flex flex-col md:flex-row min-h-screen relative z-10">
          
          {/* Desktop Image Panel (65%) */}
          <div className="hidden md:block w-[65%] relative order-1">
            <Image 
              src="/login_signin.jpg"
              alt="Background"
              fill
              sizes="65vw"
              className="object-cover"
              priority
            />
            {/* Kept a very subtle gradient just for the Back button readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-50" />
          </div>

          {/* Form Panel (35%) */}
          <div className="w-full md:w-[35%] flex flex-col justify-center relative bg-white order-2 min-h-screen overflow-y-auto">
            <div className="w-full max-w-[440px] mx-auto px-6">
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {success ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-4xl font-light text-zinc-900 mb-3">
                      {locale === 'zh' ? '查看邮箱' : locale === 'ms' ? 'Periksa E-mel' : 'Check Email'}
                    </h1>
                    <p className="text-zinc-500 text-sm whitespace-pre-line mb-8">
                      {locale === 'zh' 
                        ? '我们已向您的邮箱发送了密码重置链接。请点击链接以设置新密码。' 
                        : locale === 'ms' 
                          ? 'Kami telah menghantar pautan tetapan semula kata laluan ke e-mel anda. Sila klik pautan tersebut untuk menetapkan kata laluan baru.' 
                          : 'We have sent a password reset link to your email. Please click the link to set a new password.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-10">
                      <h1 className="text-4xl md:text-5xl font-light text-zinc-900 mb-3">
                        {locale === 'zh' ? '忘记密码？' : locale === 'ms' ? 'Lupa Kata Laluan?' : 'Forgot Password?'}
                      </h1>
                      <p className="text-zinc-500 text-sm whitespace-pre-line">
                        {locale === 'zh' 
                          ? '请输入您注册时的电子邮件地址，我们将向您发送重置密码的链接。' 
                          : locale === 'ms' 
                            ? 'Masukkan e-mel pendaftaran anda dan kami akan hantarkan pautan untuk menetapkan semula kata laluan.' 
                            : 'Enter your registered email address and we will send you a link to reset your password.'}
                      </p>
                    </div>

                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-left">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-600 mb-2">
                          {locale === 'zh' ? '电子邮件' : locale === 'ms' ? 'Alamat E-mel' : 'Email Address'}
                        </label>
                        <input 
                          type="email"
                          required
                          className="w-full px-5 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900 placeholder:text-zinc-400"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
                      >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'zh' ? '发送重置链接' : locale === 'ms' ? 'Hantar Pautan' : 'Send Reset Link')}
                      </button>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
