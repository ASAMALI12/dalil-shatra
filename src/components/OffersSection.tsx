import React from 'react';
import { Offer } from '../types/shatrah';
import { OFFERS_DATA } from '../data/shatrahData';

interface OffersSectionProps {
  onSelectOffer: (offer: Offer) => void;
  onViewAllOffers: () => void;
}

export const OffersSection: React.FC<OffersSectionProps> = ({
  onSelectOffer,
  onViewAllOffers,
}) => {
  return (
    <section className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-slate-900 flex items-center gap-1.5">
          <span>العروض والتخفيضات</span>
          <span className="text-xl">🔥</span>
        </h3>

        <button
          type="button"
          onClick={onViewAllOffers}
          className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
        >
          شاهد جميع العروض
        </button>
      </div>

      {/* Offers Cards Grid / Horizontal Scroll */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {OFFERS_DATA.slice(0, 3).map((offer) => (
          <div
            key={offer.id}
            onClick={() => onSelectOffer(offer)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
          >
            {/* Top Image with Discount Badge */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
              <img
                src={offer.imageUrl}
                alt={offer.businessName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Red Discount Badge */}
              <div className="absolute top-2.5 right-2.5 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                {offer.discountPercentage}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-1 flex-col justify-between p-3.5 text-center">
              <div>
                <h4 className="font-display text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                  {offer.businessName}
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-600 line-clamp-1">
                  {offer.title}
                </p>
              </div>

              {/* Expiration Tag */}
              <div className="mt-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400">
                  {offer.expiresIn}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
