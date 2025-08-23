// src/components/dialogs/AdminFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from "react-i18next";

const PasswordRequirement = ({ met, text }) => (
    <div className={cn("flex items-center text-sm", met ? "text-emerald-600" : "text-muted-foreground")}>
        {met ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2 text-red-500" />}
        <span>{text}</span>
    </div>
);

const PasswordValidation = ({ checks, t }) => (
    <div className="space-y-1 p-3 bg-muted/50 rounded-md mt-2">
        <PasswordRequirement met={checks.length} text={t('password_reqs.length')} />
        <PasswordRequirement met={checks.lowercase} text={t('password_reqs.lowercase')} />
        <PasswordRequirement met={checks.uppercase} text={t('password_reqs.uppercase')} />
        <PasswordRequirement met={checks.number} text={t('password_reqs.number')} />
        <PasswordRequirement met={checks.special} text={t('password_reqs.special')} />
    </div>
);

export default function AdminFormDialog({ isOpen, setIsOpen, admin, onSave }) {
    const { t } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phoneNumber: '',
        role: 'admin',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!admin;

    const [passwordValidation, setPasswordValidation] = useState({
        length: false, lowercase: false, uppercase: false, number: false, special: false,
    });
    const [showValidation, setShowValidation] = useState(false);

    useEffect(() => {
        if (admin) {
            setFormData({
                fullName: admin.fullName || '',
                username: admin.username || '',
                email: admin.email || '',
                phoneNumber: admin.phoneNumber || '',
                role: admin.role || 'admin',
                password: '',
            });
        } else {
            setFormData({
                fullName: '', username: '', email: '', phoneNumber: '', role: 'admin', password: ''
            });
        }
        setShowValidation(false);
        setPasswordValidation({ length: false, lowercase: false, uppercase: false, number: false, special: false });
    }, [admin, isOpen]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });

        if (id === 'password') {
            const isPasswordEntered = value.length > 0;
            setShowValidation(isPasswordEntered);

            if (isPasswordEntered) {
                const checks = {
                    length: value.length >= 8,
                    lowercase: /[a-z]/.test(value),
                    uppercase: /[A-Z]/.test(value),
                    number: /[0-9]/.test(value),
                    special: /[!@#$%^&*]/.test(value),
                };
                setPasswordValidation(checks);
            }
        }
    };

    const handleRoleChange = (value) => {
        setFormData({ ...formData, role: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password) {
            if (Object.values(passwordValidation).some(met => !met)) {
                toast.error(t('toast.password_req_not_met'));
                return;
            }
        }
        
        setIsLoading(true);
        const url = isEditMode ? `/admins/${admin.id}` : '/admins';
        const method = isEditMode ? 'put' : 'post';
        
        let payload = { ...formData };
        if (isEditMode && !payload.password) {
            delete payload.password;
        }

        toast.promise(
            axiosInstance[method](url, payload, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_admin'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t(isEditMode ? 'toast.update_admin_success' : 'toast.create_admin_success');
                },
                error: (err) => err.response?.data?.message || t('toast.generic_error'),
                finally: () => setIsLoading(false),
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? t('admin_form_dialog.edit_title') : t('admin_form_dialog.add_title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">{t('form_labels.full_name')}</Label>
                        <Input id="fullName" value={formData.fullName} onChange={handleInputChange} placeholder={t('form_labels.full_name_placeholder_admin')} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">{t('form_labels.username')}</Label>
                            <Input id="username" value={formData.username} onChange={handleInputChange} placeholder={t('form_labels.username_placeholder_admin')} required disabled={isEditMode} />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="password">{t('form_labels.password')}</Label>
                            <Input id="password" type="password" onChange={handleInputChange} placeholder={isEditMode ? t('form_labels.password_edit_placeholder') : t('form_labels.password_add_placeholder_admin')} required={!isEditMode} />
                        </div>
                    </div>

                    {showValidation && (
                        <PasswordValidation checks={passwordValidation} t={t} />
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">{t('form_labels.email')}</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t('form_labels.email_placeholder')} required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">{t('form_labels.phone_number')}</Label>
                            <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder={t('form_labels.phone_number_placeholder')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">{t('form_labels.role')}</Label>
                            <Select value={formData.role} onValueChange={handleRoleChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                                    <SelectItem value="superadmin">{t('roles.superadmin')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? t('saving') : t('save')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}