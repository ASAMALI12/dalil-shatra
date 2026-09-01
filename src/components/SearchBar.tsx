import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFocus?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onFocus,
}) => {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-xs focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all">
        {/* Search Icon on the right/left */}
        <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />

        {/* Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={onFocus}
          placeholder="ابحث عن مطاعم، محلات، أطباء وأكثر..."
          className="w-full bg-transparent px-3 font-display text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
        />

        {/* Clear Button if query typed */}
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
