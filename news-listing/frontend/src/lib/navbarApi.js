import Cookies from "js-cookie";

/**
 * navbarApi — Authentication helper for news-listing frontend
 *
 * Token Storage:
 * - access_token: Memory only (cleared on page refresh)
 * - csrf_token: Cookie (readable by JS for header)
 * - refresh_token: HttpOnly Cookie (SET BY BACKEND ONLY via Set-Cookie header)
 *
 * On every page load / refresh:
 *   1. Memory token is null
 *   2. Call /auth/refresh → browser auto-sends HttpOnly refresh_token cookie
 *   3. Backend returns new access_token in response body
 *   4. Store access_token in memory only
 */

let refreshPromise = null;
let _navMemoryToken = null;
let lastRefreshTime = 0;

const isProd = process.env.NEXT_ENV === "production";

const getBaseUrl = () => "/api/v1";

const navbarApi = {

  // ---------- TOKEN (memory only) ----------
  getToken() {
    return _navMemoryToken;
  },

  isLoggedIn() {
    return !!_navMemoryToken;
  },

  setToken(token) {
    _navMemoryToken = token;
  },

  // ---------- REFRESH TOKEN ----------
  async refreshToken() {

    if (refreshPromise) return refreshPromise;

    // Debounce / Throttle: prevent multiple retry attempts within 3 seconds
    // This helps avoid repeating 401 errors on rapid renders or repeated API calls
    if (Date.now() - lastRefreshTime < 3000) {
      return _navMemoryToken;
    }

    refreshPromise = (async () => {

      try {
        lastRefreshTime = Date.now();

        const csrfToken = Cookies.get("csrf_token_news");

        //  Only trigger if we have evidence of a session, prevents unnecessary 401
        if (!csrfToken) return null;

        const response = await fetch(
          `${getBaseUrl()}/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": csrfToken,
              "x-product-key": "news"
            },
            body: JSON.stringify({ product_key: "news" }),
            credentials: "include",    // ← sends HttpOnly refresh_token cookie
            cache: "no-store"          // ← prevents browser from caching 401 responses
          }
        );

        // 401 is expected when user is not logged in or session has expired
        if (!response.ok) {
          if (response.status === 401) {
            //Clean up stale cookie to prevent 401 errors on subsequent page refreshes
            Cookies.remove("csrf_token_news", { path: "/" });
            _navMemoryToken = null;
          } else {
            console.warn("Token refresh failed with status:", response.status);
          }
          return null;
        }

        const data = await response.json();

        if (data.access_token) {

          //Store in memory ONLY — never sessionStorage
          _navMemoryToken = data.access_token;

          // Save csrf_token in a JS-readable cookie
          if (data.csrf_token) {
            const secureFlag = isProd ? "secure" : "";
            document.cookie = `csrf_token_news=${data.csrf_token || ""}; path=/; max-age=31536000; samesite=lax; ${secureFlag}`;
          }

          return data.access_token;
        }

        return null;

      } catch (err) {

        // Network errors are real errors — log them
        console.error("Refresh Token Error:", err);
        return null;

      } finally {

        refreshPromise = null;

      }

    })();

    return refreshPromise;
  },

  // ---------- PROFILE ----------
  async getProfile(forceRefresh = false) {

    if (typeof window === "undefined") return null;

    let token = this.getToken();

    // If no in-memory token or force refresh → get a new one
    if (!token || forceRefresh) {
      token = await this.refreshToken();
    }

    if (!token) return null;

    const url = `${getBaseUrl()}/profile/me`;

    try {

      let response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-product-key": "news",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });

      // If token expired mid-session, refresh and retry once
      if (response.status === 401) {

        token = await this.refreshToken();

        if (!token) return null;

        response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-product-key": "news",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include"
        });
      }

      if (!response.ok) return null;

      return await response.json();

    } catch (err) {

      console.error("Profile Fetch Error:", err);
      return null;

    }
  },

  // ---------- LOGOUT ----------
  async logout() {

    try {

      await fetch(`${getBaseUrl()}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-product-key": "news"
        },
        body: JSON.stringify({ product_key: "news" }),
        credentials: "include"    // ← backend clears HttpOnly refresh_token
      });

    } catch (err) {

      console.error("Logout API Error:", err);

    } finally {

      // Clear memory token
      _navMemoryToken = null;

      // Clear JS-readable csrf cookie
      Cookies.remove("csrf_token_news", { path: "/" });

      // NOTE: refresh_token is HttpOnly — backend clears it via Set-Cookie
      // We do NOT touch it from JS
    }
  }

};

export default navbarApi;