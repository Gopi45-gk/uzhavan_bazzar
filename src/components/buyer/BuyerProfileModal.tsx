import React from 'react';
import { motion } from 'motion/react';
import { X, User, Phone, MapPin, Mail, Building2, FileText, RefreshCw, LogOut } from 'lucide-react';
import { BuyerUserData } from '../../types/buyer';
import { useLanguage } from '../../context/LanguageContext';

interface BuyerProfileModalProps {
  buyerData: BuyerUserData | null;
  onClose: () => void;
  onSwitchToFarmer: () => void;
  onLogout: () => void;
}

export const BuyerProfileModal: React.FC<BuyerProfileModalProps> = ({
  buyerData,
  onClose,
  onSwitchToFarmer,
  onLogout,
}) => {
  const { t } = useLanguage();

  const fullName = buyerData?.fullName || 'Anand Kumar';
  const mobile = buyerData?.mobile || '98765 43210';
  const location = buyerData?.location || 'Coimbatore / RS Puram';
  const email = buyerData?.email || 'buyer@uzhavanbazzar.app';
  const businessName = buyerData?.businessName || 'Fresh Naturals Retail Store';
  const gst = buyerData?.gst || '33ABCDE1234F1Z5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Avatar & Header */}
        <div className="text-center pt-2 pb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-50">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-xl font-black text-neutral-900 mt-3">{fullName}</h3>
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
            🛒 Verified Produce Buyer
          </span>
        </div>

        {/* Details List */}
        <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/70 text-sm">
          <div className="flex items-center gap-3 text-neutral-700">
            <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="font-semibold">+91 {mobile}</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-700">
            <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-700">
            <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="text-xs">{email}</span>
          </div>
          <div className="border-t border-neutral-200 pt-2 flex items-center gap-3 text-neutral-700">
            <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>{businessName}</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-500 text-xs">
            <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>GST: {gst}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={onSwitchToFarmer}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('switchFarmerPortal', 'Switch to Farmer Portal')}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
