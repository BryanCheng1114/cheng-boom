import Head from 'next/head';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ShieldCheck, Users, X, Eye } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '../hooks/useTranslation';

const getSafetyBlocks = (locale: string) => [
  {
    number: '01',
    tag: locale === 'zh' ? '产品知识' : locale === 'ms' ? 'PENGETAHUAN PRODUK' : 'PRODUCT KNOWLEDGE',
    icon: ShieldCheck,
    image: '/safe1.png',
    alt: locale === 'zh' ? '产品展示和安全指南' : locale === 'ms' ? 'Paparan produk dan panduan keselamatan' : 'Product display and safety guide',
    title: locale === 'zh' ? '产品展示和安全指南' : locale === 'ms' ? 'Paparan produk & panduan keselamatan' : 'Product display & safety guide',
    body: locale === 'zh' ? '了解您的烟花是安全庆祝的第一步。我们为目录中的每件产品提供全面的处理说明。在点燃前，请务必仔细阅读安全标签和展示指南——永远不要自以为了解。' : locale === 'ms' ? 'Memahami bunga api anda adalah langkah pertama ke arah sambutan yang selamat. Kami menyediakan arahan pengendalian komprehensif untuk setiap produk dalam katalog kami. Sentiasa baca label keselamatan dan panduan paparan dengan teliti sebelum pencucuhan — jangan pernah menganggap anda sudah biasa.' : 'Understanding your fireworks is the first step to a safe celebration. We provide comprehensive handling instructions for every product in our catalogue. Always read the safety label and display guide thoroughly before ignition — never assume familiarity.',
    bullets: [
      locale === 'zh' ? '使用前阅读所有产品标签' : locale === 'ms' ? 'Baca semua label produk sebelum digunakan' : 'Read all product labels before use',
      locale === 'zh' ? '遵循点火距离指南' : locale === 'ms' ? 'Patuhi garis panduan jarak pencucuhan' : 'Follow ignition distance guidelines',
      locale === 'zh' ? '切勿改装或拆卸烟花' : locale === 'ms' ? 'Jangan ubah suai atau buka bunga api' : 'Never modify or disassemble fireworks',
    ],
    accent: '#f59e0b',
    imageRight: false,
  },
  {
    number: '02',
    tag: locale === 'zh' ? '责任通知' : locale === 'ms' ? 'NOTIS LIABILITI' : 'LIABILITY NOTICE',
    icon: AlertTriangle,
    image: '/safe2.png',
    alt: locale === 'zh' ? '责任警告' : locale === 'ms' ? 'Amaran Liabiliti' : 'Liability Warning',
    title: locale === 'zh' ? '我们不对不当使用承担任何责任。' : locale === 'ms' ? 'Kami tidak bertanggungjawab atas penyalahgunaan.' : 'We do not accept responsibility for misuse.',
    body: locale === 'zh' ? '处理不当时，烟花本质上具有危险性。购买 Cheng-BOOM 产品即表示您自愿承担所有相关风险。确保安全的环境、保持适当的距离以及遵守所有当地法律法规是您唯一的责任。' : locale === 'ms' ? 'Bunga api pada dasarnya berbahaya jika disalahgunakan. Dengan membeli daripada Cheng-BOOM, anda secara sukarela menanggung semua risiko yang berkaitan. Ia adalah tanggungjawab anda sepenuhnya untuk memastikan persekitaran yang selamat, mengekalkan jarak yang betul, dan mematuhi semua undang-undang dan peraturan tempatan.' : 'Fireworks are inherently hazardous when mishandled. By purchasing from Cheng-BOOM, you voluntarily assume all associated risks. It is your sole responsibility to ensure a safe environment, maintain proper distances, and comply with all local laws and regulations.',
    bullets: [
      locale === 'zh' ? '始终在开阔的户外空间操作' : locale === 'ms' ? 'Sentiasa beroperasi di ruang terbuka dan luar' : 'Always operate in open, outdoor spaces',
      locale === 'zh' ? '让观众保持安全距离' : locale === 'ms' ? 'Pastikan penonton berada pada jarak yang selamat' : 'Keep spectators at a safe distance',
      locale === 'zh' ? '遵守当地的噪音和安全法律' : locale === 'ms' ? 'Patuhi undang-undang bunyi dan keselamatan tempatan' : 'Comply with local noise and safety laws',
    ],
    accent: '#ef4444',
    imageRight: true,
  },
  {
    number: '03',
    tag: locale === 'zh' ? '年龄限制' : locale === 'ms' ? 'SEKATAN UMUR' : 'AGE RESTRICTION',
    icon: Users,
    image: '/safe3.png',
    alt: locale === 'zh' ? '年龄限制' : locale === 'ms' ? 'Sekatan Umur' : 'Age Restriction',
    title: locale === 'zh' ? '12 岁以下儿童需在成人陪同下使用。' : locale === 'ms' ? 'Pengawasan orang dewasa diperlukan untuk kanak-kanak di bawah umur 12 tahun.' : 'Adult supervision required for children under 12.',
    body: locale === 'zh' ? '烟花不是儿童玩具。必须始终有成人陪同。将所有烟火设备放在幼儿完全接触不到的地方，以防止严重烧伤和伤害。安全是每个家庭的共同责任。' : locale === 'ms' ? 'Bunga api bukan mainan kanak-kanak. Pengawasan orang dewasa sangat diwajibkan pada setiap masa. Jauhkan semua peranti piroteknik dari jangkauan kanak-kanak kecil untuk mengelakkan luka bakar dan kecederaan teruk. Keselamatan adalah tanggungjawab keluarga bersama.' : 'Fireworks are not children\'s toys. Adult supervision is strictly mandatory at all times. Keep all pyrotechnic devices entirely out of reach of young children to prevent severe burns and injuries. Safety is a shared family responsibility.',
    bullets: [
      locale === 'zh' ? '成人必须全程监督' : locale === 'ms' ? 'Orang dewasa mesti mengawasi setiap masa' : 'Adults must supervise at all times',
      locale === 'zh' ? '切勿将烟花交给儿童' : locale === 'ms' ? 'Jangan sekali-kali memberikan bunga api kepada kanak-kanak' : 'Never hand fireworks to children',
      locale === 'zh' ? '不使用时，请将所有设备锁好' : locale === 'ms' ? 'Simpan semua peranti di tempat yang berkunci apabila tidak digunakan' : 'Keep all devices locked away when not in use',
    ],
    accent: '#8b5cf6',
    imageRight: false,
  },
];

