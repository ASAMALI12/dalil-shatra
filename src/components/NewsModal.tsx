import React from 'react';
import { X, Newspaper, Calendar, Clock, ArrowRight } from 'lucide-react';
import { CITY_NEWS_DATA } from '../data/shatrahData';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800 text-lg">
              📰
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                أخبار وفعاليات مدينة الشطرة
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                آخر التحديثات والمشاريع البلدية والخدمية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* News Feed */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {CITY_NEWS_DATA.map((news) => (
            <article
              key={news.id}
              className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all"
            >
              {news.imageUrl && (
                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                    {news.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{news.date}</span>
                  </div>
                </div>

                <h4 className="font-display text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {news.title}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {news.summary}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-3.5 bg-slate-50 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
