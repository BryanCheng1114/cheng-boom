import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const { locale } = useTranslation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (router.isReady && !token) {
      setError(locale === 'zh' ? '无效的重置链接。' : locale === 'ms' ? 'Pautan tetapan semula tidak sah.' : 'Invalid reset link.');
    }
  }, [router.isReady, token, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!token) {
      setError(locale === 'zh' ? '缺少重置令牌。' : locale === 'ms' ? 'Token tetapan semula tiada.' : 'Missing reset token.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(locale === 'zh' ? '密码不匹配。' : locale === 'ms' ? 'Kata laluan tidak sepadan.' : 'Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(locale === 'zh' ? '密码必须至少包含 8 个字符，并包含至少一个数字和一个特殊字符。' : locale === 'ms' ? 'Kata laluan mestilah sekurang-kurangnya 8 aksara panjang dan mengandungi sekurang-kurangnya satu nombor dan satu aksara khas.' : 'Password must be at least 8 characters long and contain at least one number and one special character.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to reset password.');
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
        <title>{locale === 'zh' ? '重置密码 - Cheng-BOOM' : locale === 'ms' ? 'Tetapkan Semula Kata Laluan - Cheng-BOOM' : 'Reset Password - Cheng-BOOM'}</title>
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
          <div className="w-full md:w-[35%] flex flex-col justify-center relative bg-white order-2 min-h-screen overflow-y-auto pt-16 pb-12 md:py-0">
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
                      {locale === 'zh' ? '密码已重置！' : locale === 'ms' ? 'Kata Laluan Ditetapkan Semula!' : 'Password Reset!'}
                    </h1>
                    <p className="text-zinc-500 text-sm whitespace-pre-line mb-8">
                      {locale === 'zh' 
                        ? '您的密码已成功重置。您现在可以使用新密码登录。' 
                        : locale === 'ms' 
                          ? 'Kata laluan anda telah berjaya ditetapkan semula. Anda kini boleh log masuk menggunakan kata laluan baru.' 
                          : 'Your password has been successfully reset. You can now log in with your new password.'}
                    </p>
                    <Link href="/login" className="w-full py-3.5 flex items-center justify-center bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors">
                      {locale === 'zh' ? '前往登录' : locale === 'ms' ? 'Pergi ke Log Masuk' : 'Proceed to Sign In'}
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mb-10">
                      <h1 className="text-4xl md:text-5xl font-light text-zinc-900 mb-3">
                        {locale === 'zh' ? '设置新密码' : locale === 'ms' ? 'Kata Laluan Baru' : 'New Password'}
                      </h1>
                      <p className="text-zinc-500 text-sm whitespace-pre-line">
                        {locale === 'zh' 
                          ? '请在下方输入您的新密码以恢复账户访问权限。' 
                          : locale === 'ms' 
                            ? 'Masukkan kata laluan baru anda di bawah untuk memulihkan akses akaun.' 
                            : 'Enter your new password below to regain access to your account.'}
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
                          {locale === 'zh' ? '新密码' : locale === 'ms' ? 'Kata Laluan Baru' : 'New Password'}
                        </label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full px-5 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900 tracking-wider"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-600 mb-2">
                          {locale === 'zh' ? '确认新密码' : locale === 'ms' ? 'Sahkan Kata Laluan Baru' : 'Confirm New Password'}
                        </label>
                        <div className="relative">
                          <input 
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            className="w-full px-5 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900 tracking-wider"
                            placeholder="••••••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isLoading || !token}
                        className="w-full py-3.5 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
                      >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'zh' ? '重置密码' : locale === 'ms' ? 'Tetapkan Semula' : 'Reset Password')}
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
