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
  X,
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
import { BulkOrderModal } from './BulkOrderModal';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../types';
import { productService, ProductListing } from '../../services/productService';
import { cattleService, CattleItem } from '../../services/cattleService';
import { orderService, OrderDocument } from '../../services/orderService';
import { authService } from '../../services/authService';
import { reviewService } from '../../services/reviewService';
import { bulkOrderService, BulkOrder } from '../../services/exportService';

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
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);

  // Review Modal state (Section 17, 18, 19)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<UserOrder | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  // Data & Order state from Firebase (Section 21 & 24)
  const [products, setProducts] = useState<BuyerFeedProduct[]>([]);
  const [cattleProducts, setCattleProducts] = useState<BuyerFeedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<BuyerFeedProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [paymentPartner, setPaymentPartner] = useState<'GPay' | 'PhonePe' | 'Paytm'>('GPay');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);

  // Search & Filter state (Requirement 8)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');

  // Realtime subscription to active products from Firestore /products (Section 21 & 25)
  useEffect(() => {
    const unsubProducts = productService.subscribeProducts(
      (items: ProductListing[]) => {
        const activeItems = items.filter(
          (it) => it.status !== 'deleted' && String(it.status).toLowerCase() === 'active'
        );

        const formatted: BuyerFeedProduct[] = activeItems.map((item, idx) => {
          const primaryImg =
            (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null) ||
            (item.images && item.images.length > 0 ? item.images[0] : null) ||
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';

          return {
            id: item.productId || item.id || `live-${idx}`,
            farmerId: item.farmerId || 'farmer-default-murugan',
            productName: item.productName || item.name || 'Farm Produce',
            grade: (item.grade || 'A').toUpperCase(),
            productImg: primaryImg,
            farmerName: item.farmerName || 'Registered Farmer',
            location: item.location || 'Tamil Nadu',
            rate: Number(item.optimizedPriceMax || item.marketPrice || 38),
            rating: item.rating || 4.9,
            description:
              item.description ||
              `Fresh Grade-${item.grade || 'A'} ${item.productName || 'produce'} posted live by ${item.farmerName}.`,
            coords: {
              lat: Number(item.latitude) || 11.0168,
              lng: Number(item.longitude) || 76.9558,
            },
            quantityAvailable: `${item.quantity || 100} ${item.unit || 'kg'}`,
            unit: item.unit || 'kg',
            category: item.category || 'Vegetables',
            freshnessScore: Number(item.freshnessScore) || (item.grade === 'A' ? 96 : item.grade === 'B' ? 84 : 72),
          };
        });

        setProducts(formatted);
      },
      { activeOnly: true }
    );

    // Realtime subscription to cattle & livestock listings from Firestore /cattleListings (Requirement 12)
    const unsubCattle = cattleService.subscribeCattle(
      (cattleItems: CattleItem[]) => {
        const activeCattle = cattleItems.filter(
          (c) => c.status !== 'deleted' && c.status !== 'sold_out' && c.status !== 'inactive'
        );

        const formattedCattle: BuyerFeedProduct[] = activeCattle.map((c, idx) => {
          const primaryImg =
            c.imageUrl ||
            (c.imageUrls && c.imageUrls.length > 0 ? c.imageUrls[0] : null) ||
            'https://www.image2url.com/r2/default/images/1790515781753-c4236b67-e877-40a6-851c-b591799d290e.png';

          return {
            id: c.id || `cattle-${idx}`,
            farmerId: c.farmerId || 'farmer-default-murugan',
            productName: c.title,
            grade: 'A',
            productImg: primaryImg,
            farmerName: c.farmer || 'Verified Farmer',
            location: c.location || 'Tamil Nadu',
            rate: parseFloat(String(c.price).replace(/[^0-9.]/g, '')) || 500,
            rating: 4.9,
            description: `${c.breed || c.categoryLabel} • ${c.specs?.join(' • ') || ''}`,
            coords: {
              lat: Number(c.latitude) || 11.0168,
              lng: Number(c.longitude) || 76.9558,
            },
            quantityAvailable: c.availableQty || `${c.quantity || 1} available`,
            unit: c.unit || (c.category === 'milk' ? 'litre' : 'unit'),
            category: 'Livestock',
            freshnessScore: 98,
          };
        });

        setCattleProducts(formattedCattle);
      },
      { activeOnly: true }
    );

    // Realtime subscription to buyer orders from Firestore /orders (Section 24 & 25)
    const currentSession = authService.getCurrentSession();
    const buyerUid = currentSession?.uid || 'buyer-demo';

    const unsubOrders = orderService.subscribeOrders((orderDocs: OrderDocument[]) => {
      const formattedOrders: UserOrder[] = orderDocs.map((o) => ({
        id: o.orderId || o.id,
        itemKey: 'freshProduce',
        itemName: o.productName,
        productName: o.productName,
        productImg:
          products.find((p) => String(p.id) === o.productId)?.productImg ||
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
        date: o.time || (o.createdAt ? 'Recently' : 'Today'),
        amount: o.total || `₹${o.totalAmount.toLocaleString()}`,
        quantity: `${o.quantity} ${o.unit || 'kg'}`,
        farmerId: o.farmerId,
        farmerName: o.farmerName,
        productId: o.productId,
        orderStatus: o.orderStatus,
        statusKey:
          o.orderStatus === 'delivered'
            ? 'delivered'
            : o.orderStatus === 'cancelled'
            ? 'cancelled'
            : 'ongoing',
      }));
      setOrders(formattedOrders);
    });

    // Realtime subscription to buyer bulk orders
    const unsubBulk = bulkOrderService.subscribeBuyerBulkOrders(buyerUid, (items) => {
      setBulkOrders(items);
    });

    return () => {
      unsubProducts();
      unsubCattle();
      unsubOrders();
      unsubBulk();
    };
  }, []);

  // Filter products by search term, category, and grade (Requirement 8)
  const allMarketProducts = [...products, ...cattleProducts];
  const filteredProducts = allMarketProducts.filter((item) => {
    const sTerm = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !sTerm ||
      item.productName.toLowerCase().includes(sTerm) ||
      item.farmerName.toLowerCase().includes(sTerm) ||
      item.location.toLowerCase().includes(sTerm) ||
      (item.category && item.category.toLowerCase().includes(sTerm)) ||
      (item.grade && `grade ${item.grade}`.toLowerCase().includes(sTerm));

    const matchesCategory =
      selectedCategory === 'All' ||
      (selectedCategory === 'Vegetables' &&
        (!item.category || item.category.toLowerCase().includes('veg'))) ||
      (selectedCategory === 'Fruits' &&
        item.category &&
        item.category.toLowerCase().includes('fruit')) ||
      (selectedCategory === 'Grains' &&
        item.category &&
        item.category.toLowerCase().includes('grain')) ||
      (selectedCategory === 'Livestock' &&
        item.category &&
        ['livestock', 'cattle', 'cow', 'hens', 'goat', 'eggs', 'milk'].includes(
          item.category.toLowerCase()
        ));

    const matchesGrade = selectedGrade === 'All' || item.grade === selectedGrade;

    return matchesSearch && matchesCategory && matchesGrade;
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

  // Handle cash on delivery confirm -> Save to Firebase Firestore (Section 12 & 14)
  const handleConfirmCod = async () => {
    if (selectedProduct) {
      const currentSession = authService.getCurrentSession();
      const buyerUid = currentSession?.uid || 'buyer-demo';
      const buyerName = currentSession?.name || buyerData?.fullName || 'Verified Buyer';
      const buyerMobile = currentSession?.phoneNumber || buyerData?.mobile || '+91 98765 43210';
      const buyerAddress = currentSession?.location || buyerData?.location || 'Coimbatore, Tamil Nadu';
      const subtotalAmt = selectedProduct.rate * orderQuantity;
      const totalAmt = subtotalAmt + 120;

      try {
        await orderService.createOrder(
          {
            buyerId: buyerUid,
            buyerName: buyerName,
            buyerMobile: buyerMobile,
            farmerId: selectedProduct.farmerId || 'farmer-default-murugan',
            farmerName: selectedProduct.farmerName || 'Murugan S.',
            productId: String(selectedProduct.id),
            productName: selectedProduct.productName,
            quantity: orderQuantity,
            unit: selectedProduct.unit || 'kg',
            pricePerUnit: selectedProduct.rate,
            subtotal: subtotalAmt,
            deliveryCharge: 120,
            totalAmount: totalAmt,
            deliveryAddress: buyerAddress,
            paymentMethod: 'Cash on Delivery (COD)',
            paymentStatus: 'pending',
            orderStatus: 'placed',
            transportOption: 'Farmer Direct Delivery',
          },
          [
            {
              productId: String(selectedProduct.id),
              productName: selectedProduct.productName,
              farmerId: selectedProduct.farmerId || 'farmer-default-murugan',
              quantity: orderQuantity,
              unit: selectedProduct.unit || 'kg',
              price: selectedProduct.rate,
              subtotal: subtotalAmt,
            },
          ]
        );
      } catch (err) {
        console.warn('Error saving COD order to Firestore:', err);
      }
    }
    setView('liveMapTracker');
  };

  // Handle payment partner selected
  const handleSelectPartner = (partner: 'GPay' | 'PhonePe' | 'Paytm') => {
    setPaymentPartner(partner);
    setView('simulatedPayment');
  };

  // Handle payment success -> Save to Firebase Firestore (Section 12 & 14)
  const handlePaymentSuccess = async () => {
    if (selectedProduct) {
      const currentSession = authService.getCurrentSession();
      const buyerUid = currentSession?.uid || 'buyer-demo';
      const buyerName = currentSession?.name || buyerData?.fullName || 'Verified Buyer';
      const buyerMobile = currentSession?.phoneNumber || buyerData?.mobile || '+91 98765 43210';
      const buyerAddress = currentSession?.location || buyerData?.location || 'Coimbatore, Tamil Nadu';
      const subtotalAmt = selectedProduct.rate * orderQuantity;
      const totalAmt = subtotalAmt + 120;

      try {
        await orderService.createOrder(
          {
            buyerId: buyerUid,
            buyerName: buyerName,
            buyerMobile: buyerMobile,
            farmerId: selectedProduct.farmerId || 'farmer-default-murugan',
            farmerName: selectedProduct.farmerName || 'Murugan S.',
            productId: String(selectedProduct.id),
            productName: selectedProduct.productName,
            quantity: orderQuantity,
            unit: selectedProduct.unit || 'kg',
            pricePerUnit: selectedProduct.rate,
            subtotal: subtotalAmt,
            deliveryCharge: 120,
            totalAmount: totalAmt,
            deliveryAddress: buyerAddress,
            paymentMethod: `UPI (${paymentPartner})`,
            paymentStatus: 'completed',
            orderStatus: 'confirmed',
            transportOption: 'Farmer Direct Delivery',
          },
          [
            {
              productId: String(selectedProduct.id),
              productName: selectedProduct.productName,
              farmerId: selectedProduct.farmerId || 'farmer-default-murugan',
              quantity: orderQuantity,
              unit: selectedProduct.unit || 'kg',
              price: selectedProduct.rate,
              subtotal: subtotalAmt,
            },
          ]
        );
      } catch (err) {
        console.warn('Error saving UPI order to Firestore:', err);
      }
    }
    setView('liveMapTracker');
  };

  // Handle Review Submission to Firestore reviews/{reviewId} (Section 17)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;
    const currentSession = authService.getCurrentSession();
    try {
      await reviewService.createReview({
        buyerId: currentSession?.uid || 'buyer-demo',
        buyerName: currentSession?.name || buyerData?.fullName || 'Verified Buyer',
        farmerId: reviewOrder.farmerId || 'farmer-default-murugan',
        productId: reviewOrder.productId || '',
        productName: reviewOrder.productName || '',
        orderId: reviewOrder.id,
        rating: ratingScore,
        reviewText: reviewText.trim() || 'Verified quality produce delivered fresh from farm!',
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewSubmitted(false);
        setShowReviewModal(false);
        setReviewOrder(null);
        setReviewText('');
      }, 1400);
    } catch (err) {
      console.warn('Review save error:', err);
    }
  };

  // Language options
  const languageOptions: { code: LanguageCode; name: string }[] = [
    { code: 'ta', name: 'தமிழ்' },
    { code: 'en', name: 'English' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'hi', name: 'हिन्दी' },
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

            {/* Category Filter Pills (Requirement 8) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { key: 'All', label: t('allCategories', 'All') },
                { key: 'Vegetables', label: t('vegetables', 'Vegetables') },
                { key: 'Fruits', label: t('fruits', 'Fruits') },
                { key: 'Grains', label: t('grains', 'Grains') },
                { key: 'Livestock', label: t('livestock', 'Livestock') },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grade Filter Pill Buttons matching GitHub Repo */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'A', 'B', 'C'].map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedGrade === grade
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {grade === 'All' ? t('allGrades', 'All Grades') : `${t('grade', 'Grade')} ${grade}`}
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
                  {filteredProducts.length} {t('itemsAvailable', 'items available')}
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
                          {t('grade', 'Grade')} {product.grade}
                        </div>

                        {/* Rating Badge */}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
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

                          {/* Freshness & Available Quantity (Requirement 7) */}
                          <div className="flex items-center justify-between text-[11px] text-neutral-600 mt-1.5 font-semibold">
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md text-[10px]">
                              {product.freshnessScore || (product.grade === 'A' ? 96 : product.grade === 'B' ? 84 : 72)}% Fresh
                            </span>
                            <span className="text-neutral-500 text-[10px] truncate max-w-[55%] text-right">
                              {product.quantityAvailable}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-baseline justify-between">
                          <span className="text-sm sm:text-base font-black text-emerald-700">
                            ₹{product.rate}{' '}
                            <span className="text-[10px] font-normal text-neutral-500">/ {product.unit || t('kgUnit', 'kg')}</span>
                          </span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">
                            {t('buyNow', 'Buy Now')} →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-10 text-center border border-neutral-200">
                  <p className="text-sm font-semibold text-neutral-500">
                    {t('noListingsYet', 'No farm produce found')}
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('All');
                      setSelectedGrade('All');
                    }}
                    className="mt-3 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    {t('resetFilters', 'Reset filters')}
                  </button>
                </div>
              )}
            </div>

            {/* Request Bulk Supply Card */}
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBulkOrderModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-4 shadow-md cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {t('requestBulkSupply', 'Request Bulk Supply')}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    {t('bulkOrderDesc', 'For restaurants, shops & wholesale buyers')}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </motion.div>
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
                            {t('statusInTransit', 'On the Way')}
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
                <p className="font-bold text-neutral-700">{t('noOngoingDeliveries', 'No Ongoing Deliveries')}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {t('browseMarket', 'Orders you confirm from the market will appear here for live tracking.')}
                </p>
                <button
                  onClick={() => setActiveTab('market')}
                  className="mt-4 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold"
                >
                  {t('browseMarket', 'Browse Market')}
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

                    <div className="text-right flex items-center gap-2.5">
                      <div>
                        <span className="font-black text-neutral-900 text-sm block">
                          {order.amount}
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            order.statusKey === 'delivered' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {order.statusKey === 'delivered' ? `✓ ${t('statusDelivered', 'Delivered')}` : `⏳ ${t('statusInTransit', 'In Transit')}`}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewOrder(order);
                          setShowReviewModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="Rate & Review in Firebase"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{t('review', 'Review')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Order Requests */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                  {t('myBulkOrders', 'Bulk Supply Requests')}
                </h2>
                <button
                  onClick={() => setShowBulkOrderModal(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>+ {t('requestBulkSupply', 'Request Bulk Supply')}</span>
                </button>
              </div>
              {bulkOrders.length > 0 ? (
                <div className="space-y-3">
                  {bulkOrders.map((order) => {
                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case 'pending':
                          return { bg: 'bg-amber-100 text-amber-800', label: t('statusPending', 'Pending') };
                        case 'accepted':
                          return { bg: 'bg-emerald-100 text-emerald-800', label: t('statusAccepted', 'Accepted') };
                        case 'rejected':
                          return { bg: 'bg-rose-100 text-rose-800', label: t('statusRejected', 'Rejected') };
                        case 'processing':
                          return { bg: 'bg-blue-100 text-blue-800', label: t('statusProcessing', 'Processing') };
                        case 'ready':
                          return { bg: 'bg-indigo-100 text-indigo-800', label: t('statusReady', 'Ready') };
                        case 'delivered':
                          return { bg: 'bg-emerald-100 text-emerald-800', label: t('statusDelivered', 'Delivered') };
                        case 'cancelled':
                          return { bg: 'bg-neutral-100 text-neutral-700', label: t('statusCancelled', 'Cancelled') };
                        default:
                          return { bg: 'bg-neutral-100 text-neutral-700', label: status };
                      }
                    };
                    const badge = getStatusBadge(order.status);
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200/80 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                            <h4 className="font-bold text-neutral-900 text-sm">
                              {order.productName}
                            </h4>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-neutral-600">
                          <div>
                            <span className="text-neutral-400 font-medium">{t('farmer', 'Farmer')}:</span>{' '}
                            <span className="font-semibold text-neutral-800">{order.farmerName}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 font-medium">{t('requiredQuantity', 'Qty')}:</span>{' '}
                            <span className="font-semibold text-neutral-800">{order.requestedQuantity} {order.unit}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-neutral-400 font-medium">{t('neededBy', 'Needed By')}:</span>{' '}
                            <span className="font-semibold text-neutral-800">{order.neededBy}</span>
                          </div>
                        </div>
                        {order.notes && (
                          <p className="text-[11px] text-neutral-500 italic bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100">
                            "{order.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-5 text-center border border-neutral-200/80">
                  <p className="text-xs text-neutral-400">{t('noBulkOrders', 'No bulk requests submitted yet')}</p>
                </div>
              )}
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

      {/* Interactive Order & Product Review Modal (Section 17, 18, 19) */}
      <AnimatePresence>
        {showReviewModal && reviewOrder && (
          <div
            id="buyer-review-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 relative"
            >
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {t('writeReview', 'Verified Order Review')}
                </span>
                <h3 className="text-lg font-black text-neutral-900 mt-2">
                  {t('yourRating', 'Rate')} {reviewOrder.productName || 'Produce'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Farmer: {reviewOrder.farmerName || 'Registered Farmer'} • Order: {reviewOrder.id}
                </p>
              </div>

              {reviewSubmitted ? (
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-neutral-800">{t('reviewSubmitted', 'Review Submitted!')}</h4>
                  <p className="text-xs text-neutral-500 mt-1">{t('reviewSubmitted', 'Saved to Firebase reviews collection.')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Star Rating Selection */}
                  <div className="flex justify-center items-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingScore(star)}
                        className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= ratingScore
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs font-bold text-neutral-600">
                    {ratingScore === 5
                      ? '⭐⭐⭐⭐⭐ Excellent Freshness'
                      : ratingScore === 4
                      ? '⭐⭐⭐⭐ Very Good Quality'
                      : ratingScore === 3
                      ? '⭐⭐⭐ Average'
                      : ratingScore === 2
                      ? '⭐⭐ Below Expectations'
                      : '⭐ Poor Quality'}
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      {t('yourReview', 'Your Feedback')}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with the produce freshness, taste, and farm delivery..."
                      className="w-full p-3 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-extrabold text-sm transition-colors cursor-pointer"
                  >
                    {t('submitReview', 'Submit Review')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BULK ORDER MODAL --- */}
      <BulkOrderModal
        open={showBulkOrderModal}
        onClose={() => setShowBulkOrderModal(false)}
      />
    </div>
  );
};
