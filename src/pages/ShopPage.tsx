import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SeoHead } from '../components/SeoHead';

type SortOption = 'featured' | 'name-asc' | 'price-asc' | 'price-desc';

export function ShopPage() {
  const { categories, products, loadingCatalog } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const activeCategorySlug = initialCategory;

  const setCategoryFilter = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug === 'all') {
      next.delete('category');
    } else {
      next.set('category', slug);
    }
    setSearchParams(next);
  };

  const activeCategoryObj = useMemo(() => {
    if (activeCategorySlug === 'all') return null;
    return categories.find(
      (c) => c.slug === activeCategorySlug || c.id === activeCategorySlug
    );
  }, [categories, activeCategorySlug]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = products.filter((prod) => {
      if (activeCategorySlug !== 'all') {
        const matchesCat =
          prod.categoryId === activeCategorySlug ||
          (activeCategoryObj && prod.categoryId === activeCategoryObj.id);
        if (!matchesCat) return false;
      }

      if (q) {
        const haystack = [
          prod.name,
          prod.categoryName,
          prod.description,
          ...prod.details,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'price-asc': {
          const pa = a.price > 0 ? a.price : Number.MAX_SAFE_INTEGER;
          const pb = b.price > 0 ? b.price : Number.MAX_SAFE_INTEGER;
          return pa - pb;
        }
        case 'price-desc':
          return b.price - a.price;
        case 'featured':
        default: {
          const scoreA = (a.featured ? 2 : 0) + (a.bestSeller ? 1 : 0);
          const scoreB = (b.featured ? 2 : 0) + (b.bestSeller ? 1 : 0);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return a.sortOrder - b.sortOrder;
        }
      }
    });
  }, [products, activeCategorySlug, activeCategoryObj, searchQuery, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div className="min-h-[80vh] bg-[#171715] text-[#F5F1E8]">
      <SeoHead
        title="Shop Collection | ANTIKER – Dark Luxury Antique Boutique"
        description="Explore ANTIKER's curated catalog of antique wall décor, decorative vases, artistic showpieces, sculptures, home accessories, and collectible décor."
      />

      {/* Editorial Header */}
      <section className="border-b border-[#494335] bg-[#22221F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs uppercase tracking-[0.24em] text-[#B9975B] mb-2">
            ANTIKER Catalog
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#F5F1E8]">
            {activeCategoryObj ? activeCategoryObj.name : 'The Decorative Collection'}
          </h1>
          <p className="mt-3 text-base text-[#B9B3A8] max-w-2xl">
            {activeCategoryObj
              ? activeCategoryObj.description
              : 'Browse distinctive decorative pieces and architectural accents curated to bring timeless character to your interior.'}
          </p>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#494335]">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="w-4 h-4 text-[#B9975B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vases, planters, sculptures..."
              aria-label="Search collection"
              className="w-full h-11 pl-10 pr-9 bg-[#22221F] border border-[#494335] text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/60 focus:outline-none focus:border-[#B9975B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#B9B3A8] hover:text-[#F5F1E8]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-xs text-[#B9B3A8] tabular-nums whitespace-nowrap">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'piece' : 'pieces'}
            </span>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B9975B]" />
              <label htmlFor="sort-select" className="sr-only">
                Sort products
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-11 px-3 bg-[#22221F] border border-[#494335] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#B9975B]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="name-asc">Sort: Name (A–Z)</option>
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          className="flex items-center gap-2 overflow-x-auto py-4"
          role="tablist"
          aria-label="Filter by category"
        >
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 border ${
              activeCategorySlug === 'all'
                ? 'bg-[#B9975B] text-[#171715] border-[#B9975B] font-semibold'
                : 'bg-[#22221F] text-[#B9B3A8] border-[#494335] hover:border-[#B9975B] hover:text-[#F5F1E8]'
            }`}
          >
            All Pieces
          </button>

          {categories.map((cat) => {
            const isSelected =
              activeCategorySlug === cat.slug || activeCategorySlug === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.slug)}
                className={`px-4 py-2 text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-[#B9975B] text-[#171715] border-[#B9975B] font-semibold'
                    : 'bg-[#22221F] text-[#B9B3A8] border-[#494335] hover:border-[#B9975B] hover:text-[#F5F1E8]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loadingCatalog ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-[#292823] border border-[#494335] h-96 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-[#292823] border border-[#494335] py-16 px-6 text-center">
            <h2 className="font-serif text-2xl text-[#F5F1E8]">
              No matching pieces found
            </h2>
            <p className="mt-2 text-sm text-[#B9B3A8]">
              Try adjusting your search keywords or selecting another category.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 px-6 py-2.5 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider hover:bg-[#CCA86B] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
