import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Phone, User, MapPin, KeyRound, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  role: 'farmer' | 'buyer';
  mode: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ role, mode, onClose, onSuccess }) => {
  const isFarmer = role === 'farmer';
  const isLogin = mode === 'login';

  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [otp, setOtp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'form') {
      setStep('otp');
    } else if (step === 'otp') {
      setStep('success');
    }
  };

  return (
    <AnimatePresence>
      <div
        id="auth-modal-overlay"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          id="auth-modal-dialog"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden relative border border-neutral-100"
        >
          {/* Close button */}
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="mb-5">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
              {isFarmer ? '🌾 Farmer Portal' : '🛒 Buyer Portal'}
            </span>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              {step === 'success'
                ? 'Welcome aboard!'
                : step === 'otp'
                ? 'Verify Mobile Number'
                : `${isLogin ? 'Login as' : 'Register as'} ${isFarmer ? 'Farmer' : 'Buyer'}`}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {step === 'otp'
                ? `Enter the 4-digit OTP sent to +91 ${phoneNumber || '9876543210'}`
                : isLogin
                ? 'Enter your registered mobile number to continue'
                : `Create your ${isFarmer ? 'farmer' : 'buyer'} account with Uzhavan Bazzar`}
            </p>
          </div>

          {step === 'success' ? (
            <div className="py-6 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h3 className="text-lg font-bold text-neutral-800">
                {isLogin ? 'Signed in successfully!' : 'Registration successful!'}
              </h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                Welcome to Uzhavan Bazzar. Connecting direct agricultural produce with buyers.
              </p>
              <button
                id="auth-finish-btn"
                onClick={() => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    onClose();
                  }
                }}
                className="mt-6 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 'form' && (
                <>
                  {!isLogin && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={isFarmer ? 'e.g. Murugan S' : 'e.g. Anand Kumar'}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                          {isFarmer ? 'Village / District' : 'Delivery City / Area'}
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder={isFarmer ? 'e.g. Madurai / Melur' : 'e.g. Chennai / Anna Nagar'}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-neutral-500 font-semibold text-sm">
                        <Phone className="w-4 h-4 text-neutral-400 mr-1" />
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full pl-20 pr-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium tracking-wide"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 'otp' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    One-Time Password (OTP)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center text-lg tracking-[0.4em] font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-neutral-500">
                    <span>Didn't receive OTP?</span>
                    <button type="button" className="text-emerald-600 font-bold hover:underline">
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>{step === 'otp' ? 'VERIFY & PROCEED' : isLogin ? 'GET OTP' : 'REGISTER NOW'}</span>
                <ArrowRight className="w-5 h-5 text-black" />
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
