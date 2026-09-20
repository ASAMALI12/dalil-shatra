import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Share2,
  Check,
  Compass,
  Maximize2,
  Minimize2,
  Edit3,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';
import { DISTRICT_COORDINATES } from '../data/iraqLocations';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface StoreLocationMapProps {
  item: DirectoryItem;
  isOwner?: boolean;
  onOpenEditLocation?: () => void;
}

export const StoreLocationMap: React.FC<StoreLocationMapProps> = ({
  item,
  isOwner = false,
  onOpenEditLocation,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if store has authentic, verified coordinates
  const hasExactGps =
    typeof item.lat === 'number' &&
    typeof item.lng === 'number' &&
    !isNaN(item.lat) &&
    !isNaN(item.lng) &&
    item.lat !== 0 &&
    item.lng !== 0;

  // Resolve coordinates: either exact GPS or district/governorate center for broad area preview
  let mapLat: number;
  let mapLng: number;

  if (hasExactGps) {
    mapLat = item.lat!;
    mapLng = item.lng!;
  } else if (item.districtId && DISTRICT_COORDINATES[item.districtId]) {
    const districtCoord = DISTRICT_COORDINATES[item.districtId];
    mapLat = districtCoord.lat;
    mapLng = districtCoord.lng;
  } else {
    // Default regional center for Shatrah / Dhi Qar
    mapLat = 31.4087;
    mapLng = 46.1738;
  }

  // Location display naming
  const locationLabel = item.governorateName
    ? `${item.governorateName}${item.districtName ? ` - ${item.districtName}` : ''}`
    : item.districtName || 'العراق';

  const addressText = item.address || 'العنوان غير محدد بدقة بعد';

  // Build accurate Google Maps URLs
  // 1. If store has a custom Google Maps URL provided by owner, prioritize it
  // 2. If exact GPS exists, navigate to exact lat,lng
  // 3. Otherwise, search Google Maps using store name + address + city for genuine place matching
  const googleMapsSearchUrl = item.googleMapsUrl?.trim()
    ? item.googleMapsUrl.trim()
    : hasExactGps
    ? `https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [item.name, item.address, item.districtName, item.governorateName, 'العراق']
          .filter(Boolean)
          .join(' ')
      )}`;

  const googleMapsDirectionsUrl = hasExactGps
    ? `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        [item.name, item.address, item.districtName, item.governorateName, 'العراق']
          .filter(Boolean)
          .join(' ')
      )}`;

  // OpenStreetMap embed iframe URL
  const delta = isExpanded ? 0.009 : 0.005;
  const bbox = `${mapLng - delta}%2C${mapLat - delta * 0.8}%2C${mapLng + delta}%2C${mapLat + delta * 0.8}`;
  // Only show the specific pin marker on map if exact GPS is confirmed
  const embedMapUrl = hasExactGps
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapLat}%2C${mapLng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  const handleOpenGoogleMaps = (url: string) => {
    if (Capacitor.isNativePlatform()) {
      Browser.open({ url, windowName: '_system' }).catch(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLocation = () => {
    const textToCopy = hasExactGps
      ? `📍 موقع متجر: ${item.name}\nالعنوان: ${addressText} (${locationLabel})\nإحداثيات GPS: ${mapLat.toFixed(5)}, ${mapLng.toFixed(5)}\nرابط خرائط جوجل:\n${googleMapsSearchUrl}`
      : `📍 متجر: ${item.name}\nالعنوان: ${addressText} (${locationLabel})\nرابط البحث في خرائط جوجل:\n${googleMapsSearchUrl}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch (e) {}

    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-3 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-xs sm:text-sm font-black text-slate-900">
                موقع وخريطة المتجر الجغرافية
              </h3>
              {hasExactGps ? (
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 flex items-center gap-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  <span>موقع GPS مؤكد</span>
                </span>
              ) : (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600">
                  العنوان المسجل
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {locationLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isOwner && onOpenEditLocation && (
            <button
              type="button"
              onClick={onOpenEditLocation}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="h-3 w-3" />
              <span>تعديل الموقع</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
            title={isExpanded ? 'تصغير الخريطة' : 'تكبير الخريطة'}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-3 w-3" />
                <span>تصغير</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3" />
                <span>تكبير</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyLocation}
            className={`flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="نسخ ومشاركة رابط وإحداثيات الموقع"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Share2 className="h-3 w-3" />
                <span>مشاركة</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Address & GPS Detail Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
        <div className="flex items-start gap-2">
          <Compass className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block text-[11px]">العنوان الدقيق:</span>
            <span className="text-slate-700 text-xs font-medium">{addressText}</span>
          </div>
        </div>

        {hasExactGps ? (
          <div className="flex items-center gap-1 self-start sm:self-auto bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 text-[10px] font-mono text-emerald-800">
            <span className="font-bold">GPS دقيق:</span>
            <span>{mapLat.toFixed(5)}° N, {mapLng.toFixed(5)}° E</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 self-start sm:self-auto bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 text-[10px] text-amber-800">
            <span>المنطقة:</span>
            <span className="font-bold">{item.districtName || item.governorateName || 'العراق'}</span>
          </div>
        )}
      </div>

      {/* Notice if exact GPS is not yet saved */}
      {!hasExactGps && (
        <div className="rounded-xl bg-sky-50/70 border border-sky-200/70 p-2.5 flex items-start gap-2 text-[11px] text-sky-900">
          <AlertCircle className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">موقع الخريطة أدناه هو مركز منطقة ({item.districtName || item.governorateName})</span>
            <span className="text-sky-800 block text-[10px] leading-relaxed">
              حرصاً على دقة البيانات، لم يتم تخمين أي نقطة عشوائية. يمكنك الانتقال إلى تطبيق خرائط جوجل للبحث عن العنوان المسجل بدقة عبر الأزرار أدناه.
            </span>
            {isOwner && onOpenEditLocation && (
              <button
                type="button"
                onClick={onOpenEditLocation}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                <span>📍 هل أنت المالك؟ اضغط هنا لتثبيت إحداثيات GPS أو رابط خرائط Google لمتجرك</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Embedded Map Container */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner transition-all duration-300 ${
          isExpanded ? 'h-72 sm:h-96' : 'h-48 sm:h-56'
        }`}
      >
        <iframe
          title={`خريطة ${item.name}`}
          src={embedMapUrl}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Overlay Indicator */}
        <div className="absolute top-2 right-2 pointer-events-none bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
          <span className={`h-2 w-2 rounded-full ${hasExactGps ? 'bg-emerald-500 animate-ping' : 'bg-sky-500'}`} />
          <span>{hasExactGps ? `موقع GPS: ${item.name}` : `منطقة: ${item.districtName || item.governorateName}`}</span>
        </div>
      </div>

      {/* Map Navigation & Search Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {/* Directions in Google Maps */}
        <button
          type="button"
          onClick={() => handleOpenGoogleMaps(googleMapsDirectionsUrl)}
          className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white py-2 px-3 text-xs font-black shadow-xs transition-all cursor-pointer"
        >
          <Navigation className="h-4 w-4" />
          <span>الاتجاهات والملاحة في خرائط Google</span>
        </button>

        {/* View on Google Maps / Search place */}
        <button
          type="button"
          onClick={() => handleOpenGoogleMaps(googleMapsSearchUrl)}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 border border-slate-200 py-2 px-3 text-xs font-bold transition-all cursor-pointer"
        >
          <ExternalLink className="h-4 w-4 text-slate-600" />
          <span>فتح والبحث عن المتجر في خرائط Google</span>
        </button>
      </div>
    </div>
  );
};
