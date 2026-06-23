import Head from 'next/head';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ShieldCheck, Users, X } from 'lucide-react';
import { useState } from 'react';

export default function Safety() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <Head>
        <title>Safety Guide - Cheng-BOOM</title>
      </Head>
      
      <div className="bg-white min-h-screen">
        
        {/* ── SAFETY HERO SECTION ───────────────────────────────────── */}
        <div className="pt-24 md:pt-32 px-6 sm:px-12">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16 md:mb-20">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-800 mb-6">
                SAFETY GUIDE
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 mb-6 tracking-tight">
                Safety guidelines
              </h1>
              <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                Essential rules and strict warnings for a secure and spectacular celebration.
              </p>
            </div>
          </div>
        </div>

        {/* ── SAFETY CONTENT SECTION ─────────────────────────── */}
        <section className="pb-20 md:pb-32 overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex flex-col gap-32 md:gap-40">
            
            {/* Block 1: Product Display & Safety Guide */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col md:flex-row rounded-none overflow-hidden shadow-2xl border border-zinc-100 bg-[#FAF9F6] min-h-[500px] lg:min-h-[650px]"
            >
              <div 
                onClick={() => setSelectedImage('/safe1.png')}
                className="w-full md:w-1/2 relative aspect-square md:aspect-auto bg-white flex items-center justify-center p-8 group cursor-pointer"
              >
                <div className="relative w-full h-[400px] md:h-full">
                  <Image src="/safe1.png" alt="Product display and safety guide" fill className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center gap-8 p-10 md:p-16 lg:p-24 xl:p-32">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.15]">
                  Product display and safety guide
                </h2>
                <p className="text-xl text-zinc-600 leading-relaxed font-medium">
                  Understanding your fireworks is the first step to a safe celebration. We provide comprehensive safety guidelines and proper handling instructions for every product in our catalog. Always read the display instructions thoroughly before ignition.
                </p>
              </div>
            </motion.div>

            {/* Block 2: Liability */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col md:flex-row rounded-none overflow-hidden shadow-2xl border border-zinc-100 bg-[#FAF9F6] min-h-[500px] lg:min-h-[650px]"
            >
              <div className="w-full md:w-1/2 flex flex-col justify-center gap-8 p-10 md:p-16 lg:p-24 xl:p-32 order-2 md:order-1">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.15]">
                  We do not take responsibility for accidents or injuries.
                </h2>
                <p className="text-xl text-zinc-600 leading-relaxed font-medium">
                  Fireworks are inherently dangerous if misused. By purchasing and using our pyrotechnics, you agree to assume all risks and liabilities. It is your strict responsibility to ensure a safe environment, maintain safe distances, and follow all local laws and safety protocols.
                </p>
              </div>
              <div 
                onClick={() => setSelectedImage('/safe2.png')}
                className="w-full md:w-1/2 relative aspect-square md:aspect-auto bg-white flex items-center justify-center p-8 group cursor-pointer order-1 md:order-2"
              >
                <div className="relative w-full h-[400px] md:h-full">
                  <Image src="/safe2.png" alt="Liability Warning" fill className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
              </div>
            </motion.div>

            {/* Block 3: Age Restriction */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col md:flex-row rounded-none overflow-hidden shadow-2xl border border-zinc-100 bg-[#FAF9F6] min-h-[500px] lg:min-h-[650px]"
            >
              <div 
                onClick={() => setSelectedImage('/safe3.png')}
                className="w-full md:w-1/2 relative aspect-square md:aspect-auto bg-white flex items-center justify-center p-8 group cursor-pointer"
              >
                <div className="relative w-full h-[400px] md:h-full">
                  <Image src="/safe3.png" alt="Age Restriction" fill className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center gap-8 p-10 md:p-16 lg:p-24 xl:p-32">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.15]">
                  Parent or guardian companion required for children below the age of 12.
                </h2>
                <p className="text-xl text-zinc-600 leading-relaxed font-medium">
                  Fireworks are not toys. Adult supervision is strictly mandatory at all times. Keep sparklers and all pyrotechnic devices entirely out of the reach of young children to prevent severe burns and injuries. Safety is a shared family responsibility.
                </p>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out backdrop-blur-sm"
            >
              <button 
                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              >
                <X size={24} />
              </button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-5xl aspect-[3/4] md:aspect-video cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <Image src={selectedImage} alt="Enlarged safety guide" fill className="object-contain" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
