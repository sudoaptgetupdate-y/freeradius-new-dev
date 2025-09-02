// src/pages/HotspotManagementPage.jsx
import { useState, useMemo, useCallback, useEffect } from "react";
import useSWR from 'swr';
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Link2, Edit, ZapOff, ShieldCheck, ShieldX, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import IpBindingFormDialog from "@/components/dialogs/IpBindingFormDialog";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

// --- START: Pagination Component for Active Hosts ---
function DataTablePagination({ table, rowCount }) {
    const { pageIndex, pageSize } = table.getState().pagination;

    return (
        <div className="flex items-center justify-between px-2 mt-4">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {rowCount} row(s) selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
// --- END: Pagination Component ---

// --- Active Hosts Tab Component ---
const ActiveHostsTab = ({ token, onMakeBindingSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHosts, setSelectedHosts] = useState([]);
    const [actionState, setActionState] = useState({ isOpen: false, type: null, data: null });
    const [bindingFromHost, setBindingFromHost] = useState(null);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

    const { data: allHosts, error, isLoading, mutate } = useSWR(
        ['/mikrotik/hotspot/active', token],
        ([url, token]) => fetcher(url, token)
    );

    const filteredHosts = useMemo(() => {
        if (!allHosts) return [];
        if (!searchTerm) return allHosts;
        const lowercasedFilter = searchTerm.toLowerCase();
        return allHosts.filter(host =>
            Object.values(host).some(val =>
                String(val).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [allHosts, searchTerm]);

    const paginatedHosts = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        const end = start + pagination.pageSize;
        return filteredHosts.slice(start, end);
    }, [filteredHosts, pagination]);

    const pageCount = useMemo(() => {
        return Math.ceil(filteredHosts.length / pagination.pageSize);
    }, [filteredHosts.length, pagination.pageSize]);

    const handleSelectAll = (checked) => {
        setSelectedHosts(checked ? paginatedHosts : []);
    };
    
    // Fake table object for pagination component
    const table = {
        getState: () => ({ pagination }),
        setPageSize: (size) => setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 })),
        setPageIndex: (index) => setPagination(prev => ({ ...prev, pageIndex: index })),
        previousPage: () => setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1)})),
        nextPage: () => setPagination(prev => ({ ...prev, pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1)})),
        getCanPreviousPage: () => pagination.pageIndex > 0,
        getCanNextPage: () => pagination.pageIndex < pageCount - 1,
        getPageCount: () => pageCount,
        getFilteredSelectedRowModel: () => ({ rows: selectedHosts }),
    };


    const handleSelectSingle = (checked, host) => {
        setSelectedHosts(prev =>
            checked ? [...prev, host] : prev.filter(h => h['.id'] !== host['.id'])
        );
    };

    const openConfirmation = (type, data) => {
        setActionState({ isOpen: true, type, data });
    };

    const closeConfirmation = () => {
        setActionState({ isOpen: false, type: null, data: null });
    };

    const handleMakeBypassSingle = (host) => {
        setBindingFromHost({
            'mac-address': host['mac-address'],
            address: host.address,
            comment: host.user,
            type: 'bypassed'
        });
    };
    
    const handleActionSuccess = () => {
        mutate();
        onMakeBindingSuccess();
        setSelectedHosts([]);
        setBindingFromHost(null);
    };

    const handleConfirmAction = async () => {
        const { type, data } = actionState;
        
        if (type.startsWith('make')) {
            const bindingType = type.split('-')[1];
            const hostsToBind = Array.isArray(data) ? data : [data];
            toast.promise(
                axiosInstance.post('/mikrotik/hotspot/bindings', { hosts: hostsToBind, type: bindingType }, { headers: { Authorization: `Bearer ${token}` } }),
                {
                    loading: `Creating ${bindingType} binding(s)...`,
                    success: (res) => {
                        handleActionSuccess();
                        return `${res.data.data.createdCount} binding(s) created.`;
                    },
                    error: (err) => err.response?.data?.message || 'Failed to create bindings.',
                }
            );
        } else if (type === 'kick') {
            const hostsToKick = Array.isArray(data) ? data : [data];
            const idsToKick = hostsToKick.map(h => h['.id']);
             toast.promise(
                axiosInstance.post('/mikrotik/hotspot/kick', { ids: idsToKick }, { headers: { Authorization: `Bearer ${token}` } }),
                {
                    loading: `Kicking host(s)...`,
                    success: (res) => {
                        mutate();
                        setSelectedHosts([]);
                        return res.data.message;
                    },
                    error: (err) => err.response?.data?.message || 'Failed to kick hosts.',
                }
            );
        }
        closeConfirmation();
    };

    const getDialogDescription = () => {
        if (!actionState.type) return '';
        const isBulk = Array.isArray(actionState.data);
        const count = isBulk ? actionState.data.length : 1;
        
        switch (actionState.type) {
            case 'make-bypassed': return `This will create a permanent "bypassed" IP Binding for the ${count} selected host(s).`;
            case 'make-blocked': return `This will create a permanent "blocked" IP Binding for the ${count} selected host(s).`;
            case 'kick': return `Are you sure you want to disconnect the ${count} selected host(s)?`;
            default: return 'Are you sure?';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <Input
                    placeholder="Search active hosts..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        table.setPageIndex(0); // Reset page on search
                    }}
                    className="max-w-sm"
                />
                {selectedHosts.length > 0 && (
                     <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => openConfirmation('make-bypassed', selectedHosts)}><ShieldCheck className="mr-2 h-4 w-4"/>Make Bypassed</Button>
                        <Button size="sm" variant="destructive" onClick={() => openConfirmation('make-blocked', selectedHosts)}><ShieldX className="mr-2 h-4 w-4"/>Make Blocked</Button>
                        <Button size="sm" variant="outline" onClick={() => openConfirmation('kick', selectedHosts)}><ZapOff className="mr-2 h-4 w-4"/>Kick Selected</Button>
                    </div>
                )}
            </div>
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"><Checkbox checked={selectedHosts.length === paginatedHosts.length && paginatedHosts.length > 0} onCheckedChange={handleSelectAll} /></TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>MAC Address</TableHead>
                            <TableHead>Uptime</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading active hosts...</TableCell></TableRow>}
                        {error && <TableRow><TableCell colSpan={7} className="h-24 text-center text-destructive">Failed to load active hosts.</TableCell></TableRow>}
                        {!isLoading && paginatedHosts.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center">No active hosts found.</TableCell></TableRow>}
                        {paginatedHosts.map(host => (
                            <TableRow key={host['.id']} data-state={selectedHosts.some(h => h['.id'] === host['.id']) && "selected"}>
                                <TableCell><Checkbox checked={selectedHosts.some(h => h['.id'] === host['.id'])} onCheckedChange={(checked) => handleSelectSingle(checked, host)}/></TableCell>
                                <TableCell>{host.user || 'N/A'}</TableCell>
                                <TableCell className="font-mono">{host.address}</TableCell>
                                <TableCell className="font-mono">{host['mac-address']}</TableCell>
                                <TableCell>{host.uptime}</TableCell>
                                <TableCell>{host.comment}</TableCell>
                                <TableCell className="text-center">
                                     <div className="inline-flex items-center justify-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleMakeBypassSingle(host)}><ShieldCheck className="h-4 w-4 text-green-600"/></Button></TooltipTrigger><TooltipContent><p>Make Bypass</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openConfirmation('make-blocked', host)}><ShieldX className="h-4 w-4 text-red-600"/></Button></TooltipTrigger><TooltipContent><p>Make Block</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openConfirmation('kick', host)}><ZapOff className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Kick Host</p></TooltipContent></Tooltip>
                                        </TooltipProvider>
                                     </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
             <DataTablePagination table={table} rowCount={filteredHosts.length} />
             <AlertDialog open={actionState.isOpen} onOpenChange={closeConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirm Action</AlertDialogTitle><AlertDialogDescription>{getDialogDescription()}</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmAction}>Confirm</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {bindingFromHost && (<IpBindingFormDialog isOpen={!!bindingFromHost} setIsOpen={() => setBindingFromHost(null)} initialData={bindingFromHost} onSave={handleActionSuccess} />)}
        </div>
    );
};


// --- IP Bindings Tab Component (Reusing existing logic) ---
const IpBindingsTab = ({ token, refreshTrigger, onRefreshDone }) => {
    const [typeFilter, setTypeFilter] = useState("");
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingBinding, setEditingBinding] = useState(null);
    const [bindingToDelete, setBindingToDelete] = useState(null);
    const { data: bindings, pagination, isLoading, searchTerm, handleSearchChange, handlePageChange, handleItemsPerPageChange, refreshData } = usePaginatedFetch("/mikrotik/bindings", 10, { type: typeFilter });
    
    useEffect(() => {
        if (refreshTrigger) {
            refreshData();
            onRefreshDone();
        }
    }, [refreshTrigger, refreshData, onRefreshDone]);
    const handleAddNew = () => { setEditingBinding(null); setIsFormDialogOpen(true); };
    const handleEdit = (binding) => { setEditingBinding(binding); setIsFormDialogOpen(true); };
    const handleDelete = (binding) => { setBindingToDelete(binding); };
    
    const confirmDelete = async () => {
        if (!bindingToDelete) return;
        toast.promise(
            axiosInstance.delete(`/mikrotik/bindings/${bindingToDelete['.id']}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Removing IP Binding...",
                success: () => { refreshData(); return `Binding for '${bindingToDelete['mac-address']}' removed.`; },
                error: (err) => err.response?.data?.message || "Failed to remove binding.",
                finally: () => setBindingToDelete(null)
            }
        );
    };
    
    const getTypeBadge = (type) => {
        switch(type) {
            case 'bypassed': return <Badge variant="success">Bypassed</Badge>;
            case 'blocked': return <Badge variant="destructive">Blocked</Badge>;
            default: return <Badge variant="secondary">Regular</Badge>;
        }
    };
    
    return (
        <div>
             <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Input placeholder="Search by MAC, IP, Comment..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="flex-grow"/>
                <Select onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)} value={typeFilter || "all"}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by type..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="bypassed">Bypassed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                </Select>
                 <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add Manual Binding</Button>
            </div>
             <div className="border rounded-md">
                <TooltipProvider delayDuration={0}>
                    <Table>
                        <TableHeader><TableRow><TableHead>MAC Address</TableHead><TableHead>Address</TableHead><TableHead>To Address</TableHead><TableHead>Type</TableHead><TableHead>Comment</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading && [...Array(pagination.itemsPerPage)].map((_, i) => (<TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>))}
                            {!isLoading && bindings.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No IP bindings found.</TableCell></TableRow>}
                            {bindings.map((binding) => (
                                <TableRow key={binding['.id']}>
                                    <TableCell className="font-mono">{binding['mac-address']}</TableCell><TableCell>{binding.address}</TableCell><TableCell>{binding['to-address']}</TableCell><TableCell>{getTypeBadge(binding.type)}</TableCell><TableCell>{binding.comment}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex gap-1">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(binding)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Edit Binding</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(binding)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Remove Binding</p></TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </div>
             <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Page {pagination.currentPage} of {pagination.totalPages}</p>
                <div className="flex items-center space-x-2">
                    <Select onValueChange={(value) => handleItemsPerPageChange(Number(value))} defaultValue={`${pagination.itemsPerPage}`}>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="Rows per page" /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(size => (<SelectItem key={size} value={`${size}`}>{size} rows</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>Next</Button>
                </div>
            </div>
            {isFormDialogOpen && <IpBindingFormDialog isOpen={isFormDialogOpen} setIsOpen={setIsFormDialogOpen} binding={editingBinding} onSave={refreshData} />}
            <AlertDialog open={!!bindingToDelete} onOpenChange={() => setBindingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the IP Binding for MAC address: <strong>{bindingToDelete?.['mac-address']}</strong>.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Confirm Remove</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};


// --- Main Page Component ---
export default function HotspotManagementPage() {
    const token = useAuthStore((state) => state.token);
    const [refreshBindings, setRefreshBindings] = useState(false);

    const handleMakeBindingSuccess = useCallback(() => { setRefreshBindings(true); }, []);
    const handleRefreshDone = useCallback(() => { setRefreshBindings(false); }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link2 className="h-6 w-6" />Hotspot Management</CardTitle>
                <CardDescription>Oversee active users and manage permanent IP bindings for the Mikrotik Hotspot.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="active-hosts" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active-hosts">Active Hosts</TabsTrigger>
                        <TabsTrigger value="ip-bindings">IP Bindings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active-hosts" className="mt-4">
                       <ActiveHostsTab token={token} onMakeBindingSuccess={handleMakeBindingSuccess} />
                    </TabsContent>
                    <TabsContent value="ip-bindings" className="mt-4">
                        <IpBindingsTab token={token} refreshTrigger={refreshBindings} onRefreshDone={handleRefreshDone} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}