"use client";

import { useEffect } from "react";
import apiClient from "@/lib/apiClient";

export default function AuthInit() {

  useEffect(() => {

    // in auth pages  refresh no
    const path = window.location.pathname;

    const authPages = [
      "/auth/login",
      "/auth/register",
    ];

    const isAuthPage = authPages.some(p => path.startsWith(p));

    if (isAuthPage) return;

    const timer = setTimeout(async () => {
      try {
        const token = await apiClient.refreshToken();
        if (token) {
          // Notify other components that auth state has been refreshed
          window.dispatchEvent(new Event("auth-updated"));
        }
      } catch (err) {
        console.warn("AuthInit refresh failed:", err);
      }
    }, 400);

    return () => clearTimeout(timer);

  }, []);

  return <></>;
}
