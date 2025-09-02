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

export default function IpBindingsTab({ token, refreshTrigger, onRefreshDone }) {
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
        toast.promise(
            axiosInstance.delete(`/mikrotik/bindings/${bindingToDelete['.id']}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Removing IP Binding...",
                success: () => { refreshData(); return `Binding for '${bindingToDelete['mac-address']}' removed.`; },
                error: (err) => err.response?.data?.message || "Failed to remove binding.",
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
                <Input placeholder="Search by MAC, IP, Comment..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="flex-grow"/>
                <Select onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)} value={typeFilter || "all"}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by type..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="bypassed">Bypassed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                </Select>
                 <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add Manual Binding</Button>
            </div>
             <div className="border rounded-md">
                <TooltipProvider delayDuration={0}>
                    <Table>
                        <TableHeader><TableRow><TableHead>MAC Address</TableHead><TableHead>Address</TableHead><TableHead>To Address</TableHead><TableHead>Type</TableHead><TableHead>Comment</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading && [...Array(pagination.itemsPerPage)].map((_, i) => (<TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>))}
                            {!isLoading && bindings.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No IP bindings found.</TableCell></TableRow>}
                            {bindings.map((binding) => (
                                <TableRow key={binding['.id']}>
                                    <TableCell className="font-mono">{binding['mac-address']}</TableCell><TableCell>{binding.address}</TableCell><TableCell>{binding['to-address']}</TableCell><TableCell>{getTypeBadge(binding.type)}</TableCell><TableCell>{binding.comment}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex gap-1">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(binding)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Edit Binding</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(binding)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Remove Binding</p></TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </div>
            <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Page {pagination.currentPage} of {pagination.totalPages}</p>
                <div className="flex items-center space-x-2">
                    <Select onValueChange={(value) => handleItemsPerPageChange(Number(value))} defaultValue={`${pagination.itemsPerPage}`}>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="Rows per page" /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(size => (<SelectItem key={size} value={`${size}`}>{size} rows</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>Next</Button>
                </div>
            </div>
            {isFormDialogOpen && <IpBindingFormDialog isOpen={isFormDialogOpen} setIsOpen={setIsFormDialogOpen} binding={editingBinding} onSave={refreshData} />}
            <AlertDialog open={!!bindingToDelete} onOpenChange={() => setBindingToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the IP Binding for MAC address: <strong>{bindingToDelete?.['mac-address']}</strong>.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Confirm Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
    );
};