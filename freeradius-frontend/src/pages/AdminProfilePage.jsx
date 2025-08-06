// src/pages/AdminProfilePage.jsx
import { useState } from 'react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminProfilePage() { // <--- แก้ไขชื่อ Component
    const { user, token, login } = useAuthStore();
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
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