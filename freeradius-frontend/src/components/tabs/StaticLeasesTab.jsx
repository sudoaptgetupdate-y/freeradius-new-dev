// src/components/tabs/StaticLeasesTab.jsx
import { useState, useMemo } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DhcpLeaseFormDialog from "@/components/dialogs/DhcpLeaseFormDialog";

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

export default function StaticLeasesTab({ token }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeases, setSelectedLeases] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLease, setEditingLease] = useState(null);
    const [formMode, setFormMode] = useState('addStatic');
    const [leasesToDelete, setLeasesToDelete] = useState([]);

    const { data: allLeases, error, isLoading, mutate } = useSWR(
        ['/mikrotik/dhcp/leases', token],
        ([url, token]) => fetcher(url, token),
        { revalidateOnFocus: true }
    );

    const staticLeases = useMemo(() => {
        if (!allLeases) return [];
        const staticOnly = allLeases.filter(lease => lease.dynamic === 'false');
        if (!searchTerm) return staticOnly;
        
        const lowercasedFilter = searchTerm.toLowerCase();
        return staticOnly.filter(lease =>
            Object.values(lease).some(val =>
                String(val).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [allLeases, searchTerm]);

    const handleSelectAll = (checked) => {
        setSelectedLeases(checked ? staticLeases : []);
    };
    
    const handleSelectSingle = (checked, lease) => {
        setSelectedLeases(prev =>
            checked ? [...prev, lease] : prev.filter(l => l['.id'] !== lease['.id'])
        );
    };

    const handleAddNew = () => {
        setEditingLease(null);
        setFormMode('addStatic');
        setIsFormOpen(true);
    };

    const handleEdit = (lease) => {
        setEditingLease(lease);
        setFormMode('editStatic');
        setIsFormOpen(true);
    };
    
    const confirmDelete = async () => {
        if (leasesToDelete.length === 0) return;
        const ids = leasesToDelete.map(l => l['.id']);
        toast.promise(
            axiosInstance.post(`/mikrotik/dhcp/leases/delete`, { ids }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Removing static lease(s)...",
                success: () => {
                    mutate();
                    setSelectedLeases([]);
                    return `${ids.length} static lease(s) removed.`;
                },
                error: (err) => err.response?.data?.message || "Failed to remove static leases.",
                finally: () => setLeasesToDelete([])
            }
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <Input placeholder="Search static leases..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
                <div className="flex items-center gap-2">
                    {selectedLeases.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={() => setLeasesToDelete(selectedLeases)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedLeases.length})
                        </Button>
                    )}
                    <Button size="sm" onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Manual
                    </Button>
                </div>
            </div>
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedLeases.length === staticLeases.length && staticLeases.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>MAC Address</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading static leases...</TableCell></TableRow>}
                        {error && <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">Failed to load static leases.</TableCell></TableRow>}
                        {!isLoading && staticLeases.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">No static leases found.</TableCell></TableRow>}
                        {staticLeases.map((lease) => (
                             <TableRow key={lease['.id']} data-state={selectedLeases.some(l => l['.id'] === lease['.id']) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedLeases.some(l => l['.id'] === lease['.id'])}
                                        onCheckedChange={(checked) => handleSelectSingle(checked, lease)}
                                    />
                                </TableCell>
                                <TableCell className="font-mono">{lease.address}</TableCell>
                                <TableCell className="font-mono">{lease['mac-address']}</TableCell>
                                <TableCell>{lease.comment}</TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(lease)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setLeasesToDelete([lease])}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {isFormOpen && (
                <DhcpLeaseFormDialog
                    isOpen={isFormOpen}
                    setIsOpen={setIsFormOpen}
                    lease={editingLease}
                    mode={formMode}
                    onSave={mutate}
                />
            )}

            <AlertDialog open={leasesToDelete.length > 0} onOpenChange={() => setLeasesToDelete([])}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently remove {leasesToDelete.length} static lease(s). This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}