// src/components/dialogs/AttributeDefinitionFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { useTranslation } from "react-i18next"; // <-- Import

export default function AttributeDefinitionFormDialog({ isOpen, setIsOpen, attribute, onSave }) {
    const { t } = useTranslation(); // <-- เรียกใช้
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({ name: '', description: '', type: 'reply' });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!attribute;

    useEffect(() => {
        if (attribute) {
            setFormData({
                name: attribute.name || '',
                description: attribute.description || '',
                type: attribute.type || 'reply',
            });
        } else {
            setFormData({ name: '', description: '', type: 'reply' });
        }
    }, [attribute]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleTypeChange = (value) => {
        setFormData({ ...formData, type: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/attribute-definitions/${attribute.id}` : '/attribute-definitions';
        const method = isEditMode ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_attribute_def'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t(isEditMode ? 'toast.update_attribute_def_success' : 'toast.create_attribute_def_success');
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
                    <DialogTitle>{isEditMode ? t('attribute_def_form_dialog.edit_title') : t('attribute_def_form_dialog.add_title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('form_labels.attribute_name')}</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder={t('form_labels.attribute_name_placeholder')} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">{t('form_labels.attribute_type')}</Label>
                        <Select value={formData.type} onValueChange={handleTypeChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="reply">{t('reply')}</SelectItem>
                                <SelectItem value="check">{t('check')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{t('form_labels.description')}</Label>
                        <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder={t('form_labels.attribute_description_placeholder')} />
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