// src/pages/ExternalLoginPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import useUserAuthStore from '@/store/userAuthStore'; 
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';

export default function ExternalLoginPage() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const { login } = useUserAuthStore(); //
    const formRef = useRef(null);

    // --- State ---
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // รองรับทั้ง 2 ระบบ
    const [mikrotikConfig, setMikrotikConfig] = useState(null);
    const [fortigateMagic, setFortigateMagic] = useState('');

    // โหลด Settings
    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => setSettings(response.data.data))
          .catch(() => setSettings({ externalLoginEnabled: 'true', terms: '', hotspotUrl: '' }))
          .finally(() => setIsPageLoading(false));
    }, []);

    // ตรวจสอบ Router Params เพื่อแยกแยะระบบ
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        
        // 1. ตรวจสอบ MikroTik (ดึงค่าจาก URL ที่ Router ส่งมาให้โดยอัตโนมัติ)
        const linkLoginOnly = params.get('link-login-only');
        const dst = params.get('dst');
        const mac = params.get('mac');
        
        // 2. ตรวจสอบ FortiGate
        const magicValue = params.get('magic');

        if (linkLoginOnly || dst || mac) {
            // โหมด MikroTik Multi-Hotspot: 
            // ลำดับความสำคัญ: 1. link-login-only จาก URL (แม่นยำที่สุด) -> 2. hotspotUrl จาก DB -> 3. IP Default
            const actionUrl = linkLoginOnly || settings?.hotspotUrl || 'http://10.0.0.1/login'; 
            setMikrotikConfig({
                actionUrl: actionUrl,
                dst: dst || `${window.location.origin}/portal/dashboard`,
            });
        } else if (magicValue) {
            // โหมด FortiGate
            setFortigateMagic(magicValue);
        }

        const errorMsg = params.get('error');
        if (errorMsg) toast.error(`Router Error: ${errorMsg}`);

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
            // Step 1: ยืนยันตัวตนกับ Backend
            const response = await axiosInstance.post('/external-auth/login', formData);
            const { token, user, advertisement } = response.data.data;
            
            // Step 2: บันทึก Token
            login(token, user, advertisement);

            toast.success("Login Verified. Connecting to Network...");

            // Step 3: ส่งฟอร์มให้ Router (ส่งข้อมูลกลับไปยัง Gateway ที่ส่งมาในตอนแรก)
            setTimeout(() => {
                if (formRef.current) formRef.current.submit(); 
            }, 1500);

        } catch (error) {
            toast.error(t('toast.login_failed_title'), {
                description: error.response?.data?.message || t('toast.login_failed_desc'),
            });
            setIsLoading(false);
        }
    };
    
    if (isPageLoading) return <div className="flex items-center justify-center p-8">{t('loading')}</div>;

    // เลือก Action URL ตามระบบที่ตรวจพบ
    const currentFormAction = mikrotikConfig 
        ? mikrotikConfig.actionUrl 
        : "http://192.168.146.1:1000/fgtauth"; 

    return (
        <>
            <div className="text-center mb-6 px-6">
                <CardTitle className="text-2xl">
                    {settings?.externalLoginEnabled === 'true' ? t('external_login_page.user_login_title') : t('external_login_page.login_disabled_title')}
                </CardTitle>
                <CardDescription>
                    {settings?.externalLoginEnabled === 'true' ? t('external_login_page.description') : t('external_login_page.login_disabled_desc')}
                </CardDescription>
            </div>
            
            {settings?.externalLoginEnabled === 'true' && (
                <CardContent>
                    <form ref={formRef} action={currentFormAction} method="POST" className="space-y-4" onSubmit={handleSubmit}>
                        
                        {/* Hidden Fields สำหรับ MikroTik */}
                        {mikrotikConfig && (
                            <>
                                <input type="hidden" name="username" value={formData.username} />
                                <input type="hidden" name="password" value={formData.password} />
                                <input type="hidden" name="dst" value={mikrotikConfig.dst} />
                                <input type="hidden" name="popup" value="true" />
                            </>
                        )}

                        {/* Hidden Fields สำหรับ FortiGate */}
                        {fortigateMagic && (
                            <>
                                <input type="hidden" name="username" value={formData.username} />
                                <input type="hidden" name="password" value={formData.password} />
                                <input type="hidden" name="magic" value={fortigateMagic} />
                            </>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="username">{t('form_labels.username')}</Label>
                            <Input id="username" value={formData.username} onChange={handleInputChange} required autoFocus/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('form_labels.password')}</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required />
                        </div>
                        
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
                                <Label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                                    {t('external_login_page.agree_terms_checkbox')}
                                </Label>
                            </div>
                            <Dialog>
                                <div className="text-xs text-muted-foreground pl-6">
                                    {t('external_login_page.must_agree_prefix')}
                                    <DialogTrigger asChild><Button variant="link" className="p-1 h-auto text-xs">{t('external_login_page.terms_and_conditions')}</Button></DialogTrigger>
                                    {t('external_login_page.must_agree_suffix')}
                                </div>
                                <DialogContent className="sm:max-w-[625px]">
                                    <DialogHeader><DialogTitle>{t('terms_dialog.title')}</DialogTitle></DialogHeader>
                                    <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md text-sm text-muted-foreground whitespace-pre-wrap">{settings?.terms}</div>
                                    <DialogFooter><DialogClose asChild><Button type="button">{t('close')}</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Button type="submit" className="w-full !mt-6" disabled={isLoading || !agreed}>
                            {isLoading ? t('authenticating') : t('log_in')}
                        </Button>
                    </form>
                    
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <div className="w-full flex justify-center text-sm text-muted-foreground">
                            <Button variant="link" onClick={() => i18n.changeLanguage('th')} className={i18n.language === 'th' ? 'font-bold text-primary' : ''}>ภาษาไทย</Button>
                            <span className="mx-1">|</span>
                            <Button variant="link" onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? 'font-bold text-primary' : ''}>English</Button>
                        </div>
                    </CardFooter>
                </CardContent>
            )}
        </>
    );
}