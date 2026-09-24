export interface District {
  id: string;
  name: string;
  isCenter?: boolean;
  center?: {
    lat: number;
    lng: number;
  };
}

export interface Governorate {
  id: string;
  name: string;
  tagline: string;
  center: {
    lat: number;
    lng: number;
  };
  districts: District[];
}

export interface UserLocation {
  governorateId: string;
  districtId: string;
  governorateName: string;
  districtName: string;
  isAutoDetected?: boolean;
}

// 15 Iraqi Governorates (Excluding Erbil, Duhok, Sulaymaniyah as requested)
export const IRAQ_GOVERNORATES: Governorate[] = [
  {
    id: 'dhi-qar',
    name: 'ذي قار',
    tagline: 'الناصرية والشطرة وأور الأثرية',
    center: { lat: 31.0543, lng: 46.2625 },
    districts: [
      { id: 'shatrah', name: 'الشطرة', isCenter: false },
      { id: 'nasiriyah', name: 'الناصرية (المركز)', isCenter: true },
      { id: 'rifai', name: 'الرفاعي' },
      { id: 'suq-al-shuyukh', name: 'سوق الشيوخ' },
      { id: 'chibayish', name: 'الجبايش (الأهوار)' },
      { id: 'gharraf', name: 'الغراف' },
      { id: 'qalat-sukkar', name: 'قلعة سكر' },
      { id: 'dawayah', name: 'الدواية' },
      { id: 'fajr', name: 'الفجر' },
      { id: 'nasr', name: 'النصر' },
      { id: 'bathaa', name: 'البطحاء' },
      { id: 'karmat-bani-saeed', name: 'كرمة بني سعيد' },
      { id: 'islah', name: 'الإصلاح' },
      { id: 'fahud', name: 'الفهود' },
      { id: 'manar', name: 'المنار' },
    ],
  },
  {
    id: 'baghdad',
    name: 'بغداد',
    tagline: 'العاصمة الحبيبة ومركز التجارة',
    center: { lat: 33.3152, lng: 44.3661 },
    districts: [
      { id: 'rusafa', name: 'الرصافة', isCenter: true },
      { id: 'karkh', name: 'الكرخ', isCenter: true },
      { id: 'kadhimiya', name: 'الكاظمية المقدسة' },
      { id: 'mansour', name: 'المنصور والداوودي' },
      { id: 'karrada', name: 'الكرادة والجادرية' },
      { id: 'adhamiya', name: 'الأعظمية والوزيرية' },
      { id: 'sadr-city', name: 'مدينة الصدر' },
      { id: 'shaab', name: 'الشعب والحي الصناعي' },
      { id: 'dora', name: 'الدورة والمهدية' },
      { id: 'saydiyah', name: 'السيدية وحي الإعلام' },
      { id: 'ghazaliya', name: 'الغزالية والخضراء' },
      { id: 'amiriya', name: 'العامرية وحي الفرات' },
      { id: 'mahmudiyah', name: 'المحمودية واللطيفية' },
      { id: 'madain', name: 'المدائن وسلمان باك' },
      { id: 'tarmiyah', name: 'الطارمية والمشاهدة' },
      { id: 'abu-ghraib', name: 'أبو غريب والنصر والسلام' },
    ],
  },
  {
    id: 'basra',
    name: 'البصرة',
    tagline: 'ثغر العراق الباسم ورئة الاقتصاد',
    center: { lat: 30.5081, lng: 47.7835 },
    districts: [
      { id: 'basra-center', name: 'البصرة (العشار والجزائر)', isCenter: true },
      { id: 'zubair', name: 'الزبير' },
      { id: 'qurna', name: 'القرنة (ملتقى النهرين)' },
      { id: 'shatt-al-arab', name: 'شط العرب والفيحاء' },
      { id: 'abu-al-khaseeb', name: 'أبي الخصيب' },
      { id: 'fao', name: 'الفاو' },
      { id: 'medina', name: 'المدينة' },
      { id: 'deir', name: 'الدير' },
      { id: 'hartha', name: 'الهارثة' },
      { id: 'um-qasr', name: 'أم قصر' },
      { id: 'imam-sadiq', name: 'الإمام الصادق' },
    ],
  },
  {
    id: 'najaf',
    name: 'النجف الأشرف',
    tagline: 'مدينة العلم وباب الهدى',
    center: { lat: 32.0006, lng: 44.3314 },
    districts: [
      { id: 'najaf-center', name: 'النجف (المدينة القديمة والمركز)', isCenter: true },
      { id: 'kufa', name: 'الكوفة المقدسة' },
      { id: 'manadhira', name: 'المناذرة' },
      { id: 'meshkhab', name: 'المشخاب (مدينة العنبر)' },
      { id: 'heera', name: 'الحيرة التاريخية' },
      { id: 'abbasiyah', name: 'العباسية' },
      { id: 'qadisiyah-najaf', name: 'القادسية' },
    ],
  },
  {
    id: 'karbala',
    name: 'كربلاء المقدسة',
    tagline: 'مهوى القلوب ومدينة الإيثار',
    center: { lat: 32.616, lng: 44.0249 },
    districts: [
      { id: 'karbala-center', name: 'كربلاء (المركز والحرمين)', isCenter: true },
      { id: 'hindiya', name: 'الهندية (طويريج)' },
      { id: 'ain-tamur', name: 'عين التمر والواحات' },
      { id: 'hurr', name: 'الحر' },
      { id: 'hussainiya', name: 'الحسينية' },
      { id: 'jadwal-gharbi', name: 'الجدول الغربي' },
    ],
  },
  {
    id: 'babil',
    name: 'بابل',
    tagline: 'مهد الحضارة والتاريخ العريق',
    center: { lat: 32.484, lng: 44.4308 },
    districts: [
      { id: 'hillah', name: 'الحلة (المركز)', isCenter: true },
      { id: 'mahawil', name: 'المحاويل' },
      { id: 'musayyib', name: 'المسيب' },
      { id: 'hashimiyah', name: 'الهاشمية' },
      { id: 'iskandariya', name: 'الإسكندرية' },
      { id: 'qasim', name: 'القاسم' },
      { id: 'kifl', name: 'الكفل' },
      { id: 'jabala', name: 'جبلة (المشروع)' },
      { id: 'saddat-al-hindiya', name: 'سدة الهندية' },
      { id: 'neel', name: 'النيل' },
    ],
  },
  {
    id: 'maysan',
    name: 'ميسان',
    tagline: 'العمارة وأرض الأهوار والخير',
    center: { lat: 31.8437, lng: 47.1448 },
    districts: [
      { id: 'amara', name: 'العمارة (المركز)', isCenter: true },
      { id: 'ali-al-gharbi', name: 'علي الغربي' },
      { id: 'maymouna', name: 'الميمونة' },
      { id: 'majar-al-kabir', name: 'المجر الكبير' },
      { id: 'qalat-saleh', name: 'قلعة صالح' },
      { id: 'kahlaa', name: 'الكحلاء' },
      { id: 'musharrah', name: 'المشرح' },
      { id: 'kumait', name: 'كميت' },
      { id: 'salam-maysan', name: 'السلام' },
    ],
  },
  {
    id: 'wasit',
    name: 'واسط',
    tagline: 'الكوت وسلة خبز العراق الخضراء',
    center: { lat: 32.5126, lng: 45.8338 },
    districts: [
      { id: 'kut', name: 'الكوت (المركز)', isCenter: true },
      { id: 'hai', name: 'الحي' },
      { id: 'numaniyah', name: 'النعمانية' },
      { id: 'suwaira', name: 'الصويرة' },
      { id: 'aziziya', name: 'العزيزية' },
      { id: 'badra', name: 'بدرة' },
      { id: 'jassan', name: 'جصان' },
      { id: 'sheikh-saad', name: 'شيخ سعد' },
      { id: 'ahrar', name: 'الأحرار' },
      { id: 'taj-al-din', name: 'تاج الدين' },
    ],
  },
  {
    id: 'muthanna',
    name: 'المثنى',
    tagline: 'السماوة وأرض الوركاء وبحيرة ساوة',
    center: { lat: 31.3243, lng: 45.2809 },
    districts: [
      { id: 'samawah', name: 'السماوة (المركز)', isCenter: true },
      { id: 'rumaitha', name: 'الرميثة' },
      { id: 'khidhir', name: 'الخضر' },
      { id: 'warkaa', name: 'الوركاء' },
      { id: 'salman', name: 'السلمان' },
      { id: 'najmi', name: 'النجمي' },
      { id: 'hilal', name: 'الهلال' },
      { id: 'majd', name: 'المجد' },
    ],
  },
  {
    id: 'qadisiyah',
    name: 'الديوانية (القادسية)',
    tagline: 'مدينة النخيل وعاصمة الزراعة',
    center: { lat: 31.9928, lng: 44.9254 },
    districts: [
      { id: 'diwaniyah-center', name: 'الديوانية (المركز)', isCenter: true },
      { id: 'shamiya', name: 'الشامية' },
      { id: 'afak', name: 'عفك' },
      { id: 'hamza', name: 'الحمزة الشرقي' },
      { id: 'saniyah', name: 'السنية' },
      { id: 'ghamas', name: 'غماس' },
      { id: 'muhannawiya', name: 'المهناوية' },
      { id: 'dighara', name: 'الدغارة' },
      { id: 'shinafiya', name: 'الشنافية' },
      { id: 'sumer', name: 'سومر' },
    ],
  },
  {
    id: 'diyala',
    name: 'ديالى',
    tagline: 'مدينة البرتقال وبساتين الرافدين',
    center: { lat: 33.7584, lng: 44.6437 },
    districts: [
      { id: 'baqubah', name: 'بعقوبة (المركز)', isCenter: true },
      { id: 'miqdadiyah', name: 'المقدادية (شهربان)' },
      { id: 'khalis', name: 'الخالص' },
      { id: 'khanaqin', name: 'خانقين' },
      { id: 'baladrouz', name: 'بلدروز' },
      { id: 'mandali', name: 'مندلي' },
      { id: 'jalawla', name: 'جلولاء' },
      { id: 'saadiyah', name: 'السعدية' },
      { id: 'kanaan', name: 'كنعان' },
      { id: 'habhab', name: 'هبهب' },
    ],
  },
  {
    id: 'salah-al-din',
    name: 'صلاح الدين',
    tagline: 'تكريت وسامراء والملوية الخالدة',
    center: { lat: 34.606, lng: 43.682 },
    districts: [
      { id: 'tikrit', name: 'تكريت (المركز)', isCenter: true },
      { id: 'samarra', name: 'سامراء المقدسة' },
      { id: 'balad', name: 'بلد' },
      { id: 'dujail', name: 'الدجيل' },
      { id: 'baiji', name: 'بيجي' },
      { id: 'tuz-khurmatu', name: 'طوزخورماتو' },
      { id: 'shirqat', name: 'الشرقاط' },
      { id: 'dhuluia', name: 'الضلوعية' },
      { id: 'yathrib', name: 'يثرب' },
      { id: 'amerli', name: 'آمرلي' },
    ],
  },
  {
    id: 'anbar',
    name: 'الأنبار',
    tagline: 'الرمادي والفلوجة وأهل الكرم والفرات',
    center: { lat: 33.4241, lng: 43.2985 },
    districts: [
      { id: 'ramadi', name: 'الرمادي (المركز)', isCenter: true },
      { id: 'fallujah', name: 'الفلوجة' },
      { id: 'hit', name: 'هيت' },
      { id: 'haditha', name: 'حديثة' },
      { id: 'qaim', name: 'القائم' },
      { id: 'rutba', name: 'الرطبة' },
      { id: 'ana', name: 'عانة' },
      { id: 'rawa', name: 'راوة' },
      { id: 'karma', name: 'الكرمة' },
      { id: 'khaldiyah', name: 'الخالدية' },
      { id: 'baghdadi-anbar', name: 'البغدادي' },
    ],
  },
  {
    id: 'kirkuk',
    name: 'كركوك',
    tagline: 'قلب العراق وعاصمة التآخي والتنوع',
    center: { lat: 35.4681, lng: 44.3922 },
    districts: [
      { id: 'kirkuk-center', name: 'كركوك (المركز والقلعة)', isCenter: true },
      { id: 'hawija', name: 'الحويجة' },
      { id: 'daquq', name: 'داقوق' },
      { id: 'dibs', name: 'دبس' },
      { id: 'altun-kupri', name: 'التون كوبري' },
      { id: 'rashad', name: 'الرشاد' },
      { id: 'riyadh', name: 'الرياض' },
      { id: 'abbasi-kirkuk', name: 'العباسي' },
    ],
  },
  {
    id: 'nineveh',
    name: 'نينوى',
    tagline: 'الموصل الحدباء وأم الربيعين العريقة',
    center: { lat: 36.3489, lng: 43.1577 },
    districts: [
      { id: 'mosul-left', name: 'الموصل (الجانب الأيسر)', isCenter: true },
      { id: 'mosul-right', name: 'الموصل (الجانب الأيمن القديم)', isCenter: true },
      { id: 'tal-afar', name: 'تلعفر' },
      { id: 'sinjar', name: 'سنجار' },
      { id: 'hamdaniya', name: 'الحمدانية (قره قوش)' },
      { id: 'sheikhan', name: 'الشيخان' },
      { id: 'hadhar', name: 'الحضر' },
      { id: 'qayyarah', name: 'القيارة' },
      { id: 'bartella', name: 'برطلة' },
      { id: 'bashiqa', name: 'بعشيقة' },
      { id: 'rabia', name: 'ربيعة' },
      { id: 'hamam-al-alil', name: 'حمام العليل' },
    ],
  },
];

