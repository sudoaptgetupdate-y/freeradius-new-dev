// src/pages/IpBindingsPage.jsx
import { useState } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import IpBindingFormDialog from "@/components/dialogs/IpBindingFormDialog";

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

const getTypeBadge = (type) => {
    switch(type) {
        case 'bypassed': return <Badge variant="success">Bypassed</Badge>;
        case 'blocked': return <Badge variant="destructive">Blocked</Badge>;
        default: return <Badge variant="secondary">Regular</Badge>;
    }
};

export default function IpBindingsPage() {
    const token = useAuthStore((state) => state.token);
    const { data: bindings, error, isLoading, mutate } = useSWR('/mikrotik/bindings', (url) => fetcher(url, token));

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [bindingToDelete, setBindingToDelete] = useState(null);

    const handleAddNew = () => {
        setIsDialogOpen(true);
    };

    const handleDelete = (binding) => {
        setBindingToDelete(binding);
    };

    const confirmDelete = async () => {
        if (!bindingToDelete) return;
        toast.promise(
            axiosInstance.delete(`/mikrotik/bindings/${bindingToDelete['.id']}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Removing IP Binding...",
                success: () => {
                    mutate(); // Re-fetch data
                    return `Binding for '${bindingToDelete['mac-address']}' removed successfully.`;
                },
                error: (err) => err.response?.data?.message || "Failed to remove binding.",
                finally: () => setBindingToDelete(null)
            }
        );
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Link2 className="h-6 w-6" />Hotspot IP Bindings</CardTitle>
                            <CardDescription>Manage devices that are bypassed, blocked, or have a static IP on the Hotspot.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Binding</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>MAC Address</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>To Address</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Comment</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && <TableRow><TableCell colSpan={6} className="text-center h-24">Loading bindings...</TableCell></TableRow>}
                                {error && <TableRow><TableCell colSpan={6} className="text-center h-24 text-red-500">Failed to load data from Mikrotik.</TableCell></TableRow>}
                                {bindings && bindings.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24">No IP bindings found.</TableCell></TableRow>}
                                {bindings?.map((binding) => (
                                    <TableRow key={binding['.id']}>
                                        <TableCell className="font-mono">{binding['mac-address']}</TableCell>
                                        <TableCell>{binding.address}</TableCell>
                                        <TableCell>{binding['to-address']}</TableCell>
                                        <TableCell>{getTypeBadge(binding.type)}</TableCell>
                                        <TableCell>{binding.comment}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(binding)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {isDialogOpen && (
                <IpBindingFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    onSave={mutate}
                />
            )}

            <AlertDialog open={!!bindingToDelete} onOpenChange={() => setBindingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove the IP Binding for MAC address: <strong>{bindingToDelete?.['mac-address']}</strong>.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Confirm Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}