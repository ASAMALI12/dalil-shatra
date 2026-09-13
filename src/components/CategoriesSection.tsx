import React from 'react';
import { 
  DoctorIcon, 
  ClothingIcon, 
  RestaurantIcon, 
  BeautyIcon, 
  PharmacyIcon, 
  ElectronicsIcon, 
  ServicesIcon, 
  OtherIcon 
} from './CategoryIcons';
import { Category } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';

interface CategoriesSectionProps {
  onSelectCategory: (categoryId: string, categoryTitle: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({ onSelectCategory }) => {
  const { categories, getItemCountByCategory } = useDirectory();

  const mainCategories = categories.filter((c) => c.isMain);
  const subCategories = categories.filter((c) => !c.isMain);

  const renderIcon = (type: Category['iconType'], isMain: boolean = false) => {
    const sizeClass = isMain ? "w-14 h-14 sm:w-16 sm:h-16" : "w-10 h-10 sm:w-11 sm:h-11";
    switch (type) {
      case 'doctor':
        return <DoctorIcon className={sizeClass} />;
      case 'clothing':
        return <ClothingIcon className={sizeClass} />;
      case 'restaurant':
        return <RestaurantIcon className={sizeClass} />;
      case 'beauty':
        return <BeautyIcon className={sizeClass} />;
      case 'pharmacy':
        return <PharmacyIcon className={sizeClass} />;
      case 'electronics':
        return <ElectronicsIcon className={sizeClass} />;
      case 'services':
        return <ServicesIcon className={sizeClass} />;
      case 'other':
      default:
        return <OtherIcon className={sizeClass} />;
    }
  };

  const getDynamicCountText = (catId: string, defaultText: string) => {
    const count = getItemCountByCategory(catId);
    if (count === 0) return defaultText;
    if (catId === 'doctors') return `${count} طبيب`;
    if (catId === 'clothing') return `${count} محل`;
    if (catId === 'restaurants') return `${count} مطعم`;
    if (catId === 'pharmacies') return `${count} صيدلية`;
    if (catId === 'electronics') return `${count} محل`;
    if (catId === 'beauty') return `${count} صالون`;
    if (catId === 'services') return `${count} خدمة`;
    return `${count} نشاط`;
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Red 4-square grid icon matching image */}
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2 w-2 rounded-xs bg-red-600" />
            <div className="h-2 w-2 rounded-xs bg-red-600" />
            <div className="h-2 w-2 rounded-xs bg-red-600" />
            <div className="h-2 w-2 rounded-xs bg-red-600" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900">
            الأقسام
          </h3>
        </div>
      </div>

      {/* Top 3 Large Main Category Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {mainCategories.map((category) => (
          <div
            key={category.id}
            onClick={() => onSelectCategory(category.id, category.title)}
            className="group flex flex-col items-center justify-between rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer text-center"
          >
            {/* Category Icon */}
            <div className="flex items-center justify-center transition-transform group-hover:scale-105">
              {renderIcon(category.iconType, true)}
            </div>

            {/* Title */}
            <h4 className="mt-2.5 font-display text-xs sm:text-base font-bold text-slate-800 line-clamp-1">
              {category.title}
            </h4>

            {/* Count */}
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
              {getDynamicCountText(category.id, category.countText)}
            </span>

            {/* "عرض الكل" Button */}
            <div className="mt-3 w-full">
              <button
                type="button"
                className="w-full rounded-xl sm:rounded-2xl border border-red-100 bg-red-50/50 py-1.5 px-2 font-display text-[11px] sm:text-xs font-bold text-red-600 group-hover:bg-red-500 group-hover:text-white transition-all cursor-pointer"
              >
                عرض الكل
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom 5 Subcategory Cards */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {subCategories.map((category) => (
          <div
            key={category.id}
            onClick={() => onSelectCategory(category.id, category.title)}
            className="group flex flex-col items-center justify-between rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3.5 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer text-center"
          >
            {/* Category Icon */}
            <div className="flex items-center justify-center transition-transform group-hover:scale-105">
              {renderIcon(category.iconType, false)}
            </div>

            {/* Title */}
            <h4 className="mt-1.5 font-display text-[10px] sm:text-xs font-bold text-slate-800 line-clamp-1">
              {category.title}
            </h4>

            {/* Count */}
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-500">
              {getDynamicCountText(category.id, category.countText)}
            </span>

            {/* "عرض الكل" Button */}
            <div className="mt-2 w-full">
              <button
                type="button"
                className="w-full rounded-lg sm:rounded-xl border border-red-100 bg-red-50/50 py-1 px-1 font-display text-[9px] sm:text-[10px] font-bold text-red-600 group-hover:bg-red-500 group-hover:text-white transition-all cursor-pointer"
              >
                عرض الكل
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
