import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Search,
  Star,
  Truck,
  ShoppingBag,
  User as UserIcon,
  Globe,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  BuyerFeedProduct,
  BuyerViewState,
  BuyerUserData,
  MarketItem,
  UserOrder,
} from '../../types/buyer';
import {
  BUYER_MARKET_DATA,
  BUYER_FEED_PRODUCTS,
  BUYER_USER_ORDERS,
  BUYER_TRANSACTIONS,
  BUYER_DRIVER_DATA,
} from '../../constants/buyerMockData';
import { BuyerProductDetail } from './BuyerProductDetail';
import { BuyerCheckout } from './BuyerCheckout';
import { BuyerPaymentPartnersScreen, BuyerSimulatedPaymentScreen } from './BuyerPaymentScreens';
import { BuyerLiveTracker } from './BuyerLiveTracker';
import { BuyerProfileModal } from './BuyerProfileModal';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../types';
import { productService, ProductDocument } from '../../services/productService';

interface BuyerDashboardProps {
  onBackToRole: () => void;
  onSwitchToFarmer: () => void;
  buyerData?: BuyerUserData | null;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  onBackToRole,
  onSwitchToFarmer,
  buyerData = null,
}) => {
  const { t, language, setLanguage } = useLanguage();

  // Navigation & Sub-views state
  const [view, setView] = useState<BuyerViewState>('dashboard');
  const [activeTab, setActiveTab] = useState<'market' | 'delivery' | 'account'>('market');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Data & Order state
  const [products, setProducts] = useState<BuyerFeedProduct[]>(BUYER_FEED_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<BuyerFeedProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [paymentPartner, setPaymentPartner] = useState<'GPay' | 'PhonePe' | 'Paytm'>('GPay');
  const [orders, setOrders] = useState<UserOrder[]>(BUYER_USER_ORDERS);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');

  // Attempt to load any live farmer products posted in Firestore and merge with catalog
  useEffect(() => {
    let isMounted = true;
    const loadFirestoreProducts = async () => {
      try {
        const firestoreList = await productService.getActiveProducts();
        if (firestoreList && firestoreList.length > 0 && isMounted) {
          const formatted: BuyerFeedProduct[] = firestoreList.map((item: ProductDocument, idx) => ({
            id: item.id || `live-${idx}`,
            productName: item.productName || item.aiDetection?.detectedName || 'Farm Produce',
            grade: (item.grade || item.aiGrading?.grade || 'A').toUpperCase(),
            productImg:
              item.images && item.images.length > 0
                ? item.images[0]
                : BUYER_FEED_PRODUCTS[idx % BUYER_FEED_PRODUCTS.length].productImg,
            farmerName: item.farmerName || 'Registered Farmer',
            location: item.location || 'Tamil Nadu',
            rate: item.mandiPrice || item.recommendedPriceMin || 35,
            rating: 4.8,
            description: `Freshly graded Grade-${item.grade || 'A'} produce posted live by ${item.farmerName}. Quality verified at ${item.qualityScore || 92}%.`,
            coords: { lat: 11.0168, lng: 76.9558 },
            quantityAvailable: `${item.quantityKg || 100} kg`,
          }));

          // Put live products first, followed by default catalog
          setProducts([...formatted, ...BUYER_FEED_PRODUCTS]);
        }
      } catch (err) {
        // Fallback gracefully to catalog
      }
    };

    loadFirestoreProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products by search term and grade
  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || item.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  // Handle product click
  const handleSelectProduct = (product: BuyerFeedProduct) => {
    setSelectedProduct(product);
    setOrderQuantity(10);
    setView('productDetail');
  };

  // Handle checkout start
  const handleProceedToCheckout = () => {
    setView('checkout');
  };

  // Handle online payment selection
  const handleProceedToPayment = () => {
    setView('paymentPartners');
  };

  // Handle cash on delivery confirm
  const handleConfirmCod = () => {
    if (selectedProduct) {
      const newOrder: UserOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        itemKey: 'freshProduce',
        productName: selectedProduct.productName,
        productImg: selectedProduct.productImg,
        date: new Date().toISOString().split('T')[0],
        amount: `₹${(selectedProduct.rate * orderQuantity + 120).toLocaleString()}`,
        statusKey: 'ongoing',
      };
      setOrders([newOrder, ...orders]);
    }
    setView('liveMapTracker');
  };

  // Handle payment partner selected
  const handleSelectPartner = (partner: 'GPay' | 'PhonePe' | 'Paytm') => {
    setPaymentPartner(partner);
    setView('simulatedPayment');
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    if (selectedProduct) {
      const newOrder: UserOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        itemKey: 'freshProduce',
        productName: selectedProduct.productName,
        productImg: selectedProduct.productImg,
        date: new Date().toISOString().split('T')[0],
        amount: `₹${(selectedProduct.rate * orderQuantity + 120).toLocaleString()}`,
        statusKey: 'ongoing',
      };
      setOrders([newOrder, ...orders]);
    }
    setView('liveMapTracker');
  };

  // Language options
  const languageOptions: { code: LanguageCode; name: string }[] = [
    { code: 'ta', name: 'தமிழ்' },
    { code: 'en', name: 'English' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'hi', name: 'हिंदी' },
  ];

  // Helper for trend icon
  const renderTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-600 inline" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-600 inline" />;
    return <Minus className="w-3.5 h-3.5 text-neutral-400 inline" />;
  };

  // Render Sub-Views if not in dashboard
  if (view === 'productDetail' && selectedProduct) {
    return (
      <BuyerProductDetail
        product={selectedProduct}
        quantity={orderQuantity}
        setQuantity={setOrderQuantity}
        onBack={() => setView('dashboard')}
        onBuyNow={handleProceedToCheckout}
      />
    );
  }

  if (view === 'checkout' && selectedProduct) {
    return (
      <BuyerCheckout
        product={selectedProduct}
        quantity={orderQuantity}
        onBack={() => setView('productDetail')}
        onProceedToPayment={handleProceedToPayment}
        onConfirmCod={handleConfirmCod}
      />
    );
  }

  if (view === 'paymentPartners' && selectedProduct) {
    return (
      <BuyerPaymentPartnersScreen
        totalAmount={selectedProduct.rate * orderQuantity + 120}
        onBack={() => setView('checkout')}
        onSelectPartner={handleSelectPartner}
      />
    );
  }

  if (view === 'simulatedPayment' && selectedProduct) {
    return (
      <BuyerSimulatedPaymentScreen
        product={selectedProduct}
        quantity={orderQuantity}
        totalAmount={selectedProduct.rate * orderQuantity + 120}
        partner={paymentPartner}
        onPaymentSuccess={handlePaymentSuccess}
        onCancel={() => setView('paymentPartners')}
      />
    );
  }

  if (view === 'liveMapTracker') {
    return (
      <BuyerLiveTracker
        product={selectedProduct || products[0]}
        onBack={() => {
          setView('dashboard');
          setActiveTab('delivery');
        }}
      />
    );
  }

  // --- Main Dashboard Views: Market, Delivery, Account ---
  return (
    <div className="bg-stone-100 min-h-screen pb-24 flex flex-col font-sans">
      {/* Sticky Header matching GitHub repo */}
      <header className="bg-white sticky top-0 z-20 px-4 py-3 border-b border-neutral-200/80 shadow-xs flex items-center justify-between">
        {/* Left: Location indicator */}
        <div className="flex items-center gap-1.5 text-neutral-800">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Deliver To
            </span>
            <span className="font-bold text-xs sm:text-sm text-neutral-800 line-clamp-1">
              {buyerData?.location || 'Coimbatore, Tamil Nadu'}
            </span>
          </div>
        </div>

        {/* Right: Language switch & Profile */}
        <div className="flex items-center gap-2 relative">
          {/* Language Switcher */}
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition cursor-pointer"
            title="Change Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Language Dropdown Menu */}
          {showLangDropdown && (
            <div className="absolute right-12 top-10 w-36 bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-30">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold transition flex items-center justify-between ${
                    language === lang.code
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span>{lang.name}</span>
                  {language === lang.code && <span className="text-emerald-600">✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Profile Avatar Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20 hover:scale-105 transition cursor-pointer"
            title="Buyer Profile"
          >
            {buyerData?.fullName ? buyerData.fullName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5">
        {/* ==================== TAB 1: MARKET ==================== */}
        {activeTab === 'market' && (
          <div className="space-y-5">
            {/* Search Bar matching GitHub Repo */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder', 'Search for fruits, vegetables, farm produce...')}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200/90 rounded-2xl shadow-xs text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-neutral-400"
              />
              <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Today's Market Value Carousel matching GitHub Repo */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  {t('marketValue', "Today's Mandi Market Value")}
                </h2>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Live Mandi API
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {BUYER_MARKET_DATA.map((item, idx) => (
                  <div
                    key={idx}
                    className="shrink-0 w-36 sm:w-40 bg-white rounded-2xl p-3.5 shadow-xs border border-neutral-200/80 space-y-1 hover:border-emerald-300 transition"
                  >
                    <p className="font-bold text-neutral-800 text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-neutral-900">{item.price}</span>
                      {renderTrendIcon(item.trend)}
                    </div>
                    <p className="text-[11px] text-neutral-400 font-medium">
                      {t('predictedValue', 'Predicted')}: {item.predicted}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Filter Pill Buttons matching GitHub Repo */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['All', 'A', 'B', 'C'].map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedGrade === grade
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {grade === 'All' ? t('allGrades', 'All Grades') : `Grade ${grade}`}
                </button>
              ))}
            </div>

            {/* Produce Grid / Sales matching GitHub Repo */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  {t('sales', 'Direct Fresh Harvest')}
                </h2>
                <span className="text-xs text-neutral-500 font-semibold">
                  {filteredProducts.length} items available
                </span>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectProduct(product)}
                      className="bg-white rounded-2xl shadow-xs border border-neutral-200/80 overflow-hidden cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      {/* Product Image + Grade & Rating badges */}
                      <div className="relative w-full h-32 sm:h-36 bg-neutral-100 overflow-hidden">
                        <img
                          src={product.productImg}
                          alt={product.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                        />
                        {/* Grade Badge */}
                        <div
                          className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs text-white uppercase ${
                            product.grade === 'A'
                              ? 'bg-emerald-600'
                              : product.grade === 'B'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        >
                          Grade {product.grade}
                        </div>

                        {/* Rating Badge */}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-bold text-neutral-800">
                            {product.rating}
                          </span>
                        </div>
                      </div>

                      {/* Info Body */}
                      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-neutral-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                            {product.productName}
                          </h3>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {product.farmerName} • {product.location.split(',')[0]}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-baseline justify-between">
                          <span className="text-sm sm:text-base font-black text-emerald-700">
                            ₹{product.rate}{' '}
                            <span className="text-[10px] font-normal text-neutral-500">/ kg</span>
                          </span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">
                            Buy Now →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-10 text-center border border-neutral-200">
                  <p className="text-sm font-semibold text-neutral-500">
                    No farm produce matches "{searchTerm}" with Grade {selectedGrade}.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedGrade('All');
                    }}
                    className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: DELIVERY (Ongoing Orders) ==================== */}
        {activeTab === 'delivery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                {t('ongoingOrders', 'Live Orders & Delivery')}
              </h2>
            </div>

            {orders.filter((o) => o.statusKey === 'ongoing').length > 0 ? (
              orders
                .filter((o) => o.statusKey === 'ongoing')
                .map((order) => (
                  <div
                    key={order.id}
                    onClick={() => {
                      const matched = products.find(
                        (p) => p.productName.toLowerCase() === (order.productName || '').toLowerCase()
                      ) || products[0];
                      setSelectedProduct(matched);
                      setView('liveMapTracker');
                    }}
                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/80 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Truck className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 text-base">
                            {order.productName || 'Fresh Organic Tomatoes'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            On the Way
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Order ID: <span className="font-mono font-bold">{order.id}</span> • Placed on{' '}
                          {order.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="font-black text-neutral-900 text-base">{order.amount}</span>
                      <button className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition">
                        <span>{t('trackOrder', 'Track Live Route')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200">
                <Truck className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="font-bold text-neutral-700">No Ongoing Deliveries</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Orders you confirm from the market will appear here for live tracking.
                </p>
                <button
                  onClick={() => setActiveTab('market')}
                  className="mt-4 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold"
                >
                  Browse Market
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: ACCOUNT (History & Transactions) ==================== */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Order History */}
            <div>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight mb-3">
                {t('orderHistory', 'Order History')}
              </h2>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => {
                      if (order.statusKey === 'delivered') {
                        const matched = products.find(
                          (p) => p.productName.toLowerCase() === (order.productName || '').toLowerCase()
                        ) || products[0];
                        setSelectedProduct(matched);
                        setView('liveMapTracker');
                      }
                    }}
                    className={`bg-white rounded-2xl p-4 shadow-xs border border-neutral-200/80 flex items-center justify-between ${
                      order.statusKey === 'delivered' ? 'cursor-pointer hover:border-emerald-300' : ''
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">
                        {order.productName || order.itemKey}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {order.id} • {order.date}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-neutral-900 text-sm block">
                        {order.amount}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          order.statusKey === 'delivered' ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {order.statusKey === 'delivered' ? '✓ Delivered' : '⏳ In Transit'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Transactions matching GitHub Repo */}
            <div>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight mb-3">
                {t('transactions', 'Wallet & Payment Transactions')}
              </h2>
              <div className="space-y-3">
                {BUYER_TRANSACTIONS.map((trx) => (
                  <div
                    key={trx.id}
                    className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200/80 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">
                        {trx.itemName || trx.itemKey}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {trx.id} • {trx.date}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black text-sm block ${
                          trx.typeKey === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {trx.typeKey === 'credit' ? '+' : '-'}
                        {trx.amount}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        {trx.typeKey === 'credit' ? 'UPI Top-Up' : 'Produce Purchase'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar matching GitHub repo (Delivery, Market, Account) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-md mx-auto flex justify-around items-center py-2">
          {/* Delivery Tab */}
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex flex-col items-center justify-center w-20 py-1 transition-colors cursor-pointer ${
              activeTab === 'delivery' ? 'text-emerald-700' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Truck className={`w-5 h-5 ${activeTab === 'delivery' ? 'stroke-[2.5]' : ''}`} />
            <span
              className={`text-[11px] mt-1 ${activeTab === 'delivery' ? 'font-black' : 'font-medium'}`}
            >
              {t('delivery', 'Delivery')}
            </span>
          </button>

          {/* Market Tab */}
          <button
            onClick={() => setActiveTab('market')}
            className={`flex flex-col items-center justify-center w-20 py-1 transition-colors cursor-pointer ${
              activeTab === 'market' ? 'text-emerald-700' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <ShoppingBag className={`w-5 h-5 ${activeTab === 'market' ? 'stroke-[2.5]' : ''}`} />
            <span
              className={`text-[11px] mt-1 ${activeTab === 'market' ? 'font-black' : 'font-medium'}`}
            >
              {t('market', 'Market')}
            </span>
          </button>

          {/* Account Tab */}
          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center w-20 py-1 transition-colors cursor-pointer ${
              activeTab === 'account' ? 'text-emerald-700' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <UserIcon className={`w-5 h-5 ${activeTab === 'account' ? 'stroke-[2.5]' : ''}`} />
            <span
              className={`text-[11px] mt-1 ${activeTab === 'account' ? 'font-black' : 'font-medium'}`}
            >
              {t('account', 'Account')}
            </span>
          </button>
        </div>
      </footer>

      {/* Buyer Profile Modal */}
      {showProfileModal && (
        <BuyerProfileModal
          buyerData={buyerData}
          onClose={() => setShowProfileModal(false)}
          onSwitchToFarmer={onSwitchToFarmer}
          onLogout={onBackToRole}
        />
      )}
    </div>
  );
};
