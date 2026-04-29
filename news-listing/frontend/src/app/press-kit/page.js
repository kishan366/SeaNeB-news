"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Mail, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Share2 
} from 'lucide-react';
import { useLang } from "@/context/LangContext"; //

const PressKitPage = () => {
  const { t } = useLang(); //

  // Safety Check: Agar data load nahi hua toh blank screen ki jagah loading dikhaye
  if (!t || !t.pressKit) {
    return <div className="min-h-screen bg-white dark:bg-slate-950" />;
  }

  // Data mapping from your JSON structure
  const pressKitData = t.pressKit.content || {};
  const features = pressKitData.features?.items || [];
  const categories = pressKitData.categories || [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6 font-bold-900">
            {pressKitData.h1 ? pressKitData.h1.split(' ')[0] : "Press"} <span className="text-gray-400">{pressKitData.h1 ? pressKitData.h1.split(' ').slice(1).join(' ') : "Kit"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed">
            {pressKitData.intro}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-2xl md:text-3xl font-normal leading-tight mb-8 text-slate-800 dark:text-slate-200 tracking-tight">
            {pressKitData.mission?.title}: <span className="text-black dark:text-white underline decoration-2 underline-offset-4">{pressKitData.mission?.text}</span>
          </p>
        </div>
      </section>

      {/* Cards Section */}
      <section className="py-16 bg-white dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Platform Highlights */}
            <div className="p-10 rounded-3xl bg-slate-900 dark:bg-black text-white shadow-xl border border-transparent dark:border-slate-800">
              <Share2 className="mb-6 text-gray-400" size={40} />
              <h2 className="text-3xl font-normal tracking-tight mb-6">Highlights</h2>
              <ul className="space-y-4">
                {features.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="text-white shrink-0 mt-1" size={20} />
                    <span className="text-slate-300 font-normal">{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Media Contact */}
            <div className="p-10 rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all text-center flex flex-col justify-center">
              <Mail className="mb-6 text-black dark:text-white mx-auto" size={48} />
              <h2 className="text-3xl font-normal tracking-tight mb-6 dark:text-white">Media Inquiries</h2>
              <a href={`mailto:${pressKitData.contact?.email}`} className="text-2xl font-normal text-black dark:text-white hover:underline break-all">
                {pressKitData.contact?.email}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-sm font-normal uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-10">We Cover</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {categories.map((item, idx) => (
              <span key={idx} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-normal text-slate-700 dark:text-slate-200 shadow-sm transition-colors">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default PressKitPage;