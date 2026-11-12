import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data.data.products || []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="relative h-full sm:h-auto sm:min-h-screen sm:p-4 sm:pt-20 flex sm:items-start sm:justify-center">
        <div className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-white sm:rounded-3xl shadow-floating sm:border sm:border-brand-muted flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 duration-200">
          
          {/* Search Input Bar */}
          <div className="p-3.5 sm:p-5 border-b border-brand-muted/70 flex items-center gap-3 bg-white">
            <Search className="w-5 h-5 text-brand-primary flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plant protein, turmeric, superfoods..."
              className="flex-1 bg-transparent text-base text-brand-dark placeholder:text-brand-subtext/60 focus:outline-none"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-brand-subtext animate-spin" />}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-brand-bg text-brand-subtext hover:text-brand-dark transition-colors flex items-center justify-center -mr-1"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-brand-muted/50 pb-safe">
            {query.trim().length >= 2 && results.length === 0 && !isLoading && (
              <div className="py-12 text-center text-brand-subtext text-sm">
                No products found matching "{query}". Try searching for "Protein", "Chocolate", or "Turmeric".
              </div>
            )}

            {results.map((product) => {
              const lowestPrice = product.variants?.[0]?.sellingPrice || 0;
              const defaultImage = product.variants?.[0]?.images?.[0] || '';

              return (
                <div
                  key={product._id}
                  onClick={() => {
                    onClose();
                    navigate(`/products/${product.slug}`);
                  }}
                  className="py-3 px-2 sm:px-3 rounded-xl hover:bg-brand-bg flex items-center gap-3.5 cursor-pointer transition-colors group"
                >
                  <div className="w-16 h-16 rounded-xl bg-brand-secondary overflow-hidden flex-shrink-0 border border-brand-muted/40">
                    <img src={defaultImage} alt={product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-brand-dark group-hover:text-brand-primary truncate">
                      {product.title}
                    </h4>
                    <p className="text-xs text-brand-subtext truncate mt-0.5">{product.subtitle}</p>
                    <span className="inline-block text-xs font-bold text-brand-primary mt-1">From ₹{lowestPrice}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-brand-subtext group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                </div>
              );
            })}

            {/* Quick Popular Tags */}
            {query.trim().length < 2 && (
              <div className="py-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-subtext">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Belgian Chocolate Protein', 'Raw Unflavored', 'Madagascar Vanilla', 'Turmeric Latte', 'Daily Greens'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="px-3.5 py-2 rounded-full bg-brand-secondary text-xs font-semibold text-brand-dark hover:bg-brand-muted transition-colors border border-brand-muted/50"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
