// src/pages/ExternalLoginPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import useUserAuthStore from '@/store/userAuthStore';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { Info, HelpCircle } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';

export default function ExternalLoginPage() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const { login } = useUserAuthStore();
    const formRef = useRef(null);

    const [magic, setMagic] = useState('');
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => setSettings(response.data.data))
          .catch(() => {
              toast.error(t('toast.settings_load_failed'));
              setSettings({ externalLoginEnabled: 'true', terms: '' });
          })
          .finally(() => setIsPageLoading(false));
    }, [t]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const magicValue = params.get('magic');
        if (magicValue) {
            setMagic(magicValue);
        }
    }, [location.search]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agreed) {
            toast.error(t('toast.must_agree_terms'));
            return;
        }
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('/external-auth/login', formData);
            const { token, user, advertisement } = response.data.data;
            
            login(token, user, advertisement);

            toast.success(t('toast.auth_successful_title'), { description: t('toast.auth_successful_desc') });
            
            setTimeout(() => {
                if (formRef.current) {
                    formRef.current.submit();
                }
            }, 100);

        } catch (error) {
            toast.error(t('toast.login_failed_title'), {
                description: error.response?.data?.message || t('toast.login_failed_desc'),
            });
            setIsLoading(false);
        }
    };
    
    if (isPageLoading) {
        return <div className="flex items-center justify-center p-8">{t('loading')}</div>;
    }

    return (
        <>
            <div className="text-center mb-6 px-6">
                {settings.externalLoginEnabled === 'true' ? (
                    <>
                        <CardTitle className="text-2xl">{t('external_login_page.user_login_title')}</CardTitle>
                        <CardDescription>{t('external_login_page.description')}</CardDescription>
                    </>
                ) : (
                     <>
                        <CardTitle className="text-2xl">{t('external_login_page.login_disabled_title')}</CardTitle>
                        <CardDescription>{t('external_login_page.login_disabled_desc')}</CardDescription>
                    </>
                )}
            </div>
            
            {settings.externalLoginEnabled === 'true' ? (
                <>
                    <CardContent>
                        <form
                            ref={formRef}
                            action="http://192.168.146.1:1000/fgtauth"
                            method="POST"
                            className="space-y-4"
                            onSubmit={handleSubmit}
                        >
                            <input type="hidden" name="magic" value={magic} />
                            
                            <div className="space-y-2">
                                <Label htmlFor="username">{t('form_labels.username')}</Label>
                                <Input id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder={t('form_labels.username_placeholder')} required autoFocus/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">{t('form_labels.password')}</Label>
                                <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder={t('form_labels.password_placeholder')} required />
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
                            <Button type="submit" className="w-full !mt-6" disabled={isLoading || !agreed || !magic}>
                                {isLoading ? t('authenticating') : t('log_in')}
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
                        <div className="w-full flex justify-between items-center text-xs">
                           <Button variant="link" asChild className="p-0 h-auto text-muted-foreground">
                               <Link to="/register">{t('external_login_page.no_account_link')}</Link>
                           </Button>
                           <Button variant="link" asChild className="p-0 h-auto text-muted-foreground">
                               <Link to="/portal/login">
                                   <HelpCircle className="mr-1 h-3 w-3" />
                                   {t('external_login_page.account_management_link')}
                               </Link>
                           </Button>
                        </div>
                    </CardFooter>
                </>
            ) : (
                <>
                    <CardContent className="text-center">
                        <Info className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                        <p className="text-muted-foreground">{t('external_login_page.contact_admin')}</p>
                    </CardContent>
                    <CardFooter>
                         <Button asChild className="w-full">
                           <Link to="/register">{t('external_login_page.go_to_registration_button')}</Link>
                        </Button>
                    </CardFooter>
                </>
            )}
        </>
    );
}