// src/components/dialogs/OrganizationFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import useSWR from 'swr';
import { useTranslation } from "react-i18next";

export default function OrganizationFormDialog({ isOpen, setIsOpen, org, onSave }) {
    const { t } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        name: '',
        radiusProfileId: '',
        login_identifier_type: 'manual',
        advertisementId: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!org;

    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    const { data: profiles, error: profilesError } = useSWR(isOpen ? '/radius-profiles' : null, fetcher);
    const { data: advertisements, error: adsError } = useSWR(isOpen ? '/advertisements' : null, fetcher);

    const isProtectedOrg = isEditMode && (org.name === 'Register' || org.name === 'Voucher');

    useEffect(() => {
        if (isOpen) {
            if (org) {
                // --- Edit Mode (แก้ไขส่วนนี้) ---
                setFormData({
                    name: org.name || '',
                    radiusProfileId: org.radiusProfileId ? String(org.radiusProfileId) : '',
                    login_identifier_type: org.login_identifier_type || 'manual',
                    // --- START: EDIT ---
                    // แก้ไข: ถ้า org.advertisementId ไม่มีค่า ให้ใช้ null แทน string ว่าง
                    advertisementId: org.advertisementId ? String(org.advertisementId) : null,
                    // --- END: EDIT ---
                });
            } else {
                // --- Add New Mode ---
                const defaultProfile = profiles?.find(p => p.name === 'default-profile');
                setFormData({
                    name: '',
                    radiusProfileId: defaultProfile ? String(defaultProfile.id) : '',
                    login_identifier_type: 'manual',
                    advertisementId: null, 
                });
            }
        }
    }, [org, isOpen, profiles]);

    if (profilesError || adsError) {
        toast.error(t('toast.form_data_load_failed'));
        setIsOpen(false);
    }
    
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value === 'null' ? null : value }));
    };

    // --- START: EDIT ---
    // แก้ไข handleSubmit ให้จัดการข้อมูลก่อนส่ง
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // สร้าง payload ที่สะอาดก่อนส่งข้อมูล
        const payload = {
            ...formData,
            radiusProfileId: formData.radiusProfileId ? parseInt(formData.radiusProfileId, 10) : null,
            advertisementId: formData.advertisementId ? parseInt(String(formData.advertisementId), 10) : null,
        };

        // ตรวจสอบว่าถ้าแปลงค่าแล้วเป็น NaN ให้ส่งเป็น null แทน
        if (isNaN(payload.radiusProfileId)) {
            payload.radiusProfileId = null;
        }
        if (isNaN(payload.advertisementId)) {
            payload.advertisementId = null;
        }

        const url = org ? `/organizations/${org.id}` : '/organizations';
        const method = org ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, payload, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_org'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t(org ? 'toast.update_org_success' : 'toast.create_org_success');
                },
                error: (err) => err.response?.data?.message || t('toast.generic_error'),
                finally: () => setIsLoading(false)
            }
        );
    };
    // --- END: EDIT ---

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{org ? t('org_form_dialog.edit_title') : t('org_form_dialog.add_title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('form_labels.org_name')}</Label>
                        <Input 
                            id="name" 
                            value={formData.name} 
                            onChange={handleInputChange} 
                            placeholder={t('form_labels.org_name_placeholder')}
                            required 
                            disabled={isProtectedOrg}
                        />
                         {isProtectedOrg && (
                            <p className="text-xs text-muted-foreground pt-1">
                                {t('org_form_dialog.protected_org_name_note', { name: org.name })}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="radiusProfileId">{t('form_labels.radius_profile')}</Label>
                        <Select
                            value={formData.radiusProfileId || ""}
                            onValueChange={(value) => handleSelectChange('radiusProfileId', value)}
                            required
                        >
                            <SelectTrigger id="radiusProfileId" disabled={!profiles}>
                                <SelectValue placeholder={!profiles ? t('loading_profiles') : t('form_labels.select_profile_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles?.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="login_identifier_type">{t('form_labels.login_type')}</Label>
                         <Select
                            value={formData.login_identifier_type}
                            onValueChange={(value) => handleSelectChange('login_identifier_type', value)}
                            disabled={isProtectedOrg}
                        >
                            <SelectTrigger id="login_identifier_type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">{t('login_types.manual')}</SelectItem>
                                <SelectItem value="national_id">{t('login_types.national_id')}</SelectItem>
                                <SelectItem value="employee_id">{t('login_types.employee_id')}</SelectItem>
                                <SelectItem value="student_id">{t('login_types.student_id')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {isProtectedOrg && (
                            <p className="text-xs text-muted-foreground pt-1">
                                {t('org_form_dialog.protected_org_type_note', { name: org.name })}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="advertisementId">{t('form_labels.ad_campaign')}</Label>
                        <Select
                            value={formData.advertisementId === null ? 'null' : String(formData.advertisementId)}
                            onValueChange={(value) => handleSelectChange('advertisementId', value)}
                        >
                            <SelectTrigger id="advertisementId" disabled={!advertisements}>
                                <SelectValue placeholder={!advertisements ? t('loading_ads') : t('form_labels.select_ad_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">{t('form_labels.no_ad')}</SelectItem>
                                {advertisements?.map(ad => (
                                    <SelectItem key={ad.id} value={ad.id.toString()}>{ad.name} ({ad.type})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('saving') : t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}