import { Category } from '../types/shatrah';

export const CATEGORIES_DATA: Category[] = [
  // 3 Main Top Categories
  {
    id: 'doctors',
    title: 'الأطباء والعيادات',
    countText: 'الأطباء والمراكز الصحية',
    countNumber: 0,
    iconType: 'doctor',
    color: '#3B82F6',
    isMain: true,
  },
  {
    id: 'clothing',
    title: 'مجمعات الألبسة',
    countText: 'أزياء وأحذية ومحلات',
    countNumber: 0,
    iconType: 'clothing',
    color: '#EC4899',
    isMain: true,
  },
  {
    id: 'restaurants',
    title: 'مطاعم ومقاهي',
    countText: 'وجبات ومشاوي ومقاهي',
    countNumber: 0,
    iconType: 'restaurant',
    color: '#F59E0B',
    isMain: true,
  },
  // Subcategories
  {
    id: 'pharmacies',
    title: 'صيدليات',
    countText: 'صيدليات ومستلزمات طبية',
    countNumber: 0,
    iconType: 'pharmacy',
    color: '#10B981',
  },
  {
    id: 'electronics',
    title: 'أجهزة وموبايل',
    countText: 'هواتف وصيانة وإلكترونيات',
    countNumber: 0,
    iconType: 'electronics',
    color: '#0EA5E9',
  },
  {
    id: 'beauty',
    title: 'صالونات وتجميل',
    countText: 'مراكز عناية وتجميل',
    countNumber: 0,
    iconType: 'beauty',
    color: '#F43F5E',
  },
  {
    id: 'services',
    title: 'خدمات وصيانة',
    countText: 'خدمات منزلية وفنية',
    countNumber: 0,
    iconType: 'services',
    color: '#8B5CF6',
  },
  {
    id: 'other',
    title: 'أقسام أخرى',
    countText: 'أنشطة تجارية متنوعة',
    countNumber: 0,
    iconType: 'other',
    color: '#64748B',
  },
];
