// src/components/dialogs/UserFormDialog.jsx
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { useTranslation } from "react-i18next";
import OrganizationCombobox from "@/components/shared/OrganizationCombobox"; // <-- 1. Import component ที่สร้างใหม่

const RequiredLabel = ({ htmlFor, children }) => (
    <Label htmlFor={htmlFor}>
        {children} <span className="text-red-500">*</span>
    </Label>
);

const initialFormData = {
    organizationId: '',
    full_name: '',
    password: '',
    username: '',
    national_id: '',
    employee_id: '',
    student_id: '',
    email: '',
    phoneNumber: '',
};

export default function UserFormDialog({ isOpen, setIsOpen, user, onSave }) {
    const { t } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [isDataReady, setIsDataReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = !!user;

    const isFieldsDisabled = !isEditMode && !formData.organizationId;

    useEffect(() => {
        if (isOpen) {
            setIsDataReady(false);
            axiosInstance.get('/organizations', { 
                headers: { Authorization: `Bearer ${token}` },
                params: { pageSize: 10 }
            })
                .then(response => {
                    const fetchedOrgs = response.data.data.organizations;
                    setAllOrganizations(fetchedOrgs);

                    if (user) {
                        setFormData({
                            ...initialFormData,
                            organizationId: user.organizationId || '',
                            full_name: user.full_name || '',
                            username: user.username || '',
                            national_id: user.national_id || '',
                            employee_id: user.employee_id || '',
                            student_id: user.student_id || '',
                            email: user.email || '',
                            phoneNumber: user.phoneNumber || '',
                            password: '',
                        });
                    } else {
                        setFormData(initialFormData);
                    }
                    setIsDataReady(true);
                })
                .catch(error => {
                    toast.error(t('toast.org_load_failed'));
                    setIsOpen(false);
                });
        }
    }, [isOpen, user, token, setIsOpen, t]);

    const compatibleOrgs = useMemo(() => {
        if (!isDataReady) return [];
        if (!isEditMode) return allOrganizations;
        
        if (isEditMode && user) {
            const currentUserOrg = allOrganizations.find(
                o => String(o.id) === String(user.organizationId)
            );

            if (currentUserOrg) {
                return allOrganizations.filter(
                    o => o.login_identifier_type === currentUserOrg.login_identifier_type
                );
            }
        }
        return [];
    }, [isDataReady, isEditMode, allOrganizations, user]);

    const loginIdentifierType = useMemo(() => {
        if (formData.organizationId && allOrganizations.length > 0) {
            const org = allOrganizations.find(o => String(o.id) === String(formData.organizationId));
            return org ? org.login_identifier_type : 'manual';
        }
        return 'manual';
    }, [formData.organizationId, allOrganizations]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleOrgChange = (value) => {
        setFormData(prev => ({ ...initialFormData, organizationId: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const url = isEditMode ? `/users/${user.username}` : '/users';
        const method = isEditMode ? 'put' : 'post';
        
        let payload = { ...formData };
        if (isEditMode && !payload.password) delete payload.password;
        if (payload.organizationId) payload.organizationId = parseInt(payload.organizationId, 10);

        try {
            await axiosInstance[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(t(isEditMode ? 'toast.user_update_success' : 'toast.user_create_success'));
            onSave();
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || t('toast.generic_error'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? t('user_form_dialog.edit_title') : t('user_form_dialog.add_title')}</DialogTitle>
                </DialogHeader>
                {!isDataReady ? (
                    <div className="py-12 flex justify-center items-center"><span>{t('loading_form_data')}</span></div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="organizationId">{t('form_labels.organization')}</RequiredLabel>
                            {/* 2. ใช้งาน Component ที่ import มา */}
                            <OrganizationCombobox
                                selectedValue={formData.organizationId}
                                onSelect={handleOrgChange}
                                compatibleOrgs={compatibleOrgs}
                                placeholder={t('form_labels.select_org_placeholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="full_name">{t('form_labels.full_name')}</RequiredLabel>
                            <Input id="full_name" value={formData.full_name} onChange={handleInputChange} placeholder={t('form_labels.full_name_placeholder')} required disabled={isFieldsDisabled} />
                        </div>

                        {loginIdentifierType === 'manual' && (
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="username">{t('form_labels.username')}</RequiredLabel>
                                <Input id="username" value={formData.username} onChange={handleInputChange} placeholder={t('form_labels.username_placeholder')} required disabled={isEditMode || isFieldsDisabled} />
                            </div>
                        )}
                        {loginIdentifierType === 'employee_id' && (
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="employee_id">{t('form_labels.employee_id')}</RequiredLabel>
                                <Input id="employee_id" value={formData.employee_id} onChange={handleInputChange} placeholder={t('form_labels.employee_id_placeholder')} required disabled={isEditMode || isFieldsDisabled} />
                            </div>
                        )}
                        {loginIdentifierType === 'student_id' && (
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="student_id">{t('form_labels.student_id')}</RequiredLabel>
                                <Input id="student_id" value={formData.student_id} onChange={handleInputChange} placeholder={t('form_labels.student_id_placeholder')} required disabled={isEditMode || isFieldsDisabled} />
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            {loginIdentifierType === 'national_id' ? (
                                <RequiredLabel htmlFor="national_id">{t('form_labels.national_id')}</RequiredLabel>
                            ) : (
                                <Label htmlFor="national_id">{t('form_labels.national_id_optional')}</Label>
                            )}
                            <Input id="national_id" value={formData.national_id} onChange={handleInputChange} placeholder={t('form_labels.national_id_placeholder')} required={loginIdentifierType === 'national_id'} disabled={isEditMode || isFieldsDisabled}/>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('form_labels.email')}</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t('form_labels.email_placeholder')} disabled={isFieldsDisabled} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phoneNumber">{t('form_labels.phone_number')}</Label>
                                <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder={t('form_labels.phone_number_placeholder')} disabled={isFieldsDisabled} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="password">{t('form_labels.password')}</RequiredLabel>
                            <Input id="password" type="password" onChange={handleInputChange} placeholder={isEditMode ? t('form_labels.password_edit_placeholder') : t('form_labels.password_add_placeholder')} required={!isEditMode} disabled={isFieldsDisabled} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                            <Button type="submit" disabled={isSaving || isFieldsDisabled}>{isSaving ? t('saving') : t('save')}</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}