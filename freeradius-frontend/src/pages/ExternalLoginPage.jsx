// src/pages/ExternalLoginPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { CheckCircle, Info, HelpCircle } from 'lucide-react';
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
    const location = useLocation(); // 1. เรียกใช้ useLocation เพื่ออ่าน URL
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // 2. State ใหม่สำหรับเก็บพารามิเตอร์จาก Captive Portal
    const [captivePortalParams, setCaptivePortalParams] = useState({
        magic: null,
        post: null,
    });

    useEffect(() => {
        // 3. เมื่อหน้าโหลด ให้ตรวจสอบ URL query string
        const queryParams = new URLSearchParams(location.search);
        const magic = queryParams.get('magic');
        const post = queryParams.get('post');
        if (magic && post) {
            // ถ้าเจอ magic และ post ให้เก็บค่าไว้ใน state
            setCaptivePortalParams({ magic, post });
            console.log("Captive Portal Detected:", { magic, post });
        }
    }, [location.search]);

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
            // 4. สร้าง payload โดยรวมข้อมูลจากฟอร์มและ captive portal
            const payload = {
                ...formData,
                ...captivePortalParams
            };

            const response = await axiosInstance.post('/external-auth/login', payload);
            
            // 5. ตรวจสอบการตอบกลับจาก Backend
            if (response.data.action === 'redirect') {
                // ถ้า Backend สั่งให้ redirect (กรณี Captive Portal สำเร็จ)
                // ให้เปลี่ยนหน้าไปยัง URL ที่ FortiGate ต้องการทันที
                window.location.href = response.data.redirectUrl;
                return; // จบการทำงาน
            }

            // 6. ถ้าไม่ใช่ Captive Portal (เป็น Firewall Auth ปกติ) ให้ทำงานเหมือนเดิม
            const { advertisement } = response.data.data;
            if (advertisement && advertisement.status === 'active') {
                navigate('/ad-landing', { state: { ad: advertisement }, replace: true });
            } else {
                toast.success("Login Successful!", {
                    description: "You can now access the internet.",
                });
                setLoginSuccess(true);
            }
        } catch (error) {
            toast.error("Login Failed", {
                description: error.response?.data?.message || "Please check your credentials.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isPageLoading) {
        return <div className="flex items-center justify-center p-8">Loading...</div>;
    }

    // --- ส่วน JSX ที่เหลือเหมือนเดิมกับไฟล์ที่คุณแนบมา ไม่มีการแก้ไข ---
    return (
        <>
            <div className="text-center mb-6 px-6">
                {settings.externalLoginEnabled === 'true' && !loginSuccess ? (
                    <>
                        <CardTitle className="text-2xl">User Login</CardTitle>
                        <CardDescription>Please enter your credentials to access the network.</CardDescription>
                    </>
                ) : !loginSuccess ? (
                     <>
                        <CardTitle className="text-2xl">Login Disabled</CardTitle>
                        <CardDescription>Login is currently unavailable.</CardDescription>
                    </>
                ) : (
                    <CardTitle className="text-2xl">Login Successful</CardTitle>
                )}
            </div>
            
            {loginSuccess ? (
                <CardContent className="text-center p-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">Login Successful</h3>
                    <p className="text-muted-foreground mt-2">You are now connected. You can close this page.</p>
                </CardContent>
            ) : settings.externalLoginEnabled === 'true' ? (
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