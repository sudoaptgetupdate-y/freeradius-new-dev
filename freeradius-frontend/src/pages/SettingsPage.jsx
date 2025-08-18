// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SlidersHorizontal, Save } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';

export default function SettingsPage() {
    const token = useAuthStore((state) => state.token);
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [externalLoginEnabled, setExternalLoginEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        axiosInstance.get('/settings', { headers: { Authorization: `Bearer ${token}` }})
          .then(response => {
              const settings = response.data.data;
              setRegistrationEnabled(settings.registrationEnabled === 'true');
              setExternalLoginEnabled(settings.externalLoginEnabled === 'true');
          })
          .catch(() => toast.error("Could not load settings."))
          .finally(() => setIsLoading(false));
    }, [token]);

    const handleSave = async () => {
        const payload = {
            registrationEnabled: String(registrationEnabled),
            externalLoginEnabled: String(externalLoginEnabled),
        };
        toast.promise(axiosInstance.post('/settings', payload, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Saving settings...',
                success: 'Settings saved successfully!',
                error: (err) => err.response?.data?.message || "Failed to save settings.",
            }
        );
    };

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-6 w-6" />
                    System Settings
                </CardTitle>
                <CardDescription>Manage system-wide functionalities like user registration and external login.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="registration-switch" className="text-base">User Self-Registration</Label>
                        <p className="text-sm text-muted-foreground">Allow users to register for an account from the login page.</p>
                    </div>
                    <Switch id="registration-switch" checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="external-login-switch" className="text-base">External User Login</Label>
                        <p className="text-sm text-muted-foreground">Allow end-users (not admins) to log in to the network.</p>
                    </div>
                    <Switch id="external-login-switch" checked={externalLoginEnabled} onCheckedChange={setExternalLoginEnabled} />
                </div>
            </CardContent>
            <div className="flex justify-end p-6">
                <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </Card>
    );
}