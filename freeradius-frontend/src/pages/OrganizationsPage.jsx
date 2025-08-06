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

export default function OrganizationsPage() {
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
    } = usePaginatedFetch("/organizations");

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
        try {
            await axiosInstance.delete(`/organizations/${orgToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Organization '${orgToDelete.name}' deleted successfully!`);
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete organization.");
        } finally {
            setOrgToDelete(null);
        }
    };

    return (
        <>
            {/* --- START: แก้ไขส่วนนี้ --- */}
            <div className="h-full">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="h-6 w-6" />
                                    Organizations
                                </CardTitle>
                                <CardDescription>Manage all organizations in the system.</CardDescription>
                            </div>
                            <Button onClick={handleAddNew}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col overflow-hidden">
                        <div className="flex-shrink-0 mb-4">
                            <Input
                                placeholder="Search by organization name..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="border rounded-md flex-grow overflow-y-auto relative">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Login Type</TableHead>
                                        <TableHead>Radius Profile</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={4}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : organizations.length > 0 ? (
                                        organizations.map((org) => (
                                            <TableRow key={org.id}>
                                                <TableCell className="font-medium">{org.name}</TableCell>
                                                <TableCell>{org.login_identifier_type}</TableCell>
                                                <TableCell>{org.radiusProfile?.name || 'N/A'}</TableCell>
                                                <TableCell className="text-center space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(org)}>
                                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(org)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No organizations found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Label htmlFor="rows-per-page">Rows per page:</Label>
                            <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                                <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
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
            </div>
            {/* --- END: สิ้นสุดส่วนที่แก้ไข --- */}

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
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the organization: <strong>{orgToDelete?.name}</strong>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}