export default function Safety() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { t, locale } = useTranslation();
  const safetyBlocks = getSafetyBlocks(locale);

  return (
    <>
      <Head>
        <title>{`${t.nav.safety || 'Safety Guide'} - Cheng-BOOM`}</title>
        <meta name="description" content="Essential fireworks safety rules and guidelines from Cheng-BOOM Malaysia." />
      </Head>

      <div className="bg-white min-h-screen">

        {/* ── HERO BANNER ─────────────────────────────────────────── */}
        <section
          className="relative flex flex-col items-center justify-center pt-24 pb-12 md:pt-32 md:pb-16 bg-cover sm:bg-[length:100%_auto] bg-top bg-no-repeat border-b border-zinc-100 bg-[#8b1517]"
          style={{ backgroundImage: 'url(/shop2.png)' }}
        >
          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/80 mb-6 drop-shadow-sm">
              {locale === 'zh' ? '安全指南' : locale === 'ms' ? 'PANDUAN KESELAMATAN' : 'SAFETY GUIDE'}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-md">
              {locale === 'zh' ? '安全准则' : locale === 'ms' ? 'Garis panduan keselamatan' : 'Safety guidelines'}
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto font-medium drop-shadow-sm">
              {locale === 'zh' ? '确保庆祝活动安全且精彩的基本规则和警告。' : locale === 'ms' ? 'Aturan dan amaran penting untuk sambutan yang selamat dan menakjubkan.' : 'Essential rules and warnings for a secure and spectacular celebration.'}
            </p>
          </div>
        </section>



        {/* ── SAFETY BLOCKS ──────────────────────────────────────── */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col gap-16 md:gap-24">

            {safetyBlocks.map((block, i) => {
              const Icon = block.icon;
              const isRight = block.imageRight;
              return (
                <motion.div
                  key={block.number}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                  className={`flex flex-col ${isRight ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-12 items-center`}
                >
                  {/* Image */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => setSelectedImage(block.image)}
                    className="w-full md:w-1/2 relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 shadow-md cursor-zoom-in group"
                  >
                    <Image
                      src={block.image}
                      alt={block.alt}
                      fill
                      className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Zoom hint */}
                    <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Eye size={10} /> {locale === 'zh' ? '放大' : locale === 'ms' ? 'Besarkan' : 'Enlarge'}
                    </div>
                  </motion.div>

                  {/* Text */}
                  <div className="w-full md:w-1/2 flex flex-col gap-5">
                    {/* Number + Tag */}
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black tracking-[0.18em] text-zinc-400 uppercase">{block.number}</span>
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-[10px] font-black tracking-[0.16em] uppercase text-zinc-400">
                        {block.tag}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl md:text-2xl font-bold text-zinc-900 leading-snug tracking-tight">
                      {block.title}
                    </h2>

                    {/* Body text */}
                    <p className="text-sm md:text-[15px] text-zinc-500 leading-relaxed">
                      {block.body}
                    </p>

                    {/* Bullet list */}
                    <ul className="flex flex-col gap-2 mt-1 list-disc list-inside">
                      {block.bullets.map((bullet, bi) => (
                        <motion.li
                          key={bi}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: 0.2 + bi * 0.08 }}
                          className="text-sm text-zinc-600 font-medium"
                        >
                          {bullet}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}

          </div>
        </section>

        {/* ── DISCLAIMER FOOTER STRIP ────────────────────────────── */}
        <section className="bg-primary py-10">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <div className="flex gap-5 items-start">
              {/* Dark left accent bar */}
              <div className="w-1 self-stretch bg-black/30 rounded-full shrink-0" />
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-black/60">{locale === 'zh' ? '法律免责声明' : locale === 'ms' ? 'Penafian Undang-undang' : 'Legal Disclaimer'}</span>
                <p className="text-sm font-medium text-black/90 leading-relaxed max-w-3xl">
                  {locale === 'zh' ? 'Cheng-BOOM 仅向成年人销售烟花，供其在合法和负责任的情况下使用。我们对因使用不当造成的伤害、财产损失或违法行为不承担任何责任。' : locale === 'ms' ? 'Cheng-BOOM menjual bunga api secara ketat untuk penggunaan yang sah dan bertanggungjawab oleh orang dewasa. Kami tidak menerima liabiliti untuk kecederaan, kerosakan harta benda, atau pelanggaran undang-undang yang timbul daripada penggunaan yang tidak wajar.' : 'Cheng-BOOM sells fireworks strictly for lawful, responsible use by adults. We accept no liability for injury, property damage, or legal violations arising from improper use.'}{' '}
                  <strong className="text-black font-bold">{locale === 'zh' ? '请始终遵守您当地的法律法规。' : locale === 'ms' ? 'Sentiasa patuhi undang-undang dan peraturan tempatan anda.' : 'Always follow your local laws and regulations.'}</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── LIGHTBOX ──────────────────────────────────────────── */}
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
                className="relative w-full max-w-4xl aspect-[4/3] cursor-default"
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
