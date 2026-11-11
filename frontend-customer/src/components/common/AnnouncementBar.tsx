import React, { useState } from 'react';
import { Sparkles, Truck, ShieldCheck, X } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-brand-primary text-white text-xs font-medium py-2.5 px-4 relative transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-center">
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-brand-glow" />
          <span>Free Express Air Delivery Across India On Orders Above ₹999</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 border-l border-white/20 pl-6">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-glow" />
          <span>100% Clean Label • NABL Lab Tested • Zero Bloating Guarantee</span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 border-l border-white/20 pl-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
          <span>Use code <strong>AURAPURE10</strong> for 10% OFF</span>
        </div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
        aria-label="Close banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
