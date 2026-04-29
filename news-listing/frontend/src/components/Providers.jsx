"use client";

import { LangProvider } from '@/context/LangContext';
import { ThemeProviders } from '@/context/ThemeProvider';

export default function Providers({ children }) {
  return (
    <LangProvider>
      <ThemeProviders>
        {children}
      </ThemeProviders>
    </LangProvider>
  );
}