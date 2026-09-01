import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Download, 
  Paintbrush, 
  Eraser, 
  Sparkles, 
  Check, 
  Printer,
  Undo2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ColoringStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  caption?: string;
  childName: string;
  pageNumber?: number;
}

const CRAYON_PALETTE = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber/Yellow
  '#10B981', // Emerald/Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#854D0E', // Brown
  '#1E293B', // Dark Slate/Black
  '#94A3B8', // Light Gray
  '#FFFFFF', // White
  '#FDE047', // Sun Yellow
  '#84CC16', // Lime
  '#14B8A6', // Teal
  '#A855F7', // Violet
];

export const ColoringStudioModal: React.FC<ColoringStudioModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  caption,
  childName,
  pageNumber,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [brushSize, setBrushSize] = useState<number>(14);
  const [tool, setTool] = useState<'brush' | 'crayon' | 'eraser' | 'rainbow'>('brush');
  const [history, setHistory] = useState<ImageData[]>([]);
  const isDrawing = useRef(false);
  const rainbowHue = useRef(0);

  // Initialize canvas with background image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size matching the image or a crisp 600x800 container
      canvas.width = 600;
      canvas.height = 800;
      // White background first
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Save initial state
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), data]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previous = newHistory[newHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(newHistory);
  };

  const resetCanvas = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(history[0], 0, 0);
    setHistory([history[0]]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      saveState();
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#FFFFFF';
    } else if (tool === 'rainbow') {
      rainbowHue.current = (rainbowHue.current + 4) % 360;
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = `hsl(${rainbowHue.current}, 90%, 55%)`;
    } else if (tool === 'crayon') {
      // Crayon uses multiply blend mode so outlines remain visible!
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = selectedColor;
    } else {
      // Default brush: multiply blend mode so line art stays crisp on top
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = selectedColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${childName.toLowerCase()}-${title.toLowerCase().replace(/\s+/g, '-')}-colored.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>${title} - Colored by ${childName}</title>
            <style>
              body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; }
              img { max-width: 90vw; max-height: 90vh; object-fit: contain; }
              h2 { margin: 12px 0 4px 0; }
              p { color: #555; margin: 0 0 12px 0; }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <h2>${title}</h2>
            <p>Colored by ${childName}</p>
            <img src="${dataUrl}" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 font-display text-xl text-white shadow-xs">
              🖍️
            </span>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-800">
                {pageNumber ? `Page ${pageNumber}: ` : ''}{title}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Digital Coloring Studio for <span className="font-semibold text-amber-700">{childName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 active:scale-95"
            >
              <Download className="h-4 w-4" />
              Save Artwork
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-[1fr_280px]">
          {/* Canvas Wrapper */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-4">
            <div className="relative overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="max-h-[65vh] w-auto max-w-full cursor-crosshair touch-none object-contain"
              />
            </div>
            {caption && (
              <p className="mt-3 text-center text-xs font-medium text-slate-600">
                "{caption}"
              </p>
            )}
          </div>

          {/* Tools & Palette Sidebar */}
          <div className="flex flex-col gap-5 rounded-2xl bg-slate-50 p-4">
            {/* Tool Selection */}
            <div>
              <label className="mb-2 block font-display text-xs font-bold uppercase tracking-wider text-slate-500">
                Drawing Tool
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTool('brush')}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    tool === 'brush'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Paintbrush className="h-4 w-4" />
                  Smooth
                </button>
                <button
                  onClick={() => setTool('crayon')}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    tool === 'crayon'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>🖍️</span>
                  Crayon
                </button>
                <button
                  onClick={() => setTool('rainbow')}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    tool === 'rainbow'
                      ? 'bg-gradient-to-r from-pink-500 via-amber-400 to-cyan-500 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Rainbow
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    tool === 'eraser'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Eraser className="h-4 w-4" />
                  Eraser
                </button>
              </div>
            </div>

            {/* Brush Size */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="font-display uppercase tracking-wider">Line Thickness</span>
                <span className="text-amber-600">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="40"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-500"
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="mb-2 block font-display text-xs font-bold uppercase tracking-wider text-slate-500">
                Crayon Palette
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CRAYON_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      if (tool === 'eraser') setTool('brush');
                    }}
                    style={{ backgroundColor: color }}
                    className={`relative flex h-10 w-full items-center justify-center rounded-xl ring-2 transition-all active:scale-90 ${
                      selectedColor === color && tool !== 'eraser'
                        ? 'scale-105 ring-amber-500 ring-offset-2'
                        : 'ring-transparent hover:scale-105'
                    } ${color === '#FFFFFF' ? 'border border-slate-300' : ''}`}
                  >
                    {selectedColor === color && tool !== 'eraser' && (
                      <Check className={`h-4 w-4 ${color === '#FFFFFF' || color === '#FDE047' ? 'text-slate-800' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Actions */}
            <div className="mt-auto flex gap-2 border-t border-slate-200 pt-4">
              <button
                onClick={undo}
                disabled={history.length <= 1}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
              <button
                onClick={resetCanvas}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-rose-600 shadow-xs hover:bg-rose-50"
              >
                <RotateCcw className="h-4 w-4" />
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
