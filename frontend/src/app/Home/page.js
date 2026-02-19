"use client";
import Logo from "@/components/ui/Logo";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Settings, LayoutGrid, UserRoundPen, Search } from 'lucide-react';

export default function NewsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  // SEO: Structured Data for Google (ItemList Schema)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Top News Stories"
      }
    ]
  };

  return (
    <div className="h-screen w-screen bg-[#f8f9fa] flex flex-col overflow-hidden font-sans">
      {/* 1. SEO: Injecting JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="flex flex-1 overflow-hidden">
        
        {/* PARTITION 1: LEFT ADS */}
        <aside className="hidden lg:flex w-70 2xl:w-[320px] h-full bg-white border-r border-gray-800 flex-col items-center justify-center shrink-0">
          <div className="relative w-60 h-150 bg-[#BEE3F8] rounded-xl border border-blue-100 flex items-center justify-center shadow-sm">
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-black opacity-20"></div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 uppercase tracking-widest font-bold">Advertisement</p>
        </aside>

        {/* PARTITION 2: MAIN NEWS SECTION */}
        {/* SEO: Changed from <div> to <main> */}
        <main className="flex-1 bg-white overflow-y-auto no-scrollbar">
          <div className="max-w-275 mx-auto">
            
            <header className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Logo />
                <div className="relative w-125">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"><Search /></span>
                  <input
                    type="text"
                    placeholder="Search for topics, locations & sources"
                    className="w-full bg-[#f1f3f4] border-none rounded-full py-3 pl-12 pr-4 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[15px] text-gray-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 text-gray-500">
                <button className="hover:text-black" aria-label="Notifications"><Bell /></button>
                <button className="hover:text-black" aria-label="Settings"><Settings /></button>
                <button className="hover:text-black" aria-label="Apps"><LayoutGrid /></button>
                <div className="ml-2 w-9 h-9 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm border border-transparent hover:shadow-md overflow-hidden">
                   <UserRoundPen size={20} strokeWidth={2.5} />
                </div>
              </div>
            </header>

            <nav className="px-6 border-b border-gray-200 flex justify-center gap-12 py-3 text-[13px] font-medium text-gray-500">
              {["All", "Business", "Technology", "Sports", "Entertainment", "Health", "Science"].map((cat, i) => (
                <button key={cat} className={`${i === 0 ? "text-blue-600 border-b-2 border-blue-600" : "hover:text-black"} pb-1 px-2`}>
                  {cat}
                </button>
              ))}
            </nav>

            <div className="px-8 py-8">
              <div className="flex justify-between items-start mb-10">
                <div>
                  {/* SEO: H1 for the main page context */}
                  <h1 className="text-[28px] font-medium text-gray-800 flex items-center gap-2">
                    Anand, Gujarat <span className="text-sm text-gray-400 cursor-pointer">▼</span>
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Thursday 18 December</p>
                  <h2 className="text-blue-600 font-bold text-lg mt-8 mb-4">Trending Topics</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Left Column (Main Stories) */}
                <div className="lg:col-span-2 space-y-12">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-500 text-sm uppercase">Top News <span className="text-gray-300 ml-1">›</span></h3>
                  </div>
                  
                  {[1, 2].map((i) => (
                    <Link href={`/Home/${i}`} key={i}>
                      {/* SEO: Changed to <article> tag for individual news items */}
                      <article className="group cursor-pointer flex gap-6 mb-12">
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="w-4 h-4 bg-red-600 rounded-sm"></div>
                              <span className="text-xs font-bold text-gray-600">Times of India</span>
                           </div>
                           <h3 className="text-xl font-bold leading-tight group-hover:underline text-gray-900 mb-2">
                             No quick fix: Delhi minister Manjinder Singh Sirsa announces strict restrictions for local commuters...
                           </h3>
                           <p className="text-xs text-gray-400 font-medium">
                             <time dateTime="2026-12-18">19 hours ago</time>
                           </p>
                        </div>
                        <div className="w-45 h-30 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                          <img 
                            src="/api/placeholder/180/120" 
                            alt="Delhi Minister news thumbnail" 
                            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
                          />
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {/* Right Column (Sidebar Articles) */}
                <aside className="space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-500 text-sm uppercase">Articles <span className="text-gray-300 ml-1">›</span></h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs font-bold text-gray-700 leading-snug">
                    Sign in for personalised stories in your briefing and news feed
                  </div>
                  {[1, 2, 3].map((i) => (
                    <Link href={`/Home/article-${i}`} key={i}>
                      <article className="group cursor-pointer space-y-3 mb-8">
                         <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                            <div className="w-full h-full bg-slate-700"></div>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                            <span className="text-[11px] font-bold text-gray-500">Times of India</span>
                         </div>
                         <h4 className="text-[13px] font-bold leading-tight group-hover:underline">
                           Manjinder Singh Sirsa announces strict...
                         </h4>
                      </article>
                    </Link>
                  ))}
                </aside>
              </div>
            </div>
          </div>
        </main>

        {/* PARTITION 3: RIGHT ADS */}
        <aside className="hidden xl:flex w-70 2xl:w-[320px] h-full bg-white border-l border-gray-800 flex-col items-center justify-center shrink-0">
          <div className="relative w-60 h-150 bg-[#BEE3F8] rounded-xl border border-blue-100 flex items-center justify-center shadow-sm">
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-black opacity-20"></div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 uppercase tracking-widest font-bold">Advertisement</p>
        </aside>
      </div>

      {/* FOOTER TICKER */}
      <footer className="h-8.75 bg-[#FF0000] text-white flex items-center overflow-hidden shrink-0 z-50">
        <div className="flex animate-marquee whitespace-nowrap text-[11px] font-bold uppercase">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="mx-12 flex items-center gap-4">
              News Corp delivers authoritative <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          ))}
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}