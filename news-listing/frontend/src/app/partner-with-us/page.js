"use client";

import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowUpRight 
} from 'lucide-react';
import { useLang } from "@/context/LangContext";

export default function PartnerPage() {
  const { t } = useLang();

  // Crash Prevention: Agar data load nahi hua
  if (!t || !t.partner) {
    return <div className="min-h-screen bg-white dark:bg-slate-950 animate-pulse" />;
  }

  const { content } = t.partner;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6 font-bold">
            {content.h1} <span className="text-gray-400">{content.h1_highlight}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal">
            {content.intro}
          </p>
        </div>
      </section>

      {/* Target Audience (If you are...) */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {content.target_audience?.map((item, i) => (
              <span key={i} className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 rounded-full font-normal text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-800">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-normal tracking-tighter mb-12 text-center text-slate-900 dark:text-white">
            {content.why_partner?.title}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.why_partner?.items?.map((item, i) => (
              <div key={i} className="p-8 bg-white dark:bg-black rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:border-black dark:hover:border-white transition-all group">
                <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                  <Zap size={24} />
                </div>
                <h4 className="font-normal text-sm mb-3 text-slate-900 dark:text-white">{item.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Steps */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-slate-900 dark:bg-black p-10 md:p-16 rounded-[4rem] text-white relative overflow-hidden border border-transparent dark:border-slate-800">
            <h2 className="text-3xl font-normal mb-10">How the Partnership Works</h2>
            <div className="space-y-6 relative z-10">
              {content.steps?.map((step, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center font-normal text-xs group-hover:bg-white group-hover:text-black transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-lg font-normal tracking-tight">{step}</p>
                </div>
              ))}
            </div>
            <Globe className="absolute -bottom-10 -right-10 opacity-10" size={300} />
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-center text-sm font-normal tracking-[0.4em] text-slate-400 dark:text-slate-500 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {content.faqs?.map((faq, i) => (
              <details key={i} className="group p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 cursor-pointer overflow-hidden transition-all">
                <summary className="list-none flex justify-between items-center font-normal text-sm tracking-tight text-slate-800 dark:text-slate-200">
                  {faq.q}
                  <ChevronRight size={18} className="group-open:rotate-90 transition-transform text-slate-400 dark:text-slate-500" />
                </summary>
                <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-4">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 border-t border-slate-100 dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <ShieldCheck className="mx-auto text-black dark:text-white mb-6" size={56} />
          <h2 className="text-4xl font-normal tracking-tighter mb-6 leading-none text-slate-900 dark:text-white">
            Become a SeaNeB News <br/> Partner Today
          </h2>
          <button className="bg-black dark:bg-white text-white dark:text-black px-10 py-3 rounded-full font-normal uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-gray-200 dark:shadow-none active:scale-95">
            Get Verified Now <ArrowUpRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}