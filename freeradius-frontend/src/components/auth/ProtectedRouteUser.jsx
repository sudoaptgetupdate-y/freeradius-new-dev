// src/components/auth/ProtectedRouteUser.jsx
import useUserAuthStore from '@/store/userAuthStore';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRouteUser() {
    const token = useUserAuthStore((state) => state.token);
    const hasHydrated = useUserAuthStore((state) => state._hasHydrated);

    // ถ้ายังดึงข้อมูลจาก localStorage ไม่เสร็จ ให้แสดงหน้าว่างๆ ไปก่อน
    if (!hasHydrated) {
        return null;
    }

    // หลังจากข้อมูลพร้อมแล้ว จึงค่อยตรวจสอบ token
    return token ? <Outlet /> : <Navigate to="/portal/login" replace />;
}