// freeradius-frontend/src/pages/LoginPage.jsx
import { useState, useEffect } from 'react'; // --- เพิ่ม useEffect ---
import { useNavigate, Navigate, Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator'; 

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, token, user } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // --- START: เพิ่ม State สำหรับ appName ---
    const [appName, setAppName] = useState('Freeradius UI');

    useEffect(() => {
        axiosInstance.get('/settings')
            .then(response => {
                if (response.data.data.appName) {
                    setAppName(response.data.data.appName);
                }
            })
            .catch(() => {
                // ไม่ต้องแสดง error หากโหลดชื่อไม่สำเร็จ ก็ใช้ชื่อ default ไป
                console.warn("Could not load app name setting.");
            });
    }, []);
    // --- END ---

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
        <>
            <CardContent className="pt-0">
                <div className="text-center mb-6">
                    {/* --- START: แก้ไข CardTitle --- */}
                    <CardTitle>{appName}</CardTitle>
                    {/* --- END --- */}
                    <CardDescription>Please log in to continue.</CardDescription>
                </div>
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
        </>
    );
}