import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Truck,
  Check,
  Phone,
  ShieldCheck,
  Wallet,
  Banknote,
  MapPin,
  Clock,
  Navigation,
} from 'lucide-react';
import { BuyerFeedProduct, DriverData } from '../../types/buyer';
import { BUYER_DRIVER_DATA } from '../../constants/buyerMockData';
import { useLanguage } from '../../context/LanguageContext';
import { INDIA_POST_DISTANCE_THRESHOLD_KM } from '../../constants/deliveryConfig';
import {
  calculateDistanceKm,
  isEligibleForIndiaPost,
  calculateIndiaPostCharge,
  getEstimatedDeliveryTime,
  resolveCoordinates,
} from '../../services/deliveryService';
import { authService } from '../../services/authService';

export interface CheckoutOrderDetails {
  deliveryMethod: 'INDIA_POST' | 'FARMER_DIRECT' | 'SELF_PICKUP';
  transportOption: string;
  deliveryCharge: number;
  deliveryDistanceKm: number;
  farmerLocation: { latitude: number; longitude: number };
  buyerLocation: { latitude: number; longitude: number };
  deliveryAddress: string;
  totalAmount: number;
  deliveryStatus: string;
}

interface BuyerCheckoutProps {
  product: BuyerFeedProduct;
  quantity: number;
  onBack: () => void;
  onProceedToPayment: (details: CheckoutOrderDetails) => void;
  onConfirmCod: (details: CheckoutOrderDetails) => void;
}

