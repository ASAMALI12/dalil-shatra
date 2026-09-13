import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  Building2,
  Phone,
  RefreshCw,
  Layers,
  ArrowDown,
  Info,
} from 'lucide-react';
import { useDirectory } from '../context/DirectoryContext';
import { DirectoryItem } from '../types/shatrah';
import { validateIraqPhone } from '../utils/iraqPhoneValidator';
import { safeApiFetch } from '../utils/apiClient';
import confetti from 'canvas-confetti';

export const ManagerDataImportTab: React.FC = () => {
  const { importStores, items } = useDirectory();

  const [rawText, setRawText] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    summary?: Record<string, number>;
    message?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sample verified Iraqi businesses dataset ready for instant distribution
  const handleImportVerifiedDataset = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setImportResult(null);

    try {
      const adminToken = sessionStorage.getItem('iraq_admin_token') || '';
      // Fetch comprehensive verified list from backend import processor
      const resp = await safeApiFetch('/api/import/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          source: 'iraq_verified_multi_region',
          autoSeedDefault: true,
        }),
      });

      const data = await resp.json();

      if (data.success && Array.isArray(data.stores) && data.stores.length > 0) {
        const { importedCount, skippedNoPhoneCount } = importStores(data.stores);
        setImportResult({
          importedCount,
          skippedCount: skippedNoPhoneCount,
          summary: data.governoratesSummary,
          message: `تم استيراد وتوزيع ${importedCount} متجراً ونشاطاً حقيقياً في محافظات وأقضية العراق بنجاح!`,
        });
        confetti({ particleCount: 70, spread: 80 });
      } else {
        setErrorMessage(data.error || 'فشلت معالجة البيانات أو لم يتم العثور على سجلات صالحة.');
      }
    } catch (err: any) {
      setErrorMessage('حدث خطأ أثناء الاتصال بالخادم لمعالجة الاستيراد: ' + (err.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  // Process custom uploaded or pasted data
  const handleProcessCustomData = async () => {
    if (!rawText.trim()) {
      setErrorMessage('يرجى لصق بيانات JSON أو CSV للاستيراد');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setImportResult(null);

    let parsedItems: any[] = [];

    try {
      if (selectedFormat === 'json') {
        const parsed = JSON.parse(rawText.trim());
        parsedItems = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Simple CSV parser
        const lines = rawText.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('الملف يجب أن يحتوي على سطر الترويسة وسطر بيانات واحد على الأقل.');
        }
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= 2) {
            const obj: any = {};
            headers.forEach((h, idx) => {
              obj[h] = cols[idx] || '';
            });
            parsedItems.push(obj);
          }
        }
      }
    } catch (e: any) {
      setIsProcessing(false);
      setErrorMessage(`صيغة البيانات غير صحيحة: ${e.message}`);
      return;
    }

    try {
      const adminToken = sessionStorage.getItem('iraq_admin_token') || '';
      const resp = await safeApiFetch('/api/import/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          source: 'manual_custom_upload',
          items: parsedItems,
        }),
      });

      const data = await resp.json();

      if (data.success && Array.isArray(data.stores)) {
        const { importedCount, skippedNoPhoneCount } = importStores(data.stores);
        setImportResult({
          importedCount,
          skippedCount: skippedNoPhoneCount + (data.skippedNoPhoneCount || 0),
          summary: data.governoratesSummary,
          message: `اكتملت المعالجة: تمت إضافة ${importedCount} متجراً هاتفياً صحيحاً، واستبعاد ${skippedNoPhoneCount + (data.skippedNoPhoneCount || 0)} لعدم وجود رقم هاتف عراقي صالح.`,
        });
        setRawText('');
        confetti({ particleCount: 50, spread: 60 });
      } else {
        setErrorMessage(data.error || 'فشلت معالجة الاستيراد.');
      }
    } catch (err: any) {
      setErrorMessage('حدث خطأ أثناء إرسال البيانات للتحقق: ' + (err.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 text-right">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/60 to-slate-900 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600/30 border border-sky-400/40 text-sky-300 flex-shrink-0">
            <Upload className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-display text-sm sm:text-base font-bold text-white">
              منظومة استيراد وتوزيع أنشطة ومتاجر محافظات العراق 🇮🇶
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              تتيح استيراد المتاجر والمطاعم والعيادات وتوزيعها على محافظات وأقضية العراق بدقة. 
              <strong className="text-amber-300"> تذكير صارم:</strong> أي متجر لا يحتوي على رقم هاتف عراقي حقيقي يتم استبعاده تلقائياً ومنع إدخاله.
            </p>
          </div>
        </div>

        {/* Current Stores Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800 text-center">
          <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">المتاجر الحالية بالدليل</span>
            <span className="font-mono text-base font-bold text-white">{items.length}</span>
          </div>
          <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">المتاجر الموثقة هاتفياً</span>
            <span className="font-mono text-base font-bold text-emerald-400">
              {items.filter((i) => i.isClaimed || i.phoneReliability === 'otp_verified').length}
            </span>
          </div>
          <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 block">حالة التحقق من الشبكات</span>
            <span className="text-xs font-bold text-sky-400">زين • آسيا سيل • كورك</span>
          </div>
        </div>
      </div>

      {/* Action 1: One-click Verified Dataset Import */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h5 className="font-display text-xs sm:text-sm font-bold text-white">
              استيراد حزمة الأنشطة والمطاعم والعيادات العراقية المعتمدة
            </h5>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
            أرقام هواتف حقيقية 100%
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          جلب وتوزيع عيادات ومطاعم ومتاجر معتمدة عبر المحافظات الـ 15 (بغداد، البصرة، النجف، كربلاء، ذي قار، بابل، نينوى...) مفهرسة بالأقضية والقطاعات وأرقام الهواتف الشغالة.
        </p>

        <button
          type="button"
          onClick={handleImportVerifiedDataset}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs sm:text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md transition-all disabled:opacity-60 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>جاري المعالجة والاستيراد والتوزيع...</span>
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              <span>بدء استيراد وتوزيع المتاجر والأنشطة الآن ⚡</span>
            </>
          )}
        </button>
      </div>

      {/* Action 2: Custom JSON / CSV Data Paste & Upload */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" />
            <h5 className="font-display text-xs sm:text-sm font-bold text-white">
              استيراد مخصص (لصق بيانات JSON أو CSV)
            </h5>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSelectedFormat('json')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                selectedFormat === 'json'
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('csv')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                selectedFormat === 'csv'
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              CSV
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          الصق مصفوفة المتاجر مع الحقول المطلوبة: (name, phone, governorateId, category, address). سيتم فحص رقم الهاتف آلياً واستبعاد أي متجر بلا رقم هاتف صحيح.
        </p>

        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={
            selectedFormat === 'json'
              ? '[\n  {\n    "name": "مجمع العافية الطبي",\n    "category": "doctors",\n    "phone": "07801122334",\n    "governorateId": "baghdad",\n    "districtId": "karkh",\n    "address": "بغداد - الكرخ - المنصور"\n  }\n]'
              : 'name,category,phone,governorateId,districtId,address\nمجمع العافية الطبي,doctors,07801122334,baghdad,karkh,المنصور'
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
          dir="ltr"
        />

        {/* Action Button */}
        <button
          type="button"
          onClick={handleProcessCustomData}
          disabled={isProcessing || !rawText.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>جاري فحص الأرقام واستيراد المتاجر...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-amber-400" />
              <span>تحقق واستيراد البيانات المدخلة</span>
            </>
          )}
        </button>
      </div>

      {/* Success Notification Box */}
      {importResult && (
        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 text-right space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>{importResult.message}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="rounded-lg bg-emerald-900/40 p-2 text-emerald-200">
              <span>المتاجر الصالحة المضافة:</span>{' '}
              <strong className="font-mono text-white text-sm">{importResult.importedCount}</strong>
            </div>
            <div className="rounded-lg bg-rose-900/40 p-2 text-rose-200">
              <span>المستبعدة لعدم وجود هاتف:</span>{' '}
              <strong className="font-mono text-white text-sm">{importResult.skippedCount}</strong>
            </div>
          </div>
          {importResult.summary && Object.keys(importResult.summary).length > 0 && (
            <div className="pt-2 border-t border-emerald-800/60">
              <span className="text-[11px] text-emerald-300 block mb-1.5 font-bold">
                توزيع المتاجر المستوردة حسب المحافظات:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(importResult.summary).map(([gov, count]) => (
                  <span
                    key={gov}
                    className="rounded-md bg-emerald-900/70 border border-emerald-700/50 px-2 py-0.5 text-[10px] font-bold text-emerald-100"
                  >
                    {gov}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message Box */}
      {errorMessage && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/50 p-4 text-xs font-bold text-rose-200 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
