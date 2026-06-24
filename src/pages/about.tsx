import Head from 'next/head';
import Image from 'next/image';
import { useTranslation } from '../hooks/useTranslation';

export default function About() {
  const { t, locale } = useTranslation();

  return (
    <>
      <Head>
        <title>{`${t.nav.aboutUs} - Cheng-BOOM`}</title>
      </Head>
      
      <div className="bg-white min-h-screen">
        
        {/* ── HERO SECTION ───────────────────────────────────── */}
        <section className="relative w-full h-[50vh] md:h-[65vh] flex items-center bg-[#F8F9FA] overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
             <Image
               src="/aboutus.png"
               alt="About Us Background"
               fill
               className="object-cover object-right md:object-center"
               priority
             />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32">
            <div className="max-w-[500px]">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
                {t.nav.aboutUs || 'About Us'}
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium">
                {locale === 'zh' ? '我们的使命是提供最壮观、最可靠的烟花，让每一次庆祝活动都令人难以忘怀。' : locale === 'ms' ? 'Misi kami adalah untuk menyediakan bunga api yang paling menakjubkan dan boleh dipercayai untuk menjadikan setiap sambutan benar-benar tidak dapat dilupakan.' : 'Our mission is to provide the most spectacular and reliable fireworks to make every celebration truly unforgettable.'}
              </p>
            </div>
          </div>
        </section>

        {/* ── OUR STORY SECTION ─────────────────────────── */}
        <section className="py-20 md:py-32">
          <div className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24">
            
            {/* Section Title */}
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight">
                {locale === 'zh' ? '我们的故事' : locale === 'ms' ? 'Kisah Kami' : 'Our Story'}
              </h2>
            </div>

            {/* Three Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0">
              
              {/* Column 1 */}
              <div className="flex flex-col md:pr-12 lg:pr-16 md:border-r border-zinc-200">
                <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 mb-4">
                  {locale === 'zh' ? '公司历史' : locale === 'ms' ? 'Sejarah Syarikat' : 'History Of The Company'}
                </h3>
                <p className="text-zinc-500 leading-relaxed text-[15px] md:text-base">
                  {locale === 'zh' ? 'Cheng-BOOM 源于对庆祝活动的热爱，最初只是一个专注的小团队。通过对质量和安全的不懈承诺，我们已发展成为该地区最值得信赖的高级烟花品牌，让每一个重大节日和个人里程碑都令人难以忘怀。' : locale === 'ms' ? 'Ditubuhkan dengan semangat untuk meraikan, Cheng-BOOM bermula sebagai sebuah pasukan kecil yang berdedikasi. Melalui komitmen yang tidak berbelah bahagi terhadap kualiti dan keselamatan, kami telah berkembang menjadi nama yang paling dipercayai di rantau ini dalam piroteknik premium, menjadikan setiap perayaan utama dan peristiwa penting peribadi benar-benar tidak dapat dilupakan.' : 'Founded with a passion for celebration, Cheng-BOOM started as a small, dedicated team. Through a relentless commitment to quality and safety, we have grown into the region\'s most trusted name in premium pyrotechnics, making every major festival and personal milestone truly unforgettable.'}
                </p>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col md:px-12 lg:px-16 md:border-r border-zinc-200">
                <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 mb-4">
                  {locale === 'zh' ? '我们的使命' : locale === 'ms' ? 'Misi Kami' : 'Mission'}
                </h3>
                <p className="text-zinc-500 leading-relaxed text-[15px] md:text-base">
                  {locale === 'zh' ? '我们的使命是为每一个场合带来欢乐和奇迹。我们努力为客户提供安全、可靠、令人惊叹的烟花，确保每一次庆祝活动——无论大小——都能以完美的绽放来庆祝。' : locale === 'ms' ? 'Misi kami adalah untuk membawa kegembiraan dan keajaiban pada setiap majlis. Kami berusaha untuk menyediakan pelanggan kami dengan bunga api yang selamat, boleh dipercayai dan menakjubkan, memastikan setiap sambutan—besar atau kecil—dirayakan dengan letupan yang sempurna.' : 'Our mission is to bring joy and wonder to every occasion. We strive to provide our customers with safe, reliable, and awe-inspiring fireworks, ensuring that every celebration—big or small—is celebrated with the perfect boom.'}
                </p>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col md:pl-12 lg:pl-16">
                <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 mb-4">
                  {locale === 'zh' ? '公司价值观' : locale === 'ms' ? 'Nilai Syarikat' : 'Company Values'}
                </h3>
                <p className="text-zinc-500 leading-relaxed text-[15px] md:text-base">
                  {locale === 'zh' ? '我们坚信安全与壮观必须始终并存。我们的核心价值观植根于严格的质量控制、持续的创新以及对客户满意度的坚定承诺，保证提供完美无瑕的体验。' : locale === 'ms' ? 'Kami percaya bahawa keselamatan dan cermin mata mesti sentiasa seiring. Nilai teras kami berakar umbi dalam kawalan kualiti yang ketat, inovasi berterusan, dan komitmen yang teguh terhadap kepuasan pelanggan, menjamin pengalaman yang sempurna.' : 'We believe that safety and spectacle must always go hand-in-hand. Our core values are rooted in strict quality control, continuous innovation, and a steadfast commitment to customer satisfaction, guaranteeing a flawless experience.'}
                </p>
              </div>

            </div>
          </div>
        </section>

      </div>
    </>
  );
}
