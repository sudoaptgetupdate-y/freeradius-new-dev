// src/pages/RegisterPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { ArrowLeft, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
    });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [botCheck, setBotCheck] = useState({ num1: 0, num2: 0, answer: '' });
    
    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        generateBotCheck();
        axiosInstance.get('/settings')
          .then(response => {
            setSettings(response.data.data);
          })
          .catch(() => {
            toast.error("Could not load page settings.");
            setSettings({ registrationEnabled: 'true' });
          })
          .finally(() => {
            setIsPageLoading(false);
          });
    }, []);

    const generateBotCheck = () => {
        setBotCheck({
            num1: Math.floor(Math.random() * 10) + 1,
            num2: Math.floor(Math.random() * 10) + 1,
            answer: ''
        });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (parseInt(botCheck.answer) !== (botCheck.num1 + botCheck.num2)) {
            toast.error("Incorrect answer to the security question.");
            generateBotCheck();
            return;
        }

        if (!agreed) {
            toast.error("You must agree to the terms and conditions.");
            return;
        }

        setIsLoading(true);
        try {
            await axiosInstance.post('/register', formData);
            toast.success("Registration Successful!", {
                description: "Please wait for an administrator to approve your account.",
                duration: 5000,
            });
            navigate('/user-login');
        } catch (error) {
            toast.error("Registration Failed", {
                description: error.response?.data?.message || "An unexpected error occurred.",
            });
            generateBotCheck();
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
                {settings.registrationEnabled === 'true' ? (
                    <>
                        <CardTitle className="text-2xl">Create Your Account</CardTitle>
                        <CardDescription>Fill out the form to get started.</CardDescription>
                    </>
                ) : (
                    <>
                        <CardTitle className="text-2xl">Registration Disabled</CardTitle>
                        <CardDescription>Self-registration is currently unavailable.</CardDescription>
                    </>
                )}
            </div>
            
            {settings.registrationEnabled === 'true' ? (
                <>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="e.g., John Doe" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="e.g., user@example.com" required />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="e.g., 0812345678" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" value={formData.username} onChange={handleInputChange} placeholder="e.g., johndoe" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Create a strong password" required />
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <Label htmlFor="botCheck">Security Question: What is {botCheck.num1} + {botCheck.num2}?</Label>
                                <Input id="botCheck" type="number" value={botCheck.answer} onChange={(e) => setBotCheck({...botCheck, answer: e.target.value})} required />
                            </div>
                            <Dialog>
                                <div className="items-top flex space-x-2 pt-2">
                                    <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            I agree to the
                                            <DialogTrigger asChild>
                                                 <Button variant="link" className="p-1 h-auto">Terms and Conditions</Button>
                                            </DialogTrigger>
                                        </label>
                                    </div>
                                </div>
                                 <DialogContent className="sm:max-w-[625px]">
                                    <DialogHeader>
                                      <DialogTitle>Terms of Service and Privacy Policy</DialogTitle>
                                    </DialogHeader>
                                    <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
                                       {settings.terms}
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button">Close</Button></DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                                {isLoading ? 'Registering...' : 'Create Account'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button variant="link" asChild className="w-full text-muted-foreground">
                           <Link to="/user-login"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Login</Link>
                        </Button>
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
                           <Link to="/user-login"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Login</Link>
                        </Button>
                    </CardFooter>
                </>
            )}
        </>
    );
}