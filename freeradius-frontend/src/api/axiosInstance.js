// src/api/axiosInstance.js
import axios from 'axios';
import useAuthStore from '@/store/authStore';
import useUserAuthStore from '@/store/userAuthStore';

const axiosInstance = axios.create({
  baseURL: '/api',
});

// --- เพิ่มส่วนนี้: ส่ง Token ไปกับทุก Request ---
axiosInstance.interceptors.request.use((config) => {
    // ดึง Token จากทั้ง Admin Store และ User Store
    const adminToken = useAuthStore.getState().token;
    const userToken = useUserAuthStore.getState().token;
    const token = adminToken || userToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    // ... โค้ดส่วน Response Interceptor เดิมของคุณ ...
    if (
      error.response?.status === 401 &&
      originalRequest.headers['Authorization'] &&
      useAuthStore.getState().token
    ) {
      useAuthStore.getState().logout();
      if (useUserAuthStore.getState().token) {
        useUserAuthStore.getState().logout();
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;