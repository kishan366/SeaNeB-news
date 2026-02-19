"use client";

import { useState, useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

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
        // Sirf tabhi fetch karein jab input 2 character se zyada ho
        if (!value || value.length < 2) { 
            setSuggestions([]); 
            return; 
        }
        
        const fetchCities = async () => {
            setLoading(true);
            try {
                // DHAYAN DEIN: Check karein backend mein '/api/v1/autocomplete-cities' hai ya '/api/v1/places/autocomplete'
                const apiUrl = `${API_BASE}/api/v1/autocomplete-cities?input=${encodeURIComponent(value)}`;
                
                const res = await fetch(apiUrl, { 
                    method: 'GET',
                    headers: { 'accept': 'application/json' } 
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                
                const data = await res.json();
                // Backend 'cities' key bhej raha hai ya 'predictions'? Check image logs.
                setSuggestions(data.cities || data.predictions || []);
            } catch (err) {
                console.error("Autocomplete Failed to Fetch:", err.message);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchCities, 360);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="flex flex-col relative" ref={wrapperRef}>
            <label className="text-sm font-black text-gray-700 mb-2 ml-1 block">
                {label} <span className="text-red-500">*</span>
            </label>
            
            <input 
                type="text" 
                name={name} 
                value={value || ""} 
                autoComplete="off" 
                placeholder={placeholder}
                onChange={(e) => {
                    onChange({ label: e.target.value, place_id: "" });
                    setIsOpen(true);
                }} 
                onBlur={onBlur}
                className={`w-full border-2 rounded-2xl px-5 py-3 bg-gray-50/50 font-bold text-gray-900 transition-all outline-none h-14 focus:bg-white focus:border-black ${
                    touched && error ? "border-red-500" : "border-gray-50"
                }`} 
            />
            
            {isOpen && (suggestions.length > 0 || loading) && (
                <ul className="absolute z-100 w-full bg-white border-2 border-gray-100 rounded-2xl top-22.5 shadow-2xl max-h-60 overflow-y-auto py-2">
                    {loading ? (
                        <li className="px-6 py-3 text-sm text-gray-400 italic font-bold">Searching...</li>
                    ) : (
                        suggestions.map((city, i) => (
                            <li 
                                key={i} 
                                onClick={() => {
                                    // Backend format ke hisaab se adjust karein
                                    const fullLabel = city.description || `${city.city_name}, ${city.state_name}`;
                                    const pId = city.place_id || city.city_id;

                                    onChange({ label: fullLabel, place_id: pId });
                                    setIsOpen(false);
                                }} 
                                className="px-6 py-3 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-bold"
                            >
                                {city.description || (
                                    <>
                                        <span className="font-black">{city.city_name}</span>, 
                                        <span className="text-gray-500 text-xs ml-1">{city.state_name}</span>
                                    </>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            )}

            {touched && error && (
                <p className="text-red-500 text-[10px] mt-1 font-bold ml-2">{error}</p>
            )}
        </div>
    );
}