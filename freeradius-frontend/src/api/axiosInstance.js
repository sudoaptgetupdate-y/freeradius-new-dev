// src/api/axiosInstance.js
import axios from 'axios';
import useAuthStore from '@/store/authStore';

const axiosInstance = axios.create({
  baseURL: '/api',
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // ดักจับ error เมื่อ token หมดอายุ (status 401)
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized! Logging out.");
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;