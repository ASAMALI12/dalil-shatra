import React from 'react';
import { 
  Sparkles, 
  Printer, 
  Download, 
  Paintbrush, 
  Wand2, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ColoringPage } from '../types';

interface ColoringPageCardProps {
  page: ColoringPage;
  childName: string;
  onOpenStudio: (page: ColoringPage) => void;
  onCustomize: (page: ColoringPage) => void;
  onRetry: (page: ColoringPage) => void;
}

export const ColoringPageCard: React.FC<ColoringPageCardProps> = ({
  page,
  childName,
  onOpenStudio,
  onCustomize,
  onRetry,
}) => {
  const handlePrintSingle = () => {
    if (!page.imageUrl) return;
    const win = window.open('');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Page ${page.pageNumber}: ${page.title} - ${childName}'s Coloring Book</title>
            <style>
              @page { size: letter portrait; margin: 15mm; }
              body { 
                margin: 0; 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: space-between; 
                height: 96vh;
                box-sizing: border-box;
                padding: 10px;
              }
              .header { text-align: center; margin-bottom: 8px; }
              .title { font-size: 24px; font-weight: bold; margin: 0 0 4px 0; }
              .caption { font-size: 14px; color: #444; margin: 0; max-width: 600px; }
              .img-container { 
                flex: 1; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                width: 100%;
                max-height: 80%;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 10px;
                box-sizing: border-box;
              }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
              .footer { 
                width: 100%; 
                display: flex; 
                justify-content: space-between; 
                font-size: 12px; 
                color: #666; 
                border-top: 1px dashed #999; 
                padding-top: 8px; 
                margin-top: 8px;
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <div class="header">
              <div class="title">${page.pageNumber}. ${page.title}</div>
              <div class="caption">${page.caption}</div>
            </div>
            <div class="img-container">
              <img src="${page.imageUrl}" />
            </div>
            <div class="footer">
              <span>Colored by: ____________________ Date: ________</span>
              <span>${childName}'s Coloring Book • Page ${page.pageNumber} of 5</span>
            </div>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const handleDownloadSingle = () => {
    if (!page.imageUrl) return;
    const a = document.createElement('a');
    a.href = page.imageUrl;
    a.download = `${childName.toLowerCase()}-page-${page.pageNumber}-${page.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-md transition-all hover:shadow-xl hover:border-amber-400">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 font-display text-xs font-bold text-white shadow-2xs">
            {page.pageNumber}
          </span>
          <h4 className="font-display text-sm font-bold text-slate-800 line-clamp-1">
            {page.title}
          </h4>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
          Page {page.pageNumber} of 5
        </span>
      </div>

      {/* Image Area */}
      <div className="relative aspect-[3/4] w-full bg-slate-50 overflow-hidden flex items-center justify-center">
        {page.status === 'done' && page.imageUrl ? (
          <div className="relative h-full w-full p-3 flex items-center justify-center">
            <img
              src={page.imageUrl}
              alt={page.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain rounded-xl border border-slate-200 bg-white shadow-2xs transition-transform duration-300 group-hover:scale-[1.01]"
            />
            {/* Hover overlay quick buttons */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/40 opacity-0 backdrop-blur-2xs transition-opacity group-hover:opacity-100 p-4">
              <button
                onClick={() => onOpenStudio(page)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 font-display text-xs font-bold text-white shadow-md hover:bg-amber-600 active:scale-95 transition-transform"
              >
                <Paintbrush className="h-4 w-4" />
                Color Page
              </button>
              <button
                onClick={handlePrintSingle}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 font-display text-xs font-bold text-slate-800 shadow-md hover:bg-slate-50 active:scale-95 transition-transform"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                Print
              </button>
            </div>
          </div>
        ) : page.status === 'generating' ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Sparkles className="h-6 w-6 animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-display text-xs font-bold text-slate-800">
                Drawing Page {page.pageNumber}...
              </p>
              <p className="text-[11px] text-slate-500">
                Rendering thick black line art
              </p>
            </div>
          </div>
        ) : page.status === 'error' ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-rose-600">
            <AlertCircle className="h-8 w-8" />
            <p className="text-xs font-bold">Failed to draw page</p>
            <button
              onClick={() => onRetry(page)}
              className="mt-2 flex items-center gap-1 rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Sketch
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-slate-400">
            <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center font-display font-bold">
              #{page.pageNumber}
            </div>
            <p className="text-xs">Waiting in line to draw...</p>
          </div>
        )}
      </div>

      {/* Card Caption / Story line */}
      <div className="flex-1 p-3.5 bg-white border-t border-slate-100">
        <p className="text-xs font-medium text-slate-600 italic line-clamp-2 leading-relaxed">
          "{page.caption}"
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3 py-2">
        <button
          onClick={() => onCustomize(page)}
          disabled={page.status === 'generating'}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-amber-100/60 hover:text-amber-900 transition-colors disabled:opacity-40"
        >
          <Wand2 className="h-3.5 w-3.5 text-amber-600" />
          Customize
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenStudio(page)}
            disabled={!page.imageUrl}
            title="Digital Color Studio"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs hover:bg-amber-600 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Paintbrush className="h-4 w-4" />
          </button>
          <button
            onClick={handlePrintSingle}
            disabled={!page.imageUrl}
            title="Print this page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownloadSingle}
            disabled={!page.imageUrl}
            title="Download PNG"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
