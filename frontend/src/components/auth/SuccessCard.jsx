"use client";

import { useEffect, useState } from "react"; // useEffect aur useState add kiya
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import successAnimation from "@/lottie/success.json";
import Button from "@/components/ui/Button";

export default function SuccessCard() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3); // Timer state

  // --- AUTOMATIC REDIRECT LOGIC ---
  useEffect(() => {
    // 1. Countdown timer update karne ke liye
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // 2. 5 second baad redirect karne ke liye
    const timeout = setTimeout(() => {
      router.replace("http://localhost:3001/Home"); // replace use kiya taaki history clear ho jaye
    }, 3000);

    // Cleanup functions jab component unmount ho
    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [router]);

  const handleGetStarted = () => {
    router.replace("http://localhost:3001/Home"); 
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 border border-gray-50">

      {/* LOTTIE ANIMATION */}
      <div className="flex justify-center">
        <div className="bg-green-50 rounded-full p-4">
          <Lottie
            animationData={successAnimation}
            loop={true}
            className="w-48 h-48"
          />
        </div>
      </div>

      {/* TEXT */}
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          All Set! 🎉
        </h2>
        <p className="text-gray-500 font-bold">
          Welcome to SeaNeB News. Your profile is now live.
        </p>
      </div>

      {/* ACTION BUTTON */}
      <div className="pt-4">
        <Button
          onClick={handleGetStarted}
          variant="primary"
          className="w-full py-5 text-xl font-black rounded-2xl shadow-xl shadow-blue-900/30"
        >
          Explore News Feed
        </Button>
        
        {/* Dynamic Countdown Text */}
        <p className="mt-6 text-xs text-gray-400 font-medium">
          Redirecting automatically in <span className="text-blue-500 font-bold">{countdown}s</span>...
        </p>
      </div>

    </div>
  );
}