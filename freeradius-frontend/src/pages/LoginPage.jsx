// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom'; // 1. เพิ่ม Link
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // 2. เพิ่ม CardFooter
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator'; // 3. เพิ่ม Separator

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, token, user } = useAuthStore();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/auth/login', { username, password });
            const { token, user: userData } = response.data;
            login(token, userData);
            toast.success(`Welcome, ${userData.fullName || userData.username}!`);
            navigate('/dashboard');
        } catch (error) {
            toast.error("Login Failed", {
              description: error.response?.data?.message || "Please check your credentials.",
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                {/* --- START: เพิ่มส่วนนี้ --- */}
                <CardFooter className="flex-col items-center gap-4">
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/register" className="underline underline-offset-4 hover:text-primary">
                            Register here
                        </Link>
                    </p>
                </CardFooter>
                {/* --- END: สิ้นสุดส่วนที่เพิ่ม --- */}
            </Card>
        </div>
    );
}