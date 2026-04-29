"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

export default function HomePage() {

  const router = useRouter();

  const BASE_URL = process.env.NEXT_PUBLIC_LISTING_URL;

  useEffect(() => {

    const checkSession = async () => {

      try {

        const token = await apiClient.refreshToken();

        if (token) {

          window.location.href = BASE_URL;

        } else {

          router.replace("/auth/login");

        }

      } catch (err) {

        console.error("Session check error:", err);
        router.replace("/auth/login");

      }

    };

    checkSession();

  }, [router, BASE_URL]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      Loading...
    </div>
  );
}