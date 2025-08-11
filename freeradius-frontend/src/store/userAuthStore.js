// src/store/userAuthStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useUserAuthStore = create(
    persist(
        (set) => ({
            token: null,
            user: null,
            _hasHydrated: false, // State สำหรับติดตามสถานะการดึงข้อมูลจาก localStorage
            login: (token, user) => set({ token, user }),
            logout: () => {
                set({ token: null, user: null });
            },
            setUser: (user) => set({ user }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'freeradius-user-auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                // เมื่อดึงข้อมูลจาก localStorage เสร็จ ให้ตั้งค่า _hasHydrated เป็น true
                state.setHasHydrated(true);
            }
        }
    )
);

export default useUserAuthStore;