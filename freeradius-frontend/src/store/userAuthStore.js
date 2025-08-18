// src/store/userAuthStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useUserAuthStore = create(
    persist(
        (set) => ({
            token: null,
            user: null,
            pendingAd: null, // <-- เพิ่ม state สำหรับเก็บโฆษณา
            _hasHydrated: false,
            // แก้ไขฟังก์ชัน login ให้รับ advertisement มาด้วย
            login: (token, user, advertisement) => set({ token, user, pendingAd: advertisement }),
            logout: () => {
                // เคลียร์โฆษณาเมื่อ Logout
                set({ token: null, user: null, pendingAd: null });
            },
            setUser: (user) => set({ user }),
            // เพิ่มฟังก์ชันสำหรับเคลียร์โฆษณาหลังแสดงผลแล้ว
            clearPendingAd: () => set({ pendingAd: null }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'freeradius-user-auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state.setHasHydrated(true);
            }
        }
    )
);

export default useUserAuthStore;