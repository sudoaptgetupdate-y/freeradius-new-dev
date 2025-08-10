// src/components/dialogs/VoucherSettingsDialog.jsx
import { useState, useEffect } from 'react';
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

const initialSettings = {
    voucherSsid: 'Free-WiFi',
    voucherHeaderText: 'WiFi Voucher',
    voucherFooterText: 'Enjoy your connection!'
};

export default function VoucherSettingsDialog({ isOpen, setIsOpen }) {
    const token = useAuthStore((state) => state.token);
    const [settings, setSettings] = useState(initialSettings);
    const [isLoading, setIsLoading] = useState(false);
    
    const [voucherLogo, setVoucherLogo] = useState(null);
    const [voucherLogoPreview, setVoucherLogoPreview] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            axiosInstance.get('/settings', { headers: { Authorization: `Bearer ${token}` }})
              .then(response => {
                  const fetchedSettings = response.data.data;
                  setSettings({
                      voucherSsid: fetchedSettings.voucherSsid || initialSettings.voucherSsid,
                      voucherHeaderText: fetchedSettings.voucherHeaderText || initialSettings.voucherHeaderText,
                      voucherFooterText: fetchedSettings.voucherFooterText || initialSettings.voucherFooterText,
                  });
                  setVoucherLogoPreview(fetchedSettings.voucherLogoUrl || fetchedSettings.logoUrl || '');
              })
              .catch(() => toast.error("Could not load settings."))
              .finally(() => setIsLoading(false));
        }
    }, [isOpen, token]);

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
                loading: 'Saving settings...',
                success: () => {
                    setIsOpen(false);
                    return 'Voucher settings saved successfully!';
                },
                error: (err) => err.response?.data?.message || "Failed to save settings.",
                finally: () => setIsLoading(false),
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl grid-cols-1 md:grid-cols-2">
                <div>
                    <DialogHeader>
                        <DialogTitle>Voucher Customization</DialogTitle>
                        <DialogDescription>Customize the appearance of printed vouchers.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                        <div>
                            <Label htmlFor="voucherLogo">Voucher Logo (Optional)</Label>
                            <Input id="voucherLogo" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleFileChange} />
                            <p className="text-xs text-muted-foreground pt-1">If empty, the main logo from Customization will be used.</p>
                        </div>
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
                    </div>
                    <DialogFooter>
                         <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                         <Button onClick={handleSave} disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" /> 
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </DialogFooter>
                </div>
                <div className="hidden md:block">
                     <Card className="h-full">
                        <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
                        <CardContent>
                            <div className="p-4 border-2 border-dashed rounded-lg text-center">
                                {voucherLogoPreview ? (
                                    <img src={voucherLogoPreview} alt="logo preview" className="mx-auto h-12 mb-2"/>
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
            </DialogContent>
        </Dialog>
    );
}