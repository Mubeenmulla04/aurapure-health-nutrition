import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User as UserIcon, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const { cart, openCartDrawer } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistIds } = useWishlist();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-muted/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 text-brand-dark hover:text-brand-primary"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full bg-brand-glow flex items-center justify-center transition-transform group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-brand-primary fill-current"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-brand-dark group-hover:text-brand-primary transition-colors">
                  AuraPure
                </span>
                <span className="text-[10px] uppercase tracking-widest text-brand-subtext font-semibold -mt-1">
                  Clean Plant Nutrition
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links & Mega Menu */}
          <nav className="hidden lg:flex items-center space-x-8">
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

            <Link
              to="/track-order"
              className="text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors"
            >
              Track Order
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-4 sm:space-x-5">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-brand-dark hover:text-brand-primary hover:bg-brand-bg rounded-full transition-colors"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Icon */}
            <Link
              to="/account/wishlist"
              className="p-2 text-brand-dark hover:text-brand-primary hover:bg-brand-bg rounded-full transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            {/* Account / User Profile */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
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
                        className="block px-4 py-2 text-sm text-brand-dark hover:bg-brand-bg"
                      >
                        Profile & Addresses
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-brand-dark hover:bg-brand-bg"
                      >
                        Order History
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

            {/* Shopping Cart Bag */}
            <button
              onClick={openCartDrawer}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover transition-all active:scale-95 shadow-subtle"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{cart.totalItemsCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-brand-muted/80 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/collections"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-base font-medium text-brand-dark py-2"
          >
            All Collections
          </Link>
          <Link
            to="/collections/plant-protein-powder"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-base font-medium text-brand-dark py-2"
          >
            Plant Protein Powders
          </Link>
          <Link
            to="/collections/daily-wellness"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-base font-medium text-brand-dark py-2"
          >
            Daily Wellness & Turmeric
          </Link>
          <Link
            to="/pages/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-base font-medium text-brand-dark py-2"
          >
            Our Philosophy
          </Link>
          <Link
            to="/track-order"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-base font-medium text-brand-dark py-2"
          >
            Track Order
          </Link>
        </div>
      )}
    </header>
  );
};
