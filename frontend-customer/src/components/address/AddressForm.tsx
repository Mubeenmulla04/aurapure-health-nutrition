import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Navigation,
  Building,
  Home,
  Check,
} from 'lucide-react';
import {
  ALL_INDIAN_STATES,
  INDIAN_STATES_AND_CITIES,
  lookupPostalPincode,
  reverseGeocodeCoordinates,
} from '../../data/indiaLocations';
import { Address } from '../../types';

export interface AddressFormData {
  fullName: string;
  phone: string;
  houseFlatNo: string;
  apartmentBuilding: string;
  streetArea: string;
  landmark: string;
  state: string;
  city: string;
  pincode: string;
  country: string;
  isDefaultShipping: boolean;
}

interface AddressFormProps {
  initialValues?: Partial<AddressFormData & { addressLine1?: string; addressLine2?: string }>;
  defaultPhone?: string;
  defaultName?: string;
  onSubmit: (data: AddressFormData & { addressLine1: string; addressLine2: string }) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  isLoading?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initialValues,
  defaultPhone = '',
  defaultName = '',
  onSubmit,
  onCancel,
  submitButtonText = 'Save Address',
  isLoading = false,
}) => {
  // Parse initial values
  const [fullName, setFullName] = useState(initialValues?.fullName || defaultName);
  const [phone, setPhone] = useState(initialValues?.phone || defaultPhone);
  const [houseFlatNo, setHouseFlatNo] = useState(initialValues?.houseFlatNo || '');
  const [apartmentBuilding, setApartmentBuilding] = useState(initialValues?.apartmentBuilding || '');
  const [streetArea, setStreetArea] = useState(
    initialValues?.streetArea || initialValues?.addressLine1 || ''
  );
  const [landmark, setLandmark] = useState(initialValues?.landmark || initialValues?.addressLine2 || '');
  const [selectedState, setSelectedState] = useState(initialValues?.state || 'Karnataka');
  const [selectedCity, setSelectedCity] = useState(initialValues?.city || 'Bengaluru');
  const [pincode, setPincode] = useState(initialValues?.pincode || '');
  const [isDefaultShipping, setIsDefaultShipping] = useState(initialValues?.isDefaultShipping ?? true);

  // Searchable State Dropdown State
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  // Searchable City Dropdown State
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // Location & Pincode Lookup States
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Available cities for currently selected state
  const availableCities = INDIAN_STATES_AND_CITIES[selectedState] || [];

  // Reset city when state changes
  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    setIsStateOpen(false);
    setStateSearch('');
    const cities = INDIAN_STATES_AND_CITIES[stateName] || [];
    if (cities.length > 0) {
      setSelectedCity(cities[0]);
    } else {
      setSelectedCity('');
    }
  };

  // Filtered States
  const filteredStates = ALL_INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // Filtered Cities
  const filteredCities = availableCities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Auto Postal Pincode Lookup on 6-digit entry
  useEffect(() => {
    if (pincode.length === 6 && /^[1-9][0-9]{5}$/.test(pincode)) {
      setIsLookingUpPincode(true);
      lookupPostalPincode(pincode)
        .then((result) => {
          if (result) {
            if (result.state && INDIAN_STATES_AND_CITIES[result.state]) {
              setSelectedState(result.state);
            }
            if (result.city) {
              setSelectedCity(result.city);
            }
            if (result.area && !streetArea) {
              setStreetArea(result.area);
            }
            setLocationFeedback({
              type: 'success',
              message: `PIN code matched: ${result.city || ''}, ${result.state || ''}`,
            });
          }
        })
        .finally(() => setIsLookingUpPincode(false));
    }
  }, [pincode]);

  // "Use My Current Location" Handler
  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationFeedback({
        type: 'error',
        message: 'Geolocation is not supported by your current browser.',
      });
      return;
    }

    setIsDetectingLocation(true);
    setLocationFeedback(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const geoData = await reverseGeocodeCoordinates(latitude, longitude);

          if (geoData) {
            if (geoData.state && INDIAN_STATES_AND_CITIES[geoData.state]) {
              setSelectedState(geoData.state);
            }
            if (geoData.city) {
              setSelectedCity(geoData.city);
            }
            if (geoData.pincode) {
              setPincode(geoData.pincode);
            }
            if (geoData.area || geoData.road) {
              const suggestedStreet = [geoData.road, geoData.area].filter(Boolean).join(', ');
              if (suggestedStreet && !streetArea) {
                setStreetArea(suggestedStreet);
              }
            }

            setLocationFeedback({
              type: 'info',
              message:
                'Location detected! We have prefilled your Area, City, State and Pincode. Please enter your Flat/House No. and Building name.',
            });
          } else {
            setLocationFeedback({
              type: 'error',
              message: 'Could not resolve your exact address. Please enter your details manually.',
            });
          }
        } catch {
          setLocationFeedback({
            type: 'error',
            message: 'Failed to retrieve location details. Please fill in manually.',
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationFeedback({
            type: 'error',
            message:
              'Location permission was denied. Please allow location access in your browser or enter your address manually.',
          });
        } else {
          setLocationFeedback({
            type: 'error',
            message: 'Unable to acquire GPS coordinates. Please enter your address details below.',
          });
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter your full recipient name.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setFormError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (!houseFlatNo.trim()) {
      setFormError('House / Flat number is mandatory for accurate delivery.');
      return;
    }

    if (!streetArea.trim()) {
      setFormError('Street / Area name is required.');
      return;
    }

    if (!selectedState || !selectedCity) {
      setFormError('Please select both state and city.');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    // Build unified addressLine1 & addressLine2 for backend & carrier compatibility
    const fullLine1 = [houseFlatNo.trim(), apartmentBuilding.trim(), streetArea.trim()]
      .filter(Boolean)
      .join(', ');
    const fullLine2 = landmark.trim();

    try {
      await onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim(),
        houseFlatNo: houseFlatNo.trim(),
        apartmentBuilding: apartmentBuilding.trim(),
        streetArea: streetArea.trim(),
        landmark: fullLine2,
        addressLine1: fullLine1,
        addressLine2: fullLine2,
        state: selectedState,
        city: selectedCity.trim(),
        pincode: pincode.trim(),
        country: 'India',
        isDefaultShipping,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save address.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
      
      {/* "Use My Current Location" Instant Geolocation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-brand-glow/40 border border-brand-primary/20">
        <div className="space-y-0.5">
          <p className="font-bold text-brand-dark flex items-center gap-1.5 text-xs">
            <Navigation className="w-3.5 h-3.5 text-brand-primary fill-current" />
            <span>Fast Address Fill</span>
          </p>
          <p className="text-[11px] text-brand-subtext">
            Auto-detect your area, city, state and PIN code via device GPS.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isDetectingLocation}
          className="btn-primary !py-2 !px-3.5 !text-xs font-semibold whitespace-nowrap gap-1.5 shadow-xs flex-shrink-0"
        >
          {isDetectingLocation ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span>Use My Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Geolocation / Pincode Feedback Alert */}
      {locationFeedback && (
        <div
          className={`p-3 rounded-xl border flex items-start gap-2 text-xs animate-in fade-in duration-150 ${
            locationFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : locationFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {locationFeedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{locationFeedback.message}</span>
        </div>
      )}

      {/* Recipient Full Name & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1">
            Recipient Full Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Aarav Sharma"
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1">
            10-Digit Mobile Number <span className="text-rose-600">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-brand-muted bg-brand-bg text-brand-subtext font-semibold text-xs">
              +91
            </span>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="9876543210"
              className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-brand-muted bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Detailed Address Line Components (House/Flat No & Apartment/Building) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1">
            House / Flat / Floor No. <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={houseFlatNo}
              onChange={(e) => setHouseFlatNo(e.target.value)}
              placeholder="e.g. Flat 402, 4th Floor"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-brand-muted bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            <Home className="w-4 h-4 text-brand-subtext absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1">
            Apartment / Society / Building Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={apartmentBuilding}
              onChange={(e) => setApartmentBuilding(e.target.value)}
              placeholder="e.g. Prestige Lakeview Towers"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-brand-muted bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            <Building className="w-4 h-4 text-brand-subtext absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Street / Area & Landmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1">
            Street / Area / Colony <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={streetArea}
            onChange={(e) => setStreetArea(e.target.value)}
            placeholder="e.g. 100ft Road, Indiranagar"
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1">
            Landmark <span className="text-brand-subtext font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. Near Metro Station / Opposite Park"
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* State Dropdown (Searchable), City Dropdown (Searchable), Pincode (Validated) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Searchable State Dropdown */}
        <div className="relative">
          <label className="text-xs font-bold text-brand-dark block mb-1">
            State / UT <span className="text-rose-600">*</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsStateOpen(!isStateOpen);
              setIsCityOpen(false);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted bg-white text-left text-xs sm:text-sm font-medium text-brand-dark flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <span className="truncate">{selectedState}</span>
            <ChevronDown className={`w-4 h-4 text-brand-subtext transition-transform ${isStateOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStateOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-brand-muted/80 shadow-2xl z-50 p-2 space-y-1.5 max-h-60 overflow-hidden flex flex-col animate-in fade-in duration-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-brand-subtext absolute left-3 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  placeholder="Search state..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-brand-muted text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-brand-muted/40">
                {filteredStates.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => handleStateSelect(s)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                      selectedState === s ? 'bg-brand-glow text-brand-primary font-bold' : 'hover:bg-brand-bg text-brand-dark'
                    }`}
                  >
                    <span>{s}</span>
                    {selectedState === s && <Check className="w-3.5 h-3.5 text-brand-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Searchable City Dropdown (Bound to State) */}
        <div className="relative">
          <label className="text-xs font-bold text-brand-dark block mb-1">
            City <span className="text-rose-600">*</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsCityOpen(!isCityOpen);
              setIsStateOpen(false);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted bg-white text-left text-xs sm:text-sm font-medium text-brand-dark flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <span className="truncate">{selectedCity || 'Select city'}</span>
            <ChevronDown className={`w-4 h-4 text-brand-subtext transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCityOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-brand-muted/80 shadow-2xl z-50 p-2 space-y-1.5 max-h-60 overflow-hidden flex flex-col animate-in fade-in duration-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-brand-subtext absolute left-3 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search or type city..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-brand-muted text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-brand-muted/40">
                {filteredCities.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => {
                      setSelectedCity(c);
                      setIsCityOpen(false);
                      setCitySearch('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                      selectedCity === c ? 'bg-brand-glow text-brand-primary font-bold' : 'hover:bg-brand-bg text-brand-dark'
                    }`}
                  >
                    <span>{c}</span>
                    {selectedCity === c && <Check className="w-3.5 h-3.5 text-brand-primary" />}
                  </button>
                ))}

                {/* Allow typing custom city if not in preset list */}
                {citySearch.trim() && !availableCities.includes(citySearch.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity(citySearch.trim());
                      setIsCityOpen(false);
                      setCitySearch('');
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg bg-brand-secondary text-brand-primary font-bold hover:bg-brand-muted"
                  >
                    Use "{citySearch.trim()}"
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6-Digit PIN Code with Postal Auto-Lookup */}
        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1">
            6-Digit PIN Code <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 560038"
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            {isLookingUpPincode && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>

      </div>

      {/* Country Fixed to India */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-bg border border-brand-muted/70 text-xs">
        <span className="font-semibold text-brand-dark">Country:</span>
        <span className="font-bold text-brand-primary">India (IN)</span>
      </div>

      {/* Default Shipping Address Checkbox */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="defaultShippingCheck"
          checked={isDefaultShipping}
          onChange={(e) => setIsDefaultShipping(e.target.checked)}
          className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-brand-muted"
        />
        <label htmlFor="defaultShippingCheck" className="text-xs text-brand-dark font-medium cursor-pointer">
          Set as my default delivery address
        </label>
      </div>

      {/* Error Message */}
      {formError && (
        <p className="text-xs text-rose-600 flex items-center gap-1.5 pt-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{formError}</span>
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-muted/70">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-brand-muted bg-white text-brand-subtext font-semibold text-xs hover:text-brand-dark transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary !py-2.5 !px-6 !text-xs font-bold gap-2 shadow-card"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitButtonText}</span>
        </button>
      </div>

    </form>
  );
};
