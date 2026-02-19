"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import countries from "@/data/countries.json";
import Button from "@/components/ui/Button";
import LanguageSelect from "@/components/ui/LanguageSelect";
import Logo from "@/components/ui/Logo";
import en from "@/i18n/en";
import hi from "@/i18n/hi";
import gu from "@/i18n/gu";

const languages = { en, hi, gu };

export default function PhoneLogin() {
  const router = useRouter();

  const [country, setCountry] = useState(countries[0]);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("whatsapp");
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = languages[lang];
  const isValid = phone.length >= 8;

  const filteredCountries = useMemo(
    () =>
      countries.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.dialCode.includes(searchQuery)
      ),
    [searchQuery]
  );

  /* ---------- SEND OTP ---------- */
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ---------- SEND OTP ---------- */
const sendOtp = async () => {
  if (!isValid || loading) return;

  setLoading(true);
  setError("");

  // 1. CLEAN DATA: Remove everything except digits ( "+91" -> "91")
  const cleanCC = country.dialCode.replace(/\D/g, "");
  const cleanPhone = phone.replace(/\D/g, "");

  try {
    const res = await fetch(
      `${API_BASE}/api/v1/otp/send-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier_type: 0,        
          country_code: cleanCC,     
          mobile_number: cleanPhone,  
          purpose: 0,                
          via: method,               
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Invalid country code or number");
    }

    // Pass separate clean params to the OTP page
    router.push(
      `/auth/otp?phone=${cleanPhone}&cc=${cleanCC}&via=${method}`
    );
  } catch (err) {
    setError(err.message || "Server error");
  } finally {
    setLoading(false);
  }
};
  return (
    <section className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 space-y-8 text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center">
        <Logo />
        <LanguageSelect value={lang} onChange={setLang} />
      </header>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-base text-gray-500 mt-1">{t.brandSub}</p>
      </div>

      {/* Phone Input */}
      <div>
        <label className="text-base font-medium text-gray-700 block mb-2">
          {t.label}
        </label>

        <div className="relative flex border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-gray-900">
          {/* Country Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-3 border-r border-gray-300 text-sm bg-white rounded-l-xl"
            >
              <img src={country.flag} alt={country.name} className="w-5" />
              <span className="font-medium">{country.dialCode}</span>
              <span className="text-gray-500 text-xs">▼</span>
            </button>

            {open && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white border rounded-xl shadow-xl z-50">
                <div className="p-3 border-b bg-gray-50">
                  <input
                    type="text"
                    placeholder="Search country"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>

                <ul className="max-h-60 overflow-y-auto p-1">
                  {filteredCountries.map((c, index) => (
                    <li
                      key={`${c.dialCode}-${index}`}
                      onClick={() => {
                        setCountry(c);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >

                      <img src={c.flag} alt={c.name} className="w-6" />
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {c.dialCode}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Phone Field */}
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, ""))
            }
            placeholder={t.placeholder}
            className="flex-1 px-4 py-3 outline-none text-lg font-medium rounded-r-xl"
          />
        </div>
      </div>

      {/* Method */}
      <div className="flex gap-8">
        {["whatsapp", "sms"].map((m) => (
          <label key={m} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              checked={method === m}
              onChange={() => setMethod(m)}
            />
            <span className="font-medium">
              {m === "whatsapp" ? t.whatsapp : t.sms}
            </span>
          </label>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm font-medium">{error}</p>
      )}

      {/* CTA */}
      <Button
        disabled={!isValid || loading}
        className="py-3"
        onClick={sendOtp}
      >
        {loading ? "Sending OTP..." : t.continue}
      </Button>
    </section>
  );
}
