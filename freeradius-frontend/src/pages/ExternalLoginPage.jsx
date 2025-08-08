// src/pages/ExternalLoginPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { ArrowLeft, Building, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function ExternalLoginPage() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [settings, setSettings] = useState({
        logoUrl: '',
        backgroundUrl: '',
        terms: 'Loading terms...'
    });

    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => setSettings(response.data.data))
          .catch(() => toast.error("Could not load page settings."));
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
            await axiosInstance.post('/external-auth/login', formData);
            toast.success("Login Successful!", {
                description: "You can now access the internet.",
            });
            setLoginSuccess(true);
        } catch (error) {
            toast.error("Login Failed", {
                description: error.response?.data?.message || "Please check your credentials.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const pageStyle = settings.backgroundUrl ? {
        backgroundImage: `url(${settings.backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {
        backgroundColor: 'hsl(220 14.3% 95.9%)'
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 transition-all" style={pageStyle}>
            <Card className="w-full max-w-md shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        {settings.logoUrl ? (
                           <img src={settings.logoUrl} alt="Company Logo" className="h-20 object-contain" />
                        ) : (
                           <div className="bg-slate-100 p-3 rounded-full w-fit">
                               <Building className="h-10 w-10 text-primary" />
                           </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl">User Login</CardTitle>
                    <CardDescription>Please enter your credentials to access the network.</CardDescription>
                </CardHeader>
                
                {loginSuccess ? (
                    <CardContent className="text-center p-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">Login Successful</h3>
                        <p className="text-muted-foreground mt-2">You are now connected to the internet. You can close this page.</p>
                    </CardContent>
                ) : (
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
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <Button variant="link" asChild className="w-full text-muted-foreground text-xs">
                               <Link to="/register">Don't have an account? Register here</Link>
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>
        </div>
    );
}