export const BuyerCheckout: React.FC<BuyerCheckoutProps> = ({
  product,
  quantity,
  onBack,
  onProceedToPayment,
  onConfirmCod,
}) => {
  const { t, language } = useLanguage();
  const session = authService.getCurrentSession();

  // Delivery Address with quick location picker
  const [buyerAddress, setBuyerAddress] = useState<string>(() => {
    return session?.location || 'Gandhipuram, Coimbatore, Tamil Nadu';
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Farmer Coordinates
  const farmerCoords = useMemo(() => {
    return resolveCoordinates(
      product.coords || product.location || 'Pollachi, Tamil Nadu',
      { latitude: 10.6609, longitude: 77.0047 }
    );
  }, [product]);

  // Buyer Coordinates
  const buyerCoords = useMemo(() => {
    return resolveCoordinates(buyerAddress, { latitude: 11.0168, longitude: 76.9558 });
  }, [buyerAddress]);

  // Haversine Distance Calculation (Section 3)
  const distanceKm = useMemo(() => {
    return calculateDistanceKm(farmerCoords, buyerCoords);
  }, [farmerCoords, buyerCoords]);

  // Requirement 1: India Post eligible ONLY when distance > 50 KM
  const showIndiaPost = useMemo(() => {
    return isEligibleForIndiaPost(distanceKm);
  }, [distanceKm]);

  // Dynamic India Post delivery fee calculation (Section 2)
  const indiaPostCharge = useMemo(() => {
    return calculateIndiaPostCharge(distanceKm, quantity);
  }, [distanceKm, quantity]);

  // Transport selection
  const [transport, setTransport] = useState<'farmer' | 'own' | 'india_post'>('farmer');

  // Reset to 'farmer' if distance drops <= 50 KM and 'india_post' was active
  useEffect(() => {
    if (!showIndiaPost && transport === 'india_post') {
      setTransport('farmer');
    }
  }, [showIndiaPost, transport]);

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const driver: DriverData = { ...BUYER_DRIVER_DATA, name: product.farmerName };

  const isTamil = language === 'ta';
  const estimatedDeliveryTime = useMemo(() => {
    return getEstimatedDeliveryTime(
      distanceKm,
      transport === 'india_post' ? 'INDIA_POST' : 'FARMER_DIRECT',
      isTamil
    );
  }, [distanceKm, transport, isTamil]);

  const subtotal = product.rate * quantity;
  const deliveryFee =
    transport === 'india_post' ? indiaPostCharge : transport === 'farmer' ? 120 : 0;
  const grandTotal = subtotal + deliveryFee;

  const buildDetails = (): CheckoutOrderDetails => {
    const deliveryMethod =
      transport === 'india_post'
        ? 'INDIA_POST'
        : transport === 'own'
        ? 'SELF_PICKUP'
        : 'FARMER_DIRECT';

    const transportOption =
      transport === 'india_post'
        ? 'India Post Delivery (Speed Post)'
        : transport === 'own'
        ? 'Self Pickup (Own Transport)'
        : 'Farmer Direct Delivery (Tata Ace)';

    return {
      deliveryMethod,
      transportOption,
      deliveryCharge: deliveryFee,
      deliveryDistanceKm: distanceKm,
      farmerLocation: farmerCoords,
      buyerLocation: buyerCoords,
      deliveryAddress: buyerAddress,
      totalAmount: grandTotal,
      deliveryStatus: 'Pending',
    };
  };

  const handleConfirmOrder = () => {
    const details = buildDetails();
    if (paymentMethod === 'online') {
      onProceedToPayment(details);
    } else {
      onConfirmCod(details);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="bg-stone-50 min-h-screen pb-28 flex flex-col"
    >
      {/* Sticky Header */}
      <header className="bg-white sticky top-0 z-20 px-4 py-3.5 border-b border-neutral-200/80 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-neutral-700 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-neutral-900 tracking-tight">
          {t('checkout', 'Checkout & Order')}
        </h1>
        <div className="w-8" />
      </header>

      {/* Main Content Area */}
      <div className="max-w-xl mx-auto w-full p-4 sm:p-6 space-y-5 flex-1">
        {/* Order Item Summary Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200/80">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-3">
            {t('orderSummary', 'Produce Summary')}
          </span>

          <div className="flex items-center gap-4">
            <img
              src={product.productImg}
              alt={product.productName}
              className="w-20 h-20 rounded-xl object-cover border border-neutral-100"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-neutral-900 text-base sm:text-lg truncate">
                {product.productName}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {product.farmerName} • {product.location}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('grade', 'Grade')} {product.grade}
                </span>
                <span className="text-xs text-neutral-600 font-bold">
                  {quantity} kg × ₹{product.rate}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-neutral-900 block">
                ₹{subtotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Route & Distance Calculation (Section 3) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {t('deliveryDistance', 'Delivery Route & Distance')}
            </span>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                distanceKm > INDIA_POST_DISTANCE_THRESHOLD_KM
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {distanceKm} KM
            </span>
          </div>

          <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200/70">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase">
                  {t('location', 'Buyer Delivery Destination')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  {showLocationPicker ? 'Done' : 'Change Location'}
                </button>
              </div>
              <p className="font-bold text-neutral-900 text-sm mt-0.5 truncate">
                {buyerAddress}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-neutral-400 shrink-0" />
                <span>
                  From: {product.location || 'Pollachi Farm'} ({distanceKm} km direct route)
                </span>
              </p>
            </div>
          </div>

          {/* Quick Destination Selectors to verify 50 KM threshold rule */}
          {showLocationPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-2 border-t border-neutral-100 space-y-2"
            >
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Select Destination to test delivery threshold (50 KM):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Coimbatore', dist: '< 50 km (Local)', text: 'RS Puram, Coimbatore, Tamil Nadu' },
                  { label: 'Tiruppur', dist: '62 km (> 50 km)', text: 'Avinashi Road, Tiruppur, Tamil Nadu' },
                  { label: 'Erode', dist: '108 km (> 50 km)', text: 'Brough Road, Erode, Tamil Nadu' },
                  { label: 'Salem', dist: '167 km (> 50 km)', text: 'Hasthampatti, Salem, Tamil Nadu' },
                  { label: 'Madurai', dist: '147 km (> 50 km)', text: 'Simmakkal, Madurai, Tamil Nadu' },
                  { label: 'Chennai', dist: '446 km (> 50 km)', text: 'T. Nagar, Chennai, Tamil Nadu' },
                ].map((dest) => (
                  <button
                    key={dest.label}
                    type="button"
                    onClick={() => {
                      setBuyerAddress(dest.text);
                      setShowLocationPicker(false);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all text-xs ${
                      buyerAddress.includes(dest.label)
                        ? 'border-emerald-500 bg-emerald-50/70 font-black text-emerald-800'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    <div className="font-bold">{dest.label}</div>
                    <div className="text-[10px] text-neutral-500">{dest.dist}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Transport Options (Section 1 & 2) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200/80">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-3">
            {t('transportOptions', 'Delivery & Transport')}
          </span>

          <div className="space-y-3">
            {/* Delivered by Farmer Option */}
            <div
              onClick={() => setTransport('farmer')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                transport === 'farmer'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border ${
                    transport === 'farmer'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-neutral-300'
                  }`}
                >
                  {transport === 'farmer' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-neutral-900">
                      {t('deliveredByFarmer', 'Delivered by Farmer')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Direct delivery to your address via Tata Ace logistics
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-md">
                +₹120
              </span>
            </div>

            {/* India Post Delivery — Strictly displayed when distance > 50 KM (Section 1 & 2) */}
            {showIndiaPost && (
              <div
                onClick={() => setTransport('india_post')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                  transport === 'india_post'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border ${
                      transport === 'india_post'
                        ? 'border-amber-600 bg-amber-600 text-white'
                        : 'border-neutral-300'
                    }`}
                  >
                    {transport === 'india_post' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">🇮🇳</span>
                      <span className="font-bold text-sm text-neutral-900">
                        {t('indiaPostDelivery', 'India Post Delivery')}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                        {distanceKm} KM
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 font-medium">
                      {t('indiaPostSubtitle', 'Suitable for deliveries above 50 KM')}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        {t('estimatedDeliveryTimeLabel', 'Estimated Delivery')}:{' '}
                        <strong className="text-neutral-800">{estimatedDeliveryTime}</strong>
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-800 bg-amber-100/90 px-2 py-1 rounded-md shrink-0">
                  +₹{indiaPostCharge}
                </span>
              </div>
            )}

            {/* Own Transport Option */}
            <div
              onClick={() => setTransport('own')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                transport === 'own'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border ${
                    transport === 'own'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-neutral-300'
                  }`}
                >
                  {transport === 'own' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-neutral-900">
                    {t('ownTransport', 'Self Pickup (Own Transport)')}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    Collect directly from farmer's farm gate / cold storage
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-neutral-500">{t('free', 'FREE')}</span>
            </div>
          </div>

          {/* Farmer Driver Details Card */}
          {transport === 'farmer' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-neutral-100"
            >
              <span className="text-xs font-bold text-neutral-500 block mb-2">
                {t('assignedLogisticsPartner', 'Assigned Logistics Partner')}:
              </span>
              <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80">
                <img
                  src={driver.pictureUrl}
                  alt={driver.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-neutral-900">{driver.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-neutral-500">
                    {driver.vehicleModel} • {driver.vehicleNumber}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('call', 'Call')}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* India Post Speed Post Details Card */}
          {transport === 'india_post' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-neutral-100"
            >
              <span className="text-xs font-bold text-neutral-500 block mb-2">
                {t('assignedLogisticsPartner', 'Assigned Logistics Partner')}:
              </span>
              <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80">
                <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shrink-0">
                  📮
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-neutral-900">
                      India Post (Speed Post Parcel)
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-neutral-500">
                    National Postal Network • Tracked Route • {distanceKm} KM
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg shrink-0">
                  Speed Post
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200/80">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-3">
            {t('paymentMethod', 'Payment Method')}
          </span>

          <div className="space-y-3">
            {/* Online Payment (UPI) */}
            <div
              onClick={() => setPaymentMethod('online')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                paymentMethod === 'online'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    paymentMethod === 'online'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-neutral-300'
                  }`}
                >
                  {paymentMethod === 'online' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-sm text-neutral-900">
                      {t('onlinePayment', 'Online Payment (UPI)')}
                    </span>
                    <p className="text-xs text-neutral-400">Google Pay, PhonePe, Paytm</p>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {t('fastAndSecure', 'Fast & Secure')}
              </span>
            </div>

            {/* Cash on Delivery */}
            <div
              onClick={() => setPaymentMethod('cod')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                paymentMethod === 'cod'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-neutral-300'
                  }`}
                >
                  {paymentMethod === 'cod' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-neutral-600" />
                  <div>
                    <span className="font-bold text-sm text-neutral-900">
                      {t('cod', 'Cash on Delivery (COD)')}
                    </span>
                    <p className="text-xs text-neutral-400">{t('codSubtitle', 'Pay when goods reach your doorstep')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Breakdown */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200/80 space-y-2 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>{t('produceSubtotal', 'Produce Subtotal')}</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>
              {transport === 'india_post'
                ? `${t('indiaPostDelivery', 'India Post Delivery')} (${distanceKm} km)`
                : t('logisticsFee', 'Logistics Fee')}
            </span>
            <span>{deliveryFee > 0 ? `₹${deliveryFee}` : t('free', 'FREE')}</span>
          </div>
          <div className="border-t border-neutral-100 pt-2 flex justify-between font-black text-neutral-900 text-base">
            <span>{t('totalPayable', 'Total Amount')}</span>
            <span className="text-emerald-700">₹{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 p-4 sm:px-8 z-30 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              {t('grandTotal', 'Grand Total')}
            </span>
            <span className="text-2xl font-black text-neutral-900">
              ₹{grandTotal.toLocaleString()}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleConfirmOrder}
            className="flex-1 max-w-[280px] py-4 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-black text-base sm:text-lg tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center cursor-pointer transition-colors"
          >
            {paymentMethod === 'online' ? t('proceedToPayment', 'PROCEED TO PAY') : t('confirmOrder', 'CONFIRM ORDER')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
