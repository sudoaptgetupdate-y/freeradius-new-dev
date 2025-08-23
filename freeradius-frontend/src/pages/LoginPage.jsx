// freeradius-frontend/src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next'; // <-- Import hook

export default function LoginPage() {
    const { t, i18n } = useTranslation(); // <-- เรียกใช้ hook
    const navigate = useNavigate();
    const { login, token } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [appName, setAppName] = useState('Freeradius UI');

    useEffect(() => {
        axiosInstance.get('/settings')
            .then(response => {
                if (response.data.data.appName) {
                    setAppName(response.data.data.appName);
                }
            })
            .catch(() => {
                console.warn("Could not load app name setting.");
            });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axiosInstance.post('/auth/login', { username, password });
            const { token, user: userData } = response.data;
            login(token, userData);
            toast.success(t('toast.welcome', { name: userData.fullName || userData.username }));
            navigate('/dashboard');
        } catch (error) {
            toast.error(t('toast.login_failed_title'), {
              description: error.response?.data?.message || t('toast.login_failed_desc'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <>
            <CardContent className="pt-0">
                <div className="text-center mb-6">
                    <CardTitle>{appName}</CardTitle>
                    <CardDescription>{t('login_page.description')}</CardDescription>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">{t('form_labels.username')}</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus placeholder={t('form_labels.username_placeholder_admin')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('form_labels.password')}</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
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