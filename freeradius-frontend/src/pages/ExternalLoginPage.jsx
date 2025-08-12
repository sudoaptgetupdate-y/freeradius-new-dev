// src/pages/ExternalLoginPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import useUserAuthStore from '@/store/userAuthStore';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { Info, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

export default function ExternalLoginPage() {
    const navigate = useNavigate();
    const location = useLocation(); // <-- 1. เรียกใช้ useLocation
    const { login } = useUserAuthStore();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // --- START: 2. สร้าง State สำหรับเก็บค่าจาก FortiGate ---
    const [captivePortalParams, setCaptivePortalParams] = useState({
        magic: null,
        post: null,
    });

    useEffect(() => {
        // ดึงค่าจาก URL query string เมื่อหน้าโหลด
        const queryParams = new URLSearchParams(location.search);
        const magic = queryParams.get('magic');
        const post = queryParams.get('post');
        if (magic && post) {
            setCaptivePortalParams({ magic, post });
            toast.info("Captive Portal Detected", { description: "Please log in to continue."});
        }
    }, [location.search]);
    // --- END ---

    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => setSettings(response.data.data))
          .catch(() => {
              toast.error("Could not load page settings.");
              setSettings({ externalLoginEnabled: 'true', terms: '' });
          })
          .finally(() => setIsPageLoading(false));
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agreed) {
            toast.error("You must agree to the terms and conditions to log in.");
            return;
        }
        setIsLoading(true);

        try {
            // --- 3. แนบค่าจาก FortiGate ไปกับ Request ---
            const payload = {
                ...formData,
                ...captivePortalParams
            };
            const response = await axiosInstance.post('/external-auth/login', payload);
            // --- END ---
            
            // ตรวจสอบว่า Backend สั่งให้ Redirect หรือไม่
            if (response.data.action === 'redirect') {
                // ถ้าใช่ ให้เปลี่ยนหน้าไปที่ URL ที่ Backend ส่งมา
                window.location.href = response.data.redirectUrl;
                return; 
            }

            // ถ้าไม่ใช่ (เป็น Flow ปกติ) ให้ทำงานเหมือนเดิม
            const { token, user, advertisement } = response.data.data;
            login(token, user);
            toast.success("Login Successful!", { description: "Redirecting..." });

            if (advertisement && advertisement.status === 'active') {
                navigate('/ad-landing', { state: { ad: advertisement }, replace: true });
            } else {
                navigate('/portal/dashboard', { replace: true });
            }

        } catch (error) {
            toast.error("Login Failed", {
                description: error.response?.data?.message || "Please check your credentials.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // ... (ส่วน JSX ที่เหลือเหมือนเดิมทั้งหมด ไม่ต้องแก้ไข) ...
    if (isPageLoading) {
        return <div className="flex items-center justify-center p-8">Loading...</div>;
    }

    return (
        <>
            <div className="text-center mb-6 px-6">
                {settings.externalLoginEnabled === 'true' ? (
                    <>
                        <CardTitle className="text-2xl">User Login</CardTitle>
                        <CardDescription>Please enter your credentials to access the network.</CardDescription>
                    </>
                ) : (
                     <>
                        <CardTitle className="text-2xl">Login Disabled</CardTitle>
                        <CardDescription>Login is currently unavailable.</CardDescription>
                    </>
                )}
            </div>
            
            {settings.externalLoginEnabled === 'true' ? (
                <>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={formData.username} onChange={handleInputChange} placeholder="Enter your username" required autoFocus/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Enter your password" required />
                            </div>
                            <Dialog>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
                                        <Label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                                            I have read and agree to the terms
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-6">
                                        You must agree to our
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="p-1 h-auto text-xs">Terms and Conditions</Button>
                                        </DialogTrigger>
                                        to continue.
                                    </p>
                                </div>
                                <DialogContent className="sm:max-w-[625px]">
                                    <DialogHeader><DialogTitle>Terms of Service and Privacy Policy</DialogTitle></DialogHeader>
                                    <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md text-sm text-muted-foreground whitespace-pre-wrap">{settings.terms}</div>
                                    <DialogFooter><DialogClose asChild><Button type="button">Close</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </CardContent>
                    
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <Separator />
                        <div className="w-full flex justify-between items-center text-xs">
                           <Button variant="link" asChild className="p-0 h-auto text-muted-foreground">
                               <Link to="/register">Don't have an account?</Link>
                           </Button>
                           <Button variant="link" asChild className="p-0 h-auto text-muted-foreground">
                               <Link to="/portal/login">
                                   <HelpCircle className="mr-1 h-3 w-3" />
                                   Account Management
                               </Link>
                           </Button>
                        </div>
                    </CardFooter>
                </>
            ) : (
                <>
                    <CardContent className="text-center">
                        <Info className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                        <p className="text-muted-foreground">Please contact an administrator for assistance.</p>
                    </CardContent>
                    <CardFooter>
                         <Button asChild className="w-full">
                           <Link to="/register">Go to Registration</Link>
                        </Button>
                    </CardFooter>
                </>
            )}
        </>
    );
}