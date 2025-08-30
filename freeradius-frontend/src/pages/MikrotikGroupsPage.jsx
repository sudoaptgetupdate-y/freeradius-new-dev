// src/pages/MikrotikGroupsPage.jsx
import { useState } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import MikrotikGroupFormDialog from "@/components/dialogs/MikrotikGroupFormDialog";

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

export default function MikrotikGroupsPage() {
    const token = useAuthStore((state) => state.token);
    const { data: profiles, error, isLoading, mutate } = useSWR('/mikrotik-profiles', (url) => fetcher(url, token));

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [profileToDelete, setProfileToDelete] = useState(null);
    
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
                    mutate(); // Re-fetch data
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
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Group Name</TableHead>
                                    <TableHead>Rate Limit</TableHead>
                                    <TableHead>Shared Users</TableHead>
                                    <TableHead>Session Timeout</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && <TableRow><TableCell colSpan={5} className="text-center h-24">Loading profiles...</TableCell></TableRow>}
                                {error && <TableRow><TableCell colSpan={5} className="text-center h-24 text-red-500">Failed to load data.</TableCell></TableRow>}
                                {profiles && profiles.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">No Mikrotik groups found.</TableCell></TableRow>}
                                {profiles?.map((profile) => (
                                    <TableRow key={profile.id}>
                                        <TableCell className="font-medium">{profile.name}</TableCell>
                                        <TableCell>{profile.rateLimit || 'N/A'}</TableCell>
                                        <TableCell>{profile.sharedUsers || 'N/A'}</TableCell>
                                        <TableCell>{profile.sessionTimeout ? `${profile.sessionTimeout}s` : 'N/A'}</TableCell>
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
            </Card>

            {isDialogOpen && (
                <MikrotikGroupFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    profile={editingProfile}
                    onSave={mutate}
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