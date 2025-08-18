// src/pages/AdminProfilePage.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from 'lucide-react'; // 1. Import icons
import { cn } from '@/lib/utils';

// --- START: เพิ่ม Component สำหรับแสดงผลการตรวจสอบรหัสผ่าน ---
const PasswordRequirement = ({ met, text }) => (
    <div className={cn("flex items-center text-sm", met ? "text-emerald-600" : "text-muted-foreground")}>
        {met ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2 text-red-500" />}
        <span>{text}</span>
    </div>
);

const PasswordValidation = ({ checks }) => (
    <div className="space-y-1 p-3 bg-muted/50 rounded-md">
        <PasswordRequirement met={checks.length} text="At least 8 characters long" />
        <PasswordRequirement met={checks.lowercase} text="At least one lowercase letter (a-z)" />
        <PasswordRequirement met={checks.uppercase} text="At least one uppercase letter (A-Z)" />
        <PasswordRequirement met={checks.number} text="At least one number (0-9)" />
        <PasswordRequirement met={checks.special} text="At least one special character (!@#$%^*)" />
    </div>
);
// --- END: สิ้นสุด Component ---

export default function AdminProfilePage() {
    const { user, token, login } = useAuthStore();
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // --- START: เพิ่ม State สำหรับการตรวจสอบรหัสผ่าน ---
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
    });
    const [showValidation, setShowValidation] = useState(false);
    // --- END: สิ้นสุด State ---

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));

        // --- START: เพิ่ม Logic การตรวจสอบรหัสผ่าน ---
        if (id === 'password') {
            setShowValidation(value.length > 0);
            const checks = {
                length: value.length >= 8,
                lowercase: /[a-z]/.test(value),
                uppercase: /[A-Z]/.test(value),
                number: /[0-9]/.test(value),
                special: /[!@#$%^&*]/.test(value),
            };
            setPasswordValidation(checks);
        }
        // --- END: สิ้นสุด Logic ---
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- START: เพิ่มเงื่อนไขการตรวจสอบก่อน Submit ---
        if (formData.password) {
            if (Object.values(passwordValidation).some(met => !met)) {
                toast.error("Password does not meet all security requirements.");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error("Passwords do not match.");
                return;
            }
        }
        // --- END: สิ้นสุดเงื่อนไข ---

        setIsLoading(true);
        const payload = {
            fullName: formData.fullName,
            email: formData.email,
        };
        if (formData.password) {
            payload.password = formData.password;
        }

        try {
            const response = await axiosInstance.put(`/admins/${user.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { password, ...updatedUser } = response.data.data;
            login(token, updatedUser);
            toast.success("Profile updated successfully!");
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setShowValidation(false); // ซ่อน Checklist เมื่อสำเร็จ
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Update your personal information and password.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={formData.fullName} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <hr />
                    <p className="text-sm text-muted-foreground">Leave password fields blank to keep your current password.</p>
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleInputChange} />
                    </div>
                    
                    {/* --- START: แสดงผล Checklist --- */}
                    {showValidation && (
                        <PasswordValidation checks={passwordValidation} />
                    )}
                    {/* --- END: สิ้นสุดการแสดงผล --- */}

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}