"use client";
import Link from 'next/link';
import Image from 'next/image';

export default function Logo({ size = "md" }) {
  // Height values mapping (Existing logic maintained)
  const heightMap = {
    sm: "32px",
    md: "40px",
    lg: "48px",
    xl: "56px"
  };

  const currentHeight = heightMap[size] || heightMap.md;

  return (
    <Link href="/" className="flex items-center shrink-0">
      <div style={{ position: 'relative', height: currentHeight, width: '160px' }}>
        
        {/* 1. Black Logo (logo.png) - Light Mode ke liye */}
        <Image
          src="/assets/logo2.png"
          alt="SeaNeB"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 160px"
          className="dark:hidden" //  Dark mode mein chhup jayega
          style={{ 
            objectFit: 'contain',
            objectPosition: 'left' 
          }}
        />

        {/* 2. White Logo (logo1.png) - Dark Mode ke liye */}
        <Image
          src="/assets/logo1.png"
          alt="SeaNeB"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 160px"
          className="hidden dark:block" // Light mode mein hidden, Dark mein visible
          style={{ 
            objectFit: 'contain',
            objectPosition: 'left' 
          }}
        />

      </div>
    </Link>
  );
}