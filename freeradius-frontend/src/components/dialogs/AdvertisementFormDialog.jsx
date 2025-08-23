// src/components/dialogs/AdvertisementFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { useTranslation } from "react-i18next"; // <-- Import

export default function AdvertisementFormDialog({ isOpen, setIsOpen, ad, onSave }) {
    const { t } = useTranslation(); // <-- เรียกใช้
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        name: '', type: 'A', imageUrl: '', headerText: '', bodyText: '',
        buttonText: 'Continue to Internet', countdown: 5, status: 'active',
    });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!ad;

    useEffect(() => {
        if (ad) {
            setFormData({
                name: ad.name || '', type: ad.type || 'A', imageUrl: ad.imageUrl || '',
                headerText: ad.headerText || '', bodyText: ad.bodyText || '',
                buttonText: ad.buttonText || 'Continue to Internet',
                countdown: ad.countdown === null ? 0 : ad.countdown, status: ad.status || 'active',
            });
        } else {
            setFormData({
                name: '', type: 'A', imageUrl: '', headerText: '', bodyText: '',
                buttonText: 'Continue to Internet', countdown: 5, status: 'active',
            });
        }
    }, [ad, isOpen]);

    const handleInputChange = (e) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? (value === '' ? null : parseInt(value)) : value }));
    };
    
    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (id, checked) => {
        setFormData(prev => ({ ...prev, [id]: checked ? 'active' : 'inactive' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/advertisements/${ad.id}` : '/advertisements';
        const method = isEditMode ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_ad'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t(isEditMode ? 'toast.update_ad_success' : 'toast.create_ad_success');
                },
                error: (err) => err.response?.data?.message || t('toast.generic_error'),
                finally: () => setIsLoading(false),
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? t('ad_form_dialog.edit_title') : t('ad_form_dialog.add_title')}</DialogTitle>
                </DialogHeader>
                <form id="ad-form" onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-6">
                    <div className="space-y-2"><Label htmlFor="name">{t('form_labels.campaign_name')}</Label><Input id="name" value={formData.name} onChange={handleInputChange} placeholder={t('form_labels.campaign_name_placeholder')} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="type">{t('form_labels.template_type')}</Label><Select value={formData.type} onValueChange={(val) => handleSelectChange('type', val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">{t('ad_templates.hero')}</SelectItem><SelectItem value="B">{t('ad_templates.split')}</SelectItem><SelectItem value="C">{t('ad_templates.image_focused')}</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="status">{t('form_labels.status')}</Label><div className="flex items-center space-x-2 pt-2"><Switch id="status" checked={formData.status === 'active'} onCheckedChange={(checked) => handleSwitchChange('status', checked)} /><Label htmlFor="status">{formData.status === 'active' ? t('status.active') : t('status.inactive')}</Label></div></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="imageUrl">{t('form_labels.image_url')}</Label><Input id="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder={t('form_labels.image_url_placeholder')} /></div>
                    <div className="space-y-2"><Label htmlFor="headerText">{t('form_labels.header_text')}</Label><Input id="headerText" value={formData.headerText} onChange={handleInputChange} placeholder={t('form_labels.header_text_placeholder')} /></div>
                    <div className="space-y-2"><Label htmlFor="bodyText">{t('form_labels.body_text')}</Label><Textarea id="bodyText" value={formData.bodyText} onChange={handleInputChange} placeholder={t('form_labels.body_text_placeholder')} /></div>
                    <div className="space-y-2"><Label htmlFor="buttonText">{t('form_labels.button_text')}</Label><Input id="buttonText" value={formData.buttonText} onChange={handleInputChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="countdown">{t('form_labels.countdown')}</Label><Input id="countdown" type="number" value={formData.countdown ?? ''} onChange={handleInputChange} placeholder={t('form_labels.countdown_placeholder')} /></div>
                </form>
                <DialogFooter className="mt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                    <Button type="submit" form="ad-form" disabled={isLoading}>{isLoading ? t('saving') : t('save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}