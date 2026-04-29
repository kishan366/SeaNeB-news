"use client";

import { useEffect } from "react";
import { exchangeBridgeToken } from "@/lib/ssoExchange";
import navbarApi from "@/lib/navbarApi";
import apiClient from "@/lib/apiClient";
import Cookies from "js-cookie";

export default function SsoHandler() {

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);
    const bridgeToken = params.get("bridge_token");
    const deviceId = params.get("device_id");

    if (!bridgeToken) return;

    if (deviceId) {
      localStorage.setItem("device_id", deviceId);
    }

    // Clean URL immediately so bridge_token and device_id are removed from address bar
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    if (sessionStorage.getItem("sso_done")) return;
    sessionStorage.setItem("sso_done", "1");

    exchangeBridgeToken(bridgeToken)
      .then((data) => {

        // Store tokens in apiClient memory so subsequent requests hit backend authenticated
        if (data?.access_token) {
          apiClient.setTokens(data.access_token, data.csrf_token);
          navbarApi.setToken(data.access_token);
        }

        window.dispatchEvent(new Event("auth-updated"));

      })
      .catch((err) => {
        console.error("SSO exchange failed:", err);
      });

  }, []);

  return <></>;
}
