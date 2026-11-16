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
  CheckCircle2,
  Edit2,
  Phone,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
  Star,
} from 'lucide-react';
import { api, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Order, Address } from '../types';
import { AddressForm, AddressFormData } from '../components/address/AddressForm';
import { ProfileCompletionPage } from '../components/profile/ProfileCompletionPage';
import { OrderDetailsModal } from '../components/orders/OrderDetailsModal';

export const AccountPage: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'profile' }) => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    logout,
    updateProfile,
    refreshProfile,
    changeMobileSendOtp,
    changeMobileVerifyOld,
    changeMobileSendNewOtp,
    changeMobileVerifyNew,
  } = useAuth();
  const { wishlistItems, toggleWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedDetailsOrderId, setSelectedDetailsOrderId] = useState<string | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFullName, setProfileFullName] = useState(user?.fullName || user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Address Management States
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressActionLoading, setAddressActionLoading] = useState(false);
  const [addressToast, setAddressToast] = useState<string | null>(null);

  // Synchronize profile values when user loads
  useEffect(() => {
    if (user) {
      setProfileFullName(user.fullName || (user.name !== 'Customer' ? user.name : '') || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Mobile Number Change Modal State
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<'OLD_OTP' | 'NEW_PHONE' | 'NEW_OTP' | 'SUCCESS'>('OLD_OTP');
  const [oldOtp, setOldOtp] = useState('');
  const [changeToken, setChangeToken] = useState('');
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [newOtp, setNewOtp] = useState('');
  const [mobileModalLoading, setMobileModalLoading] = useState(false);
  const [mobileModalError, setMobileModalError] = useState<string | null>(null);

  const showAddressToast = (msg: string) => {
    setAddressToast(msg);
    setTimeout(() => setAddressToast(null), 3000);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/account/login');
      return;
    }

    loadAddresses();
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab, isAuthenticated, navigate]);

  const loadOrders = async () => {
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

  const loadAddresses = async () => {
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      setProfileMessage(null);
      await updateProfile({
        name: profileFullName.trim(),
        fullName: profileFullName.trim(),
        email: profileEmail.trim() || undefined,
      });
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Profile successfully updated!' });
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Address CRUD Handlers
  const handleSaveNewAddress = async (
    data: AddressFormData & { addressLine1: string; addressLine2: string }
  ) => {
    try {
      setAddressActionLoading(true);
      await api.post('/addresses', {
        fullName: data.fullName,
        phone: data.phone,
        houseFlatNo: data.houseFlatNo,
        apartmentBuilding: data.apartmentBuilding,
        streetArea: data.streetArea,
        landmark: data.landmark,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: 'India',
        isDefaultShipping: data.isDefaultShipping || addresses.length === 0,
      });
      setIsAddingAddress(false);
      showAddressToast('New address saved successfully!');
      await loadAddresses();
      await refreshProfile();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not save address.');
    } finally {
      setAddressActionLoading(false);
    }
  };

  const handleUpdateAddress = async (
    data: AddressFormData & { addressLine1: string; addressLine2: string }
  ) => {
    if (!editingAddress?._id) return;
    try {
      setAddressActionLoading(true);
      await api.put(`/addresses/${editingAddress._id}`, {
        fullName: data.fullName,
        phone: data.phone,
        houseFlatNo: data.houseFlatNo,
        apartmentBuilding: data.apartmentBuilding,
        streetArea: data.streetArea,
        landmark: data.landmark,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: 'India',
        isDefaultShipping: data.isDefaultShipping,
      });
      setEditingAddress(null);
      showAddressToast('Address updated successfully!');
      await loadAddresses();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not update address.');
    } finally {
      setAddressActionLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.put(`/addresses/${id}`, { isDefaultShipping: true });
      showAddressToast('Default delivery address updated.');
      await loadAddresses();
    } catch {
      alert('Could not set address as default.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      showAddressToast('Address removed.');
      await loadAddresses();
    } catch {
      alert('Could not delete address.');
    }
  };

  // Mobile Change Handlers
  const handleOpenMobileModal = async () => {
    setIsMobileModalOpen(true);
    setMobileStep('OLD_OTP');
    setOldOtp('');
    setChangeToken('');
    setNewMobileNumber('');
    setNewOtp('');
    setMobileModalError(null);
    setMobileModalLoading(true);

    try {
      await changeMobileSendOtp();
    } catch (err: any) {
      setMobileModalError(
        err.response?.data?.error?.message || 'Could not send verification code to your current mobile number.'
      );
    } finally {
      setMobileModalLoading(false);
    }
  };

  const handleVerifyOldMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oldOtp.length !== 6) return;
    try {
      setMobileModalLoading(true);
      setMobileModalError(null);
      const res = await changeMobileVerifyOld(oldOtp);
      setChangeToken(res.changeToken);
      setMobileStep('NEW_PHONE');
    } catch (err: any) {
      setMobileModalError(err.response?.data?.error?.message || 'Invalid verification code.');
    } finally {
      setMobileModalLoading(false);
    }
  };

  const handleSendNewMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(newMobileNumber)) {
      setMobileModalError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    try {
      setMobileModalLoading(true);
      setMobileModalError(null);
      await changeMobileSendNewOtp(newMobileNumber);
      setMobileStep('NEW_OTP');
    } catch (err: any) {
      setMobileModalError(err.response?.data?.error?.message || 'Failed to send OTP to new number.');
    } finally {
      setMobileModalLoading(false);
    }
  };

  const handleVerifyNewMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOtp.length !== 6) return;
    try {
      setMobileModalLoading(true);
      setMobileModalError(null);
      await changeMobileVerifyNew(newMobileNumber, newOtp, changeToken);
      setMobileStep('SUCCESS');
      setTimeout(() => {
        setIsMobileModalOpen(false);
        refreshProfile();
      }, 2500);
    } catch (err: any) {
      setMobileModalError(err.response?.data?.error?.message || 'Invalid OTP for new mobile number.');
    } finally {
      setMobileModalLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  // Determine whether customer profile is complete
  const isProfileComplete =
    user?.isProfileComplete ||
    (Boolean(user?.fullName || (user?.name && user?.name !== 'Customer')) &&
      Boolean(user?.email) &&
      addresses.length > 0);

  // If viewing the Profile tab and profile is incomplete, render dedicated ProfileCompletionPage
  if (activeTab === 'profile' && !isProfileComplete && !isLoadingAddresses) {
    return (
      <ProfileCompletionPage
        onCompleted={async () => {
          await refreshProfile();
          await loadAddresses();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 pb-20">
      
      {/* Account Overview Header */}
      <div className="bg-white rounded-3xl border border-brand-muted/80 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-glow text-brand-primary font-bold text-xl flex items-center justify-center">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-brand-dark">
                {user?.fullName || (user?.name !== 'Customer' ? user?.name : 'Valued Customer')}
              </h1>
              {isProfileComplete && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>Profile Complete</span>
                </span>
              )}
            </div>
            <p className="text-xs text-brand-subtext mt-0.5">
              {user?.email || 'No email registered'} • +91 {user?.mobileNumber || user?.phone || ''}
            </p>
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
        
        {/* Navigation Tabs */}
        <aside className="lg:col-span-3 flex lg:flex-col overflow-x-auto no-scrollbar gap-2 p-1.5 sm:p-3 bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 shadow-subtle">
          {[
            { id: 'profile', label: 'My Profile', icon: UserIcon },
            { id: 'addresses', label: 'My Addresses', icon: MapPin },
            { id: 'orders', label: 'My Orders', icon: Package },
            { id: 'wishlist', label: 'Wishlist', icon: Heart },
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
            <div className="space-y-6 max-w-xl">
              <div className="flex items-center justify-between pb-4 border-b border-brand-muted/60">
                <div>
                  <h2 className="font-serif text-xl font-bold text-brand-dark">Personal Profile</h2>
                  <p className="text-xs text-brand-subtext mt-0.5">Manage your identity and contact details</p>
                </div>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(true);
                      setProfileMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-primary text-brand-primary text-xs font-bold hover:bg-brand-glow/30 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {profileMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              {/* View / Edit Mode */}
              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-brand-dark block mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      placeholder="e.g. Vikram Malhotra"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-dark block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. vikram@example.com (for tax invoices)"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <p className="text-[10px] text-brand-subtext mt-1">
                      Used for order confirmations and tax invoices.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="btn-primary !text-xs !py-2.5 !px-5 gap-1.5"
                    >
                      {isSavingProfile ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isSavingProfile}
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileFullName(user?.fullName || user?.name || '');
                        setProfileEmail(user?.email || '');
                        setProfileMessage(null);
                      }}
                      className="btn-secondary !text-xs !py-2.5 !px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-brand-bg/50 border border-brand-muted/60 space-y-3">
                    <div>
                      <span className="text-brand-subtext block text-[11px] uppercase tracking-wider font-semibold">
                        Full Name
                      </span>
                      <span className="text-sm font-semibold text-brand-dark mt-0.5 block">
                        {user?.fullName || user?.name || 'Customer'}
                      </span>
                    </div>

                    <div>
                      <span className="text-brand-subtext block text-[11px] uppercase tracking-wider font-semibold">
                        Email Address
                      </span>
                      <span className="text-sm font-semibold text-brand-dark mt-0.5 block">
                        {user?.email || <span className="text-brand-subtext italic">Not set</span>}
                      </span>
                    </div>

                    <div>
                      <span className="text-brand-subtext block text-[11px] uppercase tracking-wider font-semibold">
                        Registered Mobile Number
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-brand-dark">
                          +91 {user?.mobileNumber || user?.phone}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>OTP Verified</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Change Mobile Button */}
                  <div className="p-4 rounded-2xl border border-brand-muted/70 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark">Need to update your mobile number?</h4>
                      <p className="text-[11px] text-brand-subtext mt-0.5">
                        Transfer your account and order history securely with OTP verification.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenMobileModal}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-secondary text-brand-dark hover:bg-brand-muted text-xs font-semibold transition-all self-start sm:self-auto"
                    >
                      <Phone className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Change Mobile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-brand-muted/70">
                <div>
                  <h2 className="font-serif text-xl font-bold text-brand-dark">My Orders</h2>
                  <p className="text-xs text-brand-subtext">View orders and live delivery tracking</p>
                </div>
              </div>

              {isLoadingOrders ? (
                <div className="py-12 text-center text-brand-subtext text-xs space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-primary" />
                  <p>Loading your verified orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Package className="w-10 h-10 text-brand-subtext mx-auto opacity-40" />
                  <p className="text-sm text-brand-subtext">You have not placed any orders yet.</p>
                  <Link to="/collections" className="btn-primary !text-xs !py-2.5">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  {orders.map((ord) => {
                    const totalQty = ord.items.reduce((acc, i) => acc + i.quantity, 0);
                    const mainItem = ord.items[0];
                    const estDelivery =
                      ord.shipment?.estimatedDeliveryDate ||
                      (ord.tracking?.estimatedDeliveryDate ? new Date(ord.tracking.estimatedDeliveryDate) : null);

                    return (
                      <div
                        key={ord._id}
                        className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-brand-muted/80 shadow-xs hover:border-brand-primary/50 transition-all space-y-4"
                      >
                        {/* Order Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-brand-muted/50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm sm:text-base font-bold text-brand-dark">
                                {ord.orderNumber}
                              </span>
                              <span className="text-[10px] text-brand-subtext">
                                • {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Payment Status Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                ord.paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.paymentStatus === 'REFUNDED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Payment: {ord.paymentStatus === 'UNPAID' ? 'COD Pending' : ord.paymentStatus}
                            </span>

                            {/* Order Status Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                ord.orderStatus === 'DELIVERED'
                                  ? 'bg-emerald-600 text-white'
                                  : ord.orderStatus === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : ord.orderStatus === 'REFUNDED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-brand-primary text-white'
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Order Card Content */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {/* Main Product Thumbnail */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white border border-brand-muted/70 p-1 flex-shrink-0 flex items-center justify-center">
                            <img
                              src={mainItem?.image || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80'}
                              alt={mainItem?.title}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {/* Order Details Column */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-sm font-bold text-brand-dark truncate">
                              {mainItem?.title}
                              {ord.items.length > 1 && (
                                <span className="text-xs font-normal text-brand-subtext ml-1.5">
                                  + {ord.items.length - 1} more item{ord.items.length > 2 ? 's' : ''}
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-brand-subtext">
                              {mainItem?.flavor && `Flavor: ${mainItem.flavor}`}
                              {mainItem?.packSize && ` • Pack: ${mainItem.packSize}`}
                            </p>
                            <div className="flex items-center gap-3 text-xs pt-0.5">
                              <span className="text-brand-subtext">
                                Total Items: <strong className="text-brand-dark">{totalQty}</strong>
                              </span>
                              <span>•</span>
                              <span className="font-bold text-brand-primary text-sm sm:text-base">
                                ₹{ord.pricing.finalTotal}
                              </span>
                            </div>

                            {/* Estimated Delivery Date if available */}
                            {estDelivery && (
                              <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 pt-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  Estimated Delivery by{' '}
                                  {new Date(estDelivery).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Card Actions */}
                          <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-muted/40">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailsOrderId(ord._id)}
                              className="btn-primary !text-xs !py-2.5 !px-4 flex-1 sm:flex-initial w-full sm:w-auto text-center font-bold shadow-xs active:scale-95"
                            >
                              View Details & Tracking
                            </button>

                            <a
                              href={`${API_BASE_URL}/invoices/${ord._id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 rounded-xl border border-brand-muted text-xs font-semibold text-brand-subtext hover:text-brand-dark hover:bg-brand-bg transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial w-full sm:w-auto"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-brand-muted/70">
                <div>
                  <h2 className="font-serif text-xl font-bold text-brand-dark">Saved Delivery Addresses</h2>
                  <p className="text-xs text-brand-subtext">Manage addresses for one-click express delivery</p>
                </div>
                {!isAddingAddress && !editingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="btn-primary !text-xs !py-2.5 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* Toast Feedback */}
              {addressToast && (
                <div className="p-3.5 rounded-2xl bg-brand-dark text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{addressToast}</span>
                </div>
              )}

              {/* Add New Address Form Modal/View */}
              {isAddingAddress && (
                <div className="p-5 sm:p-6 rounded-3xl bg-brand-bg/60 border border-brand-muted/80 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-muted/60">
                    <h3 className="text-sm font-bold text-brand-dark">Add New Delivery Address</h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="p-1 text-brand-subtext hover:text-brand-dark"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <AddressForm
                    defaultName={user?.fullName || (user?.name !== 'Customer' ? user?.name : '') || ''}
                    defaultPhone={user?.phone || user?.mobileNumber || ''}
                    onSubmit={handleSaveNewAddress}
                    onCancel={() => setIsAddingAddress(false)}
                    submitButtonText="Save Delivery Address"
                    isLoading={addressActionLoading}
                  />
                </div>
              )}

              {/* Edit Address Form Modal/View */}
              {editingAddress && (
                <div className="p-5 sm:p-6 rounded-3xl bg-brand-bg/60 border border-brand-muted/80 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-muted/60">
                    <h3 className="text-sm font-bold text-brand-dark">Edit Delivery Address</h3>
                    <button
                      type="button"
                      onClick={() => setEditingAddress(null)}
                      className="p-1 text-brand-subtext hover:text-brand-dark"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <AddressForm
                    initialValues={{
                      fullName: editingAddress.fullName,
                      phone: editingAddress.phone,
                      houseFlatNo: editingAddress.houseFlatNo || '',
                      apartmentBuilding: editingAddress.apartmentBuilding || '',
                      streetArea: editingAddress.streetArea || editingAddress.addressLine1 || '',
                      landmark: editingAddress.landmark || editingAddress.addressLine2 || '',
                      state: editingAddress.state,
                      city: editingAddress.city,
                      pincode: editingAddress.pincode,
                      isDefaultShipping: editingAddress.isDefaultShipping,
                    }}
                    onSubmit={handleUpdateAddress}
                    onCancel={() => setEditingAddress(null)}
                    submitButtonText="Update Address"
                    isLoading={addressActionLoading}
                  />
                </div>
              )}

              {/* Addresses List */}
              {isLoadingAddresses ? (
                <div className="py-12 text-center text-brand-subtext text-xs">Loading addresses...</div>
              ) : addresses.length === 0 && !isAddingAddress ? (
                <div className="py-12 text-center space-y-3">
                  <MapPin className="w-10 h-10 text-brand-subtext mx-auto opacity-40" />
                  <p className="text-sm text-brand-subtext">No saved delivery addresses yet.</p>
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="btn-primary !text-xs !py-2.5"
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 relative ${
                        addr.isDefaultShipping
                          ? 'bg-brand-glow/20 border-brand-primary ring-2 ring-brand-primary/20'
                          : 'bg-white border-brand-muted/80 hover:border-brand-primary/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-brand-dark">{addr.fullName}</p>
                          <p className="text-xs font-semibold text-brand-primary">+91 {addr.phone}</p>
                        </div>

                        {addr.isDefaultShipping ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-primary text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Default</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr._id!)}
                            className="text-[11px] font-semibold text-brand-subtext hover:text-brand-primary underline"
                          >
                            Set as default
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-brand-subtext space-y-0.5 leading-relaxed">
                        <p className="text-brand-dark font-medium">
                          {addr.houseFlatNo && `${addr.houseFlatNo}, `}
                          {addr.apartmentBuilding && `${addr.apartmentBuilding}, `}
                          {addr.streetArea || addr.addressLine1}
                        </p>
                        {(addr.landmark || addr.addressLine2) && (
                          <p>Landmark: {addr.landmark || addr.addressLine2}</p>
                        )}
                        <p>
                          {addr.city}, {addr.state} - <strong className="text-brand-dark">{addr.pincode}</strong>
                        </p>
                        <p className="text-[11px] font-medium text-brand-subtext">India</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-brand-muted/50">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(addr);
                            setIsAddingAddress(false);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr._id!)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-dark">Saved Wishlist</h2>

              {wishlistItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Heart className="w-10 h-10 text-brand-subtext mx-auto opacity-40" />
                  <p className="text-sm text-brand-subtext">Your wishlist is currently empty.</p>
                  <Link to="/collections" className="btn-primary !text-xs !py-2.5">
                    Discover Formulations
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((prod) => (
                    <div key={prod._id} className="p-4 rounded-2xl border border-brand-muted/80 bg-brand-bg/30 space-y-3">
                      <div className="aspect-square rounded-xl bg-white p-2 border border-brand-muted/60 overflow-hidden">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80'}
                          alt={prod.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-dark line-clamp-1">{prod.title}</h4>
                        <p className="text-[11px] text-brand-primary font-semibold mt-0.5">
                          ₹{prod.variants?.[0]?.sellingPrice || '2,499'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/products/${prod.slug}`}
                          className="flex-1 btn-primary !py-2 !text-xs text-center font-bold"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(prod._id)}
                          className="p-2 rounded-xl border border-brand-muted text-rose-600 hover:bg-rose-50"
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

      {/* Change Mobile Modal */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 relative border border-brand-muted shadow-2xl">
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-brand-subtext hover:text-brand-dark"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif text-lg font-bold text-brand-dark">Change Registered Mobile</h3>
              <p className="text-xs text-brand-subtext mt-0.5">
                Two-step verification to securely transfer your account.
              </p>
            </div>

            {mobileModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{mobileModalError}</span>
              </div>
            )}

            {/* Step 1: Verify Old Number */}
            {mobileStep === 'OLD_OTP' && (
              <form onSubmit={handleVerifyOldMobileOtp} className="space-y-4">
                <p className="text-xs text-brand-dark leading-relaxed">
                  Enter the 6-digit verification code sent to your current number{' '}
                  <strong className="text-brand-primary">+91 {user?.mobileNumber || user?.phone}</strong>.
                </p>
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={oldOtp}
                    onChange={(e) => setOldOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full text-center tracking-widest text-lg font-bold py-2.5 border border-brand-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={mobileModalLoading || oldOtp.length !== 6}
                  className="w-full btn-primary !py-3 text-xs font-bold"
                >
                  {mobileModalLoading ? 'Verifying...' : 'Verify Current Number'}
                </button>
              </form>
            )}

            {/* Step 2: Enter New Mobile */}
            {mobileStep === 'NEW_PHONE' && (
              <form onSubmit={handleSendNewMobileOtp} className="space-y-4">
                <p className="text-xs text-brand-dark leading-relaxed">
                  Enter your new 10-digit Indian mobile number.
                </p>
                <div className="flex">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-brand-muted bg-brand-bg text-brand-subtext font-semibold text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newMobileNumber}
                    onChange={(e) => setNewMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="New Mobile Number"
                    className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={mobileModalLoading || newMobileNumber.length !== 10}
                  className="w-full btn-primary !py-3 text-xs font-bold"
                >
                  {mobileModalLoading ? 'Sending OTP...' : 'Send OTP to New Number'}
                </button>
              </form>
            )}

            {/* Step 3: Verify New Number */}
            {mobileStep === 'NEW_OTP' && (
              <form onSubmit={handleVerifyNewMobileOtp} className="space-y-4">
                <p className="text-xs text-brand-dark leading-relaxed">
                  Enter the 6-digit OTP sent to <strong className="text-brand-primary">+91 {newMobileNumber}</strong>.
                </p>
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newOtp}
                    onChange={(e) => setNewOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full text-center tracking-widest text-lg font-bold py-2.5 border border-brand-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={mobileModalLoading || newOtp.length !== 6}
                  className="w-full btn-primary !py-3 text-xs font-bold"
                >
                  {mobileModalLoading ? 'Migrating Account...' : 'Confirm & Update Mobile'}
                </button>
              </form>
            )}

            {/* Step 4: Success */}
            {mobileStep === 'SUCCESS' && (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-lg font-bold text-brand-dark">Mobile Number Updated!</h4>
                <p className="text-xs text-brand-subtext">
                  Your AuraPure account has been migrated to your new mobile number.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Details & Live Tracking Modal */}
      {selectedDetailsOrderId && (
        <OrderDetailsModal
          orderId={selectedDetailsOrderId}
          onClose={() => setSelectedDetailsOrderId(null)}
        />
      )}

    </div>
  );
};
