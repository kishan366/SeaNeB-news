"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "@/context/LangContext";
import { Languages } from "lucide-react";

export default function LanguageSelect() { 
  const { lang, setLang } = useLang(); 
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { label: "ENG", value: "en" },
    { label: "हिंदी", value: "hi" },
    { label: "ગુજરાતી", value: "gu" },
  ];

  // Bahar click karne par dropdown band karne ke liye
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === lang)?.label || "ENG";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Button Jo Dropdown Kholega - Added Dark Mode Classes */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-800 rounded-full bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 hover:border-gray-900 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-slate-800 transition-all shadow-sm group"
        title={`Language: ${selectedLabel}`}
      >
        <Languages size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
      </button>

      {/* Dropdown List - Added Dark Mode Classes */}
      {isOpen && (
        <ul className="absolute right-0 mt-2 w-full min-w-30 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in duration-150">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                setLang(option.value); 
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-xs cursor-pointer transition-colors ${
                lang === option.value  
                  ? "bg-black text-white font-bold mx-1 rounded-lg" 
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 mx-1 rounded-lg"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}