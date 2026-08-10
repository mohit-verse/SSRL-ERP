import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Constants
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'ssrl_auth_token';

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Central Error Handler and Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Implement logout or token clearing here if needed
        localStorage.removeItem(TOKEN_KEY);
        // Optional: Dispatch a custom event to tell the app to redirect to login
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      
      // Handle other common errors (e.g., 403, 404, 500)
      console.error('API Error Response:', error.response.data);
    } else if (error.request) {
      console.error('API Error No Response:', error.request);
    } else {
      console.error('API Error Message:', error.message);
    }
    
    return Promise.reject(error);
  }
);
