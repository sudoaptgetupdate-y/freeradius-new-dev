// src/pages/AdvertisementPage.jsx
import { useState } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Palette, Eye } from "lucide-react"; // <-- Import Eye icon
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // <-- Import Tooltip
import { toast } from "sonner";
import AdvertisementFormDialog from "@/components/dialogs/AdvertisementFormDialog";
import AdvertisementPreviewDialog from "@/components/dialogs/AdvertisementPreviewDialog"; // <-- Import Preview Dialog

const getTemplateName = (type) => {
    const names = {
        A: 'Hero Page',
        B: 'Split-Screen',
        C: 'Image Focused',
    };
    return names[type] || 'Unknown';
};

export default function AdvertisementPage() {
    const token = useAuthStore((state) => state.token);
    const { data: ads, isLoading, refreshData } = usePaginatedFetch("/advertisements");

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [adToDelete, setAdToDelete] = useState(null);

    // --- START: Add state for the preview dialog ---
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [adToPreview, setAdToPreview] = useState(null);
    // --- END ---

    const handleAddNew = () => {
        setEditingAd(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (ad) => {
        setEditingAd(ad);
        setIsFormDialogOpen(true);
    };

    const handleDelete = (ad) => {
        setAdToDelete(ad);
    };
    
    // --- START: Add handler for the preview action ---
    const handlePreview = (ad) => {
        setAdToPreview(ad);
        setIsPreviewOpen(true);
    };
    // --- END ---

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
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
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
                        <TooltipProvider delayDuration={0}>
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
                                                <TableCell>{getTemplateName(ad.type)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={ad.status === 'active' ? 'success' : 'secondary'}>
                                                        {ad.status === 'active' ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                {/* --- START: Update the actions cell --- */}
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(ad)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Preview</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ad)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(ad)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Delete</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                                 {/* --- END --- */}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No advertisement campaigns found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>

            {isFormDialogOpen && (
                <AdvertisementFormDialog
                    isOpen={isFormDialogOpen}
                    setIsOpen={setIsFormDialogOpen}
                    ad={editingAd}
                    onSave={refreshData}
                />
            )}

            {/* --- START: Add the preview dialog instance --- */}
            {isPreviewOpen && (
                <AdvertisementPreviewDialog
                    isOpen={isPreviewOpen}
                    setIsOpen={setIsPreviewOpen}
                    ad={adToPreview}
                />
            )}
            {/* --- END --- */}

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