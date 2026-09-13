export interface GovernorateCardData {
  id: string;
  name: string;
  tagline: string;
  symbol: string; // Emoji / landmark symbol
  bgGradient?: string;
  borderColor?: string;
  accentColor?: string;
}

export const IRAQ_GOVERNORATES_CARDS: GovernorateCardData[] = [
  // ROW 1
  {
    id: 'nineveh',
    name: 'نينوى',
    tagline: 'محافظة نينوى',
    symbol: '🏛️',
  },
  {
    id: 'basra',
    name: 'البصرة',
    tagline: 'التاريخ والبصرة',
    symbol: '🌴',
  },
  {
    id: 'baghdad',
    name: 'بغداد',
    tagline: 'بغداد المستنصرية',
    symbol: '🕌',
  },

  // ROW 2
  {
    id: 'diyala',
    name: 'ديالى',
    tagline: 'مدينة البرتقال',
    symbol: '🍊',
  },
  {
    id: 'babil',
    name: 'بابل',
    tagline: 'حضارة بابل',
    symbol: '🦁',
  },
  {
    id: 'anbar',
    name: 'الأنبار',
    tagline: 'محافظة الأنبار',
    symbol: '🏰',
  },

  // ROW 3
  {
    id: 'dhi-qar',
    name: 'ذي قار',
    tagline: 'الناصرية والأهوار',
    symbol: '🌊',
  },
  {
    id: 'najaf',
    name: 'النجف',
    tagline: 'النجف الأشرف',
    symbol: '🕌',
  },
  {
    id: 'karbala',
    name: 'كربلاء',
    tagline: 'كربلاء المقدسة',
    symbol: '🕋',
  },

  // ROW 4
  {
    id: 'wasit',
    name: 'واسط',
    tagline: 'محافظة واسط',
    symbol: '☀️',
  },
  {
    id: 'salah-al-din',
    name: 'صلاح الدين',
    tagline: 'صلاح الدين',
    symbol: '🛡️',
  },
  {
    id: 'kirkuk',
    name: 'كركوك',
    tagline: 'محافظة كركوك',
    symbol: '🏗️',
  },

  // ROW 5
  {
    id: 'maysan',
    name: 'ميسان',
    tagline: 'محافظة ميسان',
    symbol: '🌾',
  },
  {
    id: 'muthanna',
    name: 'المثنى',
    tagline: 'السماوة والوركاء',
    symbol: '🏺',
  },
  {
    id: 'qadisiyah',
    name: 'القادسية',
    tagline: 'الديوانية',
    symbol: '🏺',
  },
];
