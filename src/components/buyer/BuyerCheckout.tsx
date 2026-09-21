import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Truck, Check, Phone, ShieldCheck, Wallet, Banknote } from 'lucide-react';
import { BuyerFeedProduct, DriverData } from '../../types/buyer';
import { BUYER_DRIVER_DATA } from '../../constants/buyerMockData';
import { useLanguage } from '../../context/LanguageContext';

interface BuyerCheckoutProps {
  product: BuyerFeedProduct;
  quantity: number;
  onBack: () => void;
  onProceedToPayment: () => void;
  onConfirmCod: () => void;
}

export const BuyerCheckout: React.FC<BuyerCheckoutProps> = ({
  product,
  quantity,
  onBack,
  onProceedToPayment,
  onConfirmCod,
}) => {
  const { t } = useLanguage();
  const [transport, setTransport] = useState<'farmer' | 'own'>('farmer');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const driver: DriverData = { ...BUYER_DRIVER_DATA, name: product.farmerName };

  const subtotal = product.rate * quantity;
  const deliveryFee = transport === 'farmer' ? 120 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleConfirmOrder = () => {
    if (paymentMethod === 'online') {
      onProceedToPayment();
    } else {
      onConfirmCod();
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
                  Grade {product.grade}
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

        {/* Transport Options */}
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
              <span className="text-xs font-bold text-neutral-500">FREE</span>
            </div>
          </div>

          {/* Farmer Driver Details Card matching GitHub Repo */}
          {transport === 'farmer' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-neutral-100"
            >
              <span className="text-xs font-bold text-neutral-500 block mb-2">
                Assigned Logistics Partner:
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
                  <span>Call</span>
                </div>
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
                Fast & Secure
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
                    <p className="text-xs text-neutral-400">Pay when goods reach your doorstep</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Breakdown */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200/80 space-y-2 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>Produce Subtotal</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>Logistics Fee</span>
            <span>{deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}</span>
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
              Grand Total
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
