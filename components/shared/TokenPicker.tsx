import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { getTokenMetaByAddress } from '../../utils/tokenUtils';

interface TokenPickerProps {
  tokens: string[];
  value: string;
  onChange: (address: string) => void;
  isLoading?: boolean;
}

const TokenPicker: React.FC<TokenPickerProps> = ({ tokens, value, onChange, isLoading }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  if (isLoading) {
    return (
      <div className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-gray-400">
        Loading tokens...
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-yellow-400">
        No tokens available
      </div>
    );
  }

  const selectedMeta = value ? getTokenMetaByAddress(value) : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((o) => !o)}
        className="w-full flex items-center gap-3 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 hover:border-slate-500 transition-colors"
      >
        {selectedMeta ? (
          <>
            <Image
              src={selectedMeta.logoUrl}
              alt={selectedMeta.symbol}
              width={24}
              height={24}
              className="rounded-full flex-shrink-0"
              unoptimized
            />
            <span className="font-semibold">{selectedMeta.symbol}</span>
            <span className="text-gray-400 text-xs">{selectedMeta.name}</span>
          </>
        ) : (
          <span className="text-gray-400">Select token...</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          {tokens.map((token) => {
            const meta = getTokenMetaByAddress(token);
            const isSelected = token.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={token}
                type="button"
                onClick={() => {
                  onChange(token);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left ${
                  isSelected ? 'bg-cyan-500/10 text-cyan-400' : 'text-white hover:bg-slate-700'
                }`}
              >
                <Image
                  src={meta.logoUrl}
                  alt={meta.symbol}
                  width={24}
                  height={24}
                  className="rounded-full flex-shrink-0"
                  unoptimized
                />
                <span className="font-semibold">{meta.symbol}</span>
                <span className="text-gray-400 text-xs">{meta.name}</span>
                {isSelected && (
                  <svg className="w-4 h-4 ml-auto text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TokenPicker;
