export interface DirectoryItem {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  phone: string;
  whatsapp?: string;
  address: string;
  governorateId?: string;
  districtId?: string;
  governorateName?: string;
  districtName?: string;
  rating?: number | null;
  reviewsCount?: number;
  isOpen: boolean;
  workingHours: string;
  imageUrl: string;
  images?: string[];
  description: string;
  featured?: boolean;
  tags: string[];
  isClaimed?: boolean;
  claimStatus?: 'unclaimed' | 'pending' | 'verified' | 'rejected';
  phoneReliability?: 'unverified' | 'otp_verified' | 'claimed' | 'admin_confirmed';
  verificationLevel?: 'phone_valid' | 'phone_verified' | 'owner_verified';
  source?: 'manual_registration' | 'google_places' | 'meta_official' | 'official_directory' | 'multi_source_import' | 'osm_overpass' | 'tiktok_business';
  importedAt?: string;
  lastUpdatedAt?: string;
  claimedByName?: string;
  claimedByPhone?: string;
  claimedAt?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  telegram?: string;
  website?: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  menu?: StoreMenuItem[];
  menuImages?: string[];
  itemType?: 'store' | 'used_goods' | 'lost_found' | 'job';
  price?: string;
  condition?: string;
  salary?: string;
  jobType?: string;
}

export interface StoreMenuItem {
  id: string;
  name: string;
  price: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  popular?: boolean;
}

export interface StoreClaim {
  id: string;
  storeId: string;
  storeName: string;
  applicantName: string;
  applicantPhone: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  adminNotes?: string;
  otpVerified: boolean;
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
  storeId?: string;
  businessName: string;
  title: string;
  discountPercentage: string;
  description: string;
  expiresIn?: string;
  daysLeft?: number;
  imageUrl: string;
  category: string;
  governorateId?: string;
  districtId?: string;
  originalPrice?: string;
  discountedPrice?: string;
  couponCode?: string;
  phone?: string;
  validUntil?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface CityNews {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  governorateId?: string;
  districtId?: string;
  imageUrl?: string;
  readTime: string;
  source?: string;
  link?: string;
  isUrgent?: boolean;
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
  governorateId?: string;
  governorateName?: string;
  districtId?: string;
  districtName?: string;
  targetScope?: 'district' | 'governorate' | 'iraq';
  targetGovernorateId?: string;
  targetDistrictId?: string;
  storeId?: string;
  createdAt?: string;
  categoryId?: string;
  categoryName?: string;
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

export interface CategoryAd {
  id: string;
  scope?: 'national' | 'governorate' | 'store_area';
  governorateId: string;
  governorateName: string;
  districtId: string;
  districtName: string;
  categoryId: string;
  categoryName: string;
  businessName: string;
  headline: string;
  description: string;
  imageUrl?: string;
  phone: string;
  whatsapp?: string;
  offerBadge?: string;
  durationDays: number;
  price: number;
  createdAt: number;
  expiresAt: number;
  paymentMethod: string;
  transactionId?: string;
  referenceNumber: string;
}
