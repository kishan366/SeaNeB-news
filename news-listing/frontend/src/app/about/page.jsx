"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Target, 
  Eye, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck
} from 'lucide-react';
import { useLang } from "@/context/LangContext"; //  Language hook import kiya

const AboutPage = () => {
  const { t } = useLang(); //  Translation object nikala

  // Fallback data (Agar JSON load na ho toh ye dikhega)
  const coverage = t.about?.coverage || [
    "Breaking News", "Political Updates", "Business & Economy", 
    "Technology & Innovation", "Entertainment & Culture", "Health & Science"
  ];

  const missionPoints = t.about?.missionPoints || [
    "Deliver accurate and unbiased news",
    "Promote local journalism",
    "Provide a publishing platform for verified contributors",
    "Combine national and regional coverage"
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* H1: Hero Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6 font-bold">
            {t.about?.hero_title_part1 || "About"} <span className="text-gray-400">{t.about?.hero_title_part2 || "SeaNeB News"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal">
            {t.about?.hero_subtitle || "India's Trusted Digital & Local News Platform"}
          </p>
        </div>
      </section>

      {/* Main Content: Mission & Founded Info */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-2xl md:text-3xl font-normal leading-tight mb-8 text-slate-800 dark:text-slate-200">
            {t.about?.mission_statement || "SeaNeB News was founded with a simple mission to make news more"} <span className="text-black dark:text-white underline decoration-2 underline-offset-4">{t.about?.mission_highlight || "local, transparent, and accessible"}</span>.
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.about?.description || "In a world dominated by large media houses, many grassroots stories go unheard. SeaNeB changes that by empowering local journalists, regional reporters, and community contributors to publish directly on our platform."}
          </p>
        </div>
      </section>

      {/* Vision & Mission Cards */}
      <section className="py-16 bg-white dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Vision - Dark Card (Always Dark or deeper in Dark Mode) */}
            <div className="p-10 rounded-3xl bg-slate-900 dark:bg-black text-white shadow-xl border border-transparent dark:border-slate-800">
              <Eye className="mb-6 text-gray-300" size={40} />
              <h2 className="text-3xl font-normal uppercase tracking-tight mb-4">{t.about?.vision_title || "Our Vision"}</h2>
              <p className="text-xl text-slate-300 font-normal italic">
                {t.about?.vision_text || "To become India’s most trusted hyperlocal digital news network."}
              </p>
            </div>

            {/* Mission - Light/Dark Card */}
            <div className="p-10 rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all">
              <Target className="mb-6 text-black dark:text-white" size={40} />
              <h2 className="text-3xl font-normal uppercase tracking-tight mb-6 dark:text-white">{t.about?.mission_title || "Our Mission"}</h2>
              <ul className="space-y-4">
                {missionPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-1" size={20} />
                    <span className="text-slate-700 dark:text-slate-300 font-normal">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-sm font-normal uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-10">{t.about?.we_cover || "We Cover"}</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {coverage.map((item, idx) => (
              <span key={idx} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-normal text-slate-700 dark:text-slate-200 shadow-sm transition-colors">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility & Inclusivity */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center border-t border-slate-100 dark:border-slate-900 pt-20 transition-colors">
          <div className="flex justify-center mb-6 text-black dark:text-white">
             <ShieldCheck size={48} />
          </div>
          <h2 className="text-3xl font-normal uppercase tracking-tighter mb-6 dark:text-white">{t.about?.footer_title || "Credibility, Speed, and Inclusivity"}</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
            {t.about?.footer_text || "Our editorial team ensures every published story meets quality and factual standards. We are not just a news website, we are a community-driven digital media ecosystem."}
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-full font-normal uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg active:scale-95 shadow-gray-200 dark:shadow-none"
          >
            {t.about?.join_btn || "Join the Community"} <ArrowRight size={20} />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;