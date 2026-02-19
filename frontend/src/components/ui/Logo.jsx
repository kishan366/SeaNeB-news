"use client";

export default function Logo({ size = "md" }) {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  return (
    <img
      src="\assets\logo.png"
      alt="SeaNeB"
      className={`${sizes[size]} w-auto`}
    />
  );
}
