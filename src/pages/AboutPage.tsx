import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ANTIKER_MEDIA } from '../data/media';
import { ResilientImage } from '../components/ResilientImage';
import { SeoHead } from '../components/SeoHead';
import { buildGeneralWhatsAppUrl } from '../utils/whatsapp';

export function AboutPage() {
  const { siteSettings } = useStore();
  const whatsappUrl = buildGeneralWhatsAppUrl(siteSettings);

  const aboutTitle =
    siteSettings.aboutTitle === 'The Quiet Resonance of Timeless Form'
      ? 'A World of Timeless Elegance.'
      : siteSettings.aboutTitle;

  return (
    <div className="bg-[#171715] text-[#F5F1E8]">
      <SeoHead
        title="About Us | ANTIKER – Dark Luxury Antique Boutique"
        description="Learn about ANTIKER's curatorial perspective on timeless decorative items, sculptural accents, and luxury home décor."
      />

      <section className="bg-[#22221F] border-b border-[#494335]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-3">
            Our Philosophy
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#F5F1E8] max-w-3xl text-balance leading-tight">
            {aboutTitle}
          </h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-6">
            <div className="aspect-[4/3] lg:h-full w-full overflow-hidden border border-[#494335] bg-[#22221F]">
              <ResilientImage
                src={ANTIKER_MEDIA.aboutDark}
                alt="ANTIKER curated decorative sculptures and vessels"
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between bg-[#22221F] border border-[#494335] p-8 sm:p-10">
            <div className="space-y-5">
              <h2 className="font-serif text-3xl text-[#F5F1E8]">
                Curating Character for Living Spaces
              </h2>
              <p className="text-base text-[#B9B3A8] leading-relaxed">
                {siteSettings.aboutBody}
              </p>
              <p className="text-base text-[#B9B3A8] leading-relaxed">
                Rather than chasing fleeting seasonal trends, ANTIKER focuses on quiet
                silhouettes—aged bronze wall planters, patinated amphoras, sculptural figures,
                and tactile table accessories—that harmonize effortlessly with dark timber,
                natural stone, and warm architectural lighting.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#494335] flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#CCA86B] transition-colors"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#494335] text-[#F5F1E8] text-xs font-medium uppercase tracking-[0.16em] hover:border-[#B9975B] hover:text-[#B9975B] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#B9975B]" />
                <span>Speak with Concierge</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
