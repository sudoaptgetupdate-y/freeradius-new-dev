// freeradius-frontend/src/pages/MikrotikApiPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Server, Save, PlugZap } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Badge } from "@/components/ui/badge";

export default function MikrotikApiPage() {
    const token = useAuthStore((state) => state.token);
    const [displayData, setDisplayData] = useState({ host: '', user: '', useTls: false });
    const passwordRef = useRef('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [status, setStatus] = useState({ state: 'loading', reason: '' });

    const fetchStatus = useCallback(() => {
        setStatus({ state: 'loading', reason: '' });
        axiosInstance.get('/mikrotik/settings/status', { headers: { Authorization: `Bearer ${token}` }})
            .then(response => {
                setStatus({ 
                    state: response.data.data.status, 
                    reason: response.data.data.reason || '' 
                });
            })
            .catch(() => setStatus({ state: 'offline', reason: 'Failed to fetch status' }));
    }, [token]);

    useEffect(() => {
        setIsLoading(true);
        axiosInstance.get('/mikrotik/settings', { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                if (response.data.data) {
                    setDisplayData(response.data.data);
                }
            })
            .catch(() => toast.error("Failed to load Mikrotik API settings."))
            .finally(() => setIsLoading(false));
        
        fetchStatus();
    }, [token, fetchStatus]);

    const handleInputChange = (e) => {
        setDisplayData({ ...displayData, [e.target.id]: e.target.value });
    };

    const handleSave = () => {
        const password = passwordRef.current.value;
        if (!displayData.host || !displayData.user) {
            toast.error("Host and API Username are required.");
            return;
        }
        
        // รหัสผ่านจำเป็นเฉพาะเมื่อสร้างครั้งแรก หรือเมื่อต้องการเปลี่ยน
        const dataToSave = { ...displayData };
        if (password) {
            dataToSave.password = password;
        }

        setIsLoading(true);
        toast.promise(
            axiosInstance.post('/mikrotik/settings', dataToSave, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Saving API settings...",
                success: () => {
                    passwordRef.current.value = ''; // ล้างช่องรหัสผ่านหลังบันทึก
                    fetchStatus();
                    return "Mikrotik API settings saved successfully!";
                },
                error: (err) => {
                    fetchStatus();
                    return err.response?.data?.message || "Failed to save settings.";
                },
                finally: () => setIsLoading(false)
            }
        );
    };

    const handleTestConnection = () => {
        setIsTesting(true);
        toast.promise(
            // ส่ง request ไปโดยไม่มี body, backend จะใช้ค่าที่บันทึกไว้
            axiosInstance.post('/mikrotik/settings/test-connection', {}, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Testing connection...",
                success: (res) => {
                    fetchStatus();
                    return res.data.message || "Connection successful!";
                },
                error: (err) => {
                    fetchStatus();
                    return err.response?.data?.message || "Connection failed.";
                },
                finally: () => setIsTesting(false)
            }
        );
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Server className="h-6 w-6" />
                        <CardTitle>Mikrotik API Settings</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label>Status:</Label>
                        {status.state === 'loading' ? (
                            <Badge variant="secondary">Checking...</Badge>
                        ) : status.state === 'online' ? (
                            <Badge variant="success">Online</Badge>
                        ) : (
                            <Badge variant="destructive" title={status.reason}>Offline</Badge>
                        )}
                    </div>
                </div>
                <CardDescription> Configure the connection details for your Mikrotik router. </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="host">Host (IP Address)</Label>
                    <Input id="host" value={displayData.host} onChange={handleInputChange} placeholder="e.g., 192.168.88.1" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="user">API Username</Label>
                    <Input id="user" value={displayData.user} onChange={handleInputChange} placeholder="e.g., api" />
                </div>
                
                {/* --- START: แก้ไขส่วน Password --- */}
                <div className="space-y-2">
                    <Label htmlFor="password">API Password</Label>
                    <Input id="password" type="password" ref={passwordRef} placeholder="Enter password to save or update" />
                    <p className="text-xs text-muted-foreground">
                        The password is not displayed for security. Only enter a password if you want to change it.
                        The <strong>Test Connection</strong> button uses the currently saved settings.
                    </p>
                </div>
                {/* --- END --- */}
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <Label>Use API-SSL (TLS)</Label>
                        <p className="text-sm text-muted-foreground"> Enable if you are using API-SSL service (port 8729). </p>
                    </div>
                    <Switch
                        checked={displayData.useTls}
                        onCheckedChange={(checked) => setDisplayData({ ...displayData, useTls: checked })}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button onClick={handleTestConnection} disabled={isTesting || isLoading} variant="outline">
                    <PlugZap className="mr-2 h-4 w-4" /> {isTesting ? "Testing..." : "Test Connection"}
                </Button>
                <Button onClick={handleSave} disabled={isLoading || isTesting}>
                    <Save className="mr-2 h-4 w-4" /> {isLoading ? "Saving..." : "Save Settings"}
                </Button>
            </CardFooter>
        </Card>
    );
}