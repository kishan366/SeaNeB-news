"use client";

import React from 'react';
import { useLang } from "@/context/LangContext";
import { ShieldCheck, Mail, MapPin, FileText } from 'lucide-react';
import privacyData from '@/data/privacy-data.json'; //  Path updated to local directory

const PrivacyPage = () => {
  const { t: langT } = useLang();
  const privacy = langT?.privacy || privacyData;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">
      
      {/* Header Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6 font-bold">
            Privacy <span className="text-gray-400">Policy</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal mb-4 uppercase tracking-widest">
            {privacy.document_info.last_updated ? `Last updated ${privacy.document_info.last_updated}` : ''}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-10 text-[16px] leading-relaxed">
            
            {/* Introduction */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                {privacy.introduction.content}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                {privacy.introduction.points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
              <p className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border-l-4 border-black dark:border-white transition-colors">
                <strong className="text-black dark:text-white uppercase tracking-tight font-normal">Questions or concerns?</strong> {privacy.introduction.footer_note}
              </p>
            </div>

            {/* Summary Section */}
            <div className="p-8 md:p-12 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 transition-colors">
              <h2 className="text-3xl font-normal mb-6 tracking-tight text-black dark:text-white">
                {privacy.summary.title}
              </h2>
              <p className="text-sm italic mb-8 text-slate-500 dark:text-slate-400">{privacy.summary.description}</p>
              
              <div className="space-y-8">
                {privacy.summary.key_points.map((item, idx) => (
                  <div key={idx} className="group">
                    <h4 className="font-normal uppercase text-sm mb-2 text-slate-800 dark:text-slate-200 group-hover:underline decoration-2 underline-offset-4 decoration-black dark:decoration-white transition-all">{item.question}</h4>
                    <p className="text-slate-600 dark:text-slate-400">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Table of Contents */}
            <div className="bg-slate-900 dark:bg-black text-white p-8 md:p-12 rounded-[2.5rem] transition-colors border border-transparent dark:border-slate-800">
              <h3 className="text-xl font-normal mb-6 tracking-[0.2em] text-gray-400">TABLE OF CONTENTS</h3>
              <ol className="list-decimal pl-6 space-y-3 font-normal text-slate-300">
                {privacy.table_of_contents.map((item, idx) => (
                  <li key={idx} className="hover:text-white transition-colors cursor-default">{item}</li>
                ))}
              </ol>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-16">
              <section className="group">
                <h2 className="text-3xl font-normal mb-6 tracking-tight">{privacy.full_sections.section_1.title}</h2>
                <h4 className="font-normal text-black dark:text-white mb-3 underline decoration-black dark:decoration-white underline-offset-4">{privacy.full_sections.section_1.subtitle}</h4>
                <p className="italic mb-6 text-slate-400 dark:text-slate-500 font-normal">{privacy.full_sections.section_1.short_note}</p>
                <p className="text-slate-700 dark:text-slate-300">{privacy.full_sections.section_1.content}</p>
                <div className="mt-8 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
                  <p className="font-normal text-sm uppercase tracking-widest mb-4 text-slate-400">The personal information we collect may include:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-normal text-slate-600 dark:text-slate-400">
                    {privacy.full_sections.section_1.collected_items.map(i => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full"></div>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <p className="font-normal text-sm uppercase tracking-widest mb-2 text-slate-400">Google API</p>
                  <p className="text-slate-600 dark:text-slate-400">{privacy.full_sections.section_1.google_api_note}</p>
                </div>
              </section>

              <section>
                <h2 className="text-3xl font-normal mb-6 uppercase tracking-tight">{privacy.full_sections.section_2.title}</h2>
                <p className="italic mb-6 text-slate-400 dark:text-slate-500 font-normal">{privacy.full_sections.section_2.short_note}</p>
                <ul className="space-y-4 font-normal text-slate-700 dark:text-slate-300">
                  {privacy.full_sections.section_2.purposes.map((purpose, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-black dark:text-white mt-1">•</span>
                      <span>{purpose}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-normal mb-6 uppercase tracking-tight">{privacy.full_sections.section_5.title}</h2>
                <p className="italic mb-6 text-slate-400 dark:text-slate-500 font-normal">{privacy.full_sections.section_5.short_note}</p>
                <p className="text-slate-700 dark:text-slate-300">{privacy.full_sections.section_5.google_analytics}</p>
              </section>

              <section>
                <h2 className="text-3xl font-normal mb-6 uppercase tracking-tight">{privacy.full_sections.section_11.title}</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 transition-colors">
                  <div className="flex items-start gap-6 mb-8">
                    <div className="p-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-lg">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="font-normal text-xl uppercase tracking-tight mb-1">{privacy.full_sections.section_11.address.company}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-normal">
                        {privacy.full_sections.section_11.address.street}, {privacy.full_sections.section_11.address.locality}, {privacy.full_sections.section_11.address.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-200 dark:bg-slate-800 text-black dark:text-white rounded-2xl">
                      <Mail size={24} />
                    </div>
                    <p className="font-normal text-lg tracking-tight hover:underline cursor-pointer">{privacy.document_info.contact_email}</p>
                  </div>
                </div>
              </section>

              <section className="bg-slate-900 dark:bg-black text-white p-8 md:p-12 rounded-[2.5rem] border border-transparent dark:border-slate-800">
                <h2 className="text-2xl font-normal mb-6 uppercase tracking-tight">12. HOW CAN YOU REVIEW, UPDATE, OR DELETE DATA?</h2>
                <p className="text-slate-400 font-normal leading-relaxed">Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you. To request to review, update, or delete your personal information, please contact us at <span className="text-white underline decoration-white underline-offset-4">{privacy.document_info.contact_email}</span>.</p>
              </section>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;