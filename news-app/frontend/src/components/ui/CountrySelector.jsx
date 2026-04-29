import React, { useState, useRef, useEffect, useMemo } from 'react';
import countries from '@/data/countries.json';
import { Search, ChevronDown } from 'lucide-react';

const CountrySelector = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Default to India if value is missing or not found
  const selectedCountry = useMemo(() => {
    return countries.find(c => c.dialCode === value) || countries.find(c => c.name === "India") || countries[0];
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    return countries.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.dialCode.includes(searchQuery)
    );
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country) => {
    onChange(country.dialCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors outline-none h-[46px] min-w-[100px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <img 
          src={selectedCountry.flag} 
          alt="" 
          className="w-5 h-3.5 object-cover rounded-sm shadow-xs border border-slate-200" 
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{selectedCountry.dialCode}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-4 border-b border-slate-50 bg-slate-50/30">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                autoFocus
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {filteredCountries.map((country, index) => (
              <button
                key={`${country.name}-${index}`}
                type="button"
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group ${
                  value === country.dialCode ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <img 
                    src={country.flag} 
                    alt="" 
                    className="w-6 h-4 object-cover rounded-sm shadow-xs border border-slate-100" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <span className={`text-sm flex-1 truncate ${value === country.dialCode ? 'font-bold text-blue-600' : 'text-slate-600 font-medium'}`}>
                  {country.name}
                </span>
                <span className={`text-xs font-bold ${value === country.dialCode ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {country.dialCode}
                </span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="p-8 text-center bg-slate-50/30">
                <p className="text-sm text-slate-500 font-medium italic">No countries found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
