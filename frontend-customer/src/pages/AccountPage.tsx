import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  MapPin,
  Heart,
  User as UserIcon,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Order, Address } from '../types';

export const AccountPage: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'profile' }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { addItem } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // New Address Form
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrFullName, setNewAddrFullName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrLine1, setNewAddrLine1] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('Karnataka');
  const [newAddrPincode, setNewAddrPincode] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/account/login');
      return;
    }

    if (activeTab === 'orders') {
      setIsOrdersLoading();
    } else if (activeTab === 'addresses') {
      setIsAddressesLoading();
    }
  }, [activeTab, isAuthenticated, navigate]);

  const setIsOrdersLoading = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await api.get('/orders/my-orders');
      if (res.data?.data?.orders) {
        setOrders(res.data.data.orders);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const setIsAddressesLoading = async () => {
    try {
      setIsLoadingAddresses(true);
      const res = await api.get('/addresses');
      if (res.data?.data?.addresses) {
        setAddresses(res.data.data.addresses);
      }
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/addresses', {
        fullName: newAddrFullName,
        phone: newAddrPhone,
        addressLine1: newAddrLine1,
        city: newAddrCity,
        state: newAddrState,
        pincode: newAddrPincode,
        isDefaultShipping: true,
      });
      setIsAddingAddress(false);
      setIsAddressesLoading();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not save address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`);
      setIsAddressesLoading();
    } catch {
      alert('Could not delete address.');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Account Overview Header */}
      <div className="bg-white rounded-3xl border border-brand-muted/80 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-glow text-brand-primary font-bold text-xl flex items-center justify-center">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-dark">{user?.name}</h1>
            <p className="text-xs text-brand-subtext">{user?.email} • {user?.phone || 'No phone added'}</p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="btn-outline !text-xs !py-2.5 self-start sm:self-auto"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs Navigation and Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Navigation Tabs (Horizontal swipeable on mobile, Vertical on Desktop) */}
        <aside className="lg:col-span-3 flex lg:flex-col overflow-x-auto no-scrollbar gap-2 p-1.5 sm:p-3 bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 shadow-subtle">
          {[
            { id: 'profile', label: 'My Profile', icon: UserIcon },
            { id: 'orders', label: 'Order History', icon: Package },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'wishlist', label: 'Saved Wishlist', icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-subtle'
                    : 'text-brand-dark hover:bg-brand-bg hover:text-brand-primary'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Body */}
        <div className="lg:col-span-9 bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 p-5 sm:p-8 shadow-subtle">
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-serif text-xl font-bold text-brand-dark">Account Details</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-brand-subtext block">Full Name:</span>
                  <span className="text-sm font-semibold text-brand-dark">{user?.name}</span>
                </div>
                <div>
                  <span className="text-brand-subtext block">Email Address:</span>
                  <span className="text-sm font-semibold text-brand-dark">{user?.email}</span>
                </div>
                <div>
                  <span className="text-brand-subtext block">Registered Mobile:</span>
                  <span className="text-sm font-semibold text-brand-dark">{user?.phone || 'Not added'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-dark">Order History</h2>

              {isLoadingOrders ? (
                <div className="py-12 text-center text-brand-subtext text-xs">Loading your orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Package className="w-10 h-10 text-brand-subtext mx-auto opacity-40" />
                  <p className="text-sm text-brand-subtext">You have not placed any orders yet.</p>
                  <Link to="/collections/plant-protein-powder" className="btn-primary !text-xs !py-2.5">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6 divide-y divide-brand-muted/60">
                  {orders.map((ord) => (
                    <div key={ord._id} className="pt-6 first:pt-0 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-bold text-brand-dark">{ord.orderNumber}</span>
                          <span className="text-xs text-brand-subtext block">
                            Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-glow text-brand-primary">
                            {ord.orderStatus}
                          </span>
                          <span className="text-sm font-bold text-brand-dark">₹{ord.pricing.finalTotal}</span>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="divide-y divide-brand-muted/40 bg-brand-bg/40 rounded-2xl p-4">
                        {ord.items.map((item) => (
                          <div key={item.variantId} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                            <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-brand-dark truncate">{item.title}</h4>
                              <p className="text-[11px] text-brand-subtext">
                                {item.flavor} • {item.packSize} • Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-brand-dark">₹{item.total}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions: Download Invoice & Track */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                        <a
                          href={`http://localhost:5000/api/v1/invoices/${ord._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-outline !text-xs !py-2.5 gap-1.5 justify-center flex-1 sm:flex-initial"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tax Invoice (PDF)</span>
                        </a>

                        <Link
                          to={`/track-order?orderNumber=${ord.orderNumber}`}
                          className="btn-secondary !text-xs !py-2.5 gap-1.5 justify-center flex-1 sm:flex-initial"
                        >
                          <span>Track Shipment</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-serif text-xl font-bold text-brand-dark">Saved Delivery Addresses</h2>
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="btn-primary !text-xs !py-2.5 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Add Address Form */}
              {isAddingAddress && (
                <form onSubmit={handleCreateAddress} className="p-5 rounded-2xl bg-brand-bg border border-brand-muted/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-brand-dark block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newAddrFullName}
                        onChange={(e) => setNewAddrFullName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-muted text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-dark block mb-1">Mobile</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newAddrPhone}
                        onChange={(e) => setNewAddrPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-muted text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-brand-dark block mb-1">Address Line</label>
                    <input
                      type="text"
                      required
                      value={newAddrLine1}
                      onChange={(e) => setNewAddrLine1(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-brand-muted text-xs bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-brand-dark block mb-1">PIN Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddrPincode}
                        onChange={(e) => setNewAddrPincode(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-muted text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-dark block mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={newAddrCity}
                        onChange={(e) => setNewAddrCity(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-muted text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-dark block mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={newAddrState}
                        onChange={(e) => setNewAddrState(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-muted text-xs bg-white"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary !text-xs !py-2.5">
                    Save Delivery Address
                  </button>
                </form>
              )}

              {/* Address List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr._id} className="p-5 rounded-2xl border border-brand-muted/70 bg-white space-y-2 relative">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-brand-dark">{addr.fullName}</h4>
                      <button
                        onClick={() => handleDeleteAddress(addr._id!)}
                        className="text-brand-subtext hover:text-brand-error"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-brand-subtext leading-relaxed">
                      {addr.addressLine1}<br />
                      {addr.city}, {addr.state} - {addr.pincode}<br />
                      Phone: {addr.phone}
                    </p>
                    {addr.isDefaultShipping && (
                      <span className="inline-block text-[10px] font-bold text-brand-primary bg-brand-glow px-2 py-0.5 rounded-full mt-2">
                        Default Shipping
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-dark">Saved Products ({wishlistItems.length})</h2>

              {wishlistItems.length === 0 ? (
                <div className="py-12 text-center text-brand-subtext text-xs space-y-3">
                  <div className="w-12 h-12 rounded-full bg-brand-secondary mx-auto flex items-center justify-center">
                    <Heart className="w-6 h-6 text-brand-subtext opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-brand-dark">Your wishlist is currently empty.</p>
                  <p className="text-xs text-brand-subtext max-w-xs mx-auto">
                    Save your favorite plant proteins, adaptogens, and blends to review anytime.
                  </p>
                  <Link to="/collections/plant-protein-powder" className="btn-primary !text-xs !py-2.5 !px-5 mt-2">
                    Explore Clean Nutrition
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-4 rounded-2xl border border-brand-muted/70 bg-white hover:border-brand-primary/40 transition-all flex gap-3.5 items-center shadow-subtle"
                    >
                      <div className="w-16 h-16 rounded-xl bg-brand-secondary/60 overflow-hidden flex-shrink-0 border border-brand-muted/40">
                        <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.productSlug}`}
                          className="text-xs sm:text-sm font-bold text-brand-dark hover:text-brand-primary truncate block"
                        >
                          {item.productTitle}
                        </Link>
                        <span className="text-xs font-bold text-brand-primary mt-1 block">₹{item.price}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (item.variantId) {
                              addItem(item.variantId, 1);
                              toggleWishlist(item.productId);
                            }
                          }}
                          className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-primary-hover shadow-subtle transition-colors"
                          title="Move to bag"
                          aria-label="Move to shopping bag"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleWishlist(item.productId)}
                          className="w-9 h-9 rounded-full text-brand-subtext hover:text-brand-error hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Remove from wishlist"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
