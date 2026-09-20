import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Tag,
  Search,
  MessageCircle,
  Phone,
  Star,
  Plus,
  Edit3,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { DirectoryItem, StoreMenuItem } from '../types/shatrah';
import { getStoreMenu } from '../utils/storeMenuHelper';

interface StoreMenuSectionProps {
  item: DirectoryItem;
  isOwner: boolean;
  onOpenMenuEditor?: () => void;
  onOpenImageZoom?: (url: string) => void;
}

export const StoreMenuSection: React.FC<StoreMenuSectionProps> = ({
  item,
  isOwner,
  onOpenMenuEditor,
  onOpenImageZoom,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);

  // Get authentic items (strictly custom/owner-defined, no fake fallback data)
  const menuItems = getStoreMenu(item);
  const hasMenuPhotos = Array.isArray(item.menuImages) && item.menuImages.length > 0;
  const hasMenuData = menuItems.length > 0 || hasMenuPhotos;

  // Extract unique categories from real items
  const categories = Array.from(
    new Set(menuItems.map((m) => m.category).filter(Boolean) as string[])
  );

  // Filter items
  const filteredItems = menuItems.filter((m) => {
    const matchesCategory =
      selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.price && m.price.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOrderWhatsApp = (menuItem: StoreMenuItem) => {
    const phoneToUse = item.whatsapp || item.phone;
    if (!phoneToUse) return;

    const cleanPhone = phoneToUse.replace(/\D/g, '');
    const message = `مرحباً ${item.name}، أود الاستفسار والطلب من قائمتكم:\n- الصنف: ${menuItem.name}\n- السعر: ${menuItem.price}\nهل هذا الصنف متوفر حالياً؟`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInquireFullMenu = () => {
    const phoneToUse = item.whatsapp || item.phone;
    if (!phoneToUse) return;

    const cleanPhone = phoneToUse.replace(/\D/g, '');
    const message = `السلام عليكم ${item.name}، أود الاستفسار عن أحدث قائمة أسعار ومنيو متوفر لديكم والخدمات الحالية.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCallPhone = () => {
    if (!item.phone) return;
    window.location.href = `tel:${item.phone}`;
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-xs sm:text-sm font-black text-slate-900">
                قائمة الأسعار والمنيو
              </h3>
              {hasMenuData ? (
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                  {menuItems.length > 0 ? `${menuItems.length} أصناف مسجلة` : 'منيو مصور'}
                </span>
              ) : (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600">
                  غير مدرج حالياً
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              الأسعار وقوائم الخدمات المعتمدة لدى {item.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Owner Edit Menu Button */}
          {isOwner && onOpenMenuEditor && (
            <button
              type="button"
              onClick={onOpenMenuEditor}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="h-3 w-3" />
              <span>{hasMenuData ? 'تعديل المنيو' : 'إضافة المنيو'}</span>
            </button>
          )}

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title={isMenuExpanded ? 'طي المنيو' : 'عرض المنيو'}
          >
            {isMenuExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Body */}
      {isMenuExpanded && (
        <div className="space-y-3">
          {/* CASE 1: No authentic menu or photos uploaded yet */}
          {!hasMenuData ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center space-y-3">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                <UtensilsCrossed className="h-5 w-5" />
              </div>

              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-display text-xs sm:text-sm font-bold text-slate-800">
                  لم يقم المتجر برفع قائمة الأسعار أو المنيو بعد
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  حرصاً على دقة المعلومات وعدم عرض أي أسعار غير صحيحة، لم تُدرج أي أسعار تقديرية. يمكنك الاستفسار عن أحدث الأسعار والوجبات أو الخدمات مباشرة من إدارة المتجر.
                </p>
              </div>

              {/* Owner Call-To-Action if current user owns this store */}
              {isOwner && onOpenMenuEditor ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-right flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="text-right">
                    <span className="font-display text-xs font-bold text-emerald-950 block">
                      👑 أنت المالك المعتمد لهذا المتجر
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      يمكنك الآن إضافة أصناف المنيو الحقيقية وقائمة الأسعار أو رفع صور المنيو الورقية من هاتفك.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenMenuEditor}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة قائمة الأسعار والمنيو 📋</span>
                  </button>
                </div>
              ) : (
                /* Customer Contact Actions */
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {(item.whatsapp || item.phone) && (
                    <button
                      type="button"
                      onClick={handleInquireFullMenu}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>طلب المنيو والأسعار عبر واتساب 💬</span>
                    </button>
                  )}

                  {item.phone && (
                    <button
                      type="button"
                      onClick={handleCallPhone}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>اتصال للاستفسار 📞</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* CASE 2: Authentic menu or photos exist */
            <>
              {/* Photographed Menu Gallery if uploaded */}
              {hasMenuPhotos && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Camera className="h-3.5 w-3.5 text-amber-700" />
                    <span>صور المنيو وقائمة الأسعار المصورة المعتمدة:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {item.menuImages!.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => onOpenImageZoom?.(img)}
                        className="group relative aspect-4/3 rounded-lg overflow-hidden border border-amber-200 bg-white cursor-pointer shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src={img}
                          alt={`منيو ${item.name} - ${idx + 1}`}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-0.5 rounded-md">
                            تكبير الصورة 🔍
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search and Category Filters (if items exist) */}
              {menuItems.length > 0 && (
                <div className="space-y-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث في أصناف القائمة..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pr-8 pl-3 text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-amber-400 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        مسح
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  {categories.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                          selectedCategory === 'all'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        الكل ({menuItems.length})
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Menu Items List */}
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredItems.map((menuItem) => (
                    <div
                      key={menuItem.id}
                      className="group relative flex flex-col justify-between p-3 rounded-2xl border border-slate-150 bg-slate-50/60 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all"
                    >
                      <div className="space-y-1">
                        {/* Category & Badge */}
                        <div className="flex items-center justify-between gap-1.5">
                          {menuItem.category && (
                            <span className="text-[10px] font-bold text-slate-500">
                              {menuItem.category}
                            </span>
                          )}
                          {menuItem.popular && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[9px] font-bold">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              مميز
                            </span>
                          )}
                        </div>

                        {/* Item Name */}
                        <h4 className="font-display text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-950 transition-colors">
                          {menuItem.name}
                        </h4>

                        {/* Description */}
                        {menuItem.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {menuItem.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Order Action */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 mt-2">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-emerald-600" />
                          <span className="font-display text-xs sm:text-sm font-black text-emerald-700 font-mono">
                            {menuItem.price}
                          </span>
                        </div>

                        {/* Quick WhatsApp Order Button */}
                        {(item.whatsapp || item.phone) && (
                          <button
                            type="button"
                            onClick={() => handleOrderWhatsApp(menuItem)}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer active:scale-95"
                            title="طلب هذا الصنف مباشرة عبر واتساب"
                          >
                            <MessageCircle className="h-3 w-3 text-emerald-600" />
                            <span>طلب عبر واتساب</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : menuItems.length > 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                  <Tag className="h-6 w-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">لا توجد نتائج مطابقة لبحثك</p>
                  <p className="text-[10px] text-slate-400">جرب البحث بكلمة أخرى أو مسح فلتر البحث</p>
                </div>
              ) : null}

              {/* General Menu Inquiry Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                <div className="flex items-center gap-2 text-amber-950">
                  <Tag className="h-4 w-4 text-amber-700 shrink-0" />
                  <span className="text-[11px] font-medium">
                    الأسعار مسجلة ومعتمدة من قبل إدارة المتجر.
                  </span>
                </div>

                {(item.whatsapp || item.phone) && (
                  <button
                    type="button"
                    onClick={handleInquireFullMenu}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>مراسلة المتجر عبر واتساب 💬</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
