import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User as UserIcon, Menu, X, ChevronDown, Sparkles, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistIds } = useWishlist();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-muted/70 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 text-brand-dark hover:text-brand-primary active:scale-95 transition-transform"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6 stroke-[2]" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-glow flex items-center justify-center transition-transform group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary fill-current"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-brand-dark group-hover:text-brand-primary transition-colors">
                  AuraPure
                </span>
                <span className="hidden sm:block text-[9px] uppercase tracking-widest text-brand-subtext font-semibold -mt-1">
                  Clean Plant Nutrition
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links & Mega Menu */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              to="/"
              className="text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors"
            >
              Home
            </Link>

            <div
              className="relative py-4"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <Link
                to="/collections"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors"
              >
                <span>Collections</span>
                <ChevronDown className="w-4 h-4 text-brand-subtext" />
              </Link>

              {/* Mega Menu Dropdown */}
              {isMegaMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[720px] bg-white rounded-2xl shadow-floating border border-brand-muted p-6 grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    to="/collections/plant-protein-powder"
                    onClick={() => setIsMegaMenuOpen(false)}
                    className="group p-3 rounded-xl hover:bg-brand-bg transition-colors"
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-brand-secondary mb-3">
                      <img
                        src="https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80"
                        alt="Plant Protein"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-sm font-semibold text-brand-dark group-hover:text-brand-primary">
                      Plant Protein Powder
                    </h4>
                    <p className="text-xs text-brand-subtext mt-1">25g Protein, Ashwagandha & Digestive Enzymes</p>
                  </Link>

                  <Link
                    to="/collections/daily-wellness"
                    onClick={() => setIsMegaMenuOpen(false)}
                    className="group p-3 rounded-xl hover:bg-brand-bg transition-colors"
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-brand-secondary mb-3">
                      <img
                        src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80"
                        alt="Daily Wellness"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-sm font-semibold text-brand-dark group-hover:text-brand-primary">
                      Daily Wellness & Turmeric
                    </h4>
                    <p className="text-xs text-brand-subtext mt-1">Lakadong Turmeric, Piperine & Restorative Herbs</p>
                  </Link>

                  <Link
                    to="/collections/superfoods-greens"
                    onClick={() => setIsMegaMenuOpen(false)}
                    className="group p-3 rounded-xl hover:bg-brand-bg transition-colors"
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-brand-secondary mb-3">
                      <img
                        src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80"
                        alt="Superfoods & Greens"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-sm font-semibold text-brand-dark group-hover:text-brand-primary">
                      Daily Greens & Superfoods
                    </h4>
                    <p className="text-xs text-brand-subtext mt-1">Moringa, Spirulina, Wheatgrass & Probiotics</p>
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/collections/plant-protein-powder"
              className="text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors"
            >
              Plant Protein
            </Link>

            <Link
              to="/pages/about"
              className="text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors"
            >
              Our Philosophy
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-2 text-brand-dark hover:text-brand-primary hover:bg-brand-bg rounded-full transition-colors active:scale-95"
              aria-label="Search products"
            >
              <Search className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Wishlist Icon (Desktop only, mobile has it in BottomNav) */}
            <Link
              to="/account/wishlist"
              className="hidden lg:flex p-2 text-brand-dark hover:text-brand-primary hover:bg-brand-bg rounded-full transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            {/* Account / User Profile (Desktop only, mobile has it in BottomNav) */}
            <div className="relative hidden lg:block">
              {isAuthenticated ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-brand-bg text-brand-dark transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-glow text-brand-primary font-bold text-xs flex items-center justify-center">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-floating border border-brand-muted py-2 z-50 animate-in fade-in duration-150">
                      <div className="px-4 py-2 border-b border-brand-muted/70">
                        <p className="text-xs text-brand-subtext">Signed in as</p>
                        <p className="text-sm font-semibold truncate text-brand-dark">{user?.name}</p>
                      </div>
                      <Link
                        to="/account/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-brand-dark hover:bg-brand-bg transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/account/addresses"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-brand-dark hover:bg-brand-bg transition-colors"
                      >
                        My Addresses
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-brand-dark hover:bg-brand-bg transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/account/wishlist"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-brand-dark hover:bg-brand-bg transition-colors"
                      >
                        Wishlist ({wishlistIds.length})
                      </Link>
                      {user?.role === 'admin' && (
                        <a
                          href="http://localhost:3001"
                          target="_blank"
                          rel="noreferrer"
                          className="block px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-glow/40"
                        >
                          Admin Portal ↗
                        </a>
                      )}
                      <div className="border-t border-brand-muted/70 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-brand-error hover:bg-red-50"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/account/login"
                  className="p-2 text-brand-dark hover:text-brand-primary hover:bg-brand-bg rounded-full transition-colors"
                  aria-label="Account login"
                >
                  <UserIcon className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Shopping Cart Bag (Navigates to /cart directly) */}
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover transition-all active:scale-95 shadow-subtle"
              aria-label="Shopping Cart Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{cart.totalItemsCount}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Native-feel Mobile Drawer Menu Modal (Portaled directly to document.body) */}
      {isMobileMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Full-Height Drawer content */}
            <div className="fixed inset-y-0 left-0 w-[82vw] max-w-xs h-[100dvh] bg-white shadow-2xl p-5 sm:p-6 flex flex-col justify-between z-10 overflow-y-auto pb-safe">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-brand-muted/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-glow flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-brand-primary fill-current">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-serif text-lg font-bold text-brand-dark block">AuraPure</span>
                      <span className="text-[9px] uppercase tracking-wider text-brand-subtext font-semibold -mt-1 block">
                        Clean Nutrition
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-full hover:bg-brand-bg flex items-center justify-center text-brand-subtext hover:text-brand-dark transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Status Bar inside Mobile Sidebar */}
                <div className="p-3 rounded-2xl bg-brand-secondary/60 border border-brand-muted/60">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-xs font-bold text-brand-dark block truncate">Hi, {user?.name}</span>
                        <Link
                          to="/account"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-[11px] text-brand-primary font-semibold hover:underline"
                        >
                          View Account & Orders →
                        </Link>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                          navigate('/');
                        }}
                        className="p-1.5 text-brand-subtext hover:text-brand-error"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-brand-dark block">Welcome to AuraPure</span>
                        <span className="text-[11px] text-brand-subtext">Access orders & wellness perks</span>
                      </div>
                      <Link
                        to="/account/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="btn-primary !py-1.5 !px-3 !text-[11px]"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-subtext px-2">
                    Explore Collections
                  </span>
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-dark hover:bg-brand-bg transition-colors"
                  >
                    <span>Home</span>
                  </Link>
                  <Link
                    to="/collections"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-dark hover:bg-brand-bg transition-colors"
                  >
                    <span>All Formulations</span>
                    <span className="text-[11px] text-brand-primary font-bold">Browse →</span>
                  </Link>
                  <Link
                    to="/collections/plant-protein-powder"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-dark hover:bg-brand-bg transition-colors"
                  >
                    <span>🌿 Plant Protein Powders</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      Best Seller
                    </span>
                  </Link>
                  <Link
                    to="/collections/daily-wellness"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-dark hover:bg-brand-bg transition-colors"
                  >
                    <span>☀️ Daily Wellness & Turmeric</span>
                  </Link>
                  <Link
                    to="/collections/superfoods-greens"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-dark hover:bg-brand-bg transition-colors"
                  >
                    <span>🥗 Greens & Superfoods</span>
                  </Link>
                  <Link
                    to="/collections/gut-health"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-dark hover:bg-brand-bg transition-colors"
                  >
                    <span>✨ Gut Health & Digestion</span>
                  </Link>
                </div>

                {/* Company & Support */}
                <div className="space-y-1 pt-3 border-t border-brand-muted/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-subtext px-2">
                    About & Support
                  </span>
                  <Link
                    to="/pages/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-medium text-brand-dark hover:bg-brand-bg"
                  >
                    Our Clean Philosophy
                  </Link>
                  <Link
                    to="/account/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-medium text-brand-dark hover:bg-brand-bg"
                  >
                    My Wishlist ({wishlistIds.length})
                  </Link>
                  <Link
                    to="/pages/faqs"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-medium text-brand-dark hover:bg-brand-bg"
                  >
                    Help Center & FAQs
                  </Link>
                  <Link
                    to="/pages/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-medium text-brand-dark hover:bg-brand-bg"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>

              {/* Footer WhatsApp pill inside drawer */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 mt-4">
                <p className="font-semibold text-emerald-950 text-xs">Customer Support Concierge</p>
                <p className="text-emerald-800 text-[11px]">Instant answers via official WhatsApp</p>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block font-bold text-emerald-700 mt-1 text-xs hover:underline"
                >
                  Chat with an Expert ↗
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
