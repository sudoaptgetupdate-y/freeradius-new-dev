// src/api/axiosInstance.js
import axios from 'axios';
import useAuthStore from '@/store/authStore';

const axiosInstance = axios.create({
  baseURL: '/api',
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // ดึงข้อมูล request เดิมที่ทำให้เกิด error
    const originalRequest = error.config;

    // --- START: แก้ไขเงื่อนไขตรงนี้ ---
    // ตรวจสอบว่ามี response, status เป็น 401, และ URL ที่เรียกไม่ใช่หน้า login
    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/external-auth/login'
    ) {
      console.error("Unauthorized session! Logging out.");
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Redirect ไปหน้า login ของ admin
    }
    // --- END ---

    // สำหรับ Error อื่นๆ หรือ Error 401 ที่มาจากหน้า Login, ให้ส่งต่อไปให้หน้า component จัดการเอง
    return Promise.reject(error);
  }
);

export default axiosInstance;