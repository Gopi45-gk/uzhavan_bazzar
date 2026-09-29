import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Star, MapPin, User, ShieldCheck, ShoppingCart } from 'lucide-react';
import { BuyerFeedProduct } from '../../types/buyer';
import { useLanguage } from '../../context/LanguageContext';

interface BuyerProductDetailProps {
  product: BuyerFeedProduct | null;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  onBack: () => void;
  onBuyNow: () => void;
}

export const BuyerProductDetail: React.FC<BuyerProductDetailProps> = ({
  product,
  quantity,
  setQuantity,
  onBack,
  onBuyNow,
}) => {
  const { t } = useLanguage();

  if (!product) return null;

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-600 text-white';
      case 'B':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-rose-500 text-white';
    }
  };

  const totalPrice = product.rate * quantity;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="bg-stone-50 min-h-screen pb-28 relative flex flex-col"
    >
      {/* Product Hero Image Header */}
      <div className="relative w-full h-72 sm:h-80 bg-neutral-900 overflow-hidden">
        <img
          src={product.productImg}
          alt={product.productName}
          className="w-full h-full object-cover select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full bg-white/90 backdrop-blur-md text-neutral-800 hover:bg-white shadow-md transition-transform active:scale-95 cursor-pointer"
            title="Back to Market"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide shadow-lg uppercase ${getGradeBadge(
              product.grade
            )}`}
          >
            {t('grade', 'Grade')} {product.grade}
          </span>
        </div>

        {/* Floating Quick Price Tag */}
        <div className="absolute bottom-6 left-4 right-4 flex items-center justify-between text-white">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold">
              {t('directFromFarmer', 'Direct Farm Price')}
            </span>
            <div className="text-3xl font-black">
              ₹{product.rate}{' '}
              <span className="text-sm font-medium text-white/80">/ {t('kgUnit', 'kg')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-amber-400 text-sm font-bold border border-white/10">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{product.rating}</span>
            <span className="text-xs text-white/70 font-normal">(48+ {t('reviews', 'reviews')})</span>
          </div>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-5 relative z-10 p-5 sm:p-7 shadow-xl space-y-6">
        {/* Title and Farmer Origin */}
        <div className="border-b border-neutral-100 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 leading-tight">
            {product.productName}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2.5 text-sm text-neutral-600">
            <div className="flex items-center gap-1 font-semibold text-emerald-700">
              <User className="w-4 h-4" />
              <span>{product.farmerName}</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span>{product.location}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('verifiedFarmer', 'Verified Farm')}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
            {t('productDescription', 'Produce Overview')}
          </h2>
          <p className="text-neutral-700 text-sm sm:text-base leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* AI Quality Certification Badge */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">
              {t('aiGradedProduce', 'AI Quality Certified')}
            </h4>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              Verified by Uzhavan AI Quality Vision model for freshness, color uniformity, and zero pesticide residue.
            </p>
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              {t('selectQuantity', 'Select Quantity')}
            </span>
            <span className="text-xs text-neutral-400">
              {t('available', 'Available')}: {product.quantityAvailable || '200+ kg'}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-full border border-neutral-200 shadow-xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 5))}
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-lg font-black text-neutral-700 transition active:scale-90 cursor-pointer"
              title="-5 kg"
            >
              -
            </button>
            <div className="min-w-[54px] text-center font-black text-neutral-900 text-base sm:text-lg">
              {quantity} <span className="text-xs font-medium text-neutral-500">{t('kgUnit', 'kg')}</span>
            </div>
            <button
              onClick={() => setQuantity((q) => q + 5)}
              className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-lg font-black text-white transition active:scale-90 cursor-pointer shadow-xs"
              title="+5 kg"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 p-4 sm:px-8 z-30 flex items-center justify-between shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
        <div>
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
            {t('totalPayable', 'Total Amount')}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900">
            ₹{totalPrice.toLocaleString()}
            <span className="text-xs font-normal text-neutral-500 ml-1.5">
              ({quantity} kg × ₹{product.rate})
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={onBuyNow}
          className="px-8 py-3.5 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-black text-base sm:text-lg tracking-wide shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{t('buyNow', 'BUY NOW')}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
