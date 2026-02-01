// src/components/dialogs/IpBindingFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { useTranslation } from "react-i18next"; // นำเข้า hook สำหรับจัดการภาษา

const initialFormData = {
    'mac-address': '',
    address: '',
    'to-address': '',
    server: 'all',
    type: 'regular',
    comment: ''
};

export default function IpBindingFormDialog({ isOpen, setIsOpen, binding, onSave, initialData }) {
    const { t } = useTranslation(); // เรียกใช้งานฟังก์ชัน t สำหรับแปลภาษา
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!binding;

    useEffect(() => {
        if (binding) {
            setFormData({
                'mac-address': binding['mac-address'] || '',
                address: binding.address || '',
                'to-address': binding['to-address'] || '',
                server: binding.server || 'all',
                type: binding.type || 'regular',
                comment: binding.comment || ''
            });
        } else if (initialData) {
            setFormData({ ...initialFormData, ...initialData });
        } else {
            setFormData(initialFormData);
        }
    }, [binding, initialData, isOpen]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (id, value) => {
        setFormData({ ...formData, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/mikrotik/bindings/${encodeURIComponent(binding['.id'])}` : '/mikrotik/bindings';
        const method = isEditMode ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('ip_binding_form.toast_saving'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t('ip_binding_form.toast_save_success', { mac: formData['mac-address'] });
                },
                error: (err) => err.response?.data?.message || t('ip_binding_form.toast_save_error'),
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? t('ip_binding_form.edit_title') : t('ip_binding_form.add_title')}
                    </DialogTitle>
                </DialogHeader>
                <form id="ip-binding-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="mac-address">{t('ip_binding_form.mac_label')}</Label>
                        <Input id="mac-address" value={formData['mac-address']} onChange={handleInputChange} placeholder="e.g., 00:11:22:33:44:55" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">{t('ip_binding_form.address_label')}</Label>
                        <Input id="address" value={formData.address} onChange={handleInputChange} placeholder="e.g., 10.70.0.10" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to-address">{t('ip_binding_form.to_address_label')}</Label>
                        <Input id="to-address" value={formData['to-address']} onChange={handleInputChange} placeholder="e.g., 10.70.0.10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="server">{t('ip_binding_form.server_label')}</Label>
                            <Select onValueChange={(v) => handleSelectChange('server', v)} value={formData.server}>
                                <SelectTrigger id="server"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('ip_binding_form.all_servers')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">{t('ip_binding_form.type_label')}</Label>
                            <Select onValueChange={(v) => handleSelectChange('type', v)} value={formData.type}>
                                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="regular">{t('ip_binding_form.regular')}</SelectItem>
                                    <SelectItem value="bypassed">{t('ip_binding_form.bypassed')}</SelectItem>
                                    <SelectItem value="blocked">{t('ip_binding_form.blocked')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="comment">{t('ip_binding_form.comment_label')}</Label>
                        <Input id="comment" value={formData.comment} onChange={handleInputChange} />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="ip-binding-form" disabled={isLoading}>
                        {isLoading ? t('saving') : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}