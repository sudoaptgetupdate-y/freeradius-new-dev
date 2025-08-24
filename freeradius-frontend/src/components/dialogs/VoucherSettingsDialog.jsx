// src/components/dialogs/VoucherSettingsDialog.jsx
import { useState, useEffect, useCallback } from 'react'; // <-- 1. เพิ่ม useCallback
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { useTranslation } from 'react-i18next';

export default function VoucherSettingsDialog({ isOpen, setIsOpen }) {
    const { t } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const [settings, setSettings] = useState({
        voucherSsid: 'Free-WiFi',
        voucherHeaderText: 'WiFi Voucher',
        voucherFooterText: 'Enjoy your connection!'
    });
    const [isLoading, setIsLoading] = useState(false);
    
    const [voucherLogo, setVoucherLogo] = useState(null);
    const [voucherLogoPreview, setVoucherLogoPreview] = useState('');

    // --- START: 2. สร้างฟังก์ชันสำหรับโหลดข้อมูล ---
    const fetchSettings = useCallback(() => {
        setIsLoading(true);
        axiosInstance.get('/settings', { headers: { Authorization: `Bearer ${token}` }})
          .then(response => {
              const fetchedSettings = response.data.data;
              setSettings({
                  voucherSsid: fetchedSettings.voucherSsid || settings.voucherSsid,
                  voucherHeaderText: fetchedSettings.voucherHeaderText || settings.voucherHeaderText,
                  voucherFooterText: fetchedSettings.voucherFooterText || settings.voucherFooterText,
              });
              setVoucherLogoPreview(fetchedSettings.voucherLogoUrl || fetchedSettings.logoUrl || '');
          })
          .catch(() => toast.error(t('toast.settings_load_failed')))
          .finally(() => setIsLoading(false));
    }, [token, t]); // <-- ลด dependencies ที่ไม่จำเป็นออก
    // --- END ---

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen, fetchSettings]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVoucherLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => { setVoucherLogoPreview(reader.result); };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('voucherSsid', settings.voucherSsid);
        formData.append('voucherHeaderText', settings.voucherHeaderText);
        formData.append('voucherFooterText', settings.voucherFooterText);
        
        if (voucherLogo) {
            formData.append('voucherLogo', voucherLogo);
        }

        toast.promise(
            axiosInstance.post('/settings', formData, { 
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            }),
            {
                loading: t('toast.saving_settings'),
                success: () => {
                    // --- START: 3. แก้ไขส่วนนี้ ---
                    // setIsOpen(false); // <--- ลบบรรทัดนี้ออก
                    fetchSettings(); // <--- เรียกให้โหลดข้อมูลใหม่เพื่ออัปเดต Preview
                    // --- END ---
                    return t('toast.settings_save_success');
                },
                error: (err) => err.response?.data?.message || t('toast.settings_save_failed'),
                finally: () => setIsLoading(false),
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl grid-cols-1 md:grid-cols-2">
                <div>
                    <DialogHeader>
                        <DialogTitle>{t('voucher_settings_dialog.title')}</DialogTitle>
                        <DialogDescription>{t('voucher_settings_dialog.description')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                        <div>
                            <Label htmlFor="voucherLogo">{t('voucher_settings_dialog.logo_label')}</Label>
                            <Input id="voucherLogo" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleFileChange} />
                            <p className="text-xs text-muted-foreground pt-1">{t('voucher_settings_dialog.logo_desc')}</p>
                        </div>
                        <div>
                            <Label htmlFor="voucherSsid">{t('voucher_settings_dialog.ssid_label')}</Label>
                            <Input id="voucherSsid" value={settings.voucherSsid} onChange={(e) => setSettings({...settings, voucherSsid: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="voucherHeaderText">{t('voucher_settings_dialog.header_label')}</Label>
                            <Input id="voucherHeaderText" value={settings.voucherHeaderText} onChange={(e) => setSettings({...settings, voucherHeaderText: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="voucherFooterText">{t('voucher_settings_dialog.footer_label')}</Label>
                            <Textarea id="voucherFooterText" value={settings.voucherFooterText} onChange={(e) => setSettings({...settings, voucherFooterText: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                         <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('close')}</Button> {/* <-- เปลี่ยนปุ่ม Cancel เป็น Close */}
                         <Button onClick={handleSave} disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" /> 
                            {isLoading ? t('saving') : t('save_settings')}
                        </Button>
                    </DialogFooter>
                </div>
                <div className="hidden md:block">
                     <Card className="h-full">
                        <CardHeader><CardTitle>{t('voucher_settings_dialog.preview_title')}</CardTitle></CardHeader>
                        <CardContent>
                            <div className="p-4 border-2 border-dashed rounded-lg text-center">
                                {voucherLogoPreview ? (
                                    <img src={voucherLogoPreview} alt="logo preview" className="mx-auto h-12 mb-2"/>
                                ) : (
                                    <p className="text-sm text-muted-foreground mb-2">{t('voucher_settings_dialog.no_logo')}</p>
                                )}
                                <h3 className="font-bold">{settings.voucherHeaderText}</h3>
                                <p className="text-sm">SSID: {settings.voucherSsid}</p>
                                <div className="my-4 p-2 bg-gray-100 rounded">
                                    <p>Username: <strong>sampleuser</strong></p>
                                    <p>Password: <strong>samplepass</strong></p>
                                </div>
                                <p className="text-xs">{settings.voucherFooterText}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}