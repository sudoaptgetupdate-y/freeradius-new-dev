// src/components/auth/ProtectedRoute.jsx
import useAuthStore from '@/store/authStore';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
    const token = useAuthStore((state) => state.token);
    return token ? <Outlet /> : <Navigate to="/login" replace />;
}