// Helper: Find governorate by ID
export function getGovernorate(id: string): Governorate | undefined {
  return IRAQ_GOVERNORATES.find((g) => g.id === id);
}

// Helper: Calculate distance between two GPS coordinates in KM (Haversine formula)
export function getCoordinatesDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Accurate Real-World Coordinates for All Iraqi Districts across 15 Governorates
export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Dhi Qar - ذي قار
  shatrah: { lat: 31.4087, lng: 46.1738 },
  nasiriyah: { lat: 31.0543, lng: 46.2625 },
  rifai: { lat: 31.6214, lng: 46.0601 },
  'suq-al-shuyukh': { lat: 30.8872, lng: 46.4674 },
  chibayish: { lat: 30.9702, lng: 47.0142 },
  gharraf: { lat: 31.2941, lng: 46.2312 },
  'qalat-sukkar': { lat: 31.8601, lng: 45.9520 },
  dawayah: { lat: 31.5794, lng: 46.4719 },
  fajr: { lat: 31.7820, lng: 45.8900 },
  nasr: { lat: 31.5200, lng: 46.1000 },
  bathaa: { lat: 31.0600, lng: 45.9700 },
  'karmat-bani-saeed': { lat: 30.8250, lng: 46.5410 },
  islah: { lat: 31.1820, lng: 46.4720 },
  fahud: { lat: 30.9630, lng: 46.7210 },
  manar: { lat: 30.9250, lng: 46.9050 },

  // Baghdad - بغداد
  rusafa: { lat: 33.3406, lng: 44.4121 },
  karkh: { lat: 33.3152, lng: 44.3661 },
  kadhimiya: { lat: 33.3800, lng: 44.3400 },
  mansour: { lat: 33.3100, lng: 44.3500 },
  karrada: { lat: 33.3000, lng: 44.4250 },
  adhamiya: { lat: 33.3700, lng: 44.3700 },
  'sadr-city': { lat: 33.3850, lng: 44.4600 },
  shaab: { lat: 33.4200, lng: 44.3900 },
  dora: { lat: 33.2500, lng: 44.4000 },
  saydiyah: { lat: 33.2600, lng: 44.3400 },
  ghazaliya: { lat: 33.3300, lng: 44.2700 },
  amiriya: { lat: 33.3000, lng: 44.2900 },
  mahmudiyah: { lat: 33.0600, lng: 44.3500 },
  madain: { lat: 33.1000, lng: 44.5800 },
  tarmiyah: { lat: 33.6700, lng: 44.3800 },
  'abu-ghraib': { lat: 33.3000, lng: 44.1800 },

  // Basra - البصرة
  'basra-center': { lat: 30.5081, lng: 47.7835 },
  zubair: { lat: 30.3900, lng: 47.7000 },
  qurna: { lat: 31.0100, lng: 47.4300 },
  'shatt-al-arab': { lat: 30.5400, lng: 47.8800 },
  'abu-al-khaseeb': { lat: 30.4500, lng: 47.9800 },
  fao: { lat: 29.9800, lng: 48.4700 },
  medina: { lat: 30.9400, lng: 47.2600 },
  deir: { lat: 30.8000, lng: 47.5700 },
  hartha: { lat: 30.6300, lng: 47.7600 },
  'um-qasr': { lat: 30.0400, lng: 47.9200 },
  'imam-sadiq': { lat: 30.9100, lng: 47.3800 },

  // Najaf - النجف الأشرف
  'najaf-center': { lat: 32.0006, lng: 44.3314 },
  kufa: { lat: 32.0300, lng: 44.4000 },
  manadhira: { lat: 31.8500, lng: 44.5000 },
  meshkhab: { lat: 31.8000, lng: 44.4900 },
  heera: { lat: 31.8800, lng: 44.4700 },
  abbasiyah: { lat: 32.1200, lng: 44.4500 },
  'qadisiyah-najaf': { lat: 31.7500, lng: 44.5200 },

  // Karbala - كربلاء المقدسة
  'karbala-center': { lat: 32.6160, lng: 44.0249 },
  hindiya: { lat: 32.5500, lng: 44.2200 },
  'ain-tamur': { lat: 32.5700, lng: 43.4800 },
  hurr: { lat: 32.6300, lng: 43.9800 },
  hussainiya: { lat: 32.6900, lng: 44.0900 },
  'jadwal-gharbi': { lat: 32.5200, lng: 44.1800 },

  // Babil - بابل
  hillah: { lat: 32.4840, lng: 44.4308 },
  mahawil: { lat: 32.6500, lng: 44.4000 },
  musayyib: { lat: 32.7800, lng: 44.2900 },
  hashimiyah: { lat: 32.3500, lng: 44.6500 },
  hashimiya: { lat: 32.3500, lng: 44.6500 },
  iskandariya: { lat: 32.9000, lng: 44.3500 },
  qasim: { lat: 32.3000, lng: 44.6800 },
  kifl: { lat: 32.2200, lng: 44.3700 },
  jabala: { lat: 32.8500, lng: 44.7500 },
  'saddat-al-hindiya': { lat: 32.7100, lng: 44.2700 },
  neel: { lat: 32.5500, lng: 44.5500 },

  // Maysan - ميسan
  amara: { lat: 31.8437, lng: 47.1448 },
  amarah: { lat: 31.8437, lng: 47.1448 },
  'ali-al-gharbi': { lat: 32.4600, lng: 46.6800 },
  maymouna: { lat: 31.7400, lng: 46.9700 },
  majar: { lat: 31.5800, lng: 47.1600 },
  'majar-al-kabir': { lat: 31.5800, lng: 47.1600 },
  'qalat-saleh': { lat: 31.5100, lng: 47.2800 },
  kahlaa: { lat: 31.7200, lng: 47.3000 },
  musharrah: { lat: 31.8800, lng: 47.3500 },
  kumait: { lat: 32.1800, lng: 46.8800 },
  'salam-maysan': { lat: 31.6700, lng: 46.8500 },

  // Wasit - واسط
  kut: { lat: 32.5126, lng: 45.8338 },
  hai: { lat: 32.1700, lng: 46.0400 },
  numaniyah: { lat: 32.5400, lng: 45.4100 },
  suwaira: { lat: 32.9200, lng: 44.7700 },
  aziziya: { lat: 32.9100, lng: 45.0600 },
  badra: { lat: 33.1100, lng: 45.9600 },
  jassan: { lat: 33.0000, lng: 46.0800 },
  'sheikh-saad': { lat: 32.5600, lng: 46.3000 },
  ahrar: { lat: 32.4200, lng: 45.6200 },
  'taj-al-din': { lat: 32.8500, lng: 45.2800 },

  // Muthanna - المثنى
  samawah: { lat: 31.3243, lng: 45.2809 },
  rumaitha: { lat: 31.5200, lng: 45.2000 },
  khidhir: { lat: 31.1800, lng: 45.4200 },
  warkaa: { lat: 31.3200, lng: 45.4000 },
  salman: { lat: 30.5000, lng: 44.7200 },
  najmi: { lat: 31.6000, lng: 45.1500 },
  hilal: { lat: 31.4200, lng: 45.2200 },
  majd: { lat: 31.5500, lng: 45.1800 },

  // Qadisiyah - الديوانية
  diwaniyah: { lat: 31.9928, lng: 44.9254 },
  'diwaniyah-center': { lat: 31.9928, lng: 44.9254 },
  shamiya: { lat: 31.9600, lng: 44.6000 },
  shamiyah: { lat: 31.9600, lng: 44.6000 },
  afak: { lat: 32.0600, lng: 45.2400 },
  hamza: { lat: 31.7300, lng: 44.9800 },
  saniyah: { lat: 32.1000, lng: 44.8800 },
  ghamas: { lat: 31.7500, lng: 44.6200 },
  muhannawiya: { lat: 32.0500, lng: 44.5200 },
  dighara: { lat: 32.1200, lng: 44.9800 },
  shinafiya: { lat: 31.5800, lng: 44.6500 },
  sumer: { lat: 31.8500, lng: 45.1200 },

  // Diyala - ديالى
  baqubah: { lat: 33.7584, lng: 44.6437 },
  miqdadiyah: { lat: 33.9800, lng: 44.9300 },
  muqdadiyah: { lat: 33.9800, lng: 44.9300 },
  khalis: { lat: 33.8500, lng: 44.5200 },
  khanaqin: { lat: 34.3500, lng: 45.3800 },
  baladrouz: { lat: 33.6800, lng: 45.0200 },
  mandali: { lat: 33.7500, lng: 45.5500 },
  jalawla: { lat: 34.2800, lng: 45.1600 },
  saadiyah: { lat: 34.1800, lng: 45.1200 },
  kanaan: { lat: 33.6500, lng: 44.8200 },
  habhab: { lat: 33.7000, lng: 44.5000 },

  // Salah al-Din - صلاح الدين
  tikrit: { lat: 34.6060, lng: 43.6820 },
  samarra: { lat: 34.2000, lng: 43.8800 },
  balad: { lat: 34.0100, lng: 44.1400 },
  dujail: { lat: 33.8800, lng: 44.2400 },
  baiji: { lat: 34.9300, lng: 43.4900 },
  'tuz-khurmatu': { lat: 34.8800, lng: 44.6300 },
  shirqat: { lat: 35.5000, lng: 43.2400 },
  dhuluia: { lat: 33.9600, lng: 44.2800 },
  yathrib: { lat: 33.9200, lng: 44.2200 },
  amerli: { lat: 34.7200, lng: 44.5800 },

  // Anbar - الأنبار
  ramadi: { lat: 33.4241, lng: 43.2985 },
  fallujah: { lat: 33.3500, lng: 43.7800 },
  hit: { lat: 33.6400, lng: 42.8200 },
  haditha: { lat: 34.1400, lng: 42.3800 },
  qaim: { lat: 34.3600, lng: 41.0800 },
  rutba: { lat: 33.0300, lng: 40.2800 },
  ana: { lat: 34.4600, lng: 41.9500 },
  rawa: { lat: 34.4800, lng: 41.9200 },
  karma: { lat: 33.4300, lng: 43.9000 },
  khaldiyah: { lat: 33.3800, lng: 43.5200 },
  'baghdadi-anbar': { lat: 33.8200, lng: 42.5500 },

  // Kirkuk - كركوك
  'kirkuk-center': { lat: 35.4681, lng: 44.3922 },
  hawija: { lat: 35.3200, lng: 43.7700 },
  daquq: { lat: 35.1500, lng: 44.4400 },
  dibs: { lat: 35.6800, lng: 44.0200 },
  'altun-kupri': { lat: 35.7500, lng: 44.1400 },
  rashad: { lat: 35.0800, lng: 44.2200 },
  riyadh: { lat: 35.2500, lng: 43.9200 },
  'abbasi-kirkuk': { lat: 35.4200, lng: 43.6800 },

  // Nineveh - نينوى
  'mosul-center': { lat: 36.3489, lng: 43.1577 },
  'mosul-left': { lat: 36.3650, lng: 43.1650 },
  'mosul-right': { lat: 36.3350, lng: 43.1350 },
  'tal-afar': { lat: 36.3700, lng: 42.4500 },
  'tel-afar': { lat: 36.3700, lng: 42.4500 },
  sinjar: { lat: 36.3200, lng: 41.8600 },
  hamdaniya: { lat: 36.2700, lng: 43.3700 },
  sheikhan: { lat: 36.6800, lng: 43.3500 },
  hadhar: { lat: 35.5800, lng: 42.7200 },
  qayyarah: { lat: 35.8000, lng: 43.2800 },
  bartella: { lat: 36.3500, lng: 43.3800 },
  bashiqa: { lat: 36.4500, lng: 43.3500 },
  rabia: { lat: 36.8000, lng: 42.1000 },
  'hamam-al-alil': { lat: 36.1600, lng: 43.2500 },
};

