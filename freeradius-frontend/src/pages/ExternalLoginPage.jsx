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
    
    // ดึงฟังก์ชัน login จาก User Auth Store
    const { login } = useUserAuthStore(); 
    const formRef = useRef(null);

    // --- State ---
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // ตั้งค่าเริ่มต้นสำหรับ MikroTik Gateway
    const [mikrotikConfig, setMikrotikConfig] = useState({
        actionUrl: 'http://10.70.0.1/login', // กำหนด Gateway เป็น 10.70.0.1
        dst: `${window.location.origin}/portal/dashboard`, // ปลายทางหลัง Login สำเร็จ
    });

    // โหลดการตั้งค่าจากระบบ
    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => {
              const data = response.data.data;
              setSettings(data);
              // ถ้ามีการตั้งค่า Hotspot URL ในระบบ ให้ใช้ค่านั้นแทน
              if (data.hotspotUrl) {
                  setMikrotikConfig(prev => ({ ...prev, actionUrl: data.hotspotUrl }));
              }
          })
          .catch(() => setSettings({ externalLoginEnabled: 'true', terms: '' }))
          .finally(() => setIsPageLoading(false));
    }, []);

    // ตรวจสอบ Parameter ที่ MikroTik ส่งมาให้
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const linkLoginOnly = params.get('link-login-only');
        const dst = params.get('dst');
        const errorMsg = params.get('error');

        if (linkLoginOnly || dst) {
            setMikrotikConfig(prev => ({
                actionUrl: linkLoginOnly || prev.actionUrl,
                dst: dst || prev.dst,
            }));
        }

        if (errorMsg) {
            toast.error(`Router Error: ${errorMsg}`);
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
            // Step 1: ตรวจสอบ Username/Password กับ Backend
            const response = await axiosInstance.post('/external-auth/login', formData);
            const { token, user, advertisement } = response.data.data;
            
            // Step 2: บันทึกข้อมูลการเข้าสู่ระบบลง Store
            login(token, user, advertisement);

            toast.success("Login Verified. Connecting to Hotspot...");

            // Step 3: ส่งฟอร์มไปยัง MikroTik เพื่อเปิดสัญญาณอินเทอร์เน็ต
            // ใช้ความหน่วงเวลา 1.5 วินาที เพื่อให้ Browser จัดเก็บข้อมูล Session สำเร็จก่อนเปลี่ยนหน้า
            setTimeout(() => {
                if (formRef.current) {
                    formRef.current.submit(); 
                }
            }, 1500);

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
                    <form
                        ref={formRef}
                        action={mikrotikConfig.actionUrl}
                        method="POST"
                        className="space-y-4"
                        onSubmit={handleSubmit}
                    >
                        {/* ข้อมูลที่ MikroTik ต้องการเพื่อเริ่มใช้งาน Hotspot */}
                        <input type="hidden" name="username" value={formData.username} />
                        <input type="hidden" name="password" value={formData.password} />
                        <input type="hidden" name="dst" value={mikrotikConfig.dst} />
                        <input type="hidden" name="popup" value="true" />
                        
                        <div className="space-y-2">
                            <Label htmlFor="username">{t('form_labels.username')}</Label>
                            <Input id="username" value={formData.username} onChange={handleInputChange} placeholder={t('form_labels.username_placeholder')} required autoFocus/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('form_labels.password')}</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder={t('form_labels.password_placeholder')} required />
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
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="p-1 h-auto text-xs">{t('external_login_page.terms_and_conditions')}</Button>
                                    </DialogTrigger>
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