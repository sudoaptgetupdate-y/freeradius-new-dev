// src/pages/VoucherPackagesPage.jsx
import { useState } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PackageFormDialog from "@/components/dialogs/PackageFormDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next"; // <-- 1. Import hook

export default function VoucherPackagesPage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
    const token = useAuthStore((state) => state.token);
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

    const { data: packages, error, mutate, isLoading } = useSWR('/vouchers/packages', fetcher);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [packageToDelete, setPackageToDelete] = useState(null);

    const handleAddNew = () => {
        setEditingPackage(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setIsDialogOpen(true);
    };

    const handleDelete = (pkg) => {
        setPackageToDelete(pkg);
    };

    const confirmDelete = async () => {
        if (!packageToDelete) return;
        toast.promise(
            axiosInstance.delete(`/vouchers/packages/${packageToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.deleting_package'),
                success: () => {
                    mutate();
                    setPackageToDelete(null);
                    return t('toast.delete_package_success', { name: packageToDelete.name });
                },
                error: (err) => {
                    setPackageToDelete(null);
                    return err.response?.data?.message || t('toast.delete_package_failed');
                },
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
                                <Ticket className="h-6 w-6" />
                                {t('voucher_packages_page.title')}
                            </CardTitle>
                            <CardDescription>{t('voucher_packages_page.description')}</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> {t('voucher_packages_page.add_new_button')}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('table_headers.package_name')}</TableHead>
                                        <TableHead className="text-center">{t('table_headers.duration_days')}</TableHead>
                                        <TableHead>{t('table_headers.radius_profile')}</TableHead>
                                        <TableHead className="text-right">{t('table_headers.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading && (
                                        <TableRow><TableCell colSpan={4} className="text-center h-24">{t('loading_packages')}</TableCell></TableRow>
                                    )}
                                    {error && (
                                        <TableRow><TableCell colSpan={4} className="text-center h-24 text-red-500">{t('load_packages_failed')}</TableCell></TableRow>
                                    )}
                                    {packages && packages.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center h-24">{t('voucher_packages_page.no_packages_found')}</TableCell></TableRow>
                                    )}
                                    {packages?.map((pkg) => (
                                        <TableRow key={pkg.id}>
                                            <TableCell className="font-medium">{pkg.name}</TableCell>
                                            <TableCell className="text-center">{pkg.durationDays}</TableCell>
                                            <TableCell>{pkg.radiusProfile?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                 <div className="inline-flex items-center justify-end gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(pkg)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>{t('actions.edit_package')}</p></TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(pkg)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>{t('actions.delete_package')}</p></TooltipContent>
                                                    </Tooltip>
                                                 </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>

            {isDialogOpen && (
                <PackageFormDialog 
                    isOpen={isDialogOpen} 
                    setIsOpen={setIsDialogOpen} 
                    pkg={editingPackage} 
                    onSave={mutate} 
                />
            )}

            <AlertDialog open={!!packageToDelete} onOpenChange={() => setPackageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('delete_package_dialog.description', { name: packageToDelete?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_package_dialog.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}