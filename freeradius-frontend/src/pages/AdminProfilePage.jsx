// src/pages/AdminProfilePage.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next'; // <-- 1. Import hook

const PasswordRequirement = ({ met, text }) => (
    <div className={cn("flex items-center text-sm", met ? "text-emerald-600" : "text-muted-foreground")}>
        {met ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2 text-red-500" />}
        <span>{text}</span>
    </div>
);

const PasswordValidation = ({ checks, t }) => (
    <div className="space-y-1 p-3 bg-muted/50 rounded-md">
        <PasswordRequirement met={checks.length} text={t('password_reqs.length')} />
        <PasswordRequirement met={checks.lowercase} text={t('password_reqs.lowercase')} />
        <PasswordRequirement met={checks.uppercase} text={t('password_reqs.uppercase')} />
        <PasswordRequirement met={checks.number} text={t('password_reqs.number')} />
        <PasswordRequirement met={checks.special} text={t('password_reqs.special')} />
    </div>
);

export default function AdminProfilePage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
    const { user, token, login } = useAuthStore();
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const [passwordValidation, setPasswordValidation] = useState({
        length: false, lowercase: false, uppercase: false, number: false, special: false,
    });
    const [showValidation, setShowValidation] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));

        if (id === 'password') {
            setShowValidation(value.length > 0);
            const checks = {
                length: value.length >= 8,
                lowercase: /[a-z]/.test(value),
                uppercase: /[A-Z]/.test(value),
                number: /[0-9]/.test(value),
                special: /[!@#$%^&*]/.test(value),
            };
            setPasswordValidation(checks);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password) {
            if (Object.values(passwordValidation).some(met => !met)) {
                toast.error(t('toast.password_req_not_met'));
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error(t('toast.passwords_do_not_match'));
                return;
            }
        }

        setIsLoading(true);
        const payload = {
            fullName: formData.fullName,
            email: formData.email,
        };
        if (formData.password) {
            payload.password = formData.password;
        }

        toast.promise(
            axiosInstance.put(`/admins/${user.id}`, payload, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.updating_profile'),
                success: (response) => {
                    const { password, ...updatedUser } = response.data.data;
                    login(token, updatedUser);
                    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                    setShowValidation(false);
                    return t('toast.update_profile_success');
                },
                error: (err) => err.response?.data?.message || t('toast.update_profile_failed'),
                finally: () => setIsLoading(false)
            }
        );
    };

    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{t('admin_profile_page.title')}</CardTitle>
                <CardDescription>{t('admin_profile_page.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">{t('form_labels.full_name')}</Label>
                        <Input id="fullName" value={formData.fullName} onChange={handleInputChange} placeholder={t('form_labels.full_name_placeholder_admin')} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('form_labels.email')}</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t('form_labels.email_placeholder')} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('form_labels.new_password')}</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder={t('form_labels.new_password_placeholder')} />
                    </div>
                    
                    {showValidation && (
                        <PasswordValidation checks={passwordValidation} t={t} />
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t('form_labels.confirm_new_password')}</Label>
                        <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder={t('form_labels.confirm_new_password_placeholder')} />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('saving') : t('save_changes')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}