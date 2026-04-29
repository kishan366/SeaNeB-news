"use client";

import React from 'react';

export default function Ads({ position = 'left', className = '' }) {
  const isLeft = position === 'left';
  
  // Compact Container Classes
  const containerClasses = `
    ${isLeft ? 'hidden lg:flex' : 'hidden xl:flex'} 
    w-56 2xl:w-64      /* Width kam kar di (224px to 256px) */
    h-full 
    flex-col 
    items-center 
    shrink-0
    pt-4               /* Thodi top padding */
    ${className}
  `;

  return (
    <aside className={containerClasses}>
      {/* Ad Box - Height aur Width dono reduce ki */}
      {/* <div className="relative w-48 h-96 2xl:w-56 bg-[#BEE3F8] rounded-lg border border-blue-100 flex items-center justify-center shadow-sm group hover:shadow-md transition-shadow">
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-black opacity-10"></div>
      </div> */}
      
      {/* Label ko chota kiya */}
      {/* <p className="text-[9px] text-gray-400 mt-2 uppercase tracking-tight font-medium">
        ADVERTISEMENT
      </p> */}
    </aside>
  );
}

export function MultipleAds({ count = 2 }) {
  return (
    <div className="flex flex-col items-center space-y-3 py-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="relative w-48 h-32 bg-[#BEE3F8] rounded-xl border border-blue-100 flex items-center justify-center shadow-sm group hover:shadow-md transition-shadow">
          <span className="text-[10px] text-gray-400">Ad {i + 1}</span>
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-black opacity-10"></div>
        </div>
      ))}
      <p className="text-[8px] text-gray-400 uppercase tracking-tighter font-bold">
        Ads
      </p>
    </div>
  );
}