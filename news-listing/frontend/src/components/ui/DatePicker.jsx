"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";

export default function DatePicker({
  label,
  name,
  value,
  onChange,
  required = false,
  minAge = 13,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const containerRef = useRef(null);

  // 13 Years ago from today
  const maxAllowedDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - minAge);
    return date;
  }, [minAge]);

  const selectedDate = value ? new Date(value) : null;
  // Initialize view to the latest allowed date if no value is selected
  const [viewDate, setViewDate] = useState(selectedDate || maxAllowedDate);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowYearPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDateClick = (day) => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const clickedDate = new Date(y, m, day);

    // Block clicks on future dates beyond 13 years ago
    if (clickedDate > maxAllowedDate) return;

    const formattedMonth = (m + 1).toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    
    onChange({ target: { name, value: `${y}-${formattedMonth}-${formattedDay}` } });
    setIsOpen(false);
  };

  const handleYearSelect = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setShowYearPicker(false);
  };

  const changeMonth = (offset) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const years = useMemo(() => {
    const currentMaxYear = maxAllowedDate.getFullYear();
    // Showing 100 years back from the max allowed year (e.g., 2013 back to 1913)
    return Array.from({ length: 100 }, (_, i) => currentMaxYear - i).reverse();
  }, [maxAllowedDate]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    return { totalDays, startDay };
  }, [viewDate]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-gray-700 mb-1 ml-1 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border rounded-lg px-3 h-10 text-sm cursor-pointer flex justify-between items-center transition-all ${isOpen ? 'border-blue-500 bg-white' : 'border-gray-200 bg-white hover:border-blue-500'}`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "DD/MM/YYYY"}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-white border border-gray-100 rounded-2xl p-4 shadow-xl z-60 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="flex justify-between items-center mb-4">
            <button 
              type="button"
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="text-sm font-bold text-gray-800 flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded-lg transition-all"
            >
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              <svg className={`w-3 h-3 text-gray-500 transition-transform ${showYearPicker ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </button>
            {!showYearPicker && (
              <div className="flex gap-2">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 text-gray-500 hover:text-gray-900 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
                <button 
                  type="button"
                  onClick={() => changeMonth(1)} 
                  disabled={viewDate.getFullYear() >= maxAllowedDate.getFullYear() && viewDate.getMonth() >= maxAllowedDate.getMonth()}
                  className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-0 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>

          {showYearPicker ? (
            <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {years.map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => handleYearSelect(y)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${viewDate.getFullYear() === y ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: calendarDays.startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: calendarDays.totalDays }).map((_, i) => {
                  const d = i + 1;
                  const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                  const isDisabled = dateObj > maxAllowedDate;
                  const isSelected = selectedDate?.toDateString() === dateObj.toDateString();

                  return (
                    <button
                      type="button"
                      key={d}
                      disabled={isDisabled}
                      onClick={() => handleDateClick(d)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${isSelected ? 'bg-gray-900 text-white ring-1 ring-gray-900' : isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Error message handling can be added here if needed */}
    </div>
  );
}
