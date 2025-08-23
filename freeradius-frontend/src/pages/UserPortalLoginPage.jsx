// src/pages/UserPortalLoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserAuthStore from '@/store/userAuthStore';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next'; // <-- 1. Import hook

export default function UserPortalLoginPage() {
    const { t, i18n } = useTranslation(); // <-- 2. เรียกใช้ hook
    const navigate = useNavigate();
    const { login, token, _hasHydrated } = useUserAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginData, setLoginData] = useState(null);

    useEffect(() => {
        if (loginData) {
            login(loginData.token, loginData.user);
            navigate('/portal/dashboard', { replace: true });
        }
    }, [loginData, login, navigate]);

    useEffect(() => {
        if (_hasHydrated && token) {
            navigate('/portal/dashboard', { replace: true });
        }
    }, [_hasHydrated, token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/portal/login', { username, password });
            toast.success(t('toast.welcome', { name: response.data.user.full_name || response.data.user.username }));
            setLoginData(response.data);
        } catch (error) {
            toast.error(t('toast.login_failed_title'), {
              description: error.response?.data?.message || t('toast.login_failed_desc'),
            });
            setIsLoading(false);
        }
    };
    
    if (!_hasHydrated) {
        return null; 
    }

    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <>
            <div className="text-center mb-6">
                <CardTitle>{t('user_portal_login_page.title')}</CardTitle>
                <CardDescription>{t('user_portal_login_page.description')}</CardDescription>
            </div>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">{t('form_labels.username')}</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus placeholder={t('form_labels.username_placeholder')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('form_labels.password')}</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"/>
                    </div>
                    <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                        {isLoading ? t('logging_in') : t('log_in')}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <div className="text-sm text-muted-foreground">
                    <Button
                        variant="link"
                        className={`p-1 h-auto ${i18n.language === 'th' ? 'font-bold text-primary' : ''}`}
                        onClick={() => i18n.changeLanguage('th')}
                    >
                        ภาษาไทย
                    </Button>
                    <span className="mx-1">|</span>
                    <Button
                        variant="link"
                        className={`p-1 h-auto ${i18n.language === 'en' ? 'font-bold text-primary' : ''}`}
                        onClick={() => i18n.changeLanguage('en')}
                    >
                        English
                    </Button>
                </div>
            </CardFooter>
        </>
    );
}