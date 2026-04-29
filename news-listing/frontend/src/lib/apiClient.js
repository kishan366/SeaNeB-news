import Cookies from "js-cookie";

let refreshPromise = null;
let _accessToken = null;
let lastRefreshTime = 0;

const apiClient = {

  PRODUCT_KEY: process.env.NEXT_PUBLIC_PRODUCT_KEY || "news",

  //  BASE URL 
  getBaseUrl(endpoint) {

    const API_PREFIX = "/api/v1";

    const clean = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

    return `${API_PREFIX}${clean}`;
  },

  // GET TOKEN (memory only)
  getToken() {
    return _accessToken;
  },

  // SAVE TOKENS 
  setTokens(accessToken, csrfToken = null) {

    // Store access_token in memory ONLY — never sessionStorage
    if (accessToken) {
      _accessToken = accessToken;
    }

    // Save csrf_token in a JS-readable cookie using js-cookie for reliability
    if (csrfToken) {
      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      Cookies.set("csrf_token_news", csrfToken, {
        path: "/",
        expires: 365,
        sameSite: "lax",
        secure: isSecure,
      });
    }
  },

  // CLEAR TOKENS 
  clearTokens() {

    // Clear memory token
    _accessToken = null;

    // Clear JS-readable csrf cookie
    Cookies.remove("csrf_token_news", { path: "/" });

  },

  //  REQUEST 
  async request(endpoint, options = {}) {

    const url = this.getBaseUrl(endpoint);

    let token = this.getToken();

    const headers = {
      "Accept": "application/json",
      "x-product-key": this.PRODUCT_KEY,
      ...options.headers
    };

    // Only set Content-Type if it's not already set and it's not FormData
    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });

    // AUTO REFRESH 
    if (response.status === 401 && !options._retry) {

      options._retry = true;

      const newToken = await this.refreshToken();

      if (newToken) {

        headers.Authorization = `Bearer ${newToken}`;

        response = await fetch(url, {
          ...options,
          headers,
          credentials: "include"
        });

      } else {

        this.clearTokens();

        window.dispatchEvent(new Event("session-expired"));

        throw new Error("Session expired");
      }
    }

    if (!response.ok) {

      let data = {};

      try {
        data = await response.json();
      } catch { }

      const err = new Error(data?.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.data = data;

      throw err;
    }

    return response;
  },

  //  GET 
  get(endpoint, params = {}) {

    const query = Object.keys(params).length
      ? `?${new URLSearchParams(params)}`
      : "";

    return this.request(`${endpoint}${query}`, {
      method: "GET"
    });
  },

  // POST
  post(endpoint, body = {}, options = {}) {
    let finalBody;
    
    if (body instanceof FormData) {
      finalBody = body;
    } else {
      finalBody = { ...body };
      if (typeof window !== 'undefined') {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId) {
          finalBody.device_id = deviceId;
        }
      }
      finalBody = JSON.stringify(finalBody);
    }

    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: finalBody
    });
  },

  // PUT
  put(endpoint, body = {}, options = {}) {
    let finalBody;

    if (body instanceof FormData) {
      finalBody = body;
    } else {
      finalBody = JSON.stringify(body);
    }

    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: finalBody
    });
  },

  // PATCH
  patch(endpoint, body = {}, options = {}) {
    let finalBody;

    if (body instanceof FormData) {
      finalBody = body;
    } else {
      finalBody = JSON.stringify(body);
    }

    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body: finalBody
    });
  },

  // DELETE
  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE"
    });
  },

  // REFRESH TOKEN
  async refreshToken() {

    if (refreshPromise) return refreshPromise;

    if (Date.now() - lastRefreshTime < 3000) {
      return _accessToken;
    }

    refreshPromise = (async () => {

      try {
        lastRefreshTime = Date.now();

        const csrf = Cookies.get("csrf_token_news");

        // Build headers — include csrf if available, but don't bail out if missing.
        const headers = {
          "Content-Type": "application/json",
          "x-product-key": this.PRODUCT_KEY
        };

        if (csrf) {
          headers["x-csrf-token"] = csrf;
        }

        const res = await fetch(
          this.getBaseUrl("/auth/refresh"),
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              product_key: this.PRODUCT_KEY
            }),
            credentials: "include",
            keepalive: true
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            Cookies.remove("csrf_token_news", { path: "/" });
            _accessToken = null;
          }
          return null;
        }

        const data = await res.json();

        if (data?.access_token) {
          this.setTokens(
            data.access_token,
            data.csrf_token
          );
          return data.access_token;
        }
        return null;
      } catch (err) {
        console.error("Refresh error:", err);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }
};
export default apiClient;