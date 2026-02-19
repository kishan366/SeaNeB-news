"use client";

import { useState, useRef, useEffect } from "react";

export default function LanguageSelect({ value, onChange }) {
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

  const selectedLabel = options.find((opt) => opt.value === value)?.label || "ENG";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Button Jo Dropdown Kholega */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 min-w-27.5 border border-gray-200 rounded-full px-5 py-2.5 text-sm font-bold bg-white text-gray-800 hover:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
      >
        <span>{selectedLabel}</span>
       <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M480-360 280-560h400L480-360Z"/></svg>
      </button>

      {/* Ye hai Rounded Dropdown List */}
      {isOpen && (
        <ul className="absolute right-0 mt-2 w-full min-w-30 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-150">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                value === option.value 
                  ? "bg-gray-900 text-white font-bold mx-2 rounded-xl" 
                  : "text-gray-700 hover:bg-gray-100 mx-2 rounded-xl"
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