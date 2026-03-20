import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Return only the 'data' part of our standardized format if it exists
    if (response.data && response.data.success !== undefined) {
      // If there's a message and it's not a GET request (usually modifications), show success toast
      if (response.data.message && response.config.method !== 'get') {
        toast.success(response.data.message);
      }
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    let message = 'Something went wrong';
    
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      message = error.response.data?.message || `Error: ${error.response.status}`;
    } else if (error.request) {
      // Request was made but no response was received
      message = 'Cannot connect to server. Please check your internet or try again later.';
    } else {
      // Something happened in setting up the request
      message = error.message;
    }

    toast.error(message);
    
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;