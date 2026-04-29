import Cookies from "js-cookie";

let refreshPromise = null;
let _accessToken = null;
let lastRefreshTime = 0;

const apiClient = {

  PRODUCT_KEY: process.env.NEXT_PUBLIC_PRODUCT_KEY || "news",

  // BASE URL
  getBaseUrl(endpoint) {

    const API_PREFIX = "/api/v1";

    const clean = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

    return `${API_PREFIX}${clean}`;
  },

  //  GET TOKEN (memory only) 
  getToken() {
    return _accessToken;
  },

  // SAVE TOKENS 
  setTokens(accessToken, csrfToken = null) {

    // Store access_token in memory ONLY 
    if (accessToken) {
      _accessToken = accessToken;
    }

    // Save csrf_token 
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

    // Pre-emptively refresh if token is missing (Avoids initial 401)
    if (!this.getToken() && 
        !endpoint.includes('/auth/refresh') && 
        !endpoint.includes('/otp/send-otp') && 
        !endpoint.includes('/otp/verify-otp') &&
        !endpoint.includes('/auth/login')
    ) {
        await this.refreshToken();
    }

    let token = this.getToken();

    const headers = {
      "Accept": "application/json",
      "x-product-key": this.PRODUCT_KEY,
      ...options.headers
    };

    // Include Content-Type: application/json by default unless explicitly disabled (by setting to null)
    if (!options.headers || (options.headers["Content-Type"] !== null && !options.headers["Content-Type"])) {
      headers["Content-Type"] = "application/json";
    } else if (options.headers["Content-Type"] === null) {
      delete headers["Content-Type"];
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
  get(endpoint, params = {}, options = {}) {

    const query = Object.keys(params).length
      ? `?${new URLSearchParams(params)}`
      : "";

    return this.request(`${endpoint}${query}`, {
      ...options,
      method: "GET"
    });
  },

  // POST
  post(endpoint, body = {}, options = {}) {
    let finalBody;
    const isFormData = body instanceof FormData;

    if (isFormData) {
      finalBody = body;
      if (typeof window !== 'undefined') {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId && !finalBody.has('device_id')) {
          finalBody.append('device_id', deviceId);
        }
      }
      // For FormData, we must let the browser set the Content-Type with boundary
      options.headers = { ...options.headers, "Content-Type": null };
    } else {
      finalBody = { ...body };
      if (typeof window !== 'undefined') {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId) {
          finalBody.device_id = deviceId;
        }
      }
    }

    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? finalBody : JSON.stringify(finalBody)
    });
  },

  // PUT
  put(endpoint, body = {}, options = {}) {
    let finalBody;
    const isFormData = body instanceof FormData;
    
    if (isFormData) {
      finalBody = body;
      if (typeof window !== 'undefined') {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId && !finalBody.has('device_id')) {
          finalBody.append('device_id', deviceId);
        }
      }
      options.headers = { ...options.headers, "Content-Type": null };
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
      method: "PUT",
      body: finalBody
    });
  },

  // PATCH
  patch(endpoint, body = {}, options = {}) {
    let finalBody;
    const isFormData = body instanceof FormData;
    
    if (isFormData) {
      finalBody = body;
      if (typeof window !== 'undefined') {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId && !finalBody.has('device_id')) {
          finalBody.append('device_id', deviceId);
        }
      }
      options.headers = { ...options.headers, "Content-Type": null };
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
            credentials: "include",     // sends HttpOnly refresh_token cookie
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