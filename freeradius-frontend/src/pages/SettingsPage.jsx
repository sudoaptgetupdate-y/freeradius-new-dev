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
import { useTranslation } from 'react-i18next'; // <-- 1. Import hook

export default function SettingsPage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
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
          .catch(() => toast.error(t('toast.settings_load_failed')))
          .finally(() => setIsLoading(false));
    }, [token, t]);

    const handleSave = async () => {
        const payload = {
            registrationEnabled: String(registrationEnabled),
            externalLoginEnabled: String(externalLoginEnabled),
        };
        toast.promise(axiosInstance.post('/settings', payload, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_settings'),
                success: t('toast.settings_save_success_main'),
                error: (err) => err.response?.data?.message || t('toast.settings_save_failed'),
            }
        );
    };

    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-6 w-6" />
                    {t('settings_page.title')}
                </CardTitle>
                <CardDescription>{t('settings_page.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="registration-switch" className="text-base">{t('settings_page.self_registration.label')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings_page.self_registration.description')}</p>
                    </div>
                    <Switch id="registration-switch" checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="external-login-switch" className="text-base">{t('settings_page.external_login.label')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings_page.external_login.description')}</p>
                    </div>
                    <Switch id="external-login-switch" checked={externalLoginEnabled} onCheckedChange={setExternalLoginEnabled} />
                </div>
            </CardContent>
            <div className="flex justify-end p-6">
                <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? t('saving') : t('save_settings')}
                </Button>
            </div>
        </Card>
    );
}