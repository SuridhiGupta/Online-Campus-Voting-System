import axios from 'axios';

// Create a globally accessible Axios instance for our API
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically attach JWT token if available
api.interceptors.request.use(
  (config) => {
    // We will store admin/teacher tokens in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
