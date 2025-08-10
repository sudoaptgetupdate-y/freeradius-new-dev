// src/components/auth/ProtectedRouteUser.jsx
import useUserAuthStore from '@/store/userAuthStore';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRouteUser() {
    const token = useUserAuthStore((state) => state.token);
    return token ? <Outlet /> : <Navigate to="/portal/login" replace />;
}