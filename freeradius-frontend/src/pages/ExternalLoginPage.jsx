// src/pages/ExternalLoginPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import useUserAuthStore from '@/store/userAuthStore'; // ✅ ใช้ Store ปกติ (เพราะทดสอบแล้วว่าผ่าน)
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { Info } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';

export default function ExternalLoginPage() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    
    // ✅ เรียกใช้ฟังก์ชัน login จาก Store (ทำงานได้ถูกต้องเมื่อ IP Gateway ถูกต้อง)
    const { login } = useUserAuthStore(); 
    const formRef = useRef(null);

    // --- State ---
    const [magic, setMagic] = useState('');
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // State สำหรับ MikroTik
    const [mikrotikConfig, setMikrotikConfig] = useState(null);

    // โหลด Settings
    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => setSettings(response.data.data))
          .catch(() => {
              setSettings({ externalLoginEnabled: 'true', terms: '' });
          })
          .finally(() => setIsPageLoading(false));
    }, []);

    // ตรวจสอบ URL Params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        
        const linkLoginOnly = params.get('link-login-only');
        const linkOrig = params.get('link-orig');
        const dst = params.get('dst');
        const errorMsg = params.get('error');
        const mac = params.get('mac');
        const ip = params.get('ip'); 

        // ตรวจสอบว่าเป็น MikroTik หรือไม่
        if (linkLoginOnly || linkOrig || dst || mac || ip) {
            
            let actionUrl = linkLoginOnly;
            if (!actionUrl) {
                // ✅ ใช้ IP 10.5.55.1 ตามที่คุณระบุ (Fallback)
                actionUrl = settings?.hotspotUrl || 'http://10.0.0.108/login'; 
            }

            // ✅ ใช้ window.location.origin เพื่อความยืดหยุ่น (ได้ทั้ง http://10.0.0.105 หรือ Domain อื่น)
            const forceDashboardUrl = `${window.location.origin}/portal/dashboard`;

            setMikrotikConfig({
                actionUrl: actionUrl,
                dst: forceDashboardUrl, // บังคับเด้งไป Dashboard
            });

            if (errorMsg) {
                toast.error(`Login Failed: ${errorMsg}`);
            }
        } 
        
        const magicValue = params.get('magic');
        if (magicValue) setMagic(magicValue);

    }, [location.search, settings]);

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
            // 1. ตรวจสอบรหัสผ่านกับ Backend (เก็บ Token)
            const response = await axiosInstance.post('/external-auth/login', formData);
            const { token, user, advertisement } = response.data.data;
            
            // 2. Login เข้า App ทันที (บันทึก Token)
            login(token, user, advertisement);

            toast.success("Authentication Verified. Logging in to Hotspot...");

            // 3. ส่ง Form เข้า MikroTik เพื่อเปิดเน็ต
            // ตั้งเวลาหน่วง 0.5 วิ เพื่อให้ State ของ React อัปเดตเสร็จก่อนส่ง Form
            setTimeout(() => {
                if (formRef.current) {
                    formRef.current.submit(); 
                }
            }, 500);

        } catch (error) {
            console.error(error);
            toast.error(t('toast.login_failed_title'), {
                description: error.response?.data?.message || t('toast.login_failed_desc'),
            });
            setIsLoading(false);
        }
    };
    
    if (isPageLoading) {
        return <div className="flex items-center justify-center p-8">{t('loading')}</div>;
    }

    const currentFormAction = mikrotikConfig 
        ? mikrotikConfig.actionUrl 
        : "http://192.168.146.1:1000/fgtauth";

    const isButtonDisabled = isLoading || !agreed || (!magic && !mikrotikConfig);

    return (
        <>
            <div className="text-center mb-6 px-6">
                {settings?.externalLoginEnabled === 'true' ? (
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
            
            {settings?.externalLoginEnabled === 'true' ? (
                <>
                    <CardContent>
                        {(!magic && !mikrotikConfig) && (
                            <div className="mb-4 p-2 bg-yellow-50 text-yellow-600 text-xs rounded border border-yellow-200 text-center">
                                ⚠️ Connecting directly without Router Params.<br/>
                                Please connect via WiFi Hotspot Login Page.
                            </div>
                        )}

                        <form
                            ref={formRef}
                            action={currentFormAction}
                            method="POST"
                            className="space-y-4"
                            onSubmit={handleSubmit}
                        >
                            {mikrotikConfig ? (
                                <>
                                    {/* Fields ที่ MikroTik ต้องการ */}
                                    <input type="hidden" name="dst" value={mikrotikConfig.dst} />
                                    <input type="hidden" name="popup" value="true" />
                                    {/* ส่ง Username/Password แบบ HTTP PAP */}
                                    <input type="hidden" name="username" value={formData.username} />
                                    <input type="hidden" name="password" value={formData.password} />
                                </>
                            ) : (
                                <input type="hidden" name="magic" value={magic} />
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="username">{t('form_labels.username')}</Label>
                                {/* เอา name ออกจาก input ที่โชว์ เพื่อป้องกันส่งค่าซ้ำ (Optional แต่แนะนำ) */}
                                <Input id="username" value={formData.username} onChange={handleInputChange} placeholder={t('form_labels.username_placeholder')} required autoFocus/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">{t('form_labels.password')}</Label>
                                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder={t('form_labels.password_placeholder')} required />
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
                                    <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md text-sm text-muted-foreground whitespace-pre-wrap">{settings?.terms}</div>
                                    <DialogFooter><DialogClose asChild><Button type="button">{t('close')}</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button type="submit" className="w-full !mt-6" disabled={isButtonDisabled}>
                                {isLoading ? t('authenticating') : t('log_in')}
                            </Button>
                        </form>
                    </CardContent>
                    
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <div className="w-full flex justify-center text-sm text-muted-foreground">
                            <Button variant="link" onClick={() => i18n.changeLanguage('th')} className={i18n.language === 'th' ? 'font-bold text-primary' : ''}>ภาษาไทย</Button>
                            <span className="mx-1">|</span>
                            <Button variant="link" onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? 'font-bold text-primary' : ''}>English</Button>
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