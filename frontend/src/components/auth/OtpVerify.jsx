"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OtpInputCard from "@/components/ui/OtpInputCard";
import LanguageSelect from "@/components/ui/LanguageSelect";
import Logo from "@/components/ui/Logo"; 
import en from "@/i18n/en";
import hi from "@/i18n/hi";
import gu from "@/i18n/gu";
import { setAuthTokens } from "@/lib/auth";
import Cookies from 'js-cookie';

const languages = { en, hi, gu };

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const rawPhone = searchParams.get("phone") || "";
  const rawCountryCode = searchParams.get("cc") || "";
  
  const phoneNumber = rawPhone.replace(/\D/g, "");
  const countryCode = rawCountryCode.replace(/\D/g, "");
  const method = searchParams.get("via") || "whatsapp";

  const [lang, setLang] = useState("en");
  const t = languages[lang] || en;

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!phoneNumber) {
      router.replace("/auth/login");
    }
  }, [phoneNumber, router]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const verifyOtp = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 4 || loading) return;

    setLoading(true);
    setError("");

    try {
      const requestBody = {
        identifier_type: 0,
        country_code: countryCode,
        mobile_number: phoneNumber,
        otp: fullOtp,
        purpose: 0,
        product_key: "news"
      };

      console.log('🔵 Sending OTP verify request:', requestBody);

      const response = await fetch('/api/external/v1/otp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const data = await response.json();
      console.log(' Verify OTP response:', data);

      if (response.ok) {
        //  IMPORTANT: Tokens को सही से save करें
        if (data.access_token) {
          console.log(' Saving access token:', data.access_token.substring(0, 10) + '...');
          
          // Cookie में भी manually save करें (ensure के लिए)
          Cookies.set('access_token', data.access_token, { 
            path: '/', 
            secure: true, 
            sameSite: 'strict',
            expires: 7 
          });
          
          if (data.refresh_token) {
            Cookies.set('refresh_token', data.refresh_token, { 
              path: '/', 
              secure: true, 
              sameSite: 'strict',
              expires: 30 
            });
          }
          
          if (data.csrf_token) {
            Cookies.set('csrf_token', data.csrf_token, { 
              path: '/', 
              secure: true, 
              sameSite: 'strict' 
            });
          }
          
          // Auth library function से भी save करें
          setAuthTokens(
            data.access_token, 
            data.refresh_token, 
            data.csrf_token
          );
          
          // Verify token is saved
          const savedToken = Cookies.get('access_token');
          console.log(' Token saved in cookie:', savedToken ? 'Yes' : 'No');
        }

        //  Redirect based on user type
        if (data.is_existing_user) {
          router.replace("http://localhost:3001/Home");
        } else {
          router.replace(`/auth/user-register?phone=${phoneNumber}&cc=${countryCode}`);
        }
      } else {
        setError(data.message || `Verification failed (${response.status})`);
      }
    } catch (err) {
      console.error(' Verify OTP error:', err);
      setError("Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    
    try {
      const requestBody = {
        identifier_type: 0,
        country_code: countryCode,
        mobile_number: phoneNumber,
        purpose: 0,
        via: method,
        product_key: "news"
      };

      const response = await fetch('/api/external/v1/otp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setOtp(["", "", "", ""]);
        setTimer(60);
        setError("");
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error(' Resend OTP error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-8 mx-auto mt-10 border border-gray-100">
      <header className="flex justify-between items-center">
        <Logo />
        <LanguageSelect value={lang} onChange={setLang} />
      </header>

      <OtpInputCard 
        otp={otp}
        setOtp={setOtp}
        onVerify={verifyOtp}
        onResend={handleResend}
        timer={timer}
        loading={loading}
        error={error}
        title={t.otpTitle}
        description={`${t.otpDesc} +${countryCode} ${phoneNumber}`}
        buttonText={t.verifyBtn}
      />
    </section>
  );
}

export default function OtpVerify() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5faf9]">
      <Suspense fallback={<div className="font-bold text-gray-500">Loading Security...</div>}>
        <OtpContent />
      </Suspense>
    </div>
  );
}