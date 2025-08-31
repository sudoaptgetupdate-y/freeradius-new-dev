// src/pages/IpBindingsPage.jsx
import { useState, useMemo } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch"; // Assuming you have this hook
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Link2, Edit } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import IpBindingFormDialog from "@/components/dialogs/IpBindingFormDialog"; // New dialog

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

const getTypeBadge = (type) => {
    switch(type) {
        case 'bypassed': return <Badge variant="success">Bypassed</Badge>;
        case 'blocked': return <Badge variant="destructive">Blocked</Badge>;
        default: return <Badge variant="secondary">Regular</Badge>;
    }
};

export default function IpBindingsPage() {
    const token = useAuthStore((state) => state.token);
    const [typeFilter, setTypeFilter] = useState("");

    const { 
        data: bindings, 
        pagination,
        isLoading,
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData 
    } = usePaginatedFetch("/mikrotik/bindings", 15, { type: typeFilter });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBinding, setEditingBinding] = useState(null);
    const [bindingToDelete, setBindingToDelete] = useState(null);

    const handleAddNew = () => {
        setEditingBinding(null);
        setIsDialogOpen(true);
    };
    
    const handleEdit = (binding) => {
        setEditingBinding(binding);
        setIsDialogOpen(true);
    };

    const handleDelete = (binding) => {
        setBindingToDelete(binding);
    };
    
    const confirmDelete = async () => {
        if (!bindingToDelete) return;
        toast.promise(
            axiosInstance.delete(`/mikrotik/bindings/${bindingToDelete['.id']}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Removing IP Binding...",
                success: () => {
                    refreshData();
                    return `Binding for '${bindingToDelete['mac-address']}' removed successfully.`;
                },
                error: (err) => err.response?.data?.message || "Failed to remove binding.",
                finally: () => setBindingToDelete(null)
            }
        );
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Link2 className="h-6 w-6" />Hotspot IP Bindings</CardTitle>
                            <CardDescription>Manage devices that are bypassed, blocked, or have a static IP on the Hotspot.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Binding</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <Input
                            placeholder="Search by MAC, IP, Comment..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="flex-grow"
                        />
                        <Select onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)} value={typeFilter || "all"}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by type..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="bypassed">Bypassed</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="border rounded-md">
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>MAC Address</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>To Address</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Comment</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(pagination.itemsPerPage)].map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>
                                        ))
                                    ) : bindings.length > 0 ? (
                                        bindings.map((binding) => (
                                            <TableRow key={binding['.id']}>
                                                <TableCell className="font-mono">{binding['mac-address']}</TableCell>
                                                <TableCell>{binding.address}</TableCell>
                                                <TableCell>{binding['to-address']}</TableCell>
                                                <TableCell>{getTypeBadge(binding.type)}</TableCell>
                                                <TableCell>{binding.comment}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(binding)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit Binding</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(binding)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Remove Binding</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">No IP bindings found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Label htmlFor="rows-per-page">Rows per page:</Label>
                        <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[15, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems || 0} items)
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>
                            Next
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {isDialogOpen && (
                <IpBindingFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    binding={editingBinding}
                    onSave={refreshData}
                />
            )}

            <AlertDialog open={!!bindingToDelete} onOpenChange={() => setBindingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove the IP Binding for MAC address: <strong>{bindingToDelete?.['mac-address']}</strong>.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Confirm Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}