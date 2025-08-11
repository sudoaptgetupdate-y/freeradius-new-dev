// src/pages/NasPage.jsx
import { useState } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Server } from "lucide-react";
import NasFormDialog from "@/components/dialogs/NasFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
// --- START: เพิ่มการ import Tooltip ---
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// --- END ---

export default function NasPage() {
    const token = useAuthStore((state) => state.token);
    const { data: nasList, isLoading, refreshData } = usePaginatedFetch("/nas");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingNas, setEditingNas] = useState(null);
    const [nasToDelete, setNasToDelete] = useState(null);

    const handleAddNew = () => {
        setEditingNas(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (nas) => {
        setEditingNas(nas);
        setIsDialogOpen(true);
    };

    const handleDelete = (nas) => {
        setNasToDelete(nas);
    };

    const confirmDelete = async () => {
        if (!nasToDelete) return;
        try {
            await axiosInstance.delete(`/nas/${nasToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`NAS '${nasToDelete.nasname}' deleted successfully!`);
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete NAS.");
        } finally {
            setNasToDelete(null);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-6 w-6" />
                                NAS / Clients
                            </CardTitle>
                            <CardDescription>Manage all RADIUS clients (Network Access Servers).</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New
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
                                        <TableHead>NAS Name (IP/Hostname)</TableHead>
                                        <TableHead>Short Name</TableHead>
                                        <TableHead>Description</TableHead>
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
                                    ) : nasList.length > 0 ? (
                                        nasList.map((nas) => (
                                            <TableRow key={nas.id}>
                                                <TableCell className="font-medium font-mono">{nas.nasname}</TableCell>
                                                <TableCell>{nas.shortname}</TableCell>
                                                <TableCell>{nas.description}</TableCell>
                                                {/* --- START: แก้ไขปุ่ม Action --- */}
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(nas)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit NAS</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(nas)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Delete NAS</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                                {/* --- END --- */}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No NAS clients found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                         {/* --- END --- */}
                    </div>
                </CardContent>
            </Card>

            {isDialogOpen && (
                <NasFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    nas={editingNas}
                    onSave={refreshData}
                />
            )}

            <AlertDialog open={!!nasToDelete} onOpenChange={(isOpen) => !isOpen && setNasToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the NAS client: <strong>{nasToDelete?.nasname}</strong>.
                            This action cannot be undone.
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