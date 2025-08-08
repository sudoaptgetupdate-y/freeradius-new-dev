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
import PackageFormDialog from "@/components/dialogs/PackageFormDialog"; // <-- 1. Import Dialog ที่สร้างใหม่

export default function VoucherPackagesPage() {
    const token = useAuthStore((state) => state.token);
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

    const { data: packages, error, mutate, isLoading } = useSWR('/vouchers/packages', fetcher);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [packageToDelete, setPackageToDelete] = useState(null); // <-- State สำหรับยืนยันการลบ

    const handleAddNew = () => {
        setEditingPackage(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setIsDialogOpen(true);
    };

    const handleDelete = (pkg) => {
        setPackageToDelete(pkg); // <-- เปิด Dialog ยืนยัน
    };

    const confirmDelete = async () => {
        if (!packageToDelete) return;
        toast.promise(
            axiosInstance.delete(`/vouchers/packages/${packageToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Deleting package...',
                success: () => {
                    mutate(); // Refresh data
                    setPackageToDelete(null); // ปิด Dialog
                    return `Package '${packageToDelete.name}' deleted successfully!`;
                },
                error: (err) => {
                    setPackageToDelete(null);
                    return err.response?.data?.message || 'Failed to delete package.';
                },
            }
        );
    };
    
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="h-6 w-6" />
                                Voucher Packages
                            </CardTitle>
                            <CardDescription>Manage packages for voucher generation.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Package</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Package Name</TableHead>
                                    <TableHead className="text-center">Duration (Days)</TableHead>
                                    <TableHead>Radius Profile</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">Loading packages...</TableCell></TableRow>
                                )}
                                {error && (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-red-500">Failed to load packages.</TableCell></TableRow>
                                )}
                                {packages && packages.length === 0 && (
                                     <TableRow><TableCell colSpan={4} className="text-center h-24">No packages found. Click "Add New Package" to start.</TableCell></TableRow>
                                )}
                                {packages?.map((pkg) => (
                                    <TableRow key={pkg.id}>
                                        <TableCell className="font-medium">{pkg.name}</TableCell>
                                        <TableCell className="text-center">{pkg.durationDays}</TableCell>
                                        <TableCell>{pkg.radiusProfile?.name || 'N/A'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(pkg)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* 2. เรียกใช้ Dialog Component ที่ import เข้ามา */}
            {isDialogOpen && (
                <PackageFormDialog 
                    isOpen={isDialogOpen} 
                    setIsOpen={setIsDialogOpen} 
                    pkg={editingPackage} 
                    onSave={mutate} 
                />
            )}

            {/* 3. เพิ่ม Dialog ยืนยันการลบ */}
            <AlertDialog open={!!packageToDelete} onOpenChange={() => setPackageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the package: <strong>{packageToDelete?.name}</strong>. This action cannot be undone.
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