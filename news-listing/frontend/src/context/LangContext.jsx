"use client";
import { createContext, useState, useContext, useEffect, useMemo } from "react";

import en from "@/i18n/en";
import hi from "@/i18n/hi";
import gu from "@/i18n/gu";

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState("en");

  // Sync with LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("app_lang");
    if (saved && ["en", "hi", "gu"].includes(saved)) {
      setLang(saved);
    }
  }, []);

  // Force update 't' when 'lang' changes
  const value = useMemo(() => {
    const translations = { en, hi, gu };
  

    return {
      lang,
      setLang: (newLang) => {
        setLang(newLang);
        localStorage.setItem("app_lang", newLang);
      },
      t: translations[lang] || en
    };
  }, [lang]); // [lang] dependency is crucial here!

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);