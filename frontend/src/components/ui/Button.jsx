"use client";

export default function Button({
  children,
  onClick,
  disabled = false,
  type = "button",
  variant = "primary",
  className = "",
}) {
  // Base style mein 'cursor-pointer' add kiya gaya hai
  const baseStyle =
    "w-full rounded-xl font-bold transition-all duration-200 focus:outline-none cursor-pointer";

  const variants = {
    primary: "bg-[var(--primary-bg)] text-[var(--primary-text)] hover:opacity-90 active:scale-[0.98]",
    secondary: "bg-[var(--secondary-bg)] text-[var(--secondary-text)] hover:opacity-80",
  };

  // Jab disabled hoga, toh 'cursor-not-allowed' baseStyle ke pointer ko override kar dega
  const disabledStyle = "bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed shadow-none";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${
        disabled ? disabledStyle : variants[variant]
      } ${className}`}
    >
      {children}
    </button>
  );
}