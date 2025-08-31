// src/pages/LoginRegistrationSettingsPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { KeyRound, Save } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginRegistrationSettingsPage() {
    const { t } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [externalLoginEnabled, setExternalLoginEnabled] = useState(true);
    const [initialUserStatus, setInitialUserStatus] = useState('registered');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        axiosInstance.get('/settings', { headers: { Authorization: `Bearer ${token}` }})
          .then(response => {
              const settings = response.data.data;
              setRegistrationEnabled(settings.registrationEnabled === 'true');
              setExternalLoginEnabled(settings.externalLoginEnabled === 'true');
              setInitialUserStatus(settings.initialUserStatus || 'registered');
          })
          .catch(() => toast.error(t('toast.settings_load_failed')))
          .finally(() => setIsLoading(false));
    }, [token, t]);

    const handleSave = async () => {
        const payload = {
            registrationEnabled: String(registrationEnabled),
            externalLoginEnabled: String(externalLoginEnabled),
            initialUserStatus: initialUserStatus,
        };
        
        toast.promise(axiosInstance.post('/settings', payload, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_settings'),
                success: t('toast.settings_save_success_main'),
                error: (err) => err.response?.data?.message || t('toast.settings_save_failed'),
            }
        );
    };

    return (
        <Card className="max-w-3xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-6 w-6" />
                    {/* --- START: แก้ไข Key --- */}
                    {t('login_registration_page.title')}
                    {/* --- END --- */}
                </CardTitle>
                {/* --- START: แก้ไข Key --- */}
                <CardDescription>{t('login_registration_page.description')}</CardDescription>
                {/* --- END --- */}
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-start justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="registration-switch" className="text-base">{t('settings_page.self_registration.label')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings_page.self_registration.description')}</p>
                    </div>
                    <Switch id="registration-switch" checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
                </div>

                {registrationEnabled && (
                    <div className="flex items-start justify-between rounded-lg border p-4 pl-6 bg-muted/30">
                         <div className="space-y-1.5 flex-1">
                            <Label className="text-base">{t('settings_page.initial_status.label')}</Label>
                            <p className="text-sm text-muted-foreground">{t('settings_page.initial_status.description')}</p>
                        </div>
                        <div className="w-48">
                            <Select value={initialUserStatus} onValueChange={setInitialUserStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="registered">{t('status.registered')}</SelectItem>
                                    <SelectItem value="active">{t('status.active')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="external-login-switch" className="text-base">{t('settings_page.external_login.label')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings_page.external_login.description')}</p>
                    </div>
                    <Switch id="external-login-switch" checked={externalLoginEnabled} onCheckedChange={setExternalLoginEnabled} />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end p-6">
                <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? t('saving') : t('save_settings')}
                </Button>
            </CardFooter>
        </Card>
    );
}