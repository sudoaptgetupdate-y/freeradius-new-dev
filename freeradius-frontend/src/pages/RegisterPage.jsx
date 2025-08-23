// src/pages/RegisterPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { CheckCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next'; // <-- 1. Import hook

export default function RegisterPage() {
    const { t, i18n } = useTranslation(); // <-- 2. เรียกใช้ hook
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        phoneNumber: ''
    });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => setSettings(response.data.data))
          .catch(() => {
            toast.error(t('toast.settings_load_failed'));
            setSettings({ registrationEnabled: 'true', terms: '' });
          })
          .finally(() => setIsPageLoading(false));
    }, [t]);

    useEffect(() => {
        if (registrationSuccess) {
            if (countdown <= 0) {
                window.location.href = 'http://neverssl.com';
                return;
            }

            const timerId = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            return () => clearTimeout(timerId);
        }
    }, [registrationSuccess, countdown, navigate]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error(t('toast.passwords_do_not_match'));
            return;
        }
        if (!agreed) {
            toast.error(t('toast.must_agree_terms_register'));
            return;
        }
        setIsLoading(true);
        toast.promise(
            axiosInstance.post('/register', formData),
            {
                loading: t('toast.registering'),
                success: () => {
                    setRegistrationSuccess(true);
                    return t('toast.register_success_title');
                },
                error: (err) => err.response?.data?.message || t('toast.register_failed_desc'),
                finally: () => setIsLoading(false)
            }
        );
    };

    if (isPageLoading) {
        return <div className="flex items-center justify-center p-8">{t('loading')}</div>;
    }

    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <>
            <div className="text-center mb-6 px-6">
                 {settings.registrationEnabled === 'true' && !registrationSuccess ? (
                    <>
                        <CardTitle className="text-2xl">{t('register_page.create_account_title')}</CardTitle>
                        <CardDescription>{t('register_page.create_account_desc')}</CardDescription>
                    </>
                 ) : !registrationSuccess ? (
                    <>
                        <CardTitle className="text-2xl">{t('register_page.disabled_title')}</CardTitle>
                        <CardDescription>{t('register_page.disabled_desc')}</CardDescription>
                    </>
                 ) : (
                    <CardTitle className="text-2xl">{t('register_page.success_title')}</CardTitle>
                 )}
            </div>

            {registrationSuccess ? (
                <CardContent className="text-center p-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">{t('register_page.success_title')}</h3>
                    <p className="text-muted-foreground mt-2">
                        {t('register_page.success_desc')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        {t('register_page.redirecting_in', { count: countdown })}
                    </p>
                </CardContent>
            ) : settings.registrationEnabled === 'true' ? (
                 <>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">{t('form_labels.username')}</Label>
                                    <Input id="username" value={formData.username} onChange={handleInputChange} required autoFocus placeholder={t('form_labels.username_placeholder')}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">{t('form_labels.full_name')}</Label>
                                    <Input id="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder={t('form_labels.full_name_placeholder')}/>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('form_labels.email')}</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t('form_labels.email_placeholder')} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phoneNumber">{t('form_labels.phone_number')}</Label>
                                <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder={t('form_labels.phone_number_placeholder')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('form_labels.password')}</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required placeholder="••••••••"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">{t('form_labels.confirm_password')}</Label>
                                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required placeholder="••••••••"/>
                                </div>
                            </div>
                            <Dialog>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
                                        <Label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                                            {t('external_login_page.agree_terms_checkbox')}
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-6">
                                        {t('external_login_page.must_agree_prefix')}
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="p-1 h-auto text-xs">{t('external_login_page.terms_and_conditions')}</Button>
                                        </DialogTrigger>
                                        {t('external_login_page.must_agree_suffix')}
                                    </p>
                                </div>
                                <DialogContent className="sm:max-w-[625px]">
                                    <DialogHeader><DialogTitle>{t('terms_dialog.title')}</DialogTitle></DialogHeader>
                                    <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md text-sm text-muted-foreground whitespace-pre-wrap">{settings.terms}</div>
                                    <DialogFooter><DialogClose asChild><Button type="button">{t('close')}</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                                {isLoading ? t('registering') : t('register_button')}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <div className="w-full flex justify-center text-sm text-muted-foreground">
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
                        <Separator />
                        <div className="text-center text-xs text-muted-foreground">
                            <span>{t('register_page.already_have_account')} </span>
                            <Button variant="link" asChild className="p-0 h-auto text-xs">
                                <Link to="/user-login">{t('register_page.log_in_here')}</Link>
                            </Button>
                        </div>
                    </CardFooter>
                </>
            ) : (
                <CardContent className="text-center">
                     <Info className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                     <p className="text-muted-foreground">{t('external_login_page.contact_admin')}</p>
                </CardContent>
            )}
        </>
    );
}