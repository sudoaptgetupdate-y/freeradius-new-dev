// src/pages/NasPage.jsx
import { useState } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Server } from "lucide-react";
import NasFormDialog from "@/components/dialogs/NasFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next"; // <-- 1. Import hook

export default function NasPage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
    const token = useAuthStore((state) => state.token);
    const { data: nasList, isLoading, refreshData } = usePaginatedFetch("/nas");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingNas, setEditingNas] = useState(null);
    const [nasToDelete, setNasToDelete] = useState(null);

    const handleAddNew = () => {
        setEditingNas(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (nas) => {
        setEditingNas(nas);
        setIsDialogOpen(true);
    };

    const handleDelete = (nas) => {
        setNasToDelete(nas);
    };

    const confirmDelete = async () => {
        if (!nasToDelete) return;
        toast.promise(
            axiosInstance.delete(`/nas/${nasToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.deleting_nas'),
                success: () => {
                    refreshData();
                    return t('toast.delete_nas_success', { name: nasToDelete.nasname });
                },
                error: (err) => err.response?.data?.message || t('toast.delete_nas_failed'),
                finally: () => setNasToDelete(null)
            }
        );
    };
    
    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-6 w-6" />
                                {t('nas_page.title')}
                            </CardTitle>
                            <CardDescription>{t('nas_page.description')}</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('add_new')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('table_headers.nas_name')}</TableHead>
                                        <TableHead>{t('table_headers.short_name')}</TableHead>
                                        <TableHead>{t('table_headers.description')}</TableHead>
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
                                    ) : nasList.length > 0 ? (
                                        nasList.map((nas) => (
                                            <TableRow key={nas.id}>
                                                <TableCell className="font-medium font-mono">{nas.nasname}</TableCell>
                                                <TableCell>{nas.shortname}</TableCell>
                                                <TableCell>{nas.description}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(nas)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.edit_nas')}</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(nas)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.delete_nas')}</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">{t('nas_page.no_nas_found')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>

            {isDialogOpen && (
                <NasFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    nas={editingNas}
                    onSave={refreshData}
                />
            )}

            <AlertDialog open={!!nasToDelete} onOpenChange={(isOpen) => !isOpen && setNasToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription dangerouslySetInnerHTML={{ __html: t('delete_nas_dialog.description', { name: nasToDelete?.nasname }) }} />
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_nas_dialog.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}