"use client";

import { useState, useEffect, useRef } from "react";

export default function HometownAutocomplete({ label, name, value, placeholder, onChange, onBlur, error, touched }) {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        if (!value || value.length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchCities = async () => {
            setLoading(true);
            try {
                const apiUrl = `/api/v1/autocomplete-cities?input=${encodeURIComponent(value)}`;

                const res = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                        'x-product-key': 'news'
                    }
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                const citiesList = data.cities || data.predictions || data.data || [];
                setSuggestions(citiesList);

            } catch (err) {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchCities, 500);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="flex flex-col relative w-full" ref={wrapperRef}>
            <label className="text-[13px] font-bold text-gray-700 mb-1.5 ml-1 block">
                {label || "Hometown"} <span className="text-red-500">*</span>
            </label>

            <input
                type="text"
                name={name}
                value={value || ""}
                autoComplete="off"
                placeholder={placeholder || "Search your city..."}
                onChange={(e) => {
                    onChange({ label: e.target.value, place_id: "" });
                    setIsOpen(true);
                }}
                onBlur={onBlur}
                className={`w-full border rounded-xl px-4 h-11 bg-white text-sm text-gray-900 transition-all outline-none focus:border-black ${touched && error ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />

            {/* Modern Suggestions Dropdown */}
            {isOpen && (suggestions.length > 0 || loading) && (
                <ul className="absolute z-70 w-full bg-white border border-gray-100 rounded-xl top-[calc(100%+4px)] shadow-xl max-h-52 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {loading ? (
                        <li className="px-5 py-3 text-[11px] text-gray-400 italic font-bold">Searching...</li>
                    ) : (
                        suggestions.map((city, i) => (
                            <li
                                key={i}
                                onClick={() => {
                                    const fullLabel = city.description || city.display_name || `${city.city_name}, ${city.state_name}`;
                                    const pId = city.place_id || city.city_id || city.id;

                                    onChange({ label: fullLabel, place_id: pId });
                                    setIsOpen(false);
                                }}
                                className="px-5 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-medium transition-colors"
                            >
                                {city.description || city.display_name || (
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-gray-900">{city.city_name}</span>
                                        <span className="text-gray-400 text-[10px]">— {city.state_name}</span>
                                    </div>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            )}

            {/* Compact Error Message */}
            {touched && error && (
                <div className="mt-1.5 flex items-center gap-1 text-red-500 ml-1">
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                </div>
            )}
        </div>
    );
}