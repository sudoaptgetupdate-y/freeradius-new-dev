// src/pages/OrganizationsPage.jsx
import { useState } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Building } from "lucide-react";
import OrganizationFormDialog from "@/components/dialogs/OrganizationFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next"; // <-- 1. Import hook

export default function OrganizationsPage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
    const token = useAuthStore((state) => state.token);
    const {
        data: organizations,
        pagination,
        isLoading,
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData
    } = usePaginatedFetch("/organizations", 10);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [orgToDelete, setOrgToDelete] = useState(null);

    const handleAddNew = () => {
        setEditingOrg(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (org) => {
        setEditingOrg(org);
        setIsDialogOpen(true);
    }

    const handleDelete = (org) => {
        setOrgToDelete(org);
    };

    const confirmDelete = async () => {
        if (!orgToDelete) return;
        toast.promise(
            axiosInstance.delete(`/organizations/${orgToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.deleting_org'),
                success: () => {
                    refreshData();
                    return t('toast.delete_org_success', { name: orgToDelete.name });
                },
                error: (err) => err.response?.data?.message || t('toast.delete_org_failed'),
                finally: () => setOrgToDelete(null)
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
                                <Building className="h-6 w-6" />
                                {t('organizations_page.title')}
                            </CardTitle>
                            <CardDescription>{t('organizations_page.description')}</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('organizations_page.add_new_button')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Input
                            placeholder={t('organizations_page.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    <div className="border rounded-md">
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('table_headers.name')}</TableHead>
                                        <TableHead>{t('table_headers.login_type')}</TableHead>
                                        <TableHead>{t('table_headers.radius_profile')}</TableHead>
                                        <TableHead>{t('table_headers.advertisement')}</TableHead>
                                        <TableHead className="text-center">{t('table_headers.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(pagination.itemsPerPage)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={5}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : organizations.length > 0 ? (
                                        organizations.map((org) => (
                                            <TableRow key={org.id}>
                                                <TableCell className="font-medium">{org.name}</TableCell>
                                                <TableCell>{org.login_identifier_type}</TableCell>
                                                <TableCell>{org.radiusProfile?.name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {org.advertisement ? (
                                                        <Badge variant="default">{org.advertisement.name}</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">{t('status.disabled')}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(org)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.edit')}</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(org)}>
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
                                            <TableCell colSpan={5} className="h-24 text-center">{t('organizations_page.no_orgs_found')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Label htmlFor="rows-per-page">{t('pagination.rows_per_page')}</Label>
                        <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {t('pagination.page_info', { currentPage: pagination.currentPage, totalPages: pagination.totalPages, totalItems: pagination.totalItems || 0 })}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>
                            {t('pagination.previous')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>
                            {t('pagination.next')}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {isDialogOpen && (
                <OrganizationFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    org={editingOrg}
                    onSave={refreshData}
                />
            )}

            <AlertDialog open={!!orgToDelete} onOpenChange={(isOpen) => !isOpen && setOrgToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                           {t('delete_org_dialog.description', { name: orgToDelete?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_org_dialog.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}