// src/lib/apiClient.js
import Cookies from 'js-cookie';

let refreshPromise = null;

const apiClient = {
  async request(endpoint, options = {}) {
    try {
      const token = Cookies.get('access_token');
      const url = endpoint.startsWith('http') ? endpoint : `/api/external${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-product-key': 'news',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        credentials: 'include'
      });

      // Handle 401 - Token expired
      if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
        console.log(' Token expired, attempting refresh...');
        
        const newToken = await this.refreshToken();
        
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
              'x-product-key': 'news'
            },
            credentials: 'include'
          });
          return retryResponse;
        } else {
          // Refresh failed - redirect to login
          this.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login?session=expired';
          }
          throw new Error('Session expired');
        }
      }

      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async refreshToken() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = new Promise(async (resolve) => {
      try {
        const csrfToken = Cookies.get('csrf_token');

        if (!csrfToken) {
          console.log('No CSRF token');
          resolve(null);
          return;
        }

        console.log(' Refreshing token...');

        const response = await fetch('/api/external/v1/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
            'x-product-key': 'news'
          },
          body: JSON.stringify({ product_key: 'news' }),
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.access_token) {
            Cookies.set('access_token', data.access_token, {
              secure: true,
              sameSite: 'strict',
              path: '/',
              expires: 7
            });
            
            if (data.csrf_token) {
              Cookies.set('csrf_token', data.csrf_token, {
                secure: true,
                sameSite: 'strict',
                path: '/'
              });
            }
            
            console.log(' Token refreshed successfully');
            resolve(data.access_token);
          } else {
            resolve(null);
          }
        } else {
          console.log(' Refresh failed');
          resolve(null);
        }
      } catch (error) {
        console.error('Refresh error:', error);
        resolve(null);
      } finally {
        setTimeout(() => { refreshPromise = null; }, 1000);
      }
    });

    return refreshPromise;
  },

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  clearTokens() {
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
    Cookies.remove('csrf_token', { path: '/' });
    console.log(' Tokens cleared');
  },

  isAuthenticated() {
    return !!Cookies.get('access_token');
  }
};

export default apiClient;