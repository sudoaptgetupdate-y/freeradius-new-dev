// src/pages/AdvertisementPage.jsx
import { useState } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Palette } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AdvertisementFormDialog from "@/components/dialogs/AdvertisementFormDialog";

// --- START: เพิ่มฟังก์ชันสำหรับแปลง Type ---
const getTemplateName = (type) => {
    const names = {
        A: 'Hero Page',
        B: 'Split-Screen',
        C: 'Image Focused',
    };
    return names[type] || 'Unknown';
};
// --- END ---

export default function AdvertisementPage() {
    const token = useAuthStore((state) => state.token);
    const { data: ads, isLoading, refreshData } = usePaginatedFetch("/advertisements");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [adToDelete, setAdToDelete] = useState(null);

    const handleAddNew = () => {
        setEditingAd(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (ad) => {
        setEditingAd(ad);
        setIsDialogOpen(true);
    };

    const handleDelete = (ad) => {
        setAdToDelete(ad);
    };

    const confirmDelete = async () => {
        if (!adToDelete) return;
        toast.promise(
            axiosInstance.delete(`/advertisements/${adToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: 'Deleting advertisement...',
                success: () => {
                    refreshData();
                    return `Advertisement '${adToDelete.name}' deleted successfully!`;
                },
                error: (err) => err.response?.data?.message || "Failed to delete advertisement.",
                finally: () => setAdToDelete(null)
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
                                <Palette className="h-6 w-6" />
                                Advertisement Management
                            </CardTitle>
                            <CardDescription>Manage advertisement campaigns for the login page.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Campaign
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
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
                                ) : ads.length > 0 ? (
                                    ads.map((ad) => (
                                        <TableRow key={ad.id}>
                                            <TableCell className="font-medium">{ad.name}</TableCell>
                                            {/* --- START: เรียกใช้ฟังก์ชันแปลงชื่อ --- */}
                                            <TableCell>{getTemplateName(ad.type)}</TableCell>
                                            {/* --- END --- */}
                                            <TableCell>
                                                <Badge variant={ad.status === 'active' ? 'success' : 'secondary'}>
                                                    {ad.status === 'active' ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(ad)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(ad)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No advertisement campaigns found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {isDialogOpen && (
                <AdvertisementFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    ad={editingAd}
                    onSave={refreshData}
                />
            )}

            <AlertDialog open={!!adToDelete} onOpenChange={(isOpen) => !isOpen && setAdToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the campaign: <strong>{adToDelete?.name}</strong>.
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