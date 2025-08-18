// src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            user: null, // จะใช้เก็บข้อมูล admin ที่ล็อกอินอยู่
            login: (token, user) => set({ token, user }),
            logout: () => {
                set({ token: null, user: null });
            },
        }),
        {
            name: 'freeradius-auth-storage', // ตั้งชื่อ key ใน localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useAuthStore;