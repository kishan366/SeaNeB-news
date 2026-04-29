// components/ui/Logo.jsx
"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Logo({ size = "md" }) {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-14"
  };

  //  Direct image path - public folder mein image hona chahiye
  const imagePath = "/assets/logo2.png";

  return (
    <Link href="/" className="flex items-center">
      <img
        src={imagePath}
        alt="SeaNeB"
        className={`${sizes[size] || sizes.md} w-auto object-contain`}
        onError={() => {
          console.error('❌ Logo not found at:', imagePath);
          setImageError(true);
        }}
      />
      {/* Agar image error ho to text show karo */}
      {imageError && (
        <span className="font-bold text-xl ml-2">SeaNeB</span>
      )}
    </Link>
  );
}