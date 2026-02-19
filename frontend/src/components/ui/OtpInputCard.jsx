"use client";

import { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";

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
  buttonText 
}) {
  const [showOtp, setShowOtp] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Hydration fix

  const isValidOtp = useMemo(() => otp.every((d) => d !== ""), [otp]);

  // Hydration safety check
  useEffect(() => {
    setIsMounted(true);
    // Focus after component is mounted on client
    const firstInput = document.getElementById("otp-0");
    if (firstInput) firstInput.focus();
  }, []);

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

  // Jab tak client par mount na ho, simple skeleton ya empty div dikhayein
  if (!isMounted) return null; 

  return (
    <div className="space-y-6">
      {/* CSS-in-JS style hydration mismatch ko rokne ke liye style tag ko globally handle karein */}
      <style dangerouslySetInnerHTML={{ __html: `
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
        }
      `}} />

      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <div className="flex justify-center items-center gap-3">
        <div className="flex gap-3">
          {otp.map((d, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type={showOtp ? "text" : "password"} 
              inputMode="numeric"
              value={d}
              maxLength={1}
              onPaste={handlePaste}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder="-"
              className="w-14 h-16 text-center text-2xl font-bold border-2 rounded-2xl focus:border-black focus:ring-0 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900"
            />
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => setShowOtp(!showOtp)}
          className="p-2 text-gray-400 hover:text-black transition-colors focus:outline-none shrink-0"
          tabIndex="-1"
        >
          {showOtp ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          )}
        </button>
      </div>

      <div className="text-center text-sm font-medium">
        {timer > 0 ? (
          <span className="text-gray-400">Resend in <b className="text-black">{timer}s</b></span>
        ) : (
          <button 
            type="button"
            disabled={loading}
            onClick={onResend} 
            className="text-black underline decoration-2 underline-offset-4 hover:text-gray-700 disabled:opacity-50"
          >
            Resend OTP
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs text-center font-bold bg-red-50 py-2 rounded-lg border border-red-100">
          {error}
        </p>
      )}

      <Button 
        disabled={!isValidOtp || loading} 
        className="w-full py-4 text-lg font-bold shadow-lg" 
        onClick={onVerify}
      >
        {loading ? "Verifying..." : buttonText}
      </Button>
    </div>
  );
}