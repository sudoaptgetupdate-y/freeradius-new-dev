// src/components/dialogs/AttributeFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { useTranslation } from "react-i18next"; // <-- Import

const OPERATORS = [":=", "=", "==", "+=", ">", ">=", "<", "<="];

export default function AttributeFormDialog({ isOpen, setIsOpen, profileName, attributeType, onSave }) {
    const { t } = useTranslation(); // <-- เรียกใช้
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        attribute: '',
        op: attributeType === 'reply' ? ':=' : ':=',
        value: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    
    const [attributeList, setAttributeList] = useState([]);
    const [isAttrListLoading, setIsAttrListLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchAttributes = async () => {
                setIsAttrListLoading(true);
                try {
                    const response = await axiosInstance.get('/attribute-definitions', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const filtered = response.data.data.filter(attr => attr.type === attributeType);
                    setAttributeList(filtered);
                } catch (error) {
                    toast.error(t('toast.attribute_list_load_failed'));
                } finally {
                    setIsAttrListLoading(false);
                }
            };
            fetchAttributes();
        }
    }, [isOpen, attributeType, token, t]);

    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        toast.promise(
            axiosInstance.post('/attributes', {
                profileName: profileName,
                type: attributeType,
                ...formData
            }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.adding_attribute'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t('toast.add_attribute_success');
                },
                error: (err) => err.response?.data?.message || t('toast.add_attribute_failed'),
                finally: () => setIsLoading(false),
            }
        );
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t(attributeType === 'reply' ? 'attribute_form_dialog.add_reply_title' : 'attribute_form_dialog.add_check_title', { name: profileName })}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="attribute">{t('form_labels.attribute')}</Label>
                        <Select value={formData.attribute} onValueChange={(value) => handleSelectChange('attribute', value)} required>
                            <SelectTrigger id="attribute" disabled={isAttrListLoading}>
                                <SelectValue placeholder={isAttrListLoading ? t('loading_attributes') : t('form_labels.select_attribute_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {attributeList.map(attr => (
                                    <SelectItem key={attr.id} value={attr.name}>
                                        {attr.name} <span className="text-muted-foreground ml-2">- {attr.description}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="op">{t('form_labels.operator')}</Label>
                        <Select value={formData.op} onValueChange={(value) => handleSelectChange('op', value)} required>
                            <SelectTrigger id="op"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {OPERATORS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="value">{t('form_labels.value')}</Label>
                        <Input id="value" value={formData.value} onChange={handleInputChange} placeholder={t('form_labels.value_placeholder')} required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('saving') : t('save_attribute')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}