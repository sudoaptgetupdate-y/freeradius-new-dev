import { useState, useEffect, useRef } from 'react'; // <-- **เพิ่ม useRef**
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Server, Save, PlugZap } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';

export default function MikrotikApiPage() {
    const token = useAuthStore((state) => state.token);
    // --- START: **แก้ไข** ---
    // ใช้ state แยกสำหรับข้อมูลที่แสดงผล และข้อมูลที่จะส่ง
    const [displayData, setDisplayData] = useState({ host: '', user: '', useTls: false });
    const passwordRef = useRef(''); // ใช้ Ref ในการเก็บค่า password โดยตรง
    // --- END: **แก้ไข** ---

    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

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
    }, [token]);

    const handleInputChange = (e) => {
        setDisplayData({ ...displayData, [e.target.id]: e.target.value });
    };

    const handleSave = () => {
        const password = passwordRef.current.value;
        if (!password) {
            toast.error("Password is required to save new settings.");
            return;
        }

        const dataToSave = {
            ...displayData,
            password: password,
        };

        setIsLoading(true);
        toast.promise(
            axiosInstance.post('/mikrotik/settings', dataToSave, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Saving API settings...",
                success: () => {
                    passwordRef.current.value = ''; // Clear password field after save
                    return "Mikrotik API settings saved successfully!";
                },
                error: (err) => err.response?.data?.message || "Failed to save settings.",
                finally: () => setIsLoading(false)
            }
        );
    };

    const handleTestConnection = () => {
        const password = passwordRef.current.value;
        if (!password) {
            toast.info("Please enter the current password to test the connection.");
            return;
        }
        
        // --- START: **แก้ไข** ---
        // รวบรวมข้อมูลล่าสุดจาก Form เพื่อส่งไปทดสอบเสมอ
        const dataToTest = {
            host: displayData.host,
            user: displayData.user,
            useTls: displayData.useTls,
            password: password,
        };

        // DEBUG: เพิ่ม console.log เพื่อดูข้อมูลที่กำลังจะถูกส่งไป
        console.log("--- Data being sent for test ---", dataToTest);
        // --- END: **แก้ไข** ---

        setIsTesting(true);
        toast.promise(
            axiosInstance.post('/mikrotik/settings/test-connection', dataToTest, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Testing connection...",
                success: (res) => res.data.message || "Connection successful!",
                error: (err) => err.response?.data?.message || "Connection failed.",
                finally: () => setIsTesting(false)
            }
        )
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"> <Server className="h-6 w-6" /> Mikrotik API Settings </CardTitle>
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
                <div className="space-y-2">
                    <Label htmlFor="password">API Password</Label>
                    {/* --- START: **แก้ไข** --- */}
                    <Input id="password" type="password" ref={passwordRef} placeholder="Enter password to save or test" />
                    {/* --- END: **แก้ไข** --- */}
                    <p className="text-xs text-muted-foreground">For security, the password is not displayed. Enter it only when you need to save or test.</p>
                </div>
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