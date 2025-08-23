// src/components/dialogs/ProfileFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { useTranslation } from "react-i18next"; // <-- Import

export default function ProfileFormDialog({ isOpen, setIsOpen, profile, onSave }) {
    const { t } = useTranslation(); // <-- เรียกใช้
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!profile;

    useEffect(() => {
        if (isOpen) {
            if (profile) {
                setFormData({ name: profile.name || '', description: profile.description || '' });
            } else {
                setFormData({ name: '', description: '' });
            }
        }
    }, [profile, isOpen]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/radius-profiles/${profile.id}` : '/radius-profiles';
        const method = isEditMode ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_profile'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t(isEditMode ? 'toast.update_profile_success' : 'toast.create_profile_success');
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
                    <DialogTitle>{isEditMode ? t('profile_form_dialog.edit_title') : t('profile_form_dialog.add_title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('form_labels.profile_name')}</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder={t('form_labels.profile_name_placeholder')} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{t('form_labels.description_optional')}</Label>
                        <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder={t('form_labels.description_placeholder')} />
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