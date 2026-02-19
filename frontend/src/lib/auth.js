// src/lib/auth.js
import Cookies from 'js-cookie';
import apiClient from './apiClient';

// Set tokens after login/OTP verification
export const setAuthTokens = (accessToken, refreshToken, csrfToken) => {
  const commonConfig = { 
    secure: true, 
    sameSite: 'strict', 
    path: '/' 
  };

  if (accessToken) {
    console.log('📝 Setting access token');
    Cookies.set('access_token', accessToken, { 
      ...commonConfig, 
      expires: 7 // 7 days
    });
  }
  
  if (refreshToken) {
    console.log('📝 Setting refresh token');
    Cookies.set('refresh_token', refreshToken, { 
      ...commonConfig, 
      expires: 30 // 30 days
    });
  }

  if (csrfToken) {
    console.log('📝 Setting CSRF token');
    Cookies.set('csrf_token', csrfToken, { 
      ...commonConfig,
      expires: 7 // 7 days
    });
    apiClient.setCSRFToken?.(csrfToken);
  }
  
  // Verify token was set
  const checkToken = Cookies.get('access_token');
  console.log('✅ Token set verification:', checkToken ? 'Success' : 'Failed');
};

// Clear all auth tokens (logout)
export const clearAuthTokens = () => {
  Cookies.remove('access_token', { path: '/' });
  Cookies.remove('refresh_token', { path: '/' });
  Cookies.remove('csrf_token', { path: '/' });
  
  console.log('🗑️ All tokens cleared');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = Cookies.get('access_token');
  return !!token;
};

// Get access token
export const getAccessToken = () => {
  return Cookies.get('access_token');
};

// Get CSRF token
export const getCSRFToken = () => {
  return Cookies.get('csrf_token');
};