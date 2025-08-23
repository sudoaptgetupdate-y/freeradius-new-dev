// freeradius-frontend/src/pages/CustomizationPage.jsx
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
import { useTranslation } from 'react-i18next'; // <-- 1. Import hook

export default function CustomizationPage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
    const token = useAuthStore((state) => state.token);
    
    const [appName, setAppName] = useState('');
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [background, setBackground] = useState(null);
    const [backgroundPreview, setBackgroundPreview] = useState('');
    const [terms, setTerms] = useState('');
    
    const [isLoading, setIsLoading] = useState({ appName: false, logo: false, background: false, terms: false });

    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => {
              const settings = response.data.data;
              setAppName(settings.appName || "Freeradius UI");
              setTerms(settings.terms || "");
              setLogoPreview(settings.logoUrl || '');
              setBackgroundPreview(settings.backgroundUrl || '');
          })
          .catch(() => toast.error(t('toast.settings_load_failed')));
    }, [token, t]);

    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setPreview(reader.result); };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAppName = async () => {
        setIsLoading(prev => ({ ...prev, appName: true }));
        const formData = new FormData();
        formData.append('appName', appName);

        toast.promise(
            axiosInstance.post('/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.saving_app_name'),
                success: t('toast.save_app_name_success'),
                error: (err) => err.response?.data?.message || t('toast.save_app_name_failed'),
                finally: () => setIsLoading(prev => ({ ...prev, appName: false }))
            }
        );
    };

    const handleLogoSave = async () => {
        if (!logo) return toast.info(t('toast.select_logo_first'));
        setIsLoading(prev => ({ ...prev, logo: true }));
        const formData = new FormData();
        formData.append('logo', logo);

        toast.promise(
            axiosInstance.post('/settings', formData, { 
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.saving_logo'),
                success: t('toast.save_logo_success'),
                error: (err) => err.response?.data?.message || t('toast.save_logo_failed'),
                finally: () => setIsLoading(prev => ({ ...prev, logo: false }))
            }
        );
    };

    const handleBackgroundSave = async () => {
        if (!background) return toast.info(t('toast.select_background_first'));
        setIsLoading(prev => ({ ...prev, background: true }));
        const formData = new FormData();
        formData.append('background', background);

        toast.promise(
            axiosInstance.post('/settings', formData, { 
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.saving_background'),
                success: t('toast.save_background_success'),
                error: (err) => err.response?.data?.message || t('toast.save_background_failed'),
                finally: () => setIsLoading(prev => ({ ...prev, background: false }))
            }
        );
    };

    const handleTermsSave = async () => {
        setIsLoading(prev => ({ ...prev, terms: true }));
        const formData = new FormData();
        formData.append('terms', terms);

        toast.promise(
            axiosInstance.post('/settings', formData, { 
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.saving_terms'),
                success: t('toast.save_terms_success'),
                error: (err) => err.response?.data?.message || t('toast.settings_save_failed'),
                finally: () => setIsLoading(prev => ({ ...prev, terms: false }))
            }
        );
    };

    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <Tabs defaultValue="appearance" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Palette className="h-6 w-6" />{t('customization_page.title')}</h1>
                    <p className="text-muted-foreground">{t('customization_page.description')}</p>
                </div>
                <TabsList>
                    <TabsTrigger value="appearance">{t('customization_page.tabs.appearance')}</TabsTrigger>
                    <TabsTrigger value="terms">{t('customization_page.tabs.terms')}</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="appearance" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('customization_page.app_name.title')}</CardTitle>
                        <CardDescription>{t('customization_page.app_name.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input id="app-name" value={appName} onChange={(e) => setAppName(e.target.value)} />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveAppName} disabled={isLoading.appName} className="ml-auto">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading.appName ? t('saving') : t('customization_page.app_name.save_button')}
                        </Button>
                    </CardFooter>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('customization_page.logo.title')}</CardTitle>
                            <CardDescription>{t('customization_page.logo.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleFileChange(e, setLogo, setLogoPreview)} />
                            <p className="text-xs text-muted-foreground pt-1" dangerouslySetInnerHTML={{ __html: t('customization_page.logo.recommendations') }} />
                             {logoPreview && (
                                <Dialog>
                                    <div className="p-4 border rounded-md bg-muted/50 text-center relative group h-48 flex flex-col justify-center">
                                        <Label className="text-muted-foreground">{t('customization_page.logo.preview_label')}</Label>
                                        <img src={logoPreview} alt="Logo Preview" className="mx-auto mt-2 max-h-24 object-contain" />
                                        <DialogTrigger asChild><Button variant="outline" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="mr-2 h-4 w-4" /> {t('customization_page.logo.view_full_button')}</Button></DialogTrigger>
                                    </div>
                                    <DialogContent className="max-w-md p-2"><img src={logoPreview} alt="Full logo preview" className="w-full h-auto rounded-md" /></DialogContent>
                                </Dialog>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleLogoSave} disabled={isLoading.logo} className="ml-auto">
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading.logo ? t('saving') : t('customization_page.logo.save_button')}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('customization_page.background.title')}</CardTitle>
                            <CardDescription>{t('customization_page.background.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input id="background-upload" type="file" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, setBackground, setBackgroundPreview)} />
                             <p className="text-xs text-muted-foreground pt-1" dangerouslySetInnerHTML={{ __html: t('customization_page.background.recommendations') }} />
                            {backgroundPreview && (
                                <Dialog>
                                    <div className="p-4 border rounded-md bg-muted/50 text-center relative group h-48 flex flex-col justify-center">
                                        <Label className="text-muted-foreground">{t('customization_page.background.preview_label')}</Label>
                                        <img src={backgroundPreview} alt="Background Preview" className="mx-auto mt-2 h-full w-full object-cover rounded-md" />
                                        <DialogTrigger asChild><Button variant="outline" size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="mr-2 h-4 w-4" /> {t('customization_page.background.view_full_button')}</Button></DialogTrigger>
                                    </div>
                                    <DialogContent className="max-w-4xl p-2"><img src={backgroundPreview} alt="Full background preview" className="w-full h-auto rounded-md" /></DialogContent>
                                </Dialog>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleBackgroundSave} disabled={isLoading.background} className="ml-auto">
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading.background ? t('saving') : t('customization_page.background.save_button')}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="terms">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('customization_page.terms.title')}</CardTitle>
                        <CardDescription>{t('customization_page.terms.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea id="terms-text" value={terms} onChange={(e) => setTerms(e.target.value)} rows={10} placeholder={t('customization_page.terms.placeholder')} />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleTermsSave} disabled={isLoading.terms} className="ml-auto">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading.terms ? t('saving') : t('customization_page.terms.save_button')}
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}