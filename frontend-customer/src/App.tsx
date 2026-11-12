import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { AnnouncementBar } from './components/common/AnnouncementBar';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { CartDrawer } from './components/common/CartDrawer';
import { SearchModal } from './components/common/SearchModal';

import { HomePage } from './pages/HomePage';
import { CollectionsPage } from './pages/CollectionsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountPage } from './pages/AccountPage';
import { ScrollToTop } from './components/common/ScrollToTop';
import {
  AboutPage,
  ContactPage,
  ShippingPolicyPage,
  RefundPolicyPage,
  PrivacyPolicyPage,
  TermsPage,
  FaqsPage,
  NotFoundPage,
} from './pages/StaticPages';

export const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="min-h-screen flex flex-col bg-brand-bg text-brand-dark">
              <AnnouncementBar />
              <Navbar onOpenSearch={() => setIsSearchOpen(true)} />
              
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/collections" element={<CollectionsPage />} />
                  <Route path="/collections/:slug" element={<CollectionsPage />} />
                  <Route path="/products/:slug" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                  <Route path="/track-order" element={<TrackOrderPage />} />

                  {/* Authentication & Customer Account Portal */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/account/login" element={<LoginPage />} />
                  <Route path="/account/register" element={<RegisterPage />} />
                  <Route path="/account" element={<AccountPage defaultTab="profile" />} />
                  <Route path="/account/profile" element={<AccountPage defaultTab="profile" />} />
                  <Route path="/account/orders" element={<AccountPage defaultTab="orders" />} />
                  <Route path="/account/addresses" element={<AccountPage defaultTab="addresses" />} />
                  <Route path="/account/wishlist" element={<AccountPage defaultTab="wishlist" />} />

                  {/* Company & Support Policy Pages */}
                  <Route path="/pages/about" element={<AboutPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/pages/contact" element={<ContactPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/pages/shipping-policy" element={<ShippingPolicyPage />} />
                  <Route path="/pages/refund-policy" element={<RefundPolicyPage />} />
                  <Route path="/pages/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/pages/terms" element={<TermsPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/pages/faqs" element={<FaqsPage />} />
                  <Route path="/faqs" element={<FaqsPage />} />

                  {/* Catch-all 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              <Footer />
              <CartDrawer />
              <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            </div>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
