export type TrendType = 'up' | 'down' | 'stable';

export interface MarketItem {
  name: string;
  price: string;
  trend: TrendType;
  predicted: string;
}

export interface ProductCategoryItem {
  id: string;
  name: string;
  count: string;
  image: string;
  categoryKey: string;
}

export interface BuyerFeedProduct {
  id: string | number;
  productName: string;
  grade: 'A' | 'B' | 'C' | string;
  productImg: string;
  farmerName: string;
  location: string;
  rate: number;
  originalPrice?: number;
  rating: number;
  description: string;
  coords: { lat: number; lng: number };
  quantityAvailable?: string | number;
  category?: string;
  unit?: string;
  badge?: string;
  harvestTime?: string;
}

export interface UserOrder {
  id: string;
  itemKey: string;
  itemName?: string;
  productName?: string;
  productImg?: string;
  date: string;
  amount: string;
  quantity?: string;
  farmerName?: string;
  statusKey: 'ongoing' | 'delivered' | 'cancelled' | string;
}

export interface TransactionBreakdown {
  produceTotal: number;
  farmerDirectShare: number;
  logisticsFee: number;
  platformFee: number;
  gstTax: number;
}

export interface Transaction {
  id: string;
  itemKey: string;
  itemName?: string;
  date: string;
  amount: string;
  typeKey: 'credit' | 'debit';
  status?: 'completed' | 'pending' | 'refunded';
  paymentMethod?: string;
  referenceId?: string;
  category?: 'produce' | 'wallet' | 'refund' | 'reward';
  farmerName?: string;
  breakdown?: TransactionBreakdown;
}

export interface DriverData {
  name: string;
  vehicleModel: string;
  vehicleNumber: string;
  pictureUrl: string;
  phone?: string;
}

export interface BuyerUserData {
  fullName?: string;
  mobile?: string;
  location?: string;
  email?: string;
  businessName?: string;
  businessAddress?: string;
  gst?: string;
  profilePic?: string | null;
}

export type BuyerViewState =
  | 'dashboard'
  | 'productDetail'
  | 'checkout'
  | 'paymentPartners'
  | 'simulatedPayment'
  | 'liveMapTracker';
