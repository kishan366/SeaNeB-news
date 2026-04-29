"use client";

import React from 'react';
import { 
  Newspaper, 
  Megaphone, 
  MailCheck, 
  Send, 
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import { useLang } from "@/context/LangContext"; //  Language hook

const ContactPage = () => {
  const { t } = useLang(); //  Context se data liya

  // Fallback data agar JSON na mile
  const { hero, departments, communication_from, footer_text, form } = t.contact || {
    hero: { h1: "Contact Us", subtitle: "We are here to help" },
    departments: [],
    communication_from: [],
    footer_text: "",
    form: { labels: {}, placeholders: {}, options: [] }
  };

  const getIcon = (iconName) => {
    switch(iconName) {
      case "Newspaper": return <Newspaper size={28} />;
      case "Megaphone": return <Megaphone size={28} />;
      case "MailCheck": return <MailCheck size={28} />;
      default: return <MessageSquare size={28} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="py-20 bg-[#0f172a] dark:bg-black text-white border-b border-transparent dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-normal tracking-tighter mb-6 font-bold">
            {hero.h1.split(" ")[0]} <span className="text-gray-400">{hero.h1.split(" ").slice(1).join(" ") || "SeaNeB News"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-normal">
            {hero.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            
            {/* Left side */}
            <div className="lg:col-span-5 space-y-12">
              <div>
                <h2 className="text-sm font-normal tracking-[0.3em] text-black dark:text-white mb-6">
                  {form.labels.who_reach || "Who can reach out?"}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {communication_from.map((item, idx) => (
                    <span key={idx} className="px-5 py-2 bg-slate-100 dark:bg-slate-900 rounded-full text-sm font-normal text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {departments.map((dept) => (
                  <div key={dept.id} className="group p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl dark:hover:shadow-none hover:border-black dark:hover:border-white transition-all duration-300">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-black dark:text-white mb-4 shadow-sm group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
                      {getIcon(dept.icon)}
                    </div>
                    <h3 className="text-xl font-normal tracking-tight mb-2 dark:text-white">{dept.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{dept.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-100 dark:shadow-none transition-colors">
              <h2 className="text-3xl font-normal tracking-tighter mb-8 dark:text-white">{form.labels.title || "Send a Message"}</h2>
              
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-normal tracking-widest text-slate-400 dark:text-slate-500">{form.labels.name}</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-slate-700 dark:text-white transition-all" placeholder={form.placeholders.name} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-normal tracking-widest text-slate-400 dark:text-slate-500">{form.labels.email}</label>
                    <input type="email" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-slate-700 dark:text-white transition-all" placeholder={form.placeholders.email} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-normal uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {form.labels.dept}
                  </label>

                  <div className="relative group">
                    <select className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all appearance-none cursor-pointer font-normal pr-12">
                      {form.options.map((opt, i) => (
                        <option key={i} className="bg-white dark:bg-slate-900 py-4">
                          {opt}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
                      <ChevronDown size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-normal uppercase tracking-widest text-slate-400 dark:text-slate-500">{form.labels.message}</label>
                  <textarea rows="5" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-slate-700 dark:text-white transition-all resize-none" placeholder={form.placeholders.message}></textarea>
                </div>

                <button type="button" className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-normal uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg active:scale-95 shadow-gray-200 dark:shadow-none">
                  {form.labels.btn} <Send size={20} />
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Quote */}
      <section className="py-16 border-t border-slate-50 dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto py-8 px-12 rounded-full border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 font-normal italic text-sm transition-colors">
            "{footer_text}"
          </div>
        </div>
      </section>

    </div>
  );
};

export default ContactPage;