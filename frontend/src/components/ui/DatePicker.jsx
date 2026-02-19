"use client";

export default function DatePicker({
  label,
  name,
  value,
  onChange,
  required = false,
  minAge,
  errorText,
}) {
  const today = new Date().toISOString().split("T")[0];

  // Age calculation logic
  const isAgeInvalid =
    minAge &&
    value &&
    new Date().getFullYear() - new Date(value).getFullYear() < minAge;

  const handleChange = (e) => {
    // Parent ko direct value pass karein ya event, 
    // par consistent rehna zaroori hai.
    onChange(e); 
  };

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-black text-gray-700 mb-2 ml-1 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <input
        type="date"
        name={name}
        value={value || ""}
        max={today}
        onChange={handleChange}
        className={`w-full border-2 rounded-2xl px-5 py-3 bg-gray-50/50 font-bold text-gray-900 
          focus:bg-white focus:border-black outline-none transition-all h-14 uppercase
          ${isAgeInvalid ? "border-red-500" : "border-gray-50"}`}
      />

      {isAgeInvalid && (
        <p className="mt-1 text-[10px] font-bold text-red-500 ml-2">
          {errorText || `You must be at least ${minAge} years old`}
        </p>
      )}
    </div>
  );
}