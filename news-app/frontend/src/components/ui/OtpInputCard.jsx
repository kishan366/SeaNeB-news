"use client";

import { useMemo, useState, useEffect, useRef } from "react";

export default function OtpInputCard({
  otp,
  setOtp,
  onVerify,
  onResend,
  timer,
  loading,
  error,
  title,
  description,
  buttonText // Ensure aap parent se t.verifyBtn pass kar rahe hain
}) {
  const [showOtp, setShowOtp] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const firstInputRef = useRef(null);

  const isValidOtp = useMemo(() => otp.every((d) => d !== ""), [otp]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && firstInputRef.current) {
      const focusTimer = setTimeout(() => {
        firstInputRef.current.focus();
      }, 50);
      return () => clearTimeout(focusTimer);
    }
  }, [isMounted]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === "Enter" && isValidOtp && !loading) {
      onVerify();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    if (!/^\d{4}$/.test(pastedData)) return;
    const digits = pastedData.split("");
    setOtp(digits);
    document.getElementById("otp-3")?.focus();
  };

  if (!isMounted) return null;

  return (
    // Increased max-width to allow card content to breathe in the expanded parent
    <div className="flex flex-col h-full space-y-4 w-full max-w-md mx-auto animate-in fade-in zoom-in duration-300">
      <style dangerouslySetInnerHTML={{
        __html: `
        input::-ms-reveal,
        input::-ms-clear { display: none; }
      `}} />

      {/* Header Section */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{title}</h2>
        <p className="text-[11px] text-gray-500 mt-1 font-medium leading-relaxed">{description}</p>
      </div>

      {/* OTP Inputs Section */}
      <div className="flex justify-center items-center gap-2 py-1">
        <div className="flex gap-2">
          {otp.map((d, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={i === 0 ? firstInputRef : null}
              type={showOtp ? "text" : "password"}
              inputMode="numeric"
              value={d}
              maxLength={1}
              onPaste={handlePaste}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder="•"
              className={`w-10 h-12 text-center text-lg font-bold border-2 rounded-lg outline-none transition-all duration-200 
                ${d ? 'border-black bg-white shadow-sm' : 'border-gray-100 bg-gray-50/50'} 
                focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-300`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowOtp(!showOtp)}
          className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-all active:scale-90"
        >
          {showOtp ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          )}
        </button>
      </div>

      {/* Timer & Error Section */}
      <div className="flex flex-col items-center gap-2">
        <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
          {timer > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                Resend in <span className="text-black font-mono">{timer}s</span>
              </span>
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={onResend}
              className="text-[9px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-800 disabled:opacity-50"
            >
              Resend New Code
            </button>
          )}
        </div>

        {error && (
          <p className="w-full text-red-600 text-[9px] text-center font-bold bg-red-50 py-1.5 rounded-md border border-red-100">
            {error}
          </p>
        )}
      </div>

      {/* Updated Button Section */}
      <div className="pt-1">
        <button
          type="button"
          disabled={!isValidOtp || loading}
          onClick={onVerify}
          // Yahan humne text color aur background ko force kiya hai
          className={`w-full py-2.5 text-[13px] font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
            ${(!isValidOtp || loading)
              ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800 shadow-md cursor-pointer'}`}
        >
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
          {/* Button text ko direct render kar rahe hain */}
          {buttonText || "Verify OTP"}
        </button>
      </div>
    </div>
  );
}