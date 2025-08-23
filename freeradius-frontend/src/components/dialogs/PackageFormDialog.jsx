// src/components/dialogs/PackageFormDialog.jsx
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
import { useTranslation } from "react-i18next"; // <-- Import

export default function PackageFormDialog({ isOpen, setIsOpen, pkg, onSave }) {
    const { t } = useTranslation(); // <-- เรียกใช้
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        name: '',
        durationDays: 1,
        price: 0,
        radiusProfileId: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!pkg;

    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    const { data: profiles, error: profilesError } = useSWR('/radius-profiles', fetcher);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setFormData({
                    name: pkg.name || '',
                    durationDays: pkg.durationDays || 1,
                    price: pkg.price || 0,
                    radiusProfileId: pkg.radiusProfileId ? String(pkg.radiusProfileId) : '',
                });
            } else {
                setFormData({ name: '', durationDays: 1, price: 0, radiusProfileId: '' });
            }
        }
    }, [pkg, isEditMode, isOpen]);

    const handleInputChange = (e) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseInt(value) || 0 : value }));
    };
    
    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, radiusProfileId: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/vouchers/packages/${pkg.id}` : '/vouchers/packages';
        const method = isEditMode ? 'put' : 'post';
        
        const payload = {
            ...formData,
            radiusProfileId: parseInt(formData.radiusProfileId),
        };

        toast.promise(axiosInstance[method](url, payload, { headers: { Authorization: `Bearer ${token}` } }), {
            loading: t('toast.saving_package'),
            success: () => {
                onSave();
                setIsOpen(false);
                return t(isEditMode ? 'toast.package_update_success' : 'toast.package_create_success');
            },
            error: (err) => err.response?.data?.message || t('toast.generic_error'),
            finally: () => setIsLoading(false)
        });
    };

    if (profilesError) {
        toast.error(t('toast.profile_load_failed'));
        setIsOpen(false);
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? t('package_form_dialog.edit_title') : t('package_form_dialog.add_title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('form_labels.package_name')}</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder={t('form_labels.package_name_placeholder')} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="durationDays">{t('form_labels.duration_days')}</Label>
                            <Input id="durationDays" type="number" value={formData.durationDays} onChange={handleInputChange} required min="1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">{t('form_labels.price')}</Label>
                            <Input id="price" type="number" value={formData.price} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="radiusProfileId">{t('form_labels.radius_profile')}</Label>
                        <Select value={formData.radiusProfileId} onValueChange={handleSelectChange} required>
                            <SelectTrigger id="radiusProfileId" disabled={!profiles}>
                                <SelectValue placeholder={!profiles ? t('loading_profiles') : t('form_labels.select_profile_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles?.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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