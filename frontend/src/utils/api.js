import axios from 'axios';

/**
 * For LAN deployment:
 * window.location.hostname will automatically be:
 * - 'localhost' when you are on the server PC.
 * - '192.168.x.x' (your Server IP) when students access it from other PCs.
 */
const SERVER_IP = window.location.hostname;
const ROOT_URL = `http://${SERVER_IP}:5000`;
const BASE_URL = `${ROOT_URL}/api`;

// --- DEVICE SECURITY: GET OR GENERATE DEVICE ID ---
let deviceId = localStorage.getItem('deviceId');
// If no ID exists OR it's the old long format, generate a new short one
if (!deviceId || !deviceId.startsWith('DEVICE-')) {
  const shortId = Math.floor(10 + Math.random() * 90).toString();
  deviceId = `DEVICE-${shortId}`;
  localStorage.setItem('deviceId', deviceId);
}
// --------------------------------------------------

// Exporting URLs for dynamic LAN access
export { BASE_URL, ROOT_URL, deviceId };

// Create a globally accessible Axios instance for our API
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-device-id': deviceId // Attach Device ID to every request
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
