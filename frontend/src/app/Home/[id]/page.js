"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Logo from "@/components/ui/Logo";
import { Bell, Settings, LayoutGrid, UserRoundPen, ArrowLeft, Volume2, ThumbsUp } from 'lucide-react';

export default function NewsBriefPage() {
  const { id } = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // SEO: Structured Data for Google News
  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "Supreme Court to hear plea on new farm laws tomorrow",
    "image": ["https://images.unsplash.com/photo-1504711434969-e33886168f5c"],
    "datePublished": "2026-02-12T15:00:00+05:30",
    "author": { "@type": "Organization", "name": "SeaNeB News" }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* 1. SEO: Injecting JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsSchema) }}
      />
      
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 max-w-6xl mx-auto">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-all" aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <Logo />
        </div>
        <div className="flex items-center gap-6 text-gray-500">
          <button className="hover:text-black"><Bell size={20} /></button>
          <button className="hover:text-black"><Settings size={20} /></button>
          <button className="hover:text-black"><LayoutGrid size={20} /></button>
          <div className="w-8 h-8 bg-[#1a73e8] text-white rounded-full flex items-center justify-center cursor-pointer shadow-sm">
            <UserRoundPen size={18} />
          </div>
        </div>
      </header>

      {/* 2. SEO: Use <main> and <article> for semantic meaning */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-600 rounded-sm" aria-hidden="true"></div>
            {/* 3. SEO: Use <time> tag */}
            <time className="text-sm font-bold text-gray-700" dateTime="2026-02-12">
              The Hindu • 5 hours ago
            </time>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Listen to news">
            <Volume2 size={20} />
          </button>
        </div>

        {/* 4. SEO: H1 must contain keywords */}
        <h1 className="text-[32px] md:text-[40px] font-bold leading-tight tracking-tight mb-6 text-gray-900">
          Supreme Court to hear plea on new farm laws tomorrow
        </h1>

        <div className="w-full aspect-video bg-gray-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000" 
            alt="Supreme Court building - Farm laws hearing illustration" 
            className="w-full h-full object-cover opacity-90 transition-opacity hover:opacity-100"
            loading="eager" // Hero image should load fast
          />
        </div>

        <article className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-10">
          <p className="mb-4 text-lg">
            The **Supreme Court** will hear a batch of pleas challenging the **three new laws** tomorrow. 
            Several farmer unions have been protesting against these laws for the past few months. 
            The hearing is expected to address the constitutional validity of the legislation.
          </p>
          <p className="text-lg">
            This news is currently developing. SeaNeB News will provide real-time updates as the 
            bench convenes tomorrow morning at 10:30 AM.
          </p>
        </article>

        <div className="flex items-center gap-4 border-t border-gray-100 pt-8 mb-10">
          <button className="flex items-center gap-2 px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">
            <ThumbsUp size={18} /> Like
          </button>
          <button className="flex items-center gap-2 px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">
            Follow The Hindu
          </button>
        </div>

        <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Comments</h2>
          <div className="flex gap-4 items-start">
             <div className="w-10 h-10 bg-gray-300 rounded-full shrink-0" aria-hidden="true"></div>
             <div className="flex-1">
                <textarea 
                  placeholder="Write a comment..." 
                  className="w-full bg-transparent border-none outline-none resize-none text-gray-700 placeholder-gray-400"
                  rows="2"
                ></textarea>
                <div className="flex justify-end mt-2">
                   <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg text-sm font-bold transition-colors">Post</button>
                </div>
             </div>
          </div>
        </section>
      </main>

      <footer className="py-10 text-center text-xs text-gray-400 border-t border-gray-50 mt-10">
        <p>Copyright © 2026 SeaNeB News. All rights reserved.</p>
      </footer>
    </div>
  );
}