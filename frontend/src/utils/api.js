import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Ensure the base URL ends with a trailing slash for correct relative path resolution
const sanitizedBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;

const api = axios.create({
  baseURL: sanitizedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically attach authorization tokens and resolve paths
api.interceptors.request.use(
  (config) => {
    // Strip leading slash from the request URL to force Axios to append it to the baseURL subdirectory path
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

export default api;
