import axios from 'axios';

// Normalize the API base URL:
// - Accept VITE_API_URL as either full API base (with /api) or just the backend root
// - Always ensure the URL ends with /api/ for correct routing
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// If the URL already ends with /api or /api/, keep it; otherwise, append /api
const normalizeApiUrl = (url) => {
  const stripped = url.replace(/\/+$/, ''); // Remove trailing slashes
  if (stripped.endsWith('/api')) {
    return stripped + '/'; // Ensure trailing slash
  }
  return stripped + '/api/'; // Append /api/ if not present
};

const sanitizedBaseUrl = normalizeApiUrl(rawUrl);

console.log('[API] Base URL:', sanitizedBaseUrl);

const api = axios.create({
  baseURL: sanitizedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Interceptor to automatically attach authorization tokens and resolve paths
api.interceptors.request.use(
  (config) => {
    // Strip leading slash from the request URL to force Axios to append it to the baseURL subdirectory path
    // This ensures api.post('/orders') resolves to baseURL + 'orders' not baseURL + '/orders'
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    // Get session token from localStorage
    const token = localStorage.getItem('supabase_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url;
    const status = error.response?.status;
    const msg = error.response?.data?.error || error.message;
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} /${url} → ${status}: ${msg}`);
    return Promise.reject(error);
  }
);

export default api;
