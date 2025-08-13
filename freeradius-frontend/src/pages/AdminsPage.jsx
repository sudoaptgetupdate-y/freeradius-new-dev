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
// --- START: เพิ่มการ import Tooltip ---
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// --- END ---
import { toast } from "sonner";
import AdminFormDialog from "@/components/dialogs/AdminFormDialog";

export default function AdminsPage() {
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
            try {
                await axiosInstance.delete(`/admins/${adminToAction.id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success(`Admin '${adminToAction.username}' deleted successfully!`);
                refreshData();
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to delete admin.");
            }
        } else if (actionType === 'toggle') {
            try {
                await axiosInstance.put(`/admins/${adminToAction.id}/status`, {}, { headers: { Authorization: `Bearer ${token}` }});
                toast.success(`Admin '${adminToAction.username}' status updated!`);
                refreshData();
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to update status.");
            }
        }
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
            return `This will permanently delete the admin: ${adminToAction.username}.`;
        }
        if (actionType === 'toggle') {
            const nextStatus = adminToAction.status === 'active' ? 'deactivate' : 'activate';
            return `Are you sure you want to ${nextStatus} the admin: ${adminToAction.username}?`;
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
                                Admin Management
                            </CardTitle>
                            <CardDescription>Manage all administrator accounts.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Admin
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        {/* --- START: เพิ่ม TooltipProvider ครอบ Table --- */}
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
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
                                                        {admin.status === 'active' ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                {/* --- START: แก้ไขปุ่ม Action --- */}
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(admin)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit Admin</p></TooltipContent>
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
                                                            <TooltipContent><p>{admin.status === 'active' ? 'Disable' : 'Enable'} Admin</p></TooltipContent>
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
                                                            <TooltipContent><p>Delete Admin</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                                {/* --- END --- */}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">No administrators found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                        {/* --- END --- */}
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
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {getDialogDescription()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={confirmAction} 
                          className={actionType === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
                        >
                          Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}