"use client";

import React from 'react';
import { useLang } from "@/context/LangContext";
import { Gavel, Mail, MapPin, FileText, Phone } from 'lucide-react';
import termsData from '@/data/terms-data.json';

const TermsPage = () => {
  const { t: langT } = useLang();
  const terms = langT?.terms || termsData;

  // Use translations from i18n JSON
  const title = terms.document_info.title;
  const lastUpdated = `Last updated ${terms.document_info.last_updated}`;
  const introText = terms.sections[0].content;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">
      
      {/* Header Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6">
            Terms & <span className="text-gray-400">Conditions</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal mb-4 uppercase tracking-widest">
            {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-12 text-[17px] leading-relaxed">
            
            {/* Introduction */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-3xl font-normal mb-6 tracking-tight text-black dark:text-white underline decoration-black dark:decoration-white">
                AGREEMENT TO OUR LEGAL TERMS
              </h2>
              <p className="text-lg font-normal text-slate-700 dark:text-slate-300">
                {introText}
              </p>
              <p className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-3xl border-l-4 border-black dark:border-white text-slate-700 dark:text-slate-300 transition-colors font-normal">
                <strong className="text-black dark:text-white uppercase tracking-tight font-normal">IMPORTANT:</strong> These Legal Terms constitute a legally binding agreement made between you and SeaNeB Technologies. By accessing the Services, you agree to be bound by all of these Legal Terms.
              </p>
            </div>

            {/* Table of Contents */}
            <div className="bg-slate-900 dark:bg-black text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl transition-colors border border-transparent dark:border-slate-800">
              <h3 className="text-xl font-normal mb-8 tracking-[0.2em] text-gray-400">
                {terms.table_of_contents_title || "TABLE OF CONTENTS"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 font-normal text-slate-300">
                {terms.table_of_contents.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 hover:text-white transition-colors cursor-default group">
                    <span className="text-gray-600 group-hover:text-white transition-colors">#</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-20">
              {terms.sections.map((section) => (
                <section key={section.id} id={`section-${section.id}`} className="scroll-mt-24 group">
                  <h2 className="text-3xl font-normal mb-6 flex items-center gap-6 group-hover:underline decoration-black dark:decoration-white underline-offset-8 transition-all">
                    <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal text-sm transition-colors">
                      {section.id}
                    </span>
                    <span className="uppercase tracking-tight">{section.title}</span>
                  </h2>
                  <div className="whitespace-pre-line text-slate-600 dark:text-slate-400 pl-16 text-lg font-normal">
                    {section.content}
                  </div>
                </section>
              ))}

              {/* Contact Section */}
              <section className="pt-20 border-t border-slate-100 dark:border-slate-900 transition-colors">
                <h2 className="text-3xl font-normal mb-10 tracking-tighter text-black dark:text-white underline decoration-black dark:decoration-white underline-offset-8">
                   {terms.contact_us_title || "CONTACT US"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group transition-all hover:bg-white dark:hover:bg-black hover:border-black dark:hover:border-white">
                    <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform">
                      <MapPin size={28} />
                    </div>
                    <p className="font-normal text-xl mb-2 text-slate-900 dark:text-white tracking-tight">{terms.document_info.company_name}</p>
                    <p className="text-slate-500 dark:text-slate-400 font-normal">{terms.document_info.company_address}</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group transition-all hover:bg-white dark:hover:bg-black hover:border-black dark:hover:border-white">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 text-black dark:text-white rounded-2xl flex items-center justify-center mb-6 group-hover:-rotate-6 transition-transform">
                      <Mail size={28} />
                    </div>
                    <p className="font-normal text-xl mb-2 text-slate-900 dark:text-white tracking-tight">Email Support</p>
                    <a href={`mailto:${terms.document_info.contact_email}`} className="text-black dark:text-white font-normal hover:underline cursor-pointer transition-all">
                      {terms.document_info.contact_email}
                    </a>
                  </div>
                </div>
              </section>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
