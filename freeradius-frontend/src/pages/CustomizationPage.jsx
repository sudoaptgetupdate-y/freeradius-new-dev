// src/pages/CustomizationPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Palette, Save, Eye } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function CustomizationPage() {
    const token = useAuthStore((state) => state.token);
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [background, setBackground] = useState(null);
    const [backgroundPreview, setBackgroundPreview] = useState('');
    const [terms, setTerms] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        axiosInstance.get('/settings')
          .then(response => {
              const settings = response.data.data;
              setTerms(settings.terms || "");
              setLogoPreview(settings.logoUrl || '');
              setBackgroundPreview(settings.backgroundUrl || '');
          })
          .catch(() => toast.error("ไม่สามารถโหลดข้อมูลการตั้งค่าได้"))
          .finally(() => setIsLoading(false));
    }, [token]);

    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setPreview(reader.result); };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        const formData = new FormData();
        if (logo) formData.append('logo', logo);
        if (background) formData.append('background', background);
        formData.append('terms', terms);
        
        toast.promise(
            axiosInstance.post('/settings', formData, { 
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            }),
            {
                loading: 'Saving settings...',
                success: 'Appearance settings saved successfully!',
                error: (err) => err.response?.data?.message || "Failed to save settings.",
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette className="h-6 w-6" />Appearance Customization</CardTitle>
                    <CardDescription>ปรับแต่ง Logo, Background, และข้อความสำหรับหน้าลงทะเบียน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* ... ส่วนของ Logo, Background, Terms คงเดิม ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-2">
                            <Label htmlFor="logo-upload">Company Logo</Label>
                            <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleFileChange(e, setLogo, setLogoPreview)} />
                            <p className="text-sm text-muted-foreground">แนะนำ: ไฟล์ .SVG หรือ .PNG ที่มีพื้นหลังโปร่งใส</p>
                        </div>
                        {logoPreview && (
                            <Dialog>
                                <div className="p-4 border rounded-md bg-muted/50 text-center relative group">
                                    <Label className="text-muted-foreground">Logo Preview</Label>
                                    <img src={logoPreview} alt="Logo Preview" className="mx-auto mt-2 max-h-24 object-contain" />
                                     <DialogTrigger asChild><Button variant="outline" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="mr-2 h-4 w-4" /> View Full</Button></DialogTrigger>
                                </div>
                                <DialogContent className="max-w-md p-2"><img src={logoPreview} alt="Full logo preview" className="w-full h-auto rounded-md" /></DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-2">
                            <Label htmlFor="background-upload">Register Page Background</Label>
                            <Input id="background-upload" type="file" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, setBackground, setBackgroundPreview)} />
                            <p className="text-sm text-muted-foreground">แนะนำ: ภาพที่มีความละเอียดสูง (เช่น 1920x1080px)</p>
                        </div>
                        {backgroundPreview && (
                            <Dialog>
                                <div className="p-4 border rounded-md bg-muted/50 text-center relative group">
                                    <Label className="text-muted-foreground">Background Preview</Label>
                                    <img src={backgroundPreview} alt="Background Preview" className="mx-auto mt-2 max-h-32 w-full object-cover rounded-md" />
                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="mr-2 h-4 w-4" /> View Full Image</Button></DialogTrigger>
                                </div>
                                <DialogContent className="max-w-4xl p-2"><img src={backgroundPreview} alt="Full background preview" className="w-full h-auto rounded-md" /></DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="terms-text">Terms of Service & Privacy Policy</Label>
                        <Textarea id="terms-text" value={terms} onChange={(e) => setTerms(e.target.value)} rows={15} placeholder="ใส่ข้อความ Terms of Service และ Privacy Policy ทั้งหมดที่นี่..." />
                    </div>
                </CardContent>
                 <div className="flex justify-end p-6">
                    <Button onClick={handleSave} disabled={isLoading}>
                        <Save className="mr-2 h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}