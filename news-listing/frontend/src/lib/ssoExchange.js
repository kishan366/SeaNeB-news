import api from '@/lib/apiconfig';

export async function exchangeBridgeToken(bridgeToken) {
  try {
    return await api.auth.ssoExchange(bridgeToken);
  } catch (error) {
    const msg = error.data?.message || error.data?.error?.message || error.message || "SSO exchange failed";
    throw new Error(msg);
  }
}