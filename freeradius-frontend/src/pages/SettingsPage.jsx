// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // <-- แก้ไขบรรทัดนี้
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, SlidersHorizontal } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NasPage from './NasPage';
import MikrotikApiPage from './MikrotikApiPage';

const OperatingModeSetting = () => {
    const { t } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const currentOperatingMode = useAuthStore((state) => state.operatingMode);
    const setOperatingModeInStore = useAuthStore((state) => state.setOperatingMode);
    const [operatingMode, setOperatingMode] = useState(currentOperatingMode);

    useEffect(() => {
        setOperatingMode(currentOperatingMode);
    }, [currentOperatingMode]);
    
    const handleSave = () => {
        const payload = { operatingMode };
        const promise = axiosInstance.post('/settings', payload, { headers: { Authorization: `Bearer ${token}` } })
            .then(() => {
                setOperatingModeInStore(operatingMode);
            });

        toast.promise(promise, {
            loading: t('toast.saving_settings'),
            success: t('toast.settings_save_success_main'),
            error: (err) => err.response?.data?.message || t('toast.settings_save_failed'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Operating Mode</CardTitle>
                <CardDescription>Switch between standard AAA and Mikrotik-specific modes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-md space-y-2">
                    <Label htmlFor="operating-mode">Mode</Label>
                    <Select value={operatingMode} onValueChange={setOperatingMode}>
                        <SelectTrigger id="operating-mode">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AAA">Standard AAA Mode</SelectItem>
                            <SelectItem value="Mikrotik">Mikrotik Hotspot Mode</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave} className="ml-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {t('save_settings')}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function SettingsPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <SlidersHorizontal className="h-6 w-6" /> 
                        {t('nav.system_settings')}
                    </h1>
                    <p className="text-muted-foreground">{t('settings_page.description')}</p>
                </div>
            </div>
            <Tabs defaultValue="mode" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="mode">Operating Mode</TabsTrigger>
                    <TabsTrigger value="nas">NAS / Clients</TabsTrigger>
                    <TabsTrigger value="mikrotik">Mikrotik API</TabsTrigger>
                </TabsList>
                <TabsContent value="mode" className="mt-4">
                    <OperatingModeSetting />
                </TabsContent>
                <TabsContent value="nas" className="mt-4">
                   <NasPage />
                </TabsContent>
                <TabsContent value="mikrotik" className="mt-4">
                    <MikrotikApiPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}