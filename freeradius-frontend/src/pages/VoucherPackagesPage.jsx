// src/pages/VoucherPackagesPage.jsx
import { useState } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Placeholder for the PackageFormDialog
const PackageFormDialog = () => null; 

export default function VoucherPackagesPage() {
    const token = useAuthStore((state) => state.token);
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

    const { data: packages, error, mutate } = useSWR('/vouchers/packages', fetcher);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    const handleAddNew = () => {
        setEditingPackage(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setIsDialogOpen(true);
    };

    const handleDelete = async (pkg) => {
        toast.promise(
            axiosInstance.delete(`/vouchers/packages/${pkg.id}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Deleting package...',
                success: () => {
                    mutate();
                    return `Package '${pkg.name}' deleted successfully!`;
                },
                error: 'Failed to delete package.',
            }
        );
    };
    
    if (error) return <div>Failed to load packages.</div>;
    if (!packages) return <div>Loading...</div>;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Voucher Packages</CardTitle>
                        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Package</Button>
                    </div>
                     <CardDescription>Manage packages for voucher generation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Package Name</TableHead>
                                <TableHead>Duration (Days)</TableHead>
                                <TableHead>Radius Profile</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {packages.map((pkg) => (
                                <TableRow key={pkg.id}>
                                    <TableCell>{pkg.name}</TableCell>
                                    <TableCell>{pkg.durationDays}</TableCell>
                                    <TableCell>{pkg.radiusProfile.name}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                                        <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDelete(pkg)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {/* The actual dialog component would be rendered here */}
            {isDialogOpen && <PackageFormDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} pkg={editingPackage} onSave={mutate} />}
        </>
    );
}