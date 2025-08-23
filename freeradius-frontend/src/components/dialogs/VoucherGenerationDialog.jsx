// src/components/dialogs/VoucherGenerationDialog.jsx
import { useState } from 'react';
import useSWR from 'swr';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- Import

export default function VoucherGenerationDialog({ isOpen, setIsOpen, onGenerationSuccess }) {
    const { t } = useTranslation(); // <-- เรียกใช้
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    const { data: packages, error: packagesError } = useSWR('/vouchers/packages', fetcher);

    const [formData, setFormData] = useState({
        quantity: 10,
        packageId: '',
        usernamePrefix: 'nt',
        passwordType: 'alnum',
        usernameLength: 2,
        passwordLength: 4,
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleSelectChange = (id, value) => {
        setFormData({ ...formData, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        toast.promise(axiosInstance.post('/vouchers/generate', formData, { headers: { Authorization: `Bearer ${token}` } }), {
            loading: t('toast.generating_vouchers'),
            success: (response) => {
                const batchId = response.data.data.id;
                onGenerationSuccess();
                setIsOpen(false);
                navigate(`/vouchers/batches/${batchId}`);
                return t('toast.generate_vouchers_success');
            },
            error: (err) => err.response?.data?.message || t('toast.generate_vouchers_failed'),
            finally: () => setIsLoading(false),
        });
    };
    
    if (packagesError) {
        toast.error(t('toast.package_load_failed'));
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('generate_voucher_dialog.title')}</DialogTitle>
                    <DialogDescription>{t('generate_voucher_dialog.description')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="quantity">{t('form_labels.quantity')}</Label>
                                <Input id="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required min="1" max="1000"/>
                            </div>
                            <div>
                                <Label htmlFor="packageId">{t('form_labels.package')}</Label>
                                <Select onValueChange={(val) => handleSelectChange('packageId', val)} required>
                                    <SelectTrigger disabled={!packages}><SelectValue placeholder={t('form_labels.select_package_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        {packages?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="usernamePrefix">{t('form_labels.username_prefix')}</Label>
                                <Input id="usernamePrefix" value={formData.usernamePrefix} onChange={handleInputChange} />
                            </div>
                            <div>
                                <Label htmlFor="usernameLength">{t('form_labels.username_length')}</Label>
                                <Input id="usernameLength" type="number" value={formData.usernameLength} onChange={handleInputChange} required min="2" max="16"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="passwordType">{t('form_labels.password_type')}</Label>
                                <Select onValueChange={(val) => handleSelectChange('passwordType', val)} defaultValue="alnum">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="alnum">{t('form_labels.alnum')}</SelectItem>
                                        <SelectItem value="numeric">{t('form_labels.numeric')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="passwordLength">{t('form_labels.password_length')}</Label>
                                <Input id="passwordLength" type="number" value={formData.passwordLength} onChange={handleInputChange} required min="2" max="16"/>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? t('generating') : t('generate_and_preview')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}