// src/pages/AdminsPage.jsx
import { useState } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, UserCog, Ban, CheckCircle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import AdminFormDialog from "@/components/dialogs/AdminFormDialog";
import { useTranslation } from "react-i18next"; 

export default function AdminsPage() {
    const { t } = useTranslation(); 
    const currentUser = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);

    const { data: admins, isLoading, refreshData } = usePaginatedFetch("/admins");

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [adminToAction, setAdminToAction] = useState(null);
    const [actionType, setActionType] = useState('');

    const handleAddNew = () => {
        setEditingAdmin(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (admin) => {
        setEditingAdmin(admin);
        setIsFormDialogOpen(true);
    };

    const handleDelete = (admin) => {
        setActionType('delete');
        setAdminToAction(admin);
        setIsConfirmDialogOpen(true);
    };
    
    const handleToggleStatus = (admin) => {
        setActionType('toggle');
        setAdminToAction(admin);
        setIsConfirmDialogOpen(true);
    }

    const confirmAction = async () => {
        if (!adminToAction) return;

        if (actionType === 'delete') {
            toast.promise(
                axiosInstance.delete(`/admins/${adminToAction.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                {
                    loading: t('toast.deleting_admin'),
                    success: () => {
                        refreshData();
                        return t('toast.delete_admin_success', { username: adminToAction.username });
                    },
                    error: (err) => err.response?.data?.message || t('toast.delete_admin_failed'),
                }
            );
        } else if (actionType === 'toggle') {
            toast.promise(
                axiosInstance.put(`/admins/${adminToAction.id}/status`, {}, { headers: { Authorization: `Bearer ${token}` }}),
                {
                    loading: t('toast.updating_status'),
                    success: () => {
                        refreshData();
                        return t('toast.status_update_success', { username: adminToAction.username });
                    },
                    error: (err) => err.response?.data?.message || t('toast.status_update_failed'),
                }
            );
        }
        setIsConfirmDialogOpen(false);
    };
    
    const handleConfirmDialogClose = (isOpen) => {
        setIsConfirmDialogOpen(isOpen);
        if (!isOpen) {
            setTimeout(() => {
                setAdminToAction(null);
                setActionType('');
            }, 150);
        }
    };

    const getDialogDescription = () => {
        if (!adminToAction) return '';
        if (actionType === 'delete') {
            return t('delete_admin_dialog.description', { username: `<strong>${adminToAction.username}</strong>` });
        }
        if (actionType === 'toggle') {
            const nextStatusKey = adminToAction.status === 'active' ? 'disable_desc' : 'enable_desc';
            return t(`toggle_admin_status_dialog.${nextStatusKey}`, { username: `<strong>${adminToAction.username}</strong>` });
        }
        return '';
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <UserCog className="h-6 w-6" />
                                {t('admins_page.title')}
                            </CardTitle>
                            <CardDescription>{t('admins_page.description')}</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('admins_page.add_new_button')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('table_headers.full_name')}</TableHead>
                                        <TableHead>{t('table_headers.username')}</TableHead>
                                        <TableHead>{t('table_headers.email')}</TableHead>
                                        <TableHead>{t('table_headers.role')}</TableHead>
                                        <TableHead>{t('table_headers.status')}</TableHead>
                                        <TableHead className="text-center">{t('table_headers.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(3)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={6}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : admins.length > 0 ? (
                                        admins.map((admin) => (
                                            <TableRow key={admin.id}>
                                                <TableCell className="font-medium">{admin.fullName}</TableCell>
                                                <TableCell>{admin.username}</TableCell>
                                                <TableCell>{admin.email}</TableCell>
                                                <TableCell>{admin.role}</TableCell>
                                                <TableCell>
                                                    <Badge variant={admin.status === 'active' ? 'success' : 'secondary'}>
                                                        {admin.status === 'active' ? t('status.active') : t('status.inactive')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(admin)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.edit_admin')}</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost" size="icon" className="h-8 w-8"
                                                                    onClick={() => handleToggleStatus(admin)}
                                                                    disabled={admin.id === currentUser.id}
                                                                >
                                                                    {admin.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{admin.status === 'active' ? t('actions.disable_admin') : t('actions.enable_admin')}</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={() => handleDelete(admin)}
                                                                    disabled={admin.id === currentUser.id}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.delete_admin')}</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">{t('admins_page.no_admins_found')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>

            {isFormDialogOpen && (
                <AdminFormDialog
                    isOpen={isFormDialogOpen}
                    setIsOpen={setIsFormDialogOpen}
                    admin={editingAdmin}
                    onSave={refreshData}
                />
            )}
            
            <AlertDialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialogClose}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription dangerouslySetInnerHTML={{ __html: getDialogDescription() }} />
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={confirmAction} 
                          className={actionType === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
                        >
                          {t('confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}