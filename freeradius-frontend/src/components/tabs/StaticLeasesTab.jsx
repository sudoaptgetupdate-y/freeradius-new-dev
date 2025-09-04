// src/components/tabs/StaticLeasesTab.jsx
import { useState, useMemo } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

    const isStatic = (lease) => {
        return lease.dynamic === 'false' || !lease.dynamic;
    };
    
    const staticLeases = useMemo(() => {
        if (!allLeases) return [];
        const staticOnly = allLeases.filter(lease => isStatic(lease));
        if (!searchTerm) return staticOnly;
        
        const lowercasedFilter = searchTerm.toLowerCase();
        return staticOnly.filter(lease =>
            Object.values(lease).some(val =>
                String(val).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [allLeases, searchTerm]);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const totalPages = Math.max(1, Math.ceil(staticLeases.length / rowsPerPage));
    const page = Math.min(currentPage, totalPages);
    const paged = staticLeases.slice((page - 1) * rowsPerPage, page * rowsPerPage);


    const handleSelectAll = (checked) => {
        setSelectedLeases(checked ? paged : []);
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
                <Input placeholder="Search static leases..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="max-w-sm" />
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Static Lease
                    </Button>
                    {selectedLeases.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={() => setLeasesToDelete(selectedLeases)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected ({selectedLeases.length})
                        </Button>
                    )}
                </div>
            </div>
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedLeases.length === paged.length && paged.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>MAC Address</TableHead>
                            <TableHead>Server</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading static leases...</TableCell></TableRow>}
                        {error && <TableRow><TableCell colSpan={6} className="h-24 text-center text-destructive">Failed to load static leases.</TableCell></TableRow>}
                        {!isLoading && paged.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No static leases found.</TableCell></TableRow>}
                        {paged.map((lease) => (
                             <TableRow key={lease['.id']} data-state={selectedLeases.some(l => l['.id'] === lease['.id']) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedLeases.some(l => l['.id'] === lease['.id'])}
                                        onCheckedChange={(checked) => handleSelectSingle(checked, lease)}
                                    />
                                </TableCell>
                                <TableCell className="font-mono">{lease.address}</TableCell>
                                <TableCell className="font-mono">{lease['mac-address']}</TableCell>
                                <TableCell>{lease.server}</TableCell>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Label htmlFor="rows-per-page-static">Rows per page:</Label>
                    <Select value={`${rowsPerPage}`} onValueChange={(v)=>{ setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                        <SelectTrigger id="rows-per-page-static" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(n => (<SelectItem key={n} value={`${n}`}>{n}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({staticLeases.length} items)
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={page<=1}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>
                        Next
                    </Button>
                </div>
            </div>

            {(isFormOpen || editingLease) && (
                <DhcpLeaseFormDialog
                    isOpen={isFormOpen || !!editingLease}
                    setIsOpen={() => { setIsFormOpen(false); setEditingLease(null); }}
                    lease={editingLease}
                    mode={isFormOpen && !editingLease ? 'addStatic' : 'editStatic'}
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