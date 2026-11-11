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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <div className="relative min-h-screen px-4 flex items-start justify-center pt-20">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-floating border border-brand-muted overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Search Input Bar */}
          <div className="p-4 sm:p-5 border-b border-brand-muted/70 flex items-center gap-3">
            <Search className="w-5 h-5 text-brand-primary flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plant protein, turmeric, superfoods..."
              className="flex-1 bg-transparent text-base sm:text-lg text-brand-dark placeholder:text-brand-subtext/60 focus:outline-none"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-brand-subtext animate-spin" />}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-brand-bg text-brand-subtext hover:text-brand-dark transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 divide-y divide-brand-muted/50">
            {query.trim().length >= 2 && results.length === 0 && !isLoading && (
              <div className="py-8 text-center text-brand-subtext text-sm">
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
                  className="py-3 px-3 rounded-xl hover:bg-brand-bg flex items-center gap-4 cursor-pointer transition-colors group"
                >
                  <div className="w-16 h-16 rounded-lg bg-brand-secondary overflow-hidden flex-shrink-0">
                    <img src={defaultImage} alt={product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-brand-dark group-hover:text-brand-primary truncate">
                      {product.title}
                    </h4>
                    <p className="text-xs text-brand-subtext truncate mt-0.5">{product.subtitle}</p>
                    <span className="inline-block text-xs font-bold text-brand-dark mt-1">From ₹{lowestPrice}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-brand-subtext group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                </div>
              );
            })}

            {/* Quick Popular Tags */}
            {query.trim().length < 2 && (
              <div className="py-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Belgian Chocolate Protein', 'Raw Unflavored', 'Madagascar Vanilla', 'Turmeric Latte', 'Daily Greens'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="px-3 py-1.5 rounded-full bg-brand-secondary text-xs font-medium text-brand-dark hover:bg-brand-muted transition-colors"
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
