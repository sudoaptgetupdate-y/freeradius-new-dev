// src/pages/AdvertisementPage.jsx
import { useState } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Palette, Eye } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import AdvertisementFormDialog from "@/components/dialogs/AdvertisementFormDialog";
import AdvertisementPreviewDialog from "@/components/dialogs/AdvertisementPreviewDialog";
import { useTranslation } from "react-i18next"; // <-- 1. Import hook

const getTemplateName = (type, t) => {
    const names = {
        A: t('ad_templates.hero'),
        B: t('ad_templates.split'),
        C: t('ad_templates.image_focused'),
    };
    return names[type] || t('ad_templates.unknown');
};

export default function AdvertisementPage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
    const token = useAuthStore((state) => state.token);
    const { data: ads, isLoading, refreshData } = usePaginatedFetch("/advertisements");

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [adToDelete, setAdToDelete] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [adToPreview, setAdToPreview] = useState(null);

    const handleAddNew = () => {
        setEditingAd(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (ad) => {
        setEditingAd(ad);
        setIsFormDialogOpen(true);
    };

    const handleDelete = (ad) => {
        setAdToDelete(ad);
    };
    
    const handlePreview = (ad) => {
        setAdToPreview(ad);
        setIsPreviewOpen(true);
    };

    const confirmDelete = async () => {
        if (!adToDelete) return;
        toast.promise(
            axiosInstance.delete(`/advertisements/${adToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.deleting_ad'),
                success: () => {
                    refreshData();
                    return t('toast.delete_ad_success', { name: adToDelete.name });
                },
                error: (err) => err.response?.data?.message || t('toast.delete_ad_failed'),
                finally: () => setAdToDelete(null)
            }
        );
    };

    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-6 w-6" />
                                {t('ad_page.title')}
                            </CardTitle>
                            <CardDescription>{t('ad_page.description')}</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('ad_page.add_new_button')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('table_headers.campaign_name')}</TableHead>
                                        <TableHead>{t('table_headers.type')}</TableHead>
                                        <TableHead>{t('table_headers.status')}</TableHead>
                                        <TableHead className="text-center">{t('table_headers.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={4}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : ads.length > 0 ? (
                                        ads.map((ad) => (
                                            <TableRow key={ad.id}>
                                                <TableCell className="font-medium">{ad.name}</TableCell>
                                                <TableCell>{getTemplateName(ad.type, t)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={ad.status === 'active' ? 'success' : 'secondary'}>
                                                        {ad.status === 'active' ? t('status.active') : t('status.inactive')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(ad)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.preview')}</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ad)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.edit')}</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(ad)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.delete')}</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">{t('ad_page.no_ads_found')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>

            {isFormDialogOpen && (
                <AdvertisementFormDialog
                    isOpen={isFormDialogOpen}
                    setIsOpen={setIsFormDialogOpen}
                    ad={editingAd}
                    onSave={refreshData}
                />
            )}
            
            {isPreviewOpen && (
                <AdvertisementPreviewDialog
                    isOpen={isPreviewOpen}
                    setIsOpen={setIsPreviewOpen}
                    ad={adToPreview}
                />
            )}

            <AlertDialog open={!!adToDelete} onOpenChange={(isOpen) => !isOpen && setAdToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('delete_ad_dialog.description', { name: adToDelete?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_ad_dialog.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}