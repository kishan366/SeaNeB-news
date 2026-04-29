"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight,
  CheckCircle,
  ShieldAlert,
  Newspaper,
  Users,
  Search,
  Globe,
  Zap,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { useLang } from "@/context/LangContext";

// Import local JSON data
import solutionsData from '@/data/solutions.json';

const SolutionsPage = () => {
  const { t: langT } = useLang();
  const t = langT?.solutions || solutionsData;
  const [openFaq, setOpenFaq] = useState(null);

  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": t.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-white transition-colors duration-300">
      {/* Inject FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6 font-bold-900">
            {t.hero.title.split(' ')[0]} <span className="text-gray-400">{t.hero.title.split(' ').slice(1).join(' ') || "Solutions"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed">
            {t.hero.subtitle}
          </p>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 bg-white dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-normal tracking-tighter mb-6 text-black dark:text-white">
                {t.problem.title}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-normal">
                {t.problem.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                {t.problem.challenges.map((challenge, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 group hover:border-black dark:hover:border-white transition-all">
                    <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                      <ShieldAlert size={20} />
                    </div>
                    <span className="font-normal text-slate-700 dark:text-slate-200">{challenge}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center p-8 bg-slate-900 dark:bg-black text-white rounded-[2.5rem] shadow-2xl">
                <blockquote className="text-2xl font-normal italic mb-6 leading-tight">
                  "{t.problem.footer}"
                </blockquote>
                <div className="h-1 w-20 bg-gray-500"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30 transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-normal tracking-tighter mb-4">
              The SeaNeB <span className="text-slate-400">Solution</span>
            </h2>
            <div className="h-1.5 w-24 bg-black dark:bg-white mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {t.solutions.items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 group-hover:bg-black dark:group-hover:bg-white transition-colors">
                  {item.id === 1 && <ShieldAlert className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />}
                  {item.id === 2 && <Users className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />}
                  {item.id === 3 && <Search className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />}
                  {item.id === 4 && <Globe className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />}
                  {item.id === 5 && <Zap className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />}
                </div>
                <h3 className="text-2xl font-normal mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-normal italic underline decoration-slate-200 dark:decoration-slate-700 underline-offset-4">{item.description}</p>
                <ul className="space-y-4">
                  {item.points.map((point, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-black dark:text-white shrink-0" />
                      <span className="font-normal text-sm text-slate-700 dark:text-slate-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="py-24 bg-white dark:bg-slate-950 transition-colors overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-normal tracking-tighter mb-8 text-black dark:text-white">
                {t.commitment.title}
              </h2>
              <p className="text-2xl font-normal bg-slate-900 text-white dark:bg-white dark:text-black p-8 rounded-4xl mb-8 transform -rotate-1">
                "{t.commitment.description}"
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {t.commitment.points.map((point, idx) => (
                <div key={idx} className="flex items-center gap-6 p-6 rounded-3xl border-b-4 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center font-normal group-hover:border-black dark:group-hover:border-white">
                    {idx + 1}
                  </div>
                  <span className="text-xl font-normal tracking-tight text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30 transition-colors">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-normal tracking-[0.3em] text-slate-400 mb-4">Questions</h2>
            <h3 className="text-4xl md:text-5xl font-normal tracking-tighter">Everything explained</h3>
          </div>

          <div className="space-y-4">
            {t.faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all ${openFaq === idx ? 'border-black dark:border-white shadow-2xl' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-8 text-left"
                >
                  <span className={`text-lg font-normal tracking-tight transition-colors ${openFaq === idx ? 'text-black dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {faq.question}
                  </span>
                  {openFaq === idx ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
                {openFaq === idx && (
                  <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-slate-600 dark:text-slate-400 text-lg font-normal leading-relaxed border-l-4 border-slate-200 dark:border-slate-700 pl-6">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-black dark:bg-black text-white text-center">
        <div className="container mx-auto px-6">
          <MessageSquare className="mx-auto mb-8 text-slate-500" size={48} />
          <h2 className="text-4xl md:text-4xl font-normal tracking-tighter mb-4 decoration-slate-800 underline-offset-12">
            {t.cta.title}
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-normal">
            {t.cta.subtitle}
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-4 bg-white text-black px-12 py-4 rounded-full font-normal uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
          >
            {t.cta.button} <ArrowRight size={24} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default SolutionsPage;