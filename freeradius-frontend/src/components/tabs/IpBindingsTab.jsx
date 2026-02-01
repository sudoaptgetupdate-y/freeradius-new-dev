// src/components/tabs/IpBindingsTab.jsx
import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import IpBindingFormDialog from "@/components/dialogs/IpBindingFormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next"; //

export default function IpBindingsTab({ token, refreshTrigger, onRefreshDone }) {
    const { t } = useTranslation(); //
    const [typeFilter, setTypeFilter] = useState("");
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingBinding, setEditingBinding] = useState(null);
    const [bindingToDelete, setBindingToDelete] = useState(null);
    const { data: bindings, pagination, isLoading, searchTerm, handleSearchChange, handlePageChange, handleItemsPerPageChange, refreshData } = usePaginatedFetch("/mikrotik/bindings", 10, { type: typeFilter });
    
    useEffect(() => {
        if (refreshTrigger) {
            refreshData();
            onRefreshDone();
        }
    }, [refreshTrigger, refreshData, onRefreshDone]);

    const handleAddNew = () => { setEditingBinding(null); setIsFormDialogOpen(true); };
    const handleEdit = (binding) => { setEditingBinding(binding); setIsFormDialogOpen(true); };
    const handleDelete = (binding) => { setBindingToDelete(binding); };
    
    const confirmDelete = async () => {
        if (!bindingToDelete) return;
        const id = encodeURIComponent(bindingToDelete['.id']);
        toast.promise(
            axiosInstance.delete(`/mikrotik/bindings/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('hotspot_management_page.toast.removing_binding'),
                success: () => { refreshData(); return t('hotspot_management_page.toast.remove_success', { mac: bindingToDelete['mac-address'] }); },
                error: (err) => err.response?.data?.message || t('hotspot_management_page.toast.remove_failed'),
                finally: () => setBindingToDelete(null)
            }
        );
    };
    
    const getTypeBadge = (type) => {
        switch(type) {
            case 'bypassed': return <Badge variant="success">Bypassed</Badge>;
            case 'blocked': return <Badge variant="destructive">Blocked</Badge>;
            default: return <Badge variant="secondary">Regular</Badge>;
        }
    };
    
    return (
        <div>
             <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Input placeholder={t('hotspot_management_page.search_bindings')} value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="flex-grow"/>
                <Select onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)} value={typeFilter || "all"}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={t('hotspot_management_page.filter_type')} /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('hotspot_management_page.all_types')}</SelectItem>
                        <SelectItem value="bypassed">Bypassed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                </Select>
                 <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> {t('hotspot_management_page.add_binding')}</Button>
            </div>
             <div className="border rounded-md">
                <TooltipProvider delayDuration={0}>
                    <Table>
                        <TableHeader><TableRow><TableHead>{t('table_headers.mac_address')}</TableHead><TableHead>{t('table_headers.ip_address')}</TableHead><TableHead>{t('table_headers.to_address')}</TableHead><TableHead>{t('table_headers.type')}</TableHead><TableHead>{t('table_headers.description')}</TableHead><TableHead className="text-center">{t('table_headers.actions')}</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading && [...Array(pagination.itemsPerPage)].map((_, i) => (<TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>))}
                            {!isLoading && bindings.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">{t('hotspot_management_page.no_bindings_found')}</TableCell></TableRow>}
                            {bindings.map((binding) => (
                                <TableRow key={binding['.id']}>
                                    <TableCell className="font-mono">{binding['mac-address']}</TableCell><TableCell>{binding.address}</TableCell><TableCell>{binding['to-address']}</TableCell><TableCell>{getTypeBadge(binding.type)}</TableCell><TableCell>{binding.comment}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex gap-1">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(binding)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>{t('hotspot_management_page.tooltips.edit_binding')}</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(binding)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>{t('hotspot_management_page.tooltips.remove_binding')}</p></TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Label htmlFor="rows-per-page-binding">{t('pagination.rows_per_page')}</Label>
                    <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger id="rows-per-page-binding" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
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
            </div>

            {isFormDialogOpen && <IpBindingFormDialog isOpen={isFormDialogOpen} setIsOpen={setIsFormDialogOpen} binding={editingBinding} onSave={refreshData} />}
            <AlertDialog open={!!bindingToDelete} onOpenChange={() => setBindingToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('hotspot_management_page.dialogs.remove_binding_title')}</AlertDialogTitle><AlertDialogDescription>{t('hotspot_management_page.dialogs.remove_binding_desc', { mac: bindingToDelete?.['mac-address'] })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('hotspot_management_page.dialogs.confirm_remove')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
    );
}