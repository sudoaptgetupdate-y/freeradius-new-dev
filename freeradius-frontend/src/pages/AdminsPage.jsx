// src/pages/AdminsPage.jsx
import { useState } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, UserCog } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
// สมมติว่าเราจะสร้าง AdminFormDialog ในขั้นตอนต่อไป
// import AdminFormDialog from "@/components/dialogs/AdminFormDialog";

export default function AdminsPage() {
    const token = useAuthStore((state) => state.token);
    const { data: admins, isLoading, refreshData } = usePaginatedFetch("/admins");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [adminToDelete, setAdminToDelete] = useState(null);

    const handleAddNew = () => {
        setEditingAdmin(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (admin) => {
        setEditingAdmin(admin);
        setIsDialogOpen(true);
    };

    const handleDelete = (admin) => {
        setAdminToDelete(admin);
    };

    const confirmDelete = async () => {
        if (!adminToDelete) return;
        try {
            await axiosInstance.delete(`/admins/${adminToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Admin '${adminToDelete.username}' deleted successfully!`);
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete admin.");
        } finally {
            setAdminToDelete(null);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell>
                                        </TableRow>
                                    ))
                                ) : admins.length > 0 ? (
                                    admins.map((admin) => (
                                        <TableRow key={admin.id}>
                                            <TableCell className="font-medium">{admin.fullName}</TableCell>
                                            <TableCell>{admin.username}</TableCell>
                                            <TableCell>{admin.email}</TableCell>
                                            <TableCell>{admin.role}</TableCell>
                                            <TableCell className="text-center space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(admin)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(admin)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No administrators found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* {isDialogOpen && (
                <AdminFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    admin={editingAdmin}
                    onSave={refreshData}
                />
            )} */}

            <AlertDialog open={!!adminToDelete} onOpenChange={(isOpen) => !isOpen && setAdminToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the admin: <strong>{adminToDelete?.username}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}