// GPS Closest Governorate and Exact District Detection
export function findNearestGovernorate(lat: number, lng: number): {
  governorate: Governorate;
  district: District;
  distanceKm: number;
} {
  let closestGov = IRAQ_GOVERNORATES[0];
  let minGovDistance = Infinity;

  // 1. Identify closest governorate center
  for (const gov of IRAQ_GOVERNORATES) {
    const dist = getCoordinatesDistanceKm(lat, lng, gov.center.lat, gov.center.lng);
    if (dist < minGovDistance) {
      minGovDistance = dist;
      closestGov = gov;
    }
  }

  // 2. Identify exact closest district within the governorate based on district GPS coordinates
  let closestDistrict = closestGov.districts.find((d) => d.isCenter) || closestGov.districts[0];
  let minDistrictDist = Infinity;

  for (const district of closestGov.districts) {
    const coords = district.center || DISTRICT_COORDINATES[district.id];
    if (coords) {
      const dist = getCoordinatesDistanceKm(lat, lng, coords.lat, coords.lng);
      if (dist < minDistrictDist) {
        minDistrictDist = dist;
        closestDistrict = district;
      }
    }
  }

  return {
    governorate: closestGov,
    district: closestDistrict,
    distanceKm: minDistrictDist < Infinity ? minDistrictDist : minGovDistance,
  };
}

// Default initial location: Baghdad (Capital of Iraq)
export const DEFAULT_USER_LOCATION: UserLocation = {
  governorateId: 'baghdad',
  districtId: 'karkh',
  governorateName: 'بغداد',
  districtName: 'الكرخ',
  isAutoDetected: false,
};
