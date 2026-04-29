"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Newspaper, ShieldAlert } from 'lucide-react';
import { useLang } from "@/context/LangContext"; //  Language hook

const FaqsPage = () => {
  const { t } = useLang(); //  Context se data liya
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  //  Context  FAQs nikalna
  const faqList = t.faqs?.questions || [];
  const faqStatic = t.faqs?.static || {
    title: "FAQ Library",
    subtitle: "Search through our database...",
    placeholder: "Search your question...",
    results: "Showing Results",
    noResults: "No questions match your search.",
    needHelp: "Need more help?",
    contactBtn: "Contact Our Newsroom"
  };

  // Filter functionality
  const filteredFaqs = faqList.filter(faq => 
    faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
      
      {/* Header Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6">
            SeaNeB <span className="text-gray-400">{faqStatic.title}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal mb-10">
            {faqStatic.subtitle}
          </p>

          <div className="max-w-xl mx-auto relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors" size={20} />
            <input 
              type="text" 
              placeholder={faqStatic.placeholder}
              className="w-full pl-14 pr-6 py-5 bg-white/10 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-white transition-all text-lg"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* FAQ List Card */}
      <div className="container mx-auto px-6 -mt-10">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-4 md:p-8 transition-colors">
          
          <div className="flex items-center gap-3 mb-8 px-4">
            <Newspaper className="text-black dark:text-white" />
            <span className="font-normal uppercase tracking-widest text-sm text-slate-400 dark:text-slate-500">
              {faqStatic.results}: {filteredFaqs.length}
            </span>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`group border-b border-slate-50 dark:border-slate-800 last:border-none transition-all ${
                  openIndex === idx ? 'bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl' : ''
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-6 text-left"
                >
                  <span className={`text-lg font-normal leading-tight ${openIndex === idx ? 'text-black dark:text-white underline decoration-2 underline-offset-4' : 'text-slate-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors'}`}>
                    {idx + 1}. {faq.q}
                  </span>
                  {openIndex === idx ? 
                    <ChevronUp className="text-black dark:text-white shrink-0" size={20} /> : 
                    <ChevronDown className="text-slate-300 dark:text-slate-600 shrink-0" size={20} />
                  }
                </button>
                
                {openIndex === idx && (
                  <div className="px-6 pb-8 animate-in fade-in duration-300">
                    <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {filteredFaqs.length === 0 && (
              <div className="text-center py-20">
                <ShieldAlert className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
                <p className="text-slate-400 dark:text-slate-600 font-normal">{faqStatic.noResults}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-20 text-center">
        <p className="text-slate-400 dark:text-slate-500 font-normal uppercase text-xs tracking-[0.3em] mb-4">{faqStatic.needHelp}</p>
        <a href="/contact" className="inline-block bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-full font-normal hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-xl active:scale-95">
          {faqStatic.contactBtn}
        </a>
      </div>
    </div>
  );
};

export default FaqsPage;