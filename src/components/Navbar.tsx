import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { NotificationBellPanel } from './NotificationBellPanel';

const NAV_ITEMS = [
  { label: 'Shop', to: '/shop' },
  { label: 'Collections', to: '/#collections' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Admin', to: '/admin' },
];

export function Navbar() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleNavClick = (to: string) => {
    setMobileOpen(false);
    if (to === '/#collections') {
      if (pathname === '/') {
        const el = document.getElementById('collections');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      navigate('/#collections');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#171715]/95 backdrop-blur-md border-b border-[#494335]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="font-serif text-2xl sm:text-[1.75rem] font-semibold tracking-[0.28em] text-[#F5F1E8] hover:text-[#B9975B] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B9975B]"
        >
          ANTIKER
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isCollections = item.to === '/#collections';
            const active = isCollections
              ? pathname === '/' && hash === '#collections'
              : pathname.startsWith(item.to);

            if (isCollections) {
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => handleNavClick(item.to)}
                  className={`text-xs uppercase tracking-[0.18em] transition-colors duration-150 whitespace-nowrap shrink-0 pb-1 border-b ${
                    active
                      ? 'text-[#B9975B] border-[#B9975B]'
                      : 'text-[#B9B3A8] border-transparent hover:text-[#F5F1E8] hover:border-[#494335]'
                  }`}
                >
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`text-xs uppercase tracking-[0.18em] transition-colors duration-150 whitespace-nowrap shrink-0 pb-1 border-b ${
                  active
                    ? 'text-[#B9975B] border-[#B9975B]'
                    : 'text-[#B9B3A8] border-transparent hover:text-[#F5F1E8] hover:border-[#494335]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Search & Collection Icons + Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Search collection"
            aria-expanded={searchOpen}
            className="inline-flex items-center justify-center w-10 h-10 text-[#B9B3A8] hover:text-[#B9975B] transition-colors"
          >
            {searchOpen ? (
              <X className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Search className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>

          <NotificationBellPanel />

          <Link
            to="/shop"
            aria-label="Browse shop collection"
            className="inline-flex items-center justify-center w-10 h-10 text-[#B9B3A8] hover:text-[#B9975B] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-[#F5F1E8] hover:text-[#B9975B] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Inline Search Bar */}
      {searchOpen && (
        <div className="border-t border-[#494335] bg-[#22221F] px-4 sm:px-6 lg:px-8 py-3">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex items-center gap-3"
          >
            <Search className="w-4 h-4 text-[#B9975B] shrink-0" />
            <input
              type="search"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vases, bronze sculptures, wall planters..."
              className="flex-1 h-10 bg-transparent text-sm text-[#F5F1E8] placeholder:text-[#B9B3A8]/60 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#B9975B] text-[#171715] text-xs font-semibold uppercase tracking-wider hover:bg-[#CCA86B] transition-colors whitespace-nowrap shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#22221F] border-t border-[#494335] px-4 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            if (item.to === '/#collections') {
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => handleNavClick(item.to)}
                  className="block w-full text-left py-3 px-3 text-sm uppercase tracking-[0.16em] text-[#B9B3A8] hover:text-[#F5F1E8] hover:bg-[#292823] transition-colors"
                >
                  {item.label}
                </button>
              );
            }
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block py-3 px-3 text-sm uppercase tracking-[0.16em] transition-colors ${
                  active
                    ? 'text-[#B9975B] bg-[#292823] font-medium'
                    : 'text-[#B9B3A8] hover:text-[#F5F1E8] hover:bg-[#292823]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
