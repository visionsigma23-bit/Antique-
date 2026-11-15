import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Instagram, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { ANTIKER_MEDIA } from '../data/media';
import { SAMPLE_TESTIMONIALS } from '../data/defaults';
import { ProductCard } from '../components/ProductCard';
import { ResilientImage } from '../components/ResilientImage';
import { SeoHead } from '../components/SeoHead';
import { buildGeneralWhatsAppUrl } from '../utils/whatsapp';

const WHY_CHOOSE_ITEMS = [
  {
    index: '01',
    title: 'Curated Museum Poise',
    description:
      'Every wall planter, amphora vase, and sculptural figure is chosen for balanced silhouette and enduring character.',
  },
  {
    index: '02',
    title: 'Rich Tactile Finishes',
    description:
      'Aged bronze patinas, brushed antique brass, and carved stone tones crafted to anchor sophisticated interiors.',
  },
  {
    index: '03',
    title: 'Personal Concierge',
    description:
      'Direct WhatsApp consultation for dimensions, styling placement, and live showroom availability.',
  },
  {
    index: '04',
    title: 'Timeless Collectibility',
    description:
      'Distinctive accents selected for private residences, architectural studios, and boutique hospitality.',
  },
];

export function HomePage() {
  const { categories, products, siteSettings, loadingCatalog, submitContactInquiry } =
    useStore();

  const [showcaseTab, setShowcaseTab] = useState<'best-sellers' | 'new-arrivals'>(
    'best-sellers'
  );
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  const heroHeadline =
    siteSettings.heroHeadline === 'Timeless Beauty. Unique Stories.'
      ? 'ART THAT TELLS A STORY.'
      : siteSettings.heroHeadline;

  const heroSubtitle =
    siteSettings.heroSubtitle ===
    'Discover distinctive decorative pieces that bring character, elegance and timeless charm to your space.'
      ? 'Discover timeless decorative pieces that bring character and elegance to every space.'
      : siteSettings.heroSubtitle;

  const aboutTitle =
    siteSettings.aboutTitle === 'The Quiet Resonance of Timeless Form'
      ? 'A World of Timeless Elegance.'
      : siteSettings.aboutTitle;

  const featuredProducts = useMemo(() => {
    const picked = products.filter((p) => p.featured);
    return (picked.length > 0 ? picked : products).slice(0, 6);
  }, [products]);

  const bestSellers = useMemo(() => {
    const picked = products.filter((p) => p.bestSeller);
    return (picked.length > 0 ? picked : products).slice(0, 3);
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products].slice(-3).reverse();
  }, [products]);

  const tabProducts = showcaseTab === 'best-sellers' ? bestSellers : newArrivals;
  const whatsappUrl = buildGeneralWhatsAppUrl(siteSettings);

  const galleryFrames = [
    { src: ANTIKER_MEDIA.aboutDark, label: 'Gallery Vignette', slug: 'sculptures-statues' },
    { src: ANTIKER_MEDIA.wallPlanter, label: 'Wall Planters', slug: 'antique-wall-decor' },
    { src: ANTIKER_MEDIA.decorativeVase, label: 'Patinated Vases', slug: 'decorative-vases' },
    { src: ANTIKER_MEDIA.artisticShowpiece, label: 'Showpieces', slug: 'artistic-showpieces' },
    { src: ANTIKER_MEDIA.homeAccessories, label: 'Accessories', slug: 'home-accessories' },
    { src: ANTIKER_MEDIA.collectibleDecor, label: 'Collectibles', slug: 'collectible-decor' },
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError(null);
    const email = newsletterEmail.trim();
    if (!email || !email.includes('@')) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }

    setNewsletterBusy(true);
    try {
      await submitContactInquiry({
        name: 'Newsletter Subscriber',
        email,
        phone: '',
        subject: 'Newsletter Subscription',
        message: `Newsletter subscription request from ${email}.`,
      });
      setNewsletterDone(true);
      setNewsletterEmail('');
    } catch {
      setNewsletterError('Unable to subscribe right now. Please try again later.');
    } finally {
      setNewsletterBusy(false);
    }
  };

  return (
    <div className="bg-[#171715] text-[#F5F1E8]">
      <SeoHead
        title="ANTIKER – Dark Luxury Antique Boutique & Home Décor"
        description="Discover timeless decorative pieces, sculptural accents, and luxury home décor curated by ANTIKER."
      />

      {/* 1. Cinematic Full-Width Luxury Editorial Hero */}
      <section className="relative min-h-[580px] sm:min-h-[680px] lg:min-h-[85vh] flex flex-col justify-end lg:justify-between bg-[#171715] overflow-hidden border-b border-[#494335]">
        {/* Full-Width Cinematic Antique Interior Photograph */}
        <div className="absolute inset-0">
          <ResilientImage
            src={ANTIKER_MEDIA.hero}
            alt="ANTIKER dark luxury antique boutique interior"
            loading="eager"
            className="w-full h-full object-cover object-center"
          />
          {/* Soft dark gradient scrims preserving warm gallery illumination while guaranteeing text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#171715]/95 via-[#171715]/55 to-[#171715]/25 lg:bg-gradient-to-r lg:from-[#171715]/90 lg:via-[#171715]/50 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#171715]/40 via-transparent to-[#171715]/80" />
        </div>

        {/* Top Spacer for Vertical Balance on Desktop */}
        <div className="hidden lg:block h-16 relative z-10" aria-hidden="true" />

        {/* Editorial Hero Copy */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-32 pb-12 sm:py-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <span className="h-px w-8 bg-[#B9975B]" aria-hidden="true" />
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#B9975B]">
                ANTIKER · Curated Decorative House
              </p>
            </div>

            <h1 className="font-serif text-[clamp(2.5rem,5.4vw,4.85rem)] font-normal text-[#F5F1E8] leading-[1.03] tracking-[0.03em] text-balance">
              {heroHeadline}
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-[#F5F1E8]/85 leading-[1.7] max-w-xl font-normal">
              {heroSubtitle}
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#CCA86B] transition-colors duration-150 whitespace-nowrap"
              >
                <span>Explore Collection</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                />
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 border border-[#B9975B]/65 bg-[#171715]/55 backdrop-blur-sm text-[#F5F1E8] text-xs font-medium uppercase tracking-[0.2em] hover:border-[#B9975B] hover:bg-[#B9975B]/15 hover:text-[#B9975B] transition-colors duration-150 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 text-[#B9975B]" strokeWidth={1.75} />
                <span>Private Concierge</span>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Subtle Bottom Editorial Index Bar */}
        <div className="hidden md:block relative z-10 border-t border-[#F5F1E8]/10 bg-[#171715]/45 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6 text-[11px] uppercase tracking-[0.2em] text-[#B9B3A8]">
            <Link
              to="/shop?category=antique-wall-decor"
              className="hover:text-[#B9975B] transition-colors whitespace-nowrap"
            >
              01 · Antique Wall Décor
            </Link>
            <Link
              to="/shop?category=decorative-vases"
              className="hover:text-[#B9975B] transition-colors whitespace-nowrap"
            >
              02 · Decorative Vases
            </Link>
            <Link
              to="/shop?category=sculptures-statues"
              className="hover:text-[#B9975B] transition-colors whitespace-nowrap"
            >
              03 · Sculptures &amp; Statues
            </Link>
            <Link
              to="/shop?category=artistic-showpieces"
              className="hover:text-[#B9975B] transition-colors whitespace-nowrap"
            >
              04 · Artistic Showpieces
            </Link>
          </div>
        </div>
      </section>

      {/* Architectural Value Strip */}
      <section className="bg-[#22221F] border-b border-[#494335]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-7 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="sm:border-r sm:border-[#494335] sm:pr-6">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#B9975B]">
                Curated Forms
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#B9B3A8] leading-relaxed">
                Wall planters, patinated vessels &amp; sculptural showpieces
              </p>
            </div>
            <div className="sm:border-r sm:border-[#494335] sm:pr-6">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#B9975B]">
                PKR Pricing
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#B9B3A8] leading-relaxed">
                Transparent catalog pricing updated directly by our gallery
              </p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#B9975B]">
                Direct Concierge
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#B9B3A8] leading-relaxed">
                Instant WhatsApp styling &amp; availability support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Collections */}
      <section
        id="collections"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
              Curated Categories
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#F5F1E8] text-balance">
              Featured Collections
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#B9975B] hover:text-[#F5F1E8] transition-colors whitespace-nowrap"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/shop?category=${encodeURIComponent(cat.slug)}`}
              className="group block bg-[#292823] border border-[#494335] overflow-hidden transition-all duration-200 hover:border-[#B9975B] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#22221F] relative">
                <ResilientImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#171715]/60 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />
              </div>
              <div className="p-6">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#B9975B] tabular-nums">
                  Collection {String(idx + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-1.5 font-serif text-2xl font-medium text-[#F5F1E8] group-hover:text-[#B9975B] transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm text-[#B9B3A8] leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="bg-[#22221F] border-y border-[#494335]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
                Signature Objects
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#F5F1E8] text-balance">
                Featured Pieces
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#B9975B] hover:text-[#F5F1E8] transition-colors whitespace-nowrap"
            >
              <span>Explore Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingCatalog ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-[#292823] border border-[#494335] h-96 animate-pulse"
                />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-14 text-center border border-[#494335] bg-[#292823]">
              <p className="font-serif text-2xl text-[#F5F1E8]">
                Catalog pieces are being curated
              </p>
              <p className="mt-2 text-sm text-[#B9B3A8]">
                Message our concierge on WhatsApp for private showroom previews.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. About Section (Split Layout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-6">
            <div className="aspect-[4/3] lg:h-full w-full overflow-hidden border border-[#494335] bg-[#22221F]">
              <ResilientImage
                src={ANTIKER_MEDIA.aboutDark}
                alt="ANTIKER antique sculptures and brass vessels on dark stone pedestal"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#22221F] border border-[#494335] p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-3">
                The House of ANTIKER
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#F5F1E8] leading-tight text-balance">
                {aboutTitle}
              </h2>
              <p className="mt-6 text-base text-[#B9B3A8] leading-relaxed">
                {siteSettings.aboutBody}
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-[#494335] flex flex-wrap items-center gap-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#CCA86B] transition-colors"
              >
                <span>Our Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#494335] text-[#F5F1E8] text-xs font-medium uppercase tracking-[0.18em] hover:border-[#B9975B] hover:text-[#B9975B] transition-colors"
              >
                <span>View Collection</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Best Sellers & New Arrivals */}
      <section className="bg-[#22221F] border-y border-[#494335]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
                Collector Highlights
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#F5F1E8]">
                Best Sellers &amp; New Arrivals
              </h2>
            </div>

            <div
              className="inline-flex border border-[#494335] bg-[#171715] p-1 self-start md:self-auto"
              role="tablist"
              aria-label="Filter highlights"
            >
              <button
                type="button"
                role="tab"
                aria-selected={showcaseTab === 'best-sellers'}
                onClick={() => setShowcaseTab('best-sellers')}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors whitespace-nowrap ${
                  showcaseTab === 'best-sellers'
                    ? 'bg-[#B9975B] text-[#171715]'
                    : 'text-[#B9B3A8] hover:text-[#F5F1E8]'
                }`}
              >
                Best Sellers
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={showcaseTab === 'new-arrivals'}
                onClick={() => setShowcaseTab('new-arrivals')}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors whitespace-nowrap ${
                  showcaseTab === 'new-arrivals'
                    ? 'bg-[#B9975B] text-[#171715]'
                    : 'text-[#B9B3A8] hover:text-[#F5F1E8]'
                }`}
              >
                New Arrivals
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {tabProducts.map((product) => (
              <ProductCard key={`${showcaseTab}-${product.id}`} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Why Choose Antiker */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-10 sm:mb-12">
          <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
            The Boutique Standard
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#F5F1E8]">
            Why Choose ANTIKER
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_CHOOSE_ITEMS.map((item) => (
            <div
              key={item.index}
              className="bg-[#292823] border border-[#494335] p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-medium tracking-[0.22em] text-[#B9975B] tabular-nums">
                  {item.index}.
                </span>
                <h3 className="mt-3 font-serif text-2xl font-medium text-[#F5F1E8]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-[#B9B3A8] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Editorial Product Gallery */}
      <section className="bg-[#22221F] border-y border-[#494335]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
                Editorial Archive
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#F5F1E8]">
                Curated Visual Gallery
              </h2>
            </div>
            <a
              href={`https://instagram.com/${siteSettings.instagramHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#B9975B] hover:text-[#F5F1E8] transition-colors"
            >
              <Instagram className="w-4 h-4" strokeWidth={1.75} />
              <span>Follow {siteSettings.instagramHandle}</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {galleryFrames.map((frame) => (
              <Link
                key={frame.label}
                to={`/shop?category=${encodeURIComponent(frame.slug)}`}
                className="group relative aspect-square overflow-hidden bg-[#292823] border border-[#494335] hover:border-[#B9975B] transition-colors"
              >
                <ResilientImage
                  src={frame.src}
                  alt={`ANTIKER ${frame.label}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#171715]/0 group-hover:bg-[#171715]/60 transition-colors flex items-end p-3">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#F5F1E8] opacity-0 group-hover:opacity-100 transition-opacity">
                    {frame.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Customer Testimonials (Clearly Marked Sample Content) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
              Client Reflections
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#F5F1E8]">
              From Distinguished Interiors
            </h2>
          </div>
          <p className="text-xs text-[#B9B3A8]">
            Sample testimonials displayed as placeholders until verified reviews are added.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {SAMPLE_TESTIMONIALS.map((item) => (
            <blockquote
              key={item.id}
              className="bg-[#292823] border border-[#494335] p-7 flex flex-col justify-between"
            >
              <p className="font-serif text-lg sm:text-xl text-[#F5F1E8] leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-6 pt-4 border-t border-[#494335] text-xs">
                <div className="font-medium text-[#B9975B]">{item.author}</div>
                <div className="mt-0.5 text-[#B9B3A8]">{item.context}</div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* 9. Newsletter Subscription */}
      <section className="bg-[#22221F] border-t border-[#494335]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
            Private Dispatch
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#F5F1E8]">
            Receive New Arrivals &amp; Curated Editions
          </h2>
          <p className="mt-3 text-sm text-[#B9B3A8] max-w-lg mx-auto leading-relaxed">
            Be notified when rare decorative pieces, sculptural accents, and seasonal
            collections enter the ANTIKER gallery.
          </p>

          {newsletterDone ? (
            <div className="mt-8 inline-flex items-center gap-2.5 px-6 py-4 bg-[#292823] border border-[#B9975B] text-sm text-[#F5F1E8]">
              <CheckCircle2 className="w-4 h-4 text-[#B9975B]" />
              <span>Thank you. You are subscribed to the ANTIKER journal.</span>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-3"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 h-12 px-4 bg-[#171715] border border-[#494335] text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/60 focus:outline-none focus:border-[#B9975B]"
              />
              <button
                type="submit"
                disabled={newsletterBusy}
                className="h-12 px-7 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#CCA86B] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {newsletterBusy ? 'Joining...' : 'Subscribe'}
              </button>
            </form>
          )}

          {newsletterError && (
            <p className="mt-3 text-xs text-red-400">{newsletterError}</p>
          )}
        </div>
      </section>
    </div>
  );
}
