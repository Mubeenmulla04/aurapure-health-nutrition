import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Generate or retrieve persistent guest session ID
function getGuestSessionId(): string {
  let sessionId = localStorage.getItem('aurapure_guest_session_id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('aurapure_guest_session_id', sessionId);
  }
  return sessionId;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HttpOnly refresh cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Access Token and Guest Session ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurapure_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-guest-session-id'] = getGuestSessionId();
  return config;
});

// Response interceptor to handle transparent access token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register')) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshRes.data.data.accessToken;
        localStorage.setItem('aurapure_access_token', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('aurapure_access_token');
        localStorage.removeItem('aurapure_user');
      }
    }
    return Promise.reject(error);
  }
);
