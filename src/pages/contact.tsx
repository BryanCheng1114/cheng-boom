import React, { useState } from 'react';
import Head from 'next/head';
import { Mail, Phone, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';

export default function Contact() {
  const { t } = useTranslation();
  const { settings } = useBusiness();

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus('loading');
    
    // Simulate API call for sending email
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      
      // Reset status after a few seconds
      setTimeout(() => setStatus('idle'), 5000);
    }, 1500);
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

      <div className="bg-white min-h-screen py-24 md:py-32 px-6 sm:px-12">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-20">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-800 mb-6">
              CONTACT US
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 mb-6 tracking-tight">
              Get in touch with us
            </h1>
            <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              Fill out the form below or schedule a meeting with us at your convenience.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Left Column: Form */}
            <div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="w-full px-4 py-3.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter Your Email"
                    required
                    className="w-full px-4 py-3.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Enter Your Message"
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
                  {status === 'loading' ? 'Sending...' : 'Send Your Request'}
                </button>
                
                {status === 'success' && (
                  <p className="text-green-600 font-medium text-center mt-2">
                    Your message has been sent successfully!
                  </p>
                )}
              </form>

              {/* Alternative Contact Methods */}
              <div className="mt-16 pt-8 border-t border-zinc-100">
                <p className="font-bold text-zinc-900 mb-6">You can also Contact Us via</p>
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
                With our services you can
              </h3>
              
              <ul className="flex flex-col gap-6">
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 font-medium leading-relaxed">
                    Improve usability of your product
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 font-medium leading-relaxed">
                    Engage users at a higher level and outperform your competition
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 font-medium leading-relaxed">
                    Reduce the onboarding time and improve sales
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 font-medium leading-relaxed">
                    Balance user needs with your business goal
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
