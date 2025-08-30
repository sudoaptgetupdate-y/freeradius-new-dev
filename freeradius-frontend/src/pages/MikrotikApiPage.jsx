// src/pages/MikrotikApiPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Server, Save, PlugZap } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { useTranslation } from 'react-i18next';

export default function MikrotikApiPage() {
    const { t } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({ host: '', user: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        axiosInstance.get('/mikrotik/settings', { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                if (response.data.data) {
                    setFormData(prev => ({ ...prev, ...response.data.data, password: '' })); // Clear password on load
                }
            })
            .catch(() => toast.error("Failed to load Mikrotik API settings."))
            .finally(() => setIsLoading(false));
    }, [token]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSave = () => {
        if (!formData.password) {
            toast.error("Password is required to save settings.");
            return;
        }
        setIsLoading(true);
        toast.promise(
            axiosInstance.post('/mikrotik/settings', formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Saving API settings...",
                success: (res) => {
                    setFormData(prev => ({ ...prev, password: '' })); // Clear password after save
                    return "Mikrotik API settings saved successfully!";
                },
                error: (err) => err.response?.data?.message || "Failed to save settings.",
                finally: () => setIsLoading(false)
            }
        );
    };
    
    // --- START: ADDED FUNCTION ---
    const handleTestConnection = () => {
        setIsTesting(true);
        const testData = { ...formData };
        if (!testData.password) {
            // If password field is empty, it means user hasn't changed it.
            // We can't test without a password, so we show a message.
            // A more advanced version might fetch the stored password on the backend to test.
            toast.info("Please enter a password to test the connection.");
            setIsTesting(false);
            return;
        }

        toast.promise(
            axiosInstance.post('/mikrotik/settings/test-connection', testData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Testing connection...",
                success: (res) => res.data.message || "Connection successful!",
                error: (err) => err.response?.data?.message || "Connection failed.",
                finally: () => setIsTesting(false)
            }
        )
    };
    // --- END: ADDED FUNCTION ---


    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Server className="h-6 w-6" />
                    Mikrotik API Settings
                </CardTitle>
                <CardDescription>
                    Configure the connection details for your Mikrotik router. This is required for Mikrotik-specific features.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="host">Host (IP Address)</Label>
                    <Input id="host" value={formData.host} onChange={handleInputChange} placeholder="e.g., 192.168.88.1" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="user">API Username</Label>
                    <Input id="user" value={formData.user} onChange={handleInputChange} placeholder="e.g., admin" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">API Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Enter password to save or test" />
                    <p className="text-xs text-muted-foreground">For security, the password is not displayed. Enter it only when you need to save or test.</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button onClick={handleTestConnection} disabled={isTesting || isLoading} variant="outline">
                    <PlugZap className="mr-2 h-4 w-4" />
                    {isTesting ? "Testing..." : "Test Connection"}
                </Button>
                <Button onClick={handleSave} disabled={isLoading || isTesting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Settings"}
                </Button>
            </CardFooter>
        </Card>
    );
}