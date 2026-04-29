// src/components/ui/Button.jsx
"use client";

export default function Button({ children, onClick, variant = "primary", className = "", ...props }) {
  const baseStyle = "px-4 py-2 rounded-lg font-semibold transition-colors";
  const variants = {
    primary: "bg-black text-white hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}