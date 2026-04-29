"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import countries from "@/data/countries.json";
import Button from "@/components/ui/Button";
import LanguageSelect from "@/components/ui/LanguageSelect";
import Logo from "@/components/ui/Logo";
import OtpInputCard from "@/components/ui/OtpInputCard";
import { Pencil } from "lucide-react";
import en from "@/i18n/en";
import hi from "@/i18n/hi";
import gu from "@/i18n/gu";
import { setAuthTokens } from "@/lib/auth";
import api, { OTP_PURPOSE } from "@/lib/apiconfig";

const languages = { en, hi, gu };

export default function PhoneLogin() {
  const router = useRouter();

  // LOGIN STATE
  const [country, setCountry] = useState(countries[0]);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("whatsapp");
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP STATE
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [showResendOptions, setShowResendOptions] = useState(false);

  // Ref-based lock to prevent double-submit (setState is async,
  // so the `loading` check alone can miss rapid double-clicks)
  const verifyLockRef = useRef(false);

  // DERIVED STATE
  const t = languages[lang] || en;
  const isValid = phone.length >= 8;

  const targetAppUrl = process.env.NEXT_PUBLIC_LISTING_URL;

  // ── OTP Data (derived from login state, no sessionStorage dependency) ──
  const otpData = useMemo(() => {
    const cleanCC = country.dialCode.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "");
    return {
      phoneNumber: cleanPhone,
      countryCode: cleanCC,
      method
    };
  }, [country, phone, method]);

  // ── TIMER EFFECT ──
  useEffect(() => {
    if (!showOtp || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [showOtp, timer]);

  // ── COUNTRY FILTER ──
  const filteredCountries = useMemo(
    () =>
      countries.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.dialCode.includes(searchQuery)
      ),
    [searchQuery]
  );

  // ── SEND OTP ──
  const sendOtp = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setError("");

    const cleanCC = country.dialCode.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "");

    try {
      // Get or generate device_id
      let deviceId = '';
      if (typeof window !== 'undefined') {
        deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'dev_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
          localStorage.setItem('device_id', deviceId);
        }
      }

      await api.auth.sendOtp({
        identifier_type: 0,
        country_code: cleanCC,
        mobile_number: cleanPhone,
        purpose: OTP_PURPOSE.SIGNUP,
        via: method,
        product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
      });

      // Store in sessionStorage (keeping exact same keys for downstream compatibility)
      sessionStorage.setItem('otp_phone', cleanPhone);
      sessionStorage.setItem('otp_cc', cleanCC);
      sessionStorage.setItem('otp_method', method);
      sessionStorage.setItem('otp_timestamp', Date.now().toString());

      // Switch to OTP view instead of navigating
      setOtp(["", "", "", ""]);
      setTimer(60);
      setShowOtp(true);
      setShowResendOptions(false);

    } catch (err) {
      console.error("Login Error Details:", err);
      if (err instanceof SyntaxError) {
        setError("API configuration error (Check next.config.mjs rewrites)");
      } else {
        setError(err.data?.message || err.message || "Server connection failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── VERIFY OTP ──
  const verifyOtp = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 4 || loading || verifyLockRef.current) return;

    // Synchronous lock — prevents any second call before setState takes effect
    verifyLockRef.current = true;
    setLoading(true);
    setError("");

    try {
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('device_id') : '';

      const data = await api.auth.verifyOtp({
        identifier_type: 0,
        country_code: otpData.countryCode,
        mobile_number: otpData.phoneNumber,
        otp: fullOtp,
        purpose: OTP_PURPOSE.SIGNUP,
        product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY,
        device_id: deviceId
      });

      // SAVE TOKENS 
      if (data.access_token) {
        setAuthTokens(
          data.access_token,
          data.csrf_token
        );
      }

      //  EXISTING USER 
      if (data.is_existing_user) {

        sessionStorage.removeItem("otp_phone");
        sessionStorage.removeItem("otp_cc");
        sessionStorage.removeItem("otp_method");

        setTimeout(() => {

          let redirectUrl = targetAppUrl;
          if (data.bridge_token) {
            redirectUrl = `${targetAppUrl}?bridge_token=${data.bridge_token}&device_id=${deviceId}`;
          }

          window.open(redirectUrl, '_blank');
          window.location.href = targetAppUrl;

        }, 300);

      }

      //  NEW USER 
      else {

        sessionStorage.setItem("otp_phone", otpData.phoneNumber);
        sessionStorage.setItem("otp_cc", otpData.countryCode);
        sessionStorage.setItem("otp_timestamp", Date.now().toString());

        router.push("/auth/user-register");

      }

    } catch (err) {

      console.error("OTP Error:", err);
      setError(err.data?.message || err.message || "Network error. Please check your internet connection.");

    } finally {

      setLoading(false);
      verifyLockRef.current = false;

    }
  };

  // RESEND OTP 
  const handleResend = async (selectedMethod) => {
    setLoading(true);
    setError("");
    setShowResendOptions(false);

    try {
      await api.auth.sendOtp({
        identifier_type: 0,
        country_code: otpData.countryCode,
        mobile_number: otpData.phoneNumber,
        purpose: OTP_PURPOSE.SIGNUP,
        via: selectedMethod,
        product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
      });

      setOtp(["", "", "", ""]);
      setTimer(60);
      setError("");
      setMethod(selectedMethod);
      sessionStorage.setItem('otp_timestamp', Date.now().toString());
      sessionStorage.setItem('otp_method', selectedMethod);
    } catch (err) {
      setError(err.data?.message || err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // BACK TO LOGIN (edit number) 
  const handleEditNumber = () => {
    setShowOtp(false);
    setOtp(["", "", "", ""]);
    setError("");
    setTimer(60);
    setShowResendOptions(false);
  };

  return (
    <section className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 space-y-8 text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center">
        <Logo />
        <LanguageSelect value={lang} onChange={setLang} />
      </header>

      {showOtp ? (
        /* OTP VERIFICATION VIEW  */
        <>
          {showResendOptions ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800">Resend OTP via</h3>
                <p className="text-sm text-gray-500 mt-1">Choose your preferred method</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleResend("whatsapp")}
                  className="flex items-center justify-center gap-3 p-4 border-2 border-green-100 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <input type="radio" checked={false} readOnly className="w-5 h-5 accent-green-600 pointer-events-none" />
                  <span className="font-semibold text-gray-700 group-hover:text-green-600">WhatsApp</span>
                </button>
                <button
                  onClick={() => handleResend("sms")}
                  className="flex items-center justify-center gap-3 p-4 border-2 border-blue-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <input type="radio" checked={false} readOnly className="w-5 h-5 accent-blue-600 pointer-events-none" />
                  <span className="font-semibold text-gray-700 group-hover:text-blue-600">SMS</span>
                </button>
              </div>
              <button
                onClick={() => setShowResendOptions(false)}
                className="w-full text-gray-400 text-sm hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <OtpInputCard
              otp={otp}
              setOtp={setOtp}
              onVerify={verifyOtp}
              onResend={() => setShowResendOptions(true)}
              timer={timer}
              loading={loading}
              error={error}
              title={t.otpTitle}
              description={
                <span className="flex items-center justify-center gap-2">
                  {t.otpDesc} +{otpData.countryCode} {otpData.phoneNumber}
                  <button
                    onClick={handleEditNumber}
                    className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-600"
                    title="Edit number"
                  >
                    <Pencil size={12} />
                  </button>
                </span>
              }
              buttonText={t.verifyBtn}
            />
          )}
        </>
      ) : (
        /* PHONE LOGIN VIEW */
        <>
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold-700">{t.title}</h1>
            {/* <p className="text-base text-gray-500 mt-1">{t.brandSub}</p> */}
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
                  className="flex items-center gap-2.5 px-4 py-3.5 border-r border-gray-200 text-sm bg-white rounded-l-2xl hover:bg-gray-50 active:scale-95 transition-all duration-200"
                >
                  <div className="relative w-6 h-4 shadow-sm rounded-sm overflow-hidden border border-gray-100">
                    <img src={country.flag} alt={country.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-gray-900">{country.dialCode}</span>
                  <svg
                    className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {open && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>

                    <div className="absolute left-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-left">

                      <div className="p-4 bg-white/50 border-b border-gray-100">
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </span>
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100/50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400 font-medium"
                            autoFocus
                          />
                        </div>
                      </div>

                      <ul className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c, index) => (
                            <li
                              key={`${c.dialCode}-${index}`}
                              onClick={() => {
                                setCountry(c);
                                setOpen(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                            >
                              <div className="relative w-7 h-5 shadow-sm rounded-sm overflow-hidden border border-gray-100 group-hover:scale-110 transition-transform">
                                <img src={c.flag} alt={c.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="truncate text-[13px] font-semibold text-gray-700 group-hover:text-black">
                                  {c.name}
                                </span>
                              </div>
                              <span className="ml-auto text-xs font-bold text-gray-400 group-hover:text-black bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                                {c.dialCode}
                              </span>
                            </li>
                          ))
                        ) : (
                          <div className="p-8 text-center text-sm text-gray-400 font-medium">
                            No countries found
                          </div>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Phone Field */}
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder={t.placeholder}
                className="flex-1 px-4 py-3 outline-none text-lg font-medium rounded-r-xl"
                maxLength={15}
              />
            </div>

            {/* Phone hint */}
            {phone.length > 0 && phone.length < 10 && (
              <p className="text-xs text-amber-600 mt-1">
                Minimum 10 digits required
              </p>
            )}
          </div>

          {/* Method Selection */}
          <div className="flex gap-8">
            {["whatsapp", "sms"].map((m) => (
              <label key={m} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  value={m}
                  checked={method === m}
                  onChange={() => setMethod(m)}
                  className="w-4 h-4 accent-black"
                />
                <span className={`font-medium ${
                  method === m ? 'text-black' : 'text-gray-500'
                }`}>
                  {m === "whatsapp" ? t.whatsapp : t.sms}
                </span>
              </label>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={sendOtp}
            disabled={!isValid || loading}
            className={`w-full py-4 text-lg font-bold rounded-xl transition-all ${
              !isValid || loading
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : (
              t.continue
            )}
          </Button>
        </>
      )}
    </section>
  );
}