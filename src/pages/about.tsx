import Head from 'next/head';
import Image from 'next/image';
import { useTranslation } from '../hooks/useTranslation';

export default function About() {
  const { t } = useTranslation();

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
                Our mission is to provide the most spectacular and reliable fireworks to make every celebration truly unforgettable.
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
                Our Story
              </h2>
            </div>

            {/* Three Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0">
              
              {/* Column 1 */}
              <div className="flex flex-col md:pr-12 lg:pr-16 md:border-r border-zinc-200">
                <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 mb-4">
                  History Of The Company
                </h3>
                <p className="text-zinc-500 leading-relaxed text-[15px] md:text-base">
                  Founded with a passion for celebration, Cheng-BOOM started as a small, dedicated team. Through a relentless commitment to quality and safety, we have grown into the region's most trusted name in premium pyrotechnics, making every major festival and personal milestone truly unforgettable.
                </p>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col md:px-12 lg:px-16 md:border-r border-zinc-200">
                <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 mb-4">
                  Mission
                </h3>
                <p className="text-zinc-500 leading-relaxed text-[15px] md:text-base">
                  Our mission is to bring joy and wonder to every occasion. We strive to provide our customers with safe, reliable, and awe-inspiring fireworks, ensuring that every celebration—big or small—is celebrated with the perfect boom.
                </p>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col md:pl-12 lg:pl-16">
                <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 mb-4">
                  Company Values
                </h3>
                <p className="text-zinc-500 leading-relaxed text-[15px] md:text-base">
                  We believe that safety and spectacle must always go hand-in-hand. Our core values are rooted in strict quality control, continuous innovation, and a steadfast commitment to customer satisfaction, guaranteeing a flawless experience.
                </p>
              </div>

            </div>
          </div>
        </section>

      </div>
    </>
  );
}
