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
import { useTranslation } from 'react-i18next';

export default function ExternalLoginPage() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const { login } = useUserAuthStore();
    const formRef = useRef(null);

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // Dynamic Config: ไม่ Hardcode IP อีกต่อไป
    const [routerConfig, setRouterConfig] = useState({
        actionUrl: '', // จะถูกเติมจาก URL Parameter
        dst: '',
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const linkLoginOnly = params.get('link-login-only');
        const dst = params.get('dst');

        if (linkLoginOnly) {
            setRouterConfig({
                actionUrl: linkLoginOnly,
                dst: dst || `${window.location.origin}/portal/dashboard`,
            });
            setIsPageLoading(false);
        } else {
            // กรณีไม่มีพารามิเตอร์ส่งมา (เช่น เข้าหน้าเว็บตรงๆ)
            toast.error("กรุณาเชื่อมต่อ WiFi ก่อนทำรายการ");
            setIsPageLoading(false);
        }
    }, [location.search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agreed) {
            toast.error(t('toast.must_agree_terms'));
            return;
        }
        setIsLoading(true);

        try {
            // Step 1: ตรวจสอบบัญชีกับ Backend (FreeRADIUS)
            const response = await axiosInstance.post('/external-auth/login', formData);
            const { token, user, advertisement } = response.data.data;
            
            // Step 2: บันทึก Session ลง Store
            login(token, user, advertisement);

            toast.success("ตรวจสอบสำเร็จ กำลังเชื่อมต่ออินเทอร์เน็ต...");

            // Step 3: ส่งฟอร์มไปยัง Gateway IP ของ Hotspot นั้นๆ (หน่วงเวลา 1.5 วินาที)
            setTimeout(() => {
                if (formRef.current && routerConfig.actionUrl) {
                    formRef.current.submit();
                }
            }, 1500);

        } catch (error) {
            toast.error(t('toast.login_failed_title'), {
                description: error.response?.data?.message || t('toast.login_failed_desc'),
            });
            setIsLoading(false);
        }
    };

    if (isPageLoading) return <div className="p-8 text-center">{t('loading')}</div>;

    return (
        <div className="max-w-md mx-auto">
            <div className="text-center mb-6 px-6">
                <CardTitle className="text-2xl">{t('external_login_page.user_login_title')}</CardTitle>
                <CardDescription>{t('external_login_page.description')}</CardDescription>
            </div>
            
            <CardContent>
                <form ref={formRef} action={routerConfig.actionUrl} method="POST" className="space-y-4" onSubmit={handleSubmit}>
                    {/* Hidden Fields: สำคัญมากสำหรับการยืนยันตัวตนกับ MikroTik */}
                    <input type="hidden" name="username" value={formData.username} />
                    <input type="hidden" name="password" value={formData.password} />
                    <input type="hidden" name="dst" value={routerConfig.dst} />
                    
                    <div className="space-y-2">
                        <Label htmlFor="username">{t('form_labels.username')}</Label>
                        <Input id="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required autoFocus/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('form_labels.password')}</Label>
                        <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
                        <Label htmlFor="terms" className="text-sm cursor-pointer">{t('external_login_page.agree_terms_checkbox')}</Label>
                    </div>

                    <Button type="submit" className="w-full mt-4" disabled={isLoading || !agreed || !routerConfig.actionUrl}>
                        {isLoading ? t('authenticating') : t('log_in')}
                    </Button>
                </form>
            </CardContent>
        </div>
    );
}