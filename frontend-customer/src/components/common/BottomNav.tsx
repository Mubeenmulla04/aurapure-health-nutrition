import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Search, Heart, User } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  onOpenSearch: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenSearch }) => {
  const location = useLocation();
  const { wishlistIds } = useWishlist();
  const { isAuthenticated } = useAuth();

  // Hide bottom navigation on PDP and Checkout for focused conversion and zero UI collisions
  if (location.pathname.startsWith('/products/') || location.pathname === '/checkout') {
    return null;
  }

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
      isActive: location.pathname === '/',
    },
    {
      label: 'Shop',
      icon: Grid,
      path: '/collections',
      isActive: location.pathname.startsWith('/collections'),
    },
    {
      label: 'Search',
      icon: Search,
      action: onOpenSearch,
      isActive: false,
    },
    {
      label: 'Wishlist',
      icon: Heart,
      path: '/account/wishlist',
      isActive: location.pathname === '/account/wishlist',
      badge: wishlistIds.length > 0 ? wishlistIds.length : undefined,
    },
    {
      label: 'Account',
      icon: User,
      path: isAuthenticated ? '/account' : '/account/login',
      isActive: location.pathname.startsWith('/account') && location.pathname !== '/account/wishlist',
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-lg border-t border-brand-muted/70 shadow-floating pb-safe"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const content = (
            <div className="flex flex-col items-center justify-center w-full h-full relative py-1">
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    item.isActive
                      ? 'text-brand-primary scale-110 stroke-[2.4]'
                      : 'text-brand-subtext stroke-[1.8] hover:text-brand-dark'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-brand-primary text-white text-[9px] font-extrabold flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                  item.isActive ? 'text-brand-primary font-bold' : 'text-brand-subtext'
                }`}
              >
                {item.label}
              </span>
              {item.isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-brand-primary rounded-full" />
              )}
            </div>
          );

          if (item.action) {
            return (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="w-full h-full flex items-center justify-center focus:outline-none"
                aria-label={item.label}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={idx}
              to={item.path!}
              className="w-full h-full flex items-center justify-center focus:outline-none"
              aria-label={item.label}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
