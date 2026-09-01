export interface DirectoryItem {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  phone: string;
  whatsapp?: string;
  address: string;
  rating: number;
  reviewsCount: number;
  isOpen: boolean;
  workingHours: string;
  imageUrl: string;
  description: string;
  featured?: boolean;
  tags: string[];
  isClaimed?: boolean;
  claimedByName?: string;
  claimedByPhone?: string;
  claimedAt?: string;
}

export interface Category {
  id: string;
  title: string;
  countText: string;
  countNumber: number;
  iconType: 'doctor' | 'clothing' | 'restaurant' | 'beauty' | 'pharmacy' | 'electronics' | 'services' | 'other';
  color: string;
  isMain?: boolean;
}

export interface Offer {
  id: string;
  businessName: string;
  title: string;
  discountPercentage: string;
  description: string;
  expiresIn: string;
  daysLeft: number;
  imageUrl: string;
  category: string;
  originalPrice?: string;
  discountedPrice?: string;
  couponCode?: string;
  phone?: string;
}

export interface CityNews {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: 'بلدية' | 'صحة' | 'فعاليات' | 'طوارئ';
  imageUrl?: string;
  readTime: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp?: number;
  type: 'offer' | 'store' | 'news' | 'system';
  unread: boolean;
  targetId?: string;
  targetType?: 'store' | 'offer' | 'news' | 'general';
  imageUrl?: string;
  badge?: string;
}

export type PaymentMethod = 'zaincash' | 'mastercard' | 'qicard' | 'wallet' | 'cash';

export type TransactionType = 'deposit' | 'withdrawal' | 'ad_payment' | 'earning';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  description: string;
  date: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  recipientDetails?: {
    accountName?: string;
    phoneNumber?: string;
    cardNumber?: string;
    bankName?: string;
  };
}

export interface StoreReport {
  id: string;
  storeId: string;
  storeName: string;
  storePhone: string;
  reason: string;
  details: string;
  reporterName?: string;
  reporterPhone?: string;
  createdAt: string;
  timestamp: number;
  status: 'pending' | 'resolved' | 'dismissed';
}
