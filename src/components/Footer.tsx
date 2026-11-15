import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildGeneralWhatsAppUrl } from '../utils/whatsapp';

export function Footer() {
  const { siteSettings, categories } = useStore();
  const whatsappUrl = buildGeneralWhatsAppUrl(siteSettings);

  return (
    <footer className="bg-[#171715] text-[#F5F1E8] border-t border-[#494335]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-block font-serif text-2xl font-semibold tracking-[0.26em] text-[#F5F1E8]"
            >
              ANTIKER
            </Link>
            <p className="text-sm leading-relaxed text-[#B9B3A8] max-w-xs">
              Curated decorative objects, sculptural accents, and timeless home décor pieces
              selected for refined, enduring interiors.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#B9975B] hover:text-[#F5F1E8] transition-colors pt-1"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
              <span>WhatsApp Concierge</span>
            </a>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="font-serif text-lg text-[#F5F1E8] mb-4">Navigation</h3>
            <ul className="space-y-2.5 text-sm text-[#B9B3A8]">
              <li>
                <Link to="/" className="hover:text-[#B9975B] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#B9975B] transition-colors">
                  Shop Collection
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#B9975B] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#B9975B] transition-colors">
                  Contact &amp; Inquiries
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#B9975B] transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories Column */}
          <div>
            <h3 className="font-serif text-lg text-[#F5F1E8] mb-4">Collections</h3>
            <ul className="space-y-2.5 text-sm text-[#B9B3A8]">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                    className="hover:text-[#B9975B] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="font-serif text-lg text-[#F5F1E8] mb-4">Showroom &amp; Contact</h3>
            <ul className="space-y-3 text-sm text-[#B9B3A8]">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 mt-0.5 text-[#B9975B] shrink-0" strokeWidth={1.5} />
                <span>{siteSettings.phoneDisplay}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 mt-0.5 text-[#B9975B] shrink-0" strokeWidth={1.5} />
                <a
                  href={`mailto:${siteSettings.emailDisplay}`}
                  className="hover:text-[#F5F1E8] transition-colors break-all"
                >
                  {siteSettings.emailDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-[#B9975B] shrink-0" strokeWidth={1.5} />
                <span>{siteSettings.addressDisplay}</span>
              </li>
              <li className="flex items-center gap-4 pt-2">
                {siteSettings.instagramHandle && (
                  <a
                    href={`https://instagram.com/${siteSettings.instagramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs tracking-wide text-[#B9B3A8] hover:text-[#B9975B] transition-colors"
                  >
                    <Instagram className="w-4 h-4" strokeWidth={1.5} />
                    <span>{siteSettings.instagramHandle}</span>
                  </a>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#494335]/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B9B3A8]/80">
          <p>&copy; {new Date().getFullYear()} ANTIKER. All rights reserved.</p>
          <p>Antique Decorative Items, Home Décor &amp; Collectibles</p>
        </div>
      </div>
    </footer>
  );
}
