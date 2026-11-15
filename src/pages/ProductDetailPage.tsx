import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, MessageCircle, Minus, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ResilientImage } from '../components/ResilientImage';
import { ProductCard } from '../components/ProductCard';
import { SeoHead } from '../components/SeoHead';
import {
  buildProductWhatsAppUrl,
  formatProductPrice,
  getProductCanonicalUrl,
} from '../utils/whatsapp';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { products, siteSettings, loadingCatalog } = useStore();

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.categoryId === product.categoryId
    );
    const others = products.filter(
      (p) => p.id !== product.id && p.categoryId !== product.categoryId
    );
    return [...sameCategory, ...others].slice(0, 3);
  }, [products, product]);

  if (loadingCatalog && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-[520px] bg-[#292823] border border-[#494335] animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <SeoHead
          title="Piece Not Found | ANTIKER"
          description="The requested ANTIKER decorative piece could not be found."
        />
        <h1 className="font-serif text-4xl text-[#F5F1E8]">Piece Not Found</h1>
        <p className="mt-3 text-sm text-[#B9B3A8]">
          This item may have been removed or moved within our catalog.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Collection</span>
        </Link>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [''];
  const activeImage = images[selectedImageIdx] || images[0];
  const priceLabel = formatProductPrice(product.price, siteSettings.currencySymbol);
  const whatsappUrl = buildProductWhatsAppUrl(product, siteSettings, quantity);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getProductCanonicalUrl(product.id));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="pb-20 bg-[#171715] text-[#F5F1E8]">
      <SeoHead
        title={`${product.name} | ANTIKER`}
        description={product.description.slice(0, 155)}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#B9B3A8]">
          <Link to="/" className="hover:text-[#B9975B] transition-colors">
            Home
          </Link>
          <span aria-hidden="true" className="text-[#494335]">/</span>
          <Link to="/shop" className="hover:text-[#B9975B] transition-colors">
            Collection
          </Link>
          <span aria-hidden="true" className="text-[#494335]">/</span>
          <Link
            to={`/shop?category=${encodeURIComponent(product.categoryId)}`}
            className="hover:text-[#B9975B] transition-colors"
          >
            {product.categoryName}
          </Link>
          <span aria-hidden="true" className="text-[#494335]">/</span>
          <span className="text-[#F5F1E8] truncate max-w-[240px]">{product.name}</span>
        </nav>
      </div>

      {/* Main Contiguous PDP Module */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Gallery Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/3] w-full bg-[#22221F] border border-[#494335] overflow-hidden">
              <ResilientImage
                src={activeImage}
                alt={product.name}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={`${product.id}-thumb-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`View image ${idx + 1} of ${product.name}`}
                    className={`aspect-[4/3] overflow-hidden border transition-all ${
                      idx === selectedImageIdx
                        ? 'border-[#B9975B] ring-1 ring-[#B9975B]'
                        : 'border-[#494335] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <ResilientImage
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase / Inquiry Module */}
          <div className="lg:col-span-5 bg-[#292823] border border-[#494335] p-6 sm:p-8 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#B9975B]">
              <span>{product.categoryName}</span>
              <span aria-hidden="true" className="text-[#494335]">·</span>
              <span className="text-[#B9B3A8]">{product.availability}</span>
            </div>

            <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-[#F5F1E8] leading-tight text-balance">
              {product.name}
            </h1>

            <div className="mt-4 pb-5 border-b border-[#494335] flex items-baseline justify-between gap-4">
              <span className="text-2xl font-medium text-[#B9975B] tabular-nums">
                {priceLabel}
              </span>
              {product.price === 0 && (
                <span className="text-xs text-[#B9B3A8]">
                  Confirmed via concierge inquiry
                </span>
              )}
            </div>

            <p className="mt-5 text-sm sm:text-base text-[#B9B3A8] leading-relaxed">
              {product.description}
            </p>

            {product.details.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#494335]/70">
                <h2 className="text-xs uppercase tracking-[0.18em] text-[#B9975B] font-semibold mb-3">
                  Piece Details
                </h2>
                <ul className="space-y-2 text-sm text-[#B9B3A8]">
                  {product.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <span className="text-[#B9975B] mt-0.5 text-xs" aria-hidden="true">
                        —
                      </span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity & WhatsApp Inquiry Action */}
            <div className="mt-8 pt-6 border-t border-[#494335] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.16em] text-[#B9B3A8]">
                  Quantity
                </span>
                <div className="inline-flex items-center border border-[#494335] bg-[#171715]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 flex items-center justify-center text-[#F5F1E8] hover:text-[#B9975B] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium tabular-nums text-[#F5F1E8]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-10 flex items-center justify-center text-[#F5F1E8] hover:text-[#B9975B] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 px-6 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#CCA86B] transition-colors"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                <span>Inquire via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-[#494335] text-xs font-medium uppercase tracking-[0.16em] text-[#B9B3A8] hover:border-[#B9975B] hover:text-[#F5F1E8] transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#B9975B]" />
                    <span>Product Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Piece Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-14 border-t border-[#494335]">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#B9975B] mb-1">
                Continue Exploring
              </p>
              <h2 className="font-serif text-3xl font-normal text-[#F5F1E8]">
                Complementary Pieces
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-medium uppercase tracking-[0.16em] text-[#B9975B] hover:text-[#F5F1E8] transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
