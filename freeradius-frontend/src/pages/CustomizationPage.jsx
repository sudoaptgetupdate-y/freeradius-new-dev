// src/pages/CustomizationPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Palette, Save, Eye } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CustomizationPage() {
    const token = useAuthStore((state) => state.token);
    
    // States for data
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [background, setBackground] = useState(null);
    const [backgroundPreview, setBackgroundPreview] = useState('');
    const [terms, setTerms] = useState('');
    
    const [isLoading, setIsLoading] = useState({ logo: false, background: false, terms: false });

    // Load initial settings
    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => {
              const settings = response.data.data;
              setTerms(settings.terms || "");
              setLogoPreview(settings.logoUrl || '');
              setBackgroundPreview(settings.backgroundUrl || '');
          })
          .catch(() => toast.error("Could not load settings."));
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

    // --- Save handler for LOGO ---
    const handleLogoSave = async () => {
        if (!logo) return toast.info("Please select a new logo file first.");
        setIsLoading(prev => ({ ...prev, logo: true }));
        const formData = new FormData();
        formData.append('logo', logo);

        toast.promise(
            axiosInstance.post('/settings', formData, { 
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            }),
            {
                loading: 'Saving logo...',
                success: 'Logo saved successfully!',
                error: (err) => err.response?.data?.message || "Failed to save logo.",
                finally: () => setIsLoading(prev => ({ ...prev, logo: false }))
            }
        );
    };

    // --- Save handler for BACKGROUND ---
    const handleBackgroundSave = async () => {
        if (!background) return toast.info("Please select a new background file first.");
        setIsLoading(prev => ({ ...prev, background: true }));
        const formData = new FormData();
        formData.append('background', background);

        toast.promise(
            axiosInstance.post('/settings', formData, { 
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            }),
            {
                loading: 'Saving background...',
                success: 'Background saved successfully!',
                error: (err) => err.response?.data?.message || "Failed to save background.",
                finally: () => setIsLoading(prev => ({ ...prev, background: false }))
            }
        );
    };

    // --- Save handler for TERMS ---
    const handleTermsSave = async () => {
        setIsLoading(prev => ({ ...prev, terms: true }));
        const formData = new FormData();
        formData.append('terms', terms);

        toast.promise(
            axiosInstance.post('/settings', formData, { 
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            }),
            {
                loading: 'Saving terms...',
                success: 'Terms & Policy saved successfully!',
                error: (err) => err.response?.data?.message || "Failed to save settings.",
                finally: () => setIsLoading(prev => ({ ...prev, terms: false }))
            }
        );
    };

    return (
        <Tabs defaultValue="appearance" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Palette className="h-6 w-6" />Customization</h1>
                    <p className="text-muted-foreground">Adjust the look and feel of your login pages.</p>
                </div>
                <TabsList>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="terms">Terms & Policy</TabsTrigger>
                </TabsList>
            </div>

            {/* --- Content for "Appearance" Tab --- */}
            <TabsContent value="appearance">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Logo Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Logo</CardTitle>
                            <CardDescription>Upload a logo to be displayed on login pages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleFileChange(e, setLogo, setLogoPreview)} />
                            <p className="text-xs text-muted-foreground pt-1">
                                • Recommended: SVG or PNG with transparent background.<br/>
                                • Max height: 80px. Max file size: 3MB.
                            </p>
                             {logoPreview && (
                                <Dialog>
                                    <div className="p-4 border rounded-md bg-muted/50 text-center relative group h-48 flex flex-col justify-center">
                                        <Label className="text-muted-foreground">Logo Preview</Label>
                                        <img src={logoPreview} alt="Logo Preview" className="mx-auto mt-2 max-h-24 object-contain" />
                                        <DialogTrigger asChild><Button variant="outline" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="mr-2 h-4 w-4" /> View Full</Button></DialogTrigger>
                                    </div>
                                    <DialogContent className="max-w-md p-2"><img src={logoPreview} alt="Full logo preview" className="w-full h-auto rounded-md" /></DialogContent>
                                </Dialog>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleLogoSave} disabled={isLoading.logo} className="ml-auto">
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading.logo ? 'Saving...' : 'Save Logo'}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Background Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Page Background</CardTitle>
                            <CardDescription>Set a background image for login pages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input id="background-upload" type="file" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, setBackground, setBackgroundPreview)} />
                             <p className="text-xs text-muted-foreground pt-1">
                                • Recommended resolution: 1920x1080px (16:9 aspect ratio).<br/>
                                • Max file size: 3MB.
                            </p>
                            {backgroundPreview && (
                                <Dialog>
                                    <div className="p-4 border rounded-md bg-muted/50 text-center relative group h-48 flex flex-col justify-center">
                                        <Label className="text-muted-foreground">Background Preview</Label>
                                        <img src={backgroundPreview} alt="Background Preview" className="mx-auto mt-2 h-full w-full object-cover rounded-md" />
                                        <DialogTrigger asChild><Button variant="outline" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="mr-2 h-4 w-4" /> View Full Image</Button></DialogTrigger>
                                    </div>
                                    <DialogContent className="max-w-4xl p-2"><img src={backgroundPreview} alt="Full background preview" className="w-full h-auto rounded-md" /></DialogContent>
                                </Dialog>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleBackgroundSave} disabled={isLoading.background} className="ml-auto">
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading.background ? 'Saving...' : 'Save Background'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </TabsContent>

            {/* --- Content for "Terms & Policy" Tab --- */}
            <TabsContent value="terms">
                <Card>
                    <CardHeader>
                        <CardTitle>Terms of Service & Privacy Policy</CardTitle>
                        <CardDescription>This text will be shown to users before they can register or log in.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea id="terms-text" value={terms} onChange={(e) => setTerms(e.target.value)} rows={10} placeholder="Enter the full text of your terms and policy here..." />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleTermsSave} disabled={isLoading.terms} className="ml-auto">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading.terms ? 'Saving...' : 'Save Terms'}
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}