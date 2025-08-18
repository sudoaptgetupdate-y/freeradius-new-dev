// src/api/axiosInstance.js
import axios from 'axios';
import useAuthStore from '@/store/authStore';
import useUserAuthStore from '@/store/userAuthStore';

const axiosInstance = axios.create({
  baseURL: '/api',
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // เงื่อนไขที่สำคัญที่สุด:
    // 1. Error ต้องเป็น 401 Unauthorized
    // 2. originalRequest ต้องมี Authorization header อยู่แล้ว (หมายความว่าเราพยายามใช้ token ที่อาจจะหมดอายุ)
    // 3. token ใน store ของ "Admin" ต้องมีค่าอยู่ (ยืนยันว่านี่คือ session ของ Admin จริงๆ)
    if (
      error.response?.status === 401 &&
      originalRequest.headers['Authorization'] &&
      useAuthStore.getState().token
    ) {
      console.error("Admin session expired or invalid! Logging out admin.");
      
      // ทำการ Logout ทั้งสอง Store เพื่อความปลอดภัย
      useAuthStore.getState().logout();
      if (useUserAuthStore.getState().token) {
        useUserAuthStore.getState().logout();
      }

      // ส่งกลับไปหน้า login หลักของ admin
      window.location.href = '/login';
    }

    // สำหรับ Error อื่นๆ ทั้งหมด (รวมถึง login fail ของ user portal) ให้ส่งต่อไปตามปกติ
    return Promise.reject(error);
  }
);

export default axiosInstance;