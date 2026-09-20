import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, AlertCircle, Sparkles, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DirectoryItem } from '../types/directory';
import { useDirectory } from '../context/DirectoryContext';
import { apiFetch, safeApiFetch } from '../utils/apiClient';
import { supabase, getIsSupabaseConfigured } from '../lib/supabase';

interface StoreReviewsSectionProps {
  item: DirectoryItem;
}

interface StoreReview {
  id: string;
  store_id: string;
  user_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export const StoreReviewsSection: React.FC<StoreReviewsSectionProps> = ({ item }) => {
  const { updateStore } = useDirectory();
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if current user/device already rated this store
  const localRatedKey = `rated_store_${item.id}`;
  const [hasAlreadyRated, setHasAlreadyRated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(localRatedKey));
  });
  const [savedUserRating, setSavedUserRating] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const val = localStorage.getItem(localRatedKey);
    return val ? parseInt(val, 10) : 0;
  });

  // Load reviews from Supabase or API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadReviews = async () => {
      try {
        // 1. Try Supabase client directly if configured
        if (getIsSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('store_id', item.id)
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            if (isMounted) {
              setReviews(data);
              setIsLoading(false);
            }
            return;
          }
        }

        // 2. Fallback to API / Edge Function
        const resp = await safeApiFetch(`/api/reviews?storeId=${encodeURIComponent(item.id)}`);
        if (resp.ok && resp.data && Array.isArray(resp.data.reviews)) {
          if (isMounted) {
            setReviews(resp.data.reviews);
          }
        }
      } catch {
        // Handled silently
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [item.id]);

  // Calculate real average and count
  const realCount = reviews.length;
  const realAverage =
    realCount > 0
      ? Number((reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / realCount).toFixed(1))
      : item.rating && (item.reviewsCount || 0) > 0
      ? item.rating
      : null;

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasAlreadyRated) return;

    if (selectedStars < 1 || selectedStars > 5) {
      setErrorMessage('يرجى اختيار تقييم بين نجمة واحدة و 5 نجوم.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const deviceId =
      localStorage.getItem('iraq_device_id') ||
      `dev_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    localStorage.setItem('iraq_device_id', deviceId);

    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      store_id: item.id,
      storeId: item.id,
      rating: selectedStars,
      user_name: reviewerName.trim() || 'زائر دليل العراق',
      userName: reviewerName.trim() || 'زائر دليل العراق',
      comment: reviewComment.trim() || undefined,
      device_id: deviceId,
      created_at: new Date().toISOString(),
    };

    try {
      // 1. Submit through API / Edge Function
      const resp = await apiFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview),
      });

      const resData = await resp.json().catch(() => ({}));

      if (!resp.ok && resData?.error) {
        setErrorMessage(resData.error);
        setIsSubmitting(false);
        return;
      }

      // 2. Also save to Supabase client if connected
      if (getIsSupabaseConfigured() && supabase) {
        try {
          await supabase.from('reviews').insert({
            id: newReview.id,
            store_id: item.id,
            rating: selectedStars,
            user_name: newReview.user_name,
            comment: newReview.comment || null,
            created_at: newReview.created_at,
          });
        } catch {
          // Ignore secondary DB insert error
        }
      }

      // Success handling: mark local storage to prevent duplicate ratings
      localStorage.setItem(localRatedKey, String(selectedStars));
      setHasAlreadyRated(true);
      setSavedUserRating(selectedStars);
      setSubmitSuccess(true);
      confetti({ particleCount: 40, spread: 60 });

      // Update local reviews list
      const updatedReviews = [
        {
          id: newReview.id,
          store_id: item.id,
          user_name: newReview.user_name,
          rating: selectedStars,
          comment: newReview.comment,
          created_at: newReview.created_at,
        },
        ...reviews,
      ];
      setReviews(updatedReviews);

      // Recalculate store rating & reviews count
      const updatedCount = updatedReviews.length;
      const updatedAvg = Number(
        (updatedReviews.reduce((acc, curr) => acc + curr.rating, 0) / updatedCount).toFixed(1)
      );

      // Propagate update to DirectoryContext and Supabase store record
      updateStore(item.id, {
        rating: updatedAvg,
        reviewsCount: updatedCount,
      });

      // Reset input fields
      setReviewComment('');
    } catch {
      setErrorMessage('تعذر إرسال التقييم، يرجى التحقق من اتصال الإنترنت.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id={`store-reviews-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs text-right">
      {/* Header & Overall Rating */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span>تقييمات وآراء الزبائن الحقيقية</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تقييمات موثقة من زوار وأهالي المنطقة لخدمات وجودة المتجر
          </p>
        </div>

        {/* Real Rating Badge */}
        <div className="flex items-center gap-2">
          {realAverage !== null && (realCount > 0 || (item.reviewsCount || 0) > 0) ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1 text-slate-900">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      s <= Math.round(realAverage) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-black text-sm text-slate-950 font-mono">{realAverage.toFixed(1)}</span>
              <span className="text-[11px] text-slate-500">
                ({realCount > 0 ? realCount : item.reviewsCount} {realCount === 1 ? 'تقييم' : 'تقييمات'})
              </span>
            </div>
          ) : (
            <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              جديد (لا توجد تقييمات بعد)
            </span>
          )}
        </div>
      </div>

      {/* Review Submission Form / Status */}
      {hasAlreadyRated ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center gap-2.5 text-emerald-900">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">لقد قمت بتقييم هذا المتجر بنجاح! ⭐</span>
            <span className="text-emerald-700">
              تقييمك المسجل: {savedUserRating} من 5 نجوم. شكراً لمساهمتك في دعم دقة دليل العراق.
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-800">أضف تقييمك لهذا المتجر:</span>
            {/* Interactive Stars Selection */}
            <div className="flex items-center gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isActive = (hoveredStars || selectedStars) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setSelectedStars(starVal)}
                    onMouseEnter={() => setHoveredStars(starVal)}
                    onMouseLeave={() => setHoveredStars(0)}
                    className="p-1 text-slate-300 hover:scale-115 transition-transform cursor-pointer"
                    aria-label={`${starVal} نجوم`}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        isActive ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-black text-amber-600 ml-1.5 font-mono">
                {selectedStars} / 5
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="اسمك أو كنيتك (اختياري)"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-sky-500"
              maxLength={40}
            />
            <input
              type="text"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="رأيك بتجربة المتجر أو الخدمة (اختياري)"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-sky-500"
              maxLength={180}
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 px-4 py-2 text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'جارٍ الحفظ...' : 'إرسال التقييم ⭐'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-2 pt-1">
        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-3">جارٍ تحميل التقييمات...</p>
        ) : reviews.length > 0 ? (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{rev.user_name || 'زائر دليل العراق'}</span>
                    <div className="flex items-center gap-0.5 text-amber-500" dir="ltr">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-2.5 w-2.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {rev.created_at ? new Date(rev.created_at).toLocaleDateString('ar-IQ') : 'مؤخراً'}
                  </span>
                </div>
                {rev.comment && <p className="text-slate-600 text-[11px] leading-relaxed">{rev.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
            لا توجد مراجعات مكتوبة بعد لهذا المتجر. كن أول من يشارك تجربته وتقييمه!
          </div>
        )}
      </div>
    </div>
  );
};
