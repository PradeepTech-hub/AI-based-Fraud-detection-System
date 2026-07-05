import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const isDev = import.meta.env.DEV;

const isAuthEndpoint = (url = '') => {
  const normalized = String(url).toLowerCase();
  return normalized.includes('/auth/login') || normalized.includes('/auth/register');
};

if (typeof window !== 'undefined') {
  // Helps verify the URL actually used by axios when debugging auth/network issues.
  console.info('[FraudGuard] API base URL:', apiBaseUrl);
}

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isDev) {
    console.debug('[FraudGuard][API][REQ]', {
      method: config.method,
      baseURL: config.baseURL,
      url: config.url,
      hasToken: Boolean(token),
    });
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const skipRedirect = isAuthEndpoint(requestUrl) || window.location.pathname === '/login';

    if (isDev) {
      console.warn('[FraudGuard][API][ERR]', {
        status,
        requestUrl,
        skipRedirect,
        message: error.response?.data?.message || error.message,
      });
    }

    if (status === 401 && !skipRedirect) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

