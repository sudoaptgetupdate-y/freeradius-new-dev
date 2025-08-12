// src/pages/RegisterPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { CheckCircle, Info } from 'lucide-react';
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

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        phoneNumber: ''
    });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => setSettings(response.data.data))
          .catch(() => {
            toast.error("Could not load page settings.");
            setSettings({ registrationEnabled: 'true', terms: '' });
          })
          .finally(() => setIsPageLoading(false));
    }, []);

    // --- ส่วนที่แก้ไข ---
    useEffect(() => {
        if (registrationSuccess) {
            if (countdown <= 0) {
                // เปลี่ยนจาก navigate(...) เป็นการ redirect ไปยัง URL ภายนอก
                window.location.href = 'http://neverssl.com';
                return;
            }

            const timerId = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            return () => clearTimeout(timerId);
        }
    }, [registrationSuccess, countdown, navigate]);
    // --- สิ้นสุดส่วนที่แก้ไข ---

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        if (!agreed) {
            toast.error("You must agree to the terms and conditions to register.");
            return;
        }
        setIsLoading(true);
        try {
            await axiosInstance.post('/register', formData);
            toast.success("Registration Successful!");
            setRegistrationSuccess(true);
        } catch (error) {
            toast.error("Registration Failed", {
                description: error.response?.data?.message || "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isPageLoading) {
        return <div className="flex items-center justify-center p-8">Loading...</div>;
    }

    return (
        <>
            <div className="text-center mb-6 px-6">
                 {settings.registrationEnabled === 'true' && !registrationSuccess ? (
                    <>
                        <CardTitle className="text-2xl">Create an Account</CardTitle>
                        <CardDescription>Enter your details to register for network access.</CardDescription>
                    </>
                 ) : !registrationSuccess ? (
                    <>
                        <CardTitle className="text-2xl">Registration Disabled</CardTitle>
                        <CardDescription>Registration is currently unavailable.</CardDescription>
                    </>
                 ) : (
                    <CardTitle className="text-2xl">Registration Successful</CardTitle>
                 )}
            </div>

            {registrationSuccess ? (
                <CardContent className="text-center p-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">Registration Successful</h3>
                    <p className="text-muted-foreground mt-2">
                        Your account has been created. Please wait for an administrator to approve it.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Redirecting in {countdown} seconds...
                    </p>
                </CardContent>
            ) : settings.registrationEnabled === 'true' ? (
                 <>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" value={formData.username} onChange={handleInputChange} required autoFocus/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" value={formData.fullName} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
                                </div>
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
                                {isLoading ? 'Registering...' : 'Register'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <Separator />
                        <div className="text-center text-xs text-muted-foreground">
                            <span>Already have an account? </span>
                            <Button variant="link" asChild className="p-0 h-auto text-xs">
                                <Link to="/user-login">Log in here</Link>
                            </Button>
                        </div>
                    </CardFooter>
                </>
            ) : (
                <CardContent className="text-center">
                     <Info className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                     <p className="text-muted-foreground">Please contact an administrator for assistance.</p>
                </CardContent>
            )}
        </>
    );
}