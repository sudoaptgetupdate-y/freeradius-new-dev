// src/store/userAuthStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useUserAuthStore = create(
    persist(
        (set) => ({
            token: null,
            user: null,
            login: (token, user) => set({ token, user }),
            logout: () => {
                set({ token: null, user: null });
            },
            setUser: (user) => set({ user }), // Function to update user data
        }),
        {
            name: 'freeradius-user-auth-storage', // ชื่อ key ใน localStorage ไม่ซ้ำกับของ Admin
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useUserAuthStore;