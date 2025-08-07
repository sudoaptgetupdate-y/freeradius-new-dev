// src/pages/CustomizationPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Palette, Save } from 'lucide-react';

// หมายเหตุ: หน้านี้เป็นเพียงโครงสร้าง UI และยังไม่ได้เชื่อมต่อกับ Backend
// คุณจะต้องสร้าง API สำหรับการบันทึกและดึงข้อมูลเหล่านี้ในขั้นตอนต่อไป

export default function CustomizationPage() {
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [background, setBackground] = useState(null);
    const [backgroundPreview, setBackgroundPreview] = useState('');
    const [terms, setTerms] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ในแอปพลิเคชันจริง, ส่วนนี้จะใช้ดึงข้อมูลการตั้งค่าปัจจุบันจาก Backend
    useEffect(() => {
        // axiosInstance.get('/api/settings').then(response => {
        //   setTerms(response.data.terms);
        //   setLogoPreview(response.data.logoUrl);
        //   setBackgroundPreview(response.data.backgroundUrl);
        // });
        setTerms("นี่คือข้อความตัวอย่างสำหรับ Terms of Service and Privacy Policy กรุณาแก้ไข...\n\n1. ข้อกำหนด...\n2. นโยบาย..."); // Placeholder
    }, []);

    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        // ส่วนนี้คือ Logic สำหรับการส่งข้อมูลไปยัง Backend ซึ่งต้องสร้าง API รองรับ
        toast.info("กำลังบันทึกการตั้งค่า...", {
             description: "ฟังก์ชันนี้จำเป็นต้องมีการพัฒนา Backend เพิ่มเติม",
        });
        
        /*
        const formData = new FormData();
        if (logo) formData.append('logo', logo);
        if (background) formData.append('background', background);
        formData.append('terms', terms);

        try {
            await axiosInstance.post('/api/settings', formData, { 
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Settings saved successfully!");
        } catch (error) {
            toast.error("Failed to save settings.");
        } finally {
            setIsLoading(false);
        }
        */

        // Placeholder success
        setTimeout(() => {
            setIsLoading(false);
            toast.success("บันทึกการตั้งค่าสำเร็จ (จำลอง)");
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-6 w-6" />
                        Appearance Customization
                    </CardTitle>
                    <CardDescription>ปรับแต่ง Logo, Background, และข้อความสำหรับหน้าลงทะเบียน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-2">
                            <Label htmlFor="logo-upload">Company Logo</Label>
                            <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleFileChange(e, setLogo, setLogoPreview)} />
                            <p className="text-sm text-muted-foreground">แนะนำ: ไฟล์ .SVG หรือ .PNG ที่มีพื้นหลังโปร่งใส</p>
                        </div>
                        {logoPreview && (
                            <div className="text-center p-4 border rounded-md bg-muted/50">
                                <Label className="text-muted-foreground">Logo Preview</Label>
                                <img src={logoPreview} alt="Logo Preview" className="mx-auto mt-2 max-h-24 object-contain" />
                            </div>
                        )}
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-2">
                            <Label htmlFor="background-upload">Register Page Background</Label>
                            <Input id="background-upload" type="file" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, setBackground, setBackgroundPreview)} />
                            <p className="text-sm text-muted-foreground">แนะนำ: ภาพที่มีความละเอียดสูง (เช่น 1920x1080px)</p>
                        </div>
                        {backgroundPreview && (
                            <div className="text-center p-4 border rounded-md bg-muted/50">
                                <Label className="text-muted-foreground">Background Preview</Label>
                                <img src={backgroundPreview} alt="Background Preview" className="mx-auto mt-2 max-h-32 w-full object-cover rounded-md" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="terms-text">Terms of Service & Privacy Policy</Label>
                        <Textarea
                            id="terms-text"
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            rows={15}
                            placeholder="ใส่ข้อความ Terms of Service และ Privacy Policy ทั้งหมดที่นี่..."
                        />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}