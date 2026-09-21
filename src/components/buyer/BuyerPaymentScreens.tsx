import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, ShieldCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { BuyerFeedProduct } from '../../types/buyer';
import { useLanguage } from '../../context/LanguageContext';

interface PaymentPartnerScreenProps {
  onBack: () => void;
  onSelectPartner: (partner: 'GPay' | 'PhonePe' | 'Paytm') => void;
  totalAmount: number;
}

export const BuyerPaymentPartnersScreen: React.FC<PaymentPartnerScreenProps> = ({
  onBack,
  onSelectPartner,
  totalAmount,
}) => {
  const { t } = useLanguage();

  const partners = [
    {
      id: 'GPay' as const,
      name: 'Google Pay',
      desc: 'Pay instantly via UPI',
      logo: 'https://cdn.freelogovectors.net/wp-content/uploads/2023/09/google-pay-logo-freelogovectors.net_.png',
      fallbackColor: 'bg-white text-blue-600 border border-neutral-200',
    },
    {
      id: 'PhonePe' as const,
      name: 'PhonePe',
      desc: 'UPI / RuPay Credit Cards',
      logo: 'https://static.digit.in/default/tr:w-1200/phonepe-to-launch-app-store-in-india-1280-ee228e45ee.png',
      fallbackColor: 'bg-purple-600 text-white',
    },
    {
      id: 'Paytm' as const,
      name: 'Paytm UPI',
      desc: 'Paytm Wallet & Direct Bank',
      logo: 'https://tse1.mm.bing.net/th/id/OIP.ivx34rvqm9h9ac5yUd3aUgHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
      fallbackColor: 'bg-sky-500 text-white',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="bg-stone-50 min-h-screen pb-20 flex flex-col"
    >
      <header className="bg-white sticky top-0 z-20 px-4 py-3.5 border-b border-neutral-200/80 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-neutral-700 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-neutral-900 tracking-tight">
          {t('choosePaymentMethod', 'Choose Payment App')}
        </h1>
        <div className="w-8" />
      </header>

      <div className="max-w-md mx-auto w-full p-4 sm:p-6 space-y-4 flex-1">
        {/* Payable Header Card */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-6 rounded-3xl shadow-lg text-center space-y-1">
          <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold">
            Total Payable to Farmer
          </span>
          <div className="text-3xl sm:text-4xl font-black tracking-tight">
            ₹{totalAmount.toLocaleString()}.00
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-emerald-200/90 pt-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>100% Encrypted UPI Direct Settlement</span>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-3">
            Select Your Preferred UPI Gateway
          </span>

          <div className="space-y-3">
            {partners.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectPartner(p.id)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-12 rounded-xl bg-neutral-50 flex items-center justify-center p-1.5 border border-neutral-100 overflow-hidden">
                    <img
                      src={p.logo}
                      alt={p.name}
                      className="max-h-8 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900">{p.name}</h3>
                    <p className="text-xs text-neutral-400">{p.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-400" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Simulated Payment Screen ---
interface SimulatedPaymentScreenProps {
  product: BuyerFeedProduct;
  quantity: number;
  totalAmount: number;
  partner: 'GPay' | 'PhonePe' | 'Paytm';
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const BuyerSimulatedPaymentScreen: React.FC<SimulatedPaymentScreenProps> = ({
  product,
  quantity,
  totalAmount,
  partner,
  onPaymentSuccess,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'paying' | 'processing' | 'success'>('paying');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [txnId, setTxnId] = useState('');

  const partnerInfo = {
    GPay: {
      name: 'Google Pay',
      logo: 'https://cdn.freelogovectors.net/wp-content/uploads/2023/09/google-pay-logo-freelogovectors.net_.png',
      brandBg: 'bg-blue-600',
    },
    PhonePe: {
      name: 'PhonePe',
      logo: 'https://static.digit.in/default/tr:w-1200/phonepe-to-launch-app-store-in-india-1280-ee228e45ee.png',
      brandBg: 'bg-purple-600',
    },
    Paytm: {
      name: 'Paytm UPI',
      logo: 'https://tse1.mm.bing.net/th/id/OIP.ivx34rvqm9h9ac5yUd3aUgHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
      brandBg: 'bg-sky-600',
    },
  }[partner];

  const handlePay = () => {
    setStatus('processing');
    const generatedTxn = `UPI${Math.floor(100000000 + Math.random() * 900000000)}`;
    setTxnId(generatedTxn);

    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setShowSmsModal(true);
      }, 1200);
    }, 2200);
  };

  return (
    <div className="bg-white min-h-screen p-5 flex flex-col justify-between max-w-md mx-auto relative">
      {/* Top Bar with partner logo */}
      <div className="flex items-center justify-between pt-2">
        {status === 'paying' ? (
          <button
            onClick={onCancel}
            className="text-xs font-bold text-neutral-400 hover:text-neutral-700 uppercase cursor-pointer"
          >
            Cancel
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <img
            src={partnerInfo.logo}
            alt={partnerInfo.name}
            className="h-7 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-bold text-neutral-800 text-sm">{partnerInfo.name}</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Main Payment Animation Body */}
      <div className="my-auto py-8 text-center flex flex-col items-center">
        {status === 'paying' && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Pay Direct to Farmer
              </p>
              <h2 className="text-xl font-bold text-neutral-800 mt-1">
                {product.farmerName}
              </h2>
              <p className="text-xs text-neutral-400">
                Uzhavan Verified Producer ({product.location})
              </p>
            </div>

            <div className="py-3 bg-neutral-50 rounded-2xl border border-neutral-100">
              <span className="text-3xl sm:text-4xl font-black text-neutral-900">
                ₹{totalAmount.toLocaleString()}.00
              </span>
              <p className="text-xs text-neutral-500 mt-1">
                {product.productName} ({quantity} kg)
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handlePay}
              className="w-full py-4 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-black text-lg tracking-wide shadow-lg shadow-emerald-500/20 cursor-pointer transition-colors"
            >
              {t('payNow', 'PAY NOW')}
            </motion.button>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-lg font-bold text-neutral-900">
              {t('processingPayment', 'Processing UPI Transfer...')}
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs">
              Please do not press back or close the window while we contact your bank.
            </p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14 }}
              className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg"
            >
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </motion.div>

            <div>
              <h3 className="text-2xl font-black text-neutral-900">
                {t('paymentSuccessful', 'Payment Successful!')}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Transaction Ref: <span className="font-mono font-bold text-neutral-800">{txnId}</span>
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-900 text-sm font-semibold max-w-xs">
              ₹{totalAmount.toLocaleString()} credited to {product.farmerName}'s bank account.
            </div>
          </motion.div>
        )}
      </div>

      {/* Simulated SMS Notification Popup matching GitHub Repo */}
      <AnimatePresence>
        {showSmsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                  Simulated Farmer SMS Notification
                </span>
                <h4 className="text-base font-bold text-neutral-900 mt-2">
                  Order Dispatched Instantly
                </h4>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-700 font-mono text-left leading-relaxed border border-neutral-200/80">
                "Dear {product.farmerName}, Payment credited successfully! TXN ID: {txnId}. Amount: ₹
                {totalAmount} for {product.productName}. Please prepare dispatch."
              </div>

              <button
                onClick={onPaymentSuccess}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-md transition cursor-pointer"
              >
                Track Live Delivery Map →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center text-xs text-neutral-400 pb-2">
        Protected by RBI-approved UPI 2.0 Security Protocols
      </div>
    </div>
  );
};
