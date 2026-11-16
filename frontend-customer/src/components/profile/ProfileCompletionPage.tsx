import React, { useState } from 'react';
import {
  ShieldCheck,
  User as UserIcon,
  Mail,
  MapPin,
  CheckCircle2,
  Sparkles,
  Phone,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AddressForm, AddressFormData } from '../address/AddressForm';

interface ProfileCompletionPageProps {
  onCompleted: () => void;
}

export const ProfileCompletionPage: React.FC<ProfileCompletionPageProps> = ({ onCompleted }) => {
  const { user, updateProfile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(
    user?.fullName && user?.fullName !== 'Customer' ? user.fullName : user?.name && user?.name !== 'Customer' ? user.name : ''
  );
  const [email, setEmail] = useState(user?.email || '');
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddressSubmit = async (
    addressData: AddressFormData & { addressLine1: string; addressLine2: string }
  ) => {
    setPersonalError(null);

    if (!fullName.trim()) {
      setPersonalError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setPersonalError('Please enter a valid email address for order notifications and invoices.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Update personal details
      await updateProfile({
        name: fullName.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      });

      // 2. Save first delivery address as default
      await api.post('/addresses', {
        fullName: addressData.fullName || fullName.trim(),
        phone: addressData.phone || user?.phone || user?.mobileNumber || '',
        houseFlatNo: addressData.houseFlatNo,
        apartmentBuilding: addressData.apartmentBuilding,
        streetArea: addressData.streetArea,
        landmark: addressData.landmark,
        addressLine1: addressData.addressLine1,
        addressLine2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        country: 'India',
        isDefaultShipping: true,
      });

      // 3. Refresh user profile in context
      await refreshProfile();
      onCompleted();
    } catch (err: any) {
      setPersonalError(err.response?.data?.error?.message || err.message || 'Failed to complete profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-glow text-brand-primary text-xs font-bold uppercase tracking-widest border border-brand-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Profile Setup</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-brand-dark">
          Complete Your Customer Profile
        </h1>
        <p className="text-xs sm:text-sm text-brand-subtext max-w-lg mx-auto leading-relaxed">
          Help us personalize your wellness experience and ensure accurate doorstep deliveries across India.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-brand-muted/80 shadow-subtle p-5 sm:p-8 space-y-6">
        
        {/* Verified Account Identifier */}
        <div className="p-4 rounded-2xl bg-brand-secondary/40 border border-brand-muted/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-dark">
                +91 {user?.mobileNumber || user?.phone || 'Verified'}
              </p>
              <p className="text-[11px] text-brand-subtext">Verified Mobile Account</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified OTP</span>
          </span>
        </div>

        {/* Section 1: Personal Details */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5 border-b border-brand-muted/60 pb-2">
            <UserIcon className="w-4 h-4 text-brand-primary" />
            <span>1. Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-brand-dark block mb-1">
                Full Legal Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ananya Sen"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted text-xs sm:text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-brand-dark block mb-1">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-brand-muted text-xs sm:text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
                <Mail className="w-4 h-4 text-brand-subtext absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[10px] text-brand-subtext mt-1">
                For order invoices & shipping updates (not used for logging in).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Delivery Address Form */}
        <div className="space-y-4 pt-4 border-t border-brand-muted/60">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5 border-b border-brand-muted/60 pb-2">
            <MapPin className="w-4 h-4 text-brand-primary" />
            <span>2. Primary Delivery Address</span>
          </h2>

          <AddressForm
            defaultName={fullName}
            defaultPhone={user?.phone || user?.mobileNumber || ''}
            onSubmit={handleAddressSubmit}
            submitButtonText="Save Profile & Delivery Address"
            isLoading={isSubmitting}
          />
        </div>

        {personalError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{personalError}</span>
          </div>
        )}

      </div>
    </div>
  );
};
