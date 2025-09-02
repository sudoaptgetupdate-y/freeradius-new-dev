// src/pages/MikrotikGroupsPage.jsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Edit, Users } from "lucide-react";
import { toast } from "sonner";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import MikrotikGroupFormDialog from "@/components/dialogs/MikrotikGroupFormDialog";

export default function MikrotikGroupsPage() {
    const token = useAuthStore((state) => state.token);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [profileToDelete, setProfileToDelete] = useState(null);

    const {
        data: profiles,
        pagination,
        isLoading,
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData
    // --- START: **แก้ไข** ---
    } = usePaginatedFetch("/mikrotik-profiles", 10); // ลบ argument ที่ไม่ได้ใช้ออก
    // --- END: **แก้ไข** ---

    const handleAddNew = () => {
        setEditingProfile(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (profile) => {
        setEditingProfile(profile);
        setIsDialogOpen(true);
    };

    const handleDelete = (profile) => {
        setProfileToDelete(profile);
    };

    const confirmDelete = async () => {
        if (!profileToDelete) return;
        toast.promise(
            axiosInstance.delete(`/mikrotik-profiles/${profileToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Deleting profile...",
                success: () => {
                    refreshData();
                    return `Profile '${profileToDelete.name}' deleted successfully.`;
                },
                error: (err) => err.response?.data?.message || "Failed to delete profile.",
                finally: () => setProfileToDelete(null)
            }
        );
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6" />Mikrotik User Groups</CardTitle>
                            <CardDescription>Manage user profiles for Mikrotik Hotspot.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Group</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Input
                            placeholder="Search by group name..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Group Name</TableHead>
                                    <TableHead>Rate Limit</TableHead>
                                    <TableHead>Shared Users</TableHead>
                                    <TableHead>Session Timeout</TableHead>
                                    <TableHead>Idle Timeout</TableHead>
                                    <TableHead>Acct Interval</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && [...Array(pagination.itemsPerPage)].map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>
                                ))}
                                {!isLoading && profiles.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-24">No Mikrotik groups found.</TableCell></TableRow>}
                                {profiles.map((profile) => (
                                    <TableRow key={profile.id}>
                                        <TableCell className="font-medium">{profile.name}</TableCell>
                                        <TableCell>{profile.rateLimit || 'N/A'}</TableCell>
                                        <TableCell>{profile.sharedUsers || 'N/A'}</TableCell>
                                        <TableCell>{profile.sessionTimeout ? `${profile.sessionTimeout}s` : 'N/A'}</TableCell>
                                        <TableCell>{profile.idleTimeout ? `${profile.idleTimeout}s` : 'N/A'}</TableCell>
                                        <TableCell>{profile.acctInterimInterval ? `${profile.acctInterimInterval}s` : 'N/A'}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(profile)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(profile)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
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

            {isDialogOpen && (
                <MikrotikGroupFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    profile={editingProfile}
                    onSave={refreshData}
                />
            )}

            <AlertDialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the group: <strong>{profileToDelete?.name}</strong>. This action cannot be undone.</AlertDialogDescription>
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