// src/pages/UserPortalLoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserAuthStore from '@/store/userAuthStore';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";

export default function UserPortalLoginPage() {
    const navigate = useNavigate();
    const { login, token } = useUserAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- START: เพิ่ม Logic การ Redirect ที่เสถียร ---
    useEffect(() => {
        // Hook นี้จะทำงานทุกครั้งที่ค่า token เปลี่ยนแปลง
        if (token) {
            // ถ้ามี token แสดงว่า login สำเร็จแล้ว ให้ redirect ไปหน้า dashboard
            navigate('/portal/dashboard', { replace: true });
        }
    }, [token, navigate]);
    // --- END ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/portal/login', { username, password });
            const { token, user: userData } = response.data;
            toast.success(`Welcome back, ${userData.full_name || userData.username}!`);
            // แค่สั่ง login, useEffect ที่เราสร้างไว้จะจัดการเรื่องการ redirect เอง
            login(token, userData);
        } catch (error) {
            toast.error("Login Failed", {
              description: error.response?.data?.message || "Please check your credentials.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="text-center mb-6">
                <CardTitle>User Portal</CardTitle>
                <CardDescription>Manage your account and connections.</CardDescription>
            </div>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </Button>
                </form>
            </CardContent>
        </>
    );
}