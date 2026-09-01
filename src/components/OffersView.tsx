import React, { useState } from 'react';
import { Flame, Search, Tag, Clock, Phone, CheckCircle2, Copy } from 'lucide-react';
import { Offer } from '../types/shatrah';
import { OFFERS_DATA } from '../data/shatrahData';

interface OffersViewProps {
  onSelectOffer: (offer: Offer) => void;
}

export const OffersView: React.FC<OffersViewProps> = ({ onSelectOffer }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [claimedCode, setClaimedCode] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'الكل 🔥' },
    { id: 'restaurants', name: 'مطاعم 🍔' },
    { id: 'doctors', name: 'أطباء ومختبرات 🩺' },
    { id: 'clothing', name: 'ألبسة ومحلات 👗' },
    { id: 'pharmacies', name: 'صيدليات 💊' },
    { id: 'electronics', name: 'إلكترونيات 📱' },
  ];

  const filteredOffers = OFFERS_DATA.filter((offer) => {
    const matchCat = selectedCategory === 'all' || offer.category === selectedCategory;
    const matchSearch = !search.trim() || 
      offer.businessName.toLowerCase().includes(search.toLowerCase()) ||
      offer.title.toLowerCase().includes(search.toLowerCase()) ||
      offer.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText?.(code);
    setClaimedCode(code);
    setTimeout(() => setClaimedCode(null), 3000);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* View Header */}
      <div className="rounded-3xl border border-red-200 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 p-6 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔥</span>
          <h2 className="font-display text-xl sm:text-2xl font-bold">
            عروض وتخفيضات الشطرة الحصرية
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-red-100 font-medium max-w-lg">
          وفر أموالك مع أقوى كوبونات الخصم والتخفيضات اليومية من أفضل مطاعم ومحلات وأطباء المدينة!
        </p>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-3">
        <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في العروض والتخفيضات..."
            className="w-full bg-transparent px-2.5 font-display text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOffers.map((offer) => (
          <div
            key={offer.id}
            className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs hover:border-red-300 hover:shadow-lg transition-all"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
              <img
                src={offer.imageUrl}
                alt={offer.businessName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
              />
              <div className="absolute top-3 right-3 rounded-xl bg-red-600 px-3 py-1 font-display text-xs font-bold text-white shadow-md">
                {offer.discountPercentage}
              </div>
            </div>

            <div className="p-4 flex flex-1 flex-col justify-between space-y-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {offer.businessName}
                </h3>
                <p className="font-semibold text-xs text-red-600 mt-0.5">
                  {offer.title}
                </p>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {offer.description}
                </p>
              </div>

              {/* Price & Code Section */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-2">
                {offer.originalPrice && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">السعر بعد الخصم:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-slate-400 text-[11px]">{offer.originalPrice}</span>
                      <span className="font-bold text-red-600 text-sm">{offer.discountedPrice}</span>
                    </div>
                  </div>
                )}

                {offer.couponCode && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                    <span className="text-[11px] font-semibold text-slate-600">كود الخصم:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(offer.couponCode!)}
                      className="flex items-center gap-1 rounded-lg bg-amber-100 hover:bg-amber-200 px-2 py-1 text-[11px] font-mono font-bold text-amber-900 cursor-pointer"
                    >
                      <span>{offer.couponCode}</span>
                      {claimedCode === offer.couponCode ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-400 font-medium">
                  {offer.expiresIn}
                </span>

                {offer.phone && (
                  <a
                    href={`tel:${offer.phone}`}
                    className="flex items-center gap-1 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Phone className="h-3 w-3" />
                    <span>طلب واستفسار</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
