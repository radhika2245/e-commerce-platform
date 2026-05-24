import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nebula_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (e.g., redirect to login)
    if (error.response && error.response.status === 401) {
      // Avoid redirecting if we are already on the login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('nebula_token');
        localStorage.removeItem('nebula_user');
        // window.location.href = '/login'; // Optional: auto-redirect
      }
    }
    return Promise.reject(error);
  }
);

export default api;
