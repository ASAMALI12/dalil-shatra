import React, { useState } from 'react';
import {
  X,
  Camera,
  Tag,
  Phone,
  MessageCircle,
  MapPin,
  Sparkles,
  DollarSign,
  Briefcase,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useNotification } from '../context/NotificationContext';

interface AddCommunityPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postType: 'used_goods' | 'lost_found' | 'job';
  governorateId: string;
  governorateName: string;
  districtId: string;
  districtName: string;
  onPostAdded?: (item: DirectoryItem) => void;
}

// Preset photo options for quick pick when user doesn't have a photo ready
const PRESET_USED_PHOTOS = [
  { label: 'موبايل وإلكترونيات', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80' },
  { label: 'أجهزة منزلية وكهربائية', url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80' },
  { label: 'أثاث وغرف', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80' },
  { label: 'سيارات ودراجات', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80' },
  { label: 'لابتوب وكمبيوتر', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80' },
];

const PRESET_LOST_PHOTOS = [
  { label: 'مستمسكات وأوراق', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80' },
  { label: 'محفظة ونقود', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80' },
  { label: 'مفاتيح سيارة/منزل', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80' },
  { label: 'هاتف شخصي', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80' },
];

const PRESET_JOB_PHOTOS = [
  { label: 'مطعم ومأكولات', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80' },
  { label: 'متجر ومبيعات', url: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=600&auto=format&fit=crop&q=80' },
  { label: 'كاشير ومحاسبة', url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80' },
  { label: 'توصيل ودليفري', url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&auto=format&fit=crop&q=80' },
  { label: 'مهن وحرف وصيانة', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80' },
];

export const AddCommunityPostModal: React.FC<AddCommunityPostModalProps> = ({
  isOpen,
  onClose,
  postType,
  governorateId,
  governorateName,
  districtId,
  districtName,
  onPostAdded,
}) => {
  const { addStore } = useDirectory();
  const { addNotification } = useNotification();

  const [title, setTitle] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('مستعمل نظيف جداً');
  const [jobMode, setJobMode] = useState<'employer' | 'seeker'>('employer');
  const [lostType, setLostType] = useState<'lost' | 'found'>('lost');
  const [salary, setSalary] = useState('');
  const [workHours, setWorkHours] = useState('دوام مسائي');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Header configs per type
  const typeConfig = {
    used_goods: {
      headerTitle: 'إضافة مادة في سوق المستعمل ♻️',
      subHeader: `نشر إعلان بيع مادة أو جهاز مستعمل في ${districtName !== 'all' ? districtName : governorateName}`,
      titleLabel: 'اسم المادة المستعملة *',
      titlePlaceholder: 'مثال: آيفون 13 برو نظيف 256 كيكا، غسالة إل جي 7 كيلو...',
      defaultPhoto: PRESET_USED_PHOTOS[0].url,
      presets: PRESET_USED_PHOTOS,
    },
    lost_found: {
      headerTitle: 'قسم المفقودات والموجودات 🔍',
      subHeader: `الإبلاغ عن مفقود أو مادة عُثر عليها في ${districtName !== 'all' ? districtName : governorateName}`,
      titleLabel: 'اسم الشيء المفقود أو المعثور عليه *',
      titlePlaceholder: 'مثال: حقيبة مستمسكات باسم... أو مفاتيح سيارة تويوتا...',
      defaultPhoto: PRESET_LOST_PHOTOS[0].url,
      presets: PRESET_LOST_PHOTOS,
    },
    job: {
      headerTitle: 'إعلان وظيفة / طلب موظف أو عامل 💼',
      subHeader: `نشر فرصة عمل أو طلب كادر وظيفي في ${districtName !== 'all' ? districtName : governorateName}`,
      titleLabel: jobMode === 'employer' ? 'الوظيفة المطلوبة (المسمى) *' : 'مجال العمل أو المهنة *',
      titlePlaceholder: jobMode === 'employer' ? 'مثال: مطلوب كاشير لمطعم، مطلوب خلفة كباب، مطلوب مندوب...' : 'مثال: باحث عن عمل سائق، محاسب، خبرة مبيعات...',
      defaultPhoto: PRESET_JOB_PHOTOS[0].url,
      presets: PRESET_JOB_PHOTOS,
    },
  }[postType];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('يرجى كتابة الاسم أو العنوان الرئيسي');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      alert('يرجى إدخال رقم هاتف صحيح للتواصل (7 أرقام على الأقل)');
      return;
    }

    const cleanPhone = phone.trim();
    const cleanWhatsapp = whatsapp.trim() || `964${cleanPhone.replace(/^0/, '')}`;
    const selectedImage = imageUrl.trim() || typeConfig.defaultPhoto;

    const newItemId = `post-${postType}-${Date.now()}`;

    // Map category
    let categoryKey = 'used-goods';
    let subCategoryText = condition;
    let tagsList = ['مستعمل', governorateName];

    if (postType === 'lost_found') {
      categoryKey = 'lost-found';
      subCategoryText = lostType === 'lost' ? 'مفقود (بحث)' : 'معثور عليه (أمانة)';
      tagsList = ['مفقودات', lostType === 'lost' ? 'مفقود' : 'معثور عليه', governorateName];
    } else if (postType === 'job') {
      categoryKey = 'jobs';
      subCategoryText = jobMode === 'employer' ? 'مطلوب موظف/عامل' : 'باحث عن عمل';
      tagsList = ['وظائف', 'عمل', jobMode === 'employer' ? 'شاغر' : 'طلب عمل', governorateName];
    }

    const newItem: DirectoryItem = {
      id: newItemId,
      name: title.trim(),
      category: categoryKey,
      subCategory: subCategoryText,
      phone: cleanPhone,
      whatsapp: cleanWhatsapp,
      address: address.trim() || `${governorateName} - ${districtName !== 'all' ? districtName : 'المركز'}`,
      governorateId,
      governorateName,
      districtId: districtId !== 'all' ? districtId : 'center',
      districtName: districtName !== 'all' ? districtName : 'المركز',
      rating: null,
      reviewsCount: 0,
      isOpen: true,
      workingHours: postType === 'job' ? workHours : 'متاح للتواصل',
      imageUrl: selectedImage,
      description: description.trim() || `${title} - متاح للتواصل والاستفسار في ${governorateName}.`,
      itemType: postType,
      price: postType === 'used_goods' ? price.trim() || 'قابل للتفاوض' : undefined,
      condition: postType === 'used_goods' ? condition : undefined,
      salary: postType === 'job' ? salary.trim() || 'يحدد بالمقابلة' : undefined,
      jobType: postType === 'job' ? workHours : undefined,
      tags: tagsList,
    };

    // Save to context
    addStore(newItem);

    // Broadcast instant notification
    if (postType === 'used_goods') {
      addNotification({
        title: `♻️ سلعة مستعملة جديدة: ${title}`,
        message: `تم إضافة "${title}" بسعر (${price || 'قابل للتفاوض'}) في ${governorateName}! تواصل مع المعلن الآن.`,
        type: 'store',
        targetId: newItemId,
        targetType: 'store',
        imageUrl: selectedImage,
      });
    } else if (postType === 'lost_found') {
      addNotification({
        title: `🔍 ${lostType === 'lost' ? 'بلاغ مفقود' : 'تم العثور على'}: ${title}`,
        message: `${subCategoryText} في ${governorateName} - ${districtName}. للمساعدة والتواصل اضغط هنا.`,
        type: 'system',
        targetId: newItemId,
        targetType: 'store',
        imageUrl: selectedImage,
      });
    } else {
      addNotification({
        title: `💼 ${jobMode === 'employer' ? 'فرصة عمل' : 'طلب وظيفة'}: ${title}`,
        message: `${title} - ${salary ? `الراتب: ${salary}` : ''} في ${governorateName}. تواصل مع جهة الإعلان!`,
        type: 'store',
        targetId: newItemId,
        targetType: 'store',
        imageUrl: selectedImage,
      });
    }

    if (onPostAdded) {
      onPostAdded(newItem);
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-sky-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 text-xl shadow-xs">
              {postType === 'used_goods' ? '♻️' : postType === 'lost_found' ? '🔍' : '💼'}
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                {typeConfig.headerTitle}
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                {typeConfig.subHeader}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 flex-1">
          {isSuccess ? (
            <div className="py-12 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h4 className="font-display text-lg font-bold text-slate-900">
                تم نشر الإعلان وبث الإشعار بنجاح! 🎉
              </h4>
              <p className="text-xs text-slate-600">
                إعلانك الآن متاح لجميع مستخدمي التطبيق في {governorateName}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Switcher for Jobs (Employer vs Seeker) */}
              {postType === 'job' && (
                <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setJobMode('employer')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      jobMode === 'employer'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>أبحث عن موظف أو عامل (صاحب عمل)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobMode('seeker')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      jobMode === 'seeker'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>طلب وظيفة (باحث عن عمل)</span>
                  </button>
                </div>
              )}

              {/* Type Switcher for Lost & Found */}
              {postType === 'lost_found' && (
                <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLostType('lost')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      lostType === 'lost'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🔍 فقدت شيئاً (بلاغ فقدان)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLostType('found')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      lostType === 'found'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🤲 عثرت على شيء (أمانة)</span>
                  </button>
                </div>
              )}

              {/* Title Field */}
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  {typeConfig.titleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={typeConfig.titlePlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Used Goods Specific Fields */}
              {postType === 'used_goods' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                      السعر المطلوب 💰
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="مثال: 350 ألف أو قابل للتفاوض"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                      حالة المستعمل ⭐
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      <option value="مستعمل نظيف جداً كالجديد">مستعمل نظيف جداً كالجديد</option>
                      <option value="مستعمل بحالة جيدة جداً">مستعمل بحالة جيدة جداً</option>
                      <option value="مستعمل خفيف">مستعمل خفيف</option>
                      <option value="مستعمل عادي">مستعمل عادي</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Job Specific Fields */}
              {postType === 'job' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                      الراتب المقترح 💵
                    </label>
                    <input
                      type="text"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="مثال: 600 ألف د.ع أو يحدد بالمقابلة"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                      طبيعة الدوام ⏰
                    </label>
                    <select
                      value={workHours}
                      onChange={(e) => setWorkHours(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      <option value="دوام كامل (صباحي ومسائي)">دوام كامل (صباحي ومسائي)</option>
                      <option value="دوام صباحي فقط">دوام صباحي فقط</option>
                      <option value="دوام مسائي فقط">دوام مسائي فقط</option>
                      <option value="دوام جزئي أو ساعات مرنة">دوام جزئي أو ساعات مرنة</option>
                      <option value="أجر يومي أو بالقطعة">أجر يومي أو بالقطعة</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Phone & WhatsApp Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    رقم الهاتف للتواصل * 📱
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute right-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="078XXXXXXXX"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-2 text-xs font-mono font-bold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    رقم الواتساب (اختياري)
                  </label>
                  <div className="relative flex items-center">
                    <MessageCircle className="absolute right-3 h-3.5 w-3.5 text-emerald-500 pointer-events-none" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="رقم الواتساب"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-2 text-xs font-mono font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Location Detail */}
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  المنطقة أو الحي في {governorateName} 📍
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={`مثال: ${districtName !== 'all' ? districtName : 'المركز'} - شارع النصر أو قرب السوق`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Photo Options (Upload or Quick Pick) */}
              <div className="space-y-2 rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="block font-display text-xs font-bold text-slate-700">
                    صورة الإعلان (ارفع صورة أو اختر صورة جاهزة) 📸
                  </label>
                  <label className="text-[11px] bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    <span>رفع صورة من الهاتف</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset Fast Selection */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {typeConfig.presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        imageUrl === preset.url
                          ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <img src={preset.url} alt="" className="h-3.5 w-3.5 rounded object-cover" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                {/* Image Preview if selected */}
                {imageUrl && (
                  <div className="relative h-24 w-full rounded-xl overflow-hidden bg-slate-200">
                    <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  تفاصيل وملاحظات إضافية ✍️
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب أي مواصفات أو تفاصيل يحتاج الزبون أو المتصل معرفتها..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:from-sky-700 hover:to-indigo-700 active:scale-98 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>نشر الإعلان فوراً وبث الإشعار مجاناً</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
