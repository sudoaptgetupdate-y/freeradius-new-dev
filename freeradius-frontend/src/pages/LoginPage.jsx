// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, token } = useAuthStore();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/auth/login', { username, password });
            const { token } = response.data;

            // TODO: เมื่อ Backend ส่งข้อมูล admin กลับมา ให้เอามาใส่ตรงนี้
            const user = { username }; // ใช้ข้อมูลชั่วคราวไปก่อน

            login(token, user);
            toast.success(`Welcome, ${user.username}!`);
            navigate('/dashboard');

        } catch (error) {
            toast.error("Login Failed", {
              description: error.response?.data?.message || "Please check your credentials.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ถ้า login อยู่แล้ว ให้ redirect ไปหน้า dashboard เลย
    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Freeradius UI</CardTitle>
                    <CardDescription>Please log in to continue.</CardDescription>
                </CardHeader>
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
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}