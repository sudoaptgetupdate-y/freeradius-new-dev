// src/pages/RegisterPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        nationalId: '',
        password: '',
    });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // --- START: ส่วนของระบบกันบอท ---
    const [botCheck, setBotCheck] = useState({ num1: 0, num2: 0, answer: '' });

    useEffect(() => {
        generateBotCheck();
    }, []);

    const generateBotCheck = () => {
        setBotCheck({
            num1: Math.floor(Math.random() * 10) + 1,
            num2: Math.floor(Math.random() * 10) + 1,
            answer: ''
        });
    };
    // --- END: ส่วนของระบบกันบอท ---

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- START: การตรวจสอบเงื่อนไข ---
        if (parseInt(botCheck.answer) !== (botCheck.num1 + botCheck.num2)) {
            toast.error("Incorrect answer to the security question.");
            generateBotCheck();
            return;
        }

        if (!agreed) {
            toast.error("You must agree to the terms and conditions.");
            return;
        }
        // --- END: การตรวจสอบเงื่อนไข ---

        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/register', formData);
            toast.success("Registration Successful!", {
                description: "Please wait for an administrator to approve your account.",
                duration: 5000,
            });
            navigate('/login');
        } catch (error) {
            toast.error("Registration Failed", {
                description: error.response?.data?.message || "An unexpected error occurred.",
            });
            generateBotCheck(); // สุ่มคำถามใหม่เมื่อเกิดข้อผิดพลาด
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Register New Account</CardTitle>
                    <CardDescription>Fill in the details below to create your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" value={formData.fullName} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" value={formData.username} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nationalId">National ID</Label>
                            <Input id="nationalId" value={formData.nationalId} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required />
                        </div>
                        
                        {/* --- START: ส่วนของ Bot Check และ Terms --- */}
                        <div className="space-y-2">
                            <Label htmlFor="botCheck">Security Question: What is {botCheck.num1} + {botCheck.num2}?</Label>
                            <Input id="botCheck" type="number" value={botCheck.answer} onChange={(e) => setBotCheck({...botCheck, answer: e.target.value})} required />
                        </div>

                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Accept terms and conditions
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    You agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </div>
                        {/* --- END: ส่วนของ Bot Check และ Terms --- */}
                        
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Registering...' : 'Create Account'}
                        </Button>
                        <Button variant="link" asChild className="w-full">
                           <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Login</Link>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}