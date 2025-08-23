// src/components/dialogs/NasFormDialog.jsx
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

const initialFormData = {
    nasname: '',
    shortname: '',
    secret: '',
    description: '',
};

export default function NasFormDialog({ isOpen, setIsOpen, nas, onSave }) {
    const { t } = useTranslation(); // <-- เรียกใช้
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!nas;

    useEffect(() => {
        if (isOpen) {
            if (nas) {
                setFormData({
                    nasname: nas.nasname || '',
                    shortname: nas.shortname || '',
                    secret: '', 
                    description: nas.description || '',
                });
            } else {
                setFormData(initialFormData);
            }
        }
    }, [nas, isOpen]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        const url = isEditMode ? `/nas/${nas.id}` : '/nas';
        const method = isEditMode ? 'put' : 'post';
        
        let payload = { ...formData };
        if (isEditMode && !payload.secret) {
            delete payload.secret;
        }

        toast.promise(
            axiosInstance[method](url, payload, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_nas'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t(isEditMode ? 'toast.update_nas_success' : 'toast.create_nas_success');
                },
                error: (err) => err.response?.data?.message || t('toast.generic_error'),
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? t('nas_form_dialog.edit_title') : t('nas_form_dialog.add_title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nasname">{t('form_labels.nas_name')}</Label>
                        <Input id="nasname" value={formData.nasname} onChange={handleInputChange} placeholder={t('form_labels.nas_name_placeholder')} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="shortname">{t('form_labels.short_name')}</Label>
                        <Input id="shortname" value={formData.shortname} onChange={handleInputChange} placeholder={t('form_labels.short_name_placeholder')} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="secret">{t('form_labels.secret')}</Label>
                        <Input id="secret" type="password" onChange={handleInputChange} placeholder={isEditMode ? t('form_labels.secret_edit_placeholder') : t('form_labels.secret_add_placeholder')} required={!isEditMode} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{t('form_labels.description_optional')}</Label>
                        <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder={t('form_labels.nas_description_placeholder')} />
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