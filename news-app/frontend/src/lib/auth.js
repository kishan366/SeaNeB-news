import Cookies from "js-cookie";
import apiClient from "./apiClient";

/* SAVE TOKENS */

export const setAuthTokens = (accessToken, csrfToken) => {

  if (!apiClient || typeof apiClient.setTokens !== "function") {
    console.warn("apiClient.setTokens missing");
    return;
  }

  apiClient.setTokens(accessToken, csrfToken);
};


/* CLEAR TOKENS */

export const clearAuthTokens = () => {

  if (apiClient && typeof apiClient.clearTokens === "function") {
    apiClient.clearTokens();
  }

};


/* CHECK AUTH */

export const isAuthenticated = () => {

  if (!apiClient || typeof apiClient.getToken !== "function") {
    return false;
  }

  return !!apiClient.getToken();
};


/* GET ACCESS TOKEN */

export const getAccessToken = () => {

  if (!apiClient || typeof apiClient.getToken !== "function") {
    return null;
  }

  return apiClient.getToken();
};


/* GET CSRF TOKEN */

export const getCSRFToken = () => {

  return Cookies.get("csrf_token_news") || null;

};