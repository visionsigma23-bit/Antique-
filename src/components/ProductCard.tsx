import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { buildProductWhatsAppUrl, formatProductPrice } from '../utils/whatsapp';
import { ResilientImage } from './ResilientImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { siteSettings } = useStore();
  const primaryImage = product.images[0] || '';
  const priceLabel = formatProductPrice(product.price, siteSettings.currencySymbol);
  const whatsappUrl = buildProductWhatsAppUrl(product, siteSettings, 1);

  return (
    <article className="group flex flex-col bg-[#292823] border border-[#494335] transition-all duration-200 hover:border-[#B9975B] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-[4/3] w-full overflow-hidden bg-[#22221F]"
      >
        <ResilientImage
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </Link>

      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#B9975B]">
          <span className="truncate">{product.categoryName}</span>
          <span aria-hidden="true" className="text-[#494335]">
            ·
          </span>
          <span className="text-[#B9B3A8] whitespace-nowrap shrink-0">
            {product.availability}
          </span>
        </div>

        <Link to={`/product/${product.id}`} className="mt-2.5 block">
          <h3 className="font-serif text-xl sm:text-[1.35rem] font-medium text-[#F5F1E8] leading-snug group-hover:text-[#B9975B] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 text-base font-medium text-[#B9975B] tabular-nums">
          {priceLabel}
        </div>

        <div className="mt-auto pt-5 mt-5 border-t border-[#494335]/80 flex items-center justify-between gap-3">
          <Link
            to={`/product/${product.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[#F5F1E8] hover:text-[#B9975B] transition-colors whitespace-nowrap"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#B9975B]" strokeWidth={1.75} />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Inquire about ${product.name} via WhatsApp`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#494335] text-[11px] font-medium uppercase tracking-[0.14em] text-[#F5F1E8] hover:border-[#B9975B] hover:text-[#B9975B] transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#B9975B]" strokeWidth={1.75} />
            <span>Inquire</span>
          </a>
        </div>
      </div>
    </article>
  );
}
