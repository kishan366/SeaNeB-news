"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme(); // resolvedTheme 
  const [mounted, setMounted] = useState(false);

  // Hydration sync
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Button layout shift se bachne ke liye placeholder
    return <div className="p-5 w-10 h-10"></div>;
  }

  // resolvedTheme check karta hai ki actual mein screen dark hai ya light (system preference incl.)
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-yellow-400 transition-all hover:ring-2 hover:ring-blue-500/50 active:scale-90 flex items-center justify-center"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun size={20} strokeWidth={2.5} className="animate-in zoom-in duration-300" />
      ) : (
        <Moon size={20} strokeWidth={2.5} className="animate-in zoom-in duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;