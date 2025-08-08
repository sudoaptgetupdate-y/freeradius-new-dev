// src/pages/VoucherSettingsPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';

const initialSettings = {
    // ลบ voucherLogoUrl ออก
    voucherSsid: 'Free-WiFi',
    voucherHeaderText: 'WiFi Voucher',
    voucherFooterText: 'Enjoy your connection!'
};

export default function VoucherSettingsPage() {
    const token = useAuthStore((state) => state.token);
    const [settings, setSettings] = useState(initialSettings);
    // ลบ State ที่เกี่ยวกับ logo ทั้งหมด
    const [logoPreview, setLogoPreview] = useState(''); // เก็บไว้เพื่อ Preview เท่านั้น
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        axiosInstance.get('/settings')
          .then(response => {
              const fetchedSettings = response.data.data;
              setSettings({
                  voucherSsid: fetchedSettings.voucherSsid || initialSettings.voucherSsid,
                  voucherHeaderText: fetchedSettings.voucherHeaderText || initialSettings.voucherHeaderText,
                  voucherFooterText: fetchedSettings.voucherFooterText || initialSettings.voucherFooterText,
              });
              // ดึง logoUrl หลักมาแสดงเป็น Preview แทน
              setLogoPreview(fetchedSettings.voucherLogoUrl || fetchedSettings.logoUrl || '');
          })
          .catch(() => toast.error("Could not load settings."))
          .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        const formData = new FormData();
        // ไม่ต้อง append logo file อีกต่อไป
        formData.append('voucherSsid', settings.voucherSsid);
        formData.append('voucherHeaderText', settings.voucherHeaderText);
        formData.append('voucherFooterText', settings.voucherFooterText);

        toast.promise(
            axiosInstance.post('/settings', formData, {
                headers: {
                    // ไม่ต้องส่ง 'Content-Type': 'multipart/form-data' แล้วก็ได้
                    // แต่คงไว้ก่อนได้เผื่ออนาคต
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            }),
            {
                loading: 'Saving settings...',
                success: 'Voucher settings saved successfully!',
                error: (err) => err.response?.data?.message || "Failed to save settings.",
                finally: () => setIsLoading(false),
            }
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Voucher Customization</CardTitle>
                    <CardDescription>Customize the appearance of printed vouchers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* --- ลบส่วน Input file ของ logo ออกไป --- */}
                     <div>
                        <Label htmlFor="voucherSsid">WiFi Name (SSID)</Label>
                        <Input id="voucherSsid" value={settings.voucherSsid} onChange={(e) => setSettings({...settings, voucherSsid: e.target.value})} />
                    </div>
                    <div>
                        <Label htmlFor="voucherHeaderText">Header Text</Label>
                        <Input id="voucherHeaderText" value={settings.voucherHeaderText} onChange={(e) => setSettings({...settings, voucherHeaderText: e.target.value})} />
                    </div>
                    <div>
                        <Label htmlFor="voucherFooterText">Footer Text</Label>
                        <Textarea id="voucherFooterText" value={settings.voucherFooterText} onChange={(e) => setSettings({...settings, voucherFooterText: e.target.value})} />
                    </div>
                    <Button onClick={handleSave} disabled={isLoading}>
                        <Save className="mr-2 h-4 w-4" /> 
                        {isLoading ? 'Saving...' : 'Save Settings'}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
                <CardContent>
                    <div className="p-4 border-2 border-dashed rounded-lg text-center">
                        {logoPreview ? (
                             <img src={logoPreview} alt="logo preview" className="mx-auto h-12 mb-2"/>
                        ) : (
                            <p className="text-sm text-muted-foreground mb-2">(No Logo Set)</p>
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
    );
}