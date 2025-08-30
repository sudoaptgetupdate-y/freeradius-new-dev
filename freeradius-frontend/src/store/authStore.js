import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import axiosInstance from '@/api/axiosInstance';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      operatingMode: 'AAA', // State เริ่มต้น
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      // --- ฟังก์ชันใหม่ที่เพิ่มเข้ามา ---
      setOperatingMode: (mode) => set({ operatingMode: mode }),
      fetchOperatingMode: async () => {
        try {
          const token = get().token;
          if (token) {
            const response = await axiosInstance.get('/settings', { headers: { Authorization: `Bearer ${token}` } });
            const mode = response.data.data.operating_mode || 'AAA';
            set({ operatingMode: mode });
          }
        } catch (error) {
          console.error("Failed to fetch operating mode:", error);
          set({ operatingMode: 'AAA' }); // Fallback to default
        }
      },
      // --- สิ้นสุดฟังก์ชันใหม่ ---
      logout: () => set({ token: null, user: null, operatingMode: 'AAA' }), // Reset ตอน Logout
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;