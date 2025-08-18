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
    const { login, token, _hasHydrated } = useUserAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginData, setLoginData] = useState(null);

    // Effect นี้จะรอฟังการเปลี่ยนแปลงของ loginData
    useEffect(() => {
        if (loginData) {
            login(loginData.token, loginData.user);
            navigate('/portal/dashboard', { replace: true });
        }
    }, [loginData, login, navigate]);

    // Effect นี้จะจัดการกรณีที่ User มี Token อยู่แล้ว (เช่น refresh หน้า)
    useEffect(() => {
        if (_hasHydrated && token) {
            navigate('/portal/dashboard', { replace: true });
        }
    }, [_hasHydrated, token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/portal/login', { username, password });
            toast.success(`Welcome back, ${response.data.user.full_name || response.data.user.username}!`);
            setLoginData(response.data);
        } catch (error) {
            toast.error("Login Failed", {
              description: error.response?.data?.message || "Please check your credentials.",
            });
            setIsLoading(false);
        }
    };
    
    if (!_hasHydrated) {
        return null; // รอจนกว่าข้อมูลจาก localStorage จะพร้อมใช้งาน
    }

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