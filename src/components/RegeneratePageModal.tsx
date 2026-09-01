import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Wand2 } from 'lucide-react';
import { ColoringPage, ImageResolution, AgeGroup } from '../types';

interface RegeneratePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: ColoringPage;
  childName: string;
  theme: string;
  ageGroup: AgeGroup;
  resolution: ImageResolution;
  onPageUpdated: (updatedPage: ColoringPage) => void;
}

export const RegeneratePageModal: React.FC<RegeneratePageModalProps> = ({
  isOpen,
  onClose,
  page,
  childName,
  theme,
  ageGroup,
  resolution,
  onPageUpdated,
}) => {
  const [instructions, setInstructions] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegenerate = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      // 1. Get adjusted prompt from AI
      const promptRes = await fetch('/api/regenerate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageTitle: page.title,
          currentCaption: page.caption,
          userInstructions: instructions || 'Make this scene even more fun and delightful for kids to color!',
          childName,
          theme,
          ageGroup,
        }),
      });

      const promptData = await promptRes.json();
      if (!promptData.success) {
        throw new Error(promptData.error || 'Failed to refine page prompt.');
      }

      const { title, caption, prompt } = promptData.data;

      // 2. Generate new line art image
      const imageRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          resolution,
          isCover: false,
          childName,
          theme,
          ageGroup,
        }),
      });

      const imgData = await imageRes.json();
      if (!imgData.success) {
        throw new Error(imgData.error || 'Failed to render new image.');
      }

      // 3. Callback with updated page
      onPageUpdated({
        ...page,
        title,
        caption,
        prompt,
        imageUrl: imgData.imageUrl,
        status: 'done',
      });

      onClose();
    } catch (err: any) {
      console.error('Error regenerating page:', err);
      setError(err.message || 'Failed to update page.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 font-display text-lg text-white">
              <Wand2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-800">
                Customize Page {page.pageNumber}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{page.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Page Caption
            </label>
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 italic border border-slate-200">
              "{page.caption}"
            </div>
          </div>

          <div>
            <label className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              What would you like to change or add?
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., 'Add a friendly robot sidekick', 'Make the dinosaur wear funny roller skates', 'Make the lines even thicker with fewer background items'..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Quick preset suggestions */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-slate-400">
              Quick Suggestions:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Add funny party hats & balloons',
                'Simpler shapes & thicker outlines',
                'Add stars and crescent moon in sky',
                'Make the main character bigger',
              ].map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInstructions(s)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-amber-50 hover:text-amber-900"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleRegenerate}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating New Line Art...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Regenerate Page {page.pageNumber}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
