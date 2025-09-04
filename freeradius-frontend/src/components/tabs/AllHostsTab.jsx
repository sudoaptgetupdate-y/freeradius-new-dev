// src/components/tabs/AllHostsTab.jsx
import { useState, useMemo } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import IpBindingFormDialog from "@/components/dialogs/IpBindingFormDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

export default function AllHostsTab({ token, onMakeBindingSuccess }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHosts, setSelectedHosts] = useState([]);
    const [actionState, setActionState] = useState({ isOpen: false, type: null, data: null });
    const [bindingFromHost, setBindingFromHost] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data: allHosts, error, isLoading, mutate } = useSWR(['/mikrotik/hotspot/hosts', token], ([url, token]) => fetcher(url, token));

    const filteredHosts = useMemo(() => {
        if (!allHosts) return [];
        if (!searchTerm) return allHosts;
        const lowercasedFilter = searchTerm.toLowerCase();
        return allHosts.filter(host => Object.values(host).some(val => String(val).toLowerCase().includes(lowercasedFilter)));
    }, [allHosts, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredHosts.length / rowsPerPage));
    const page = Math.min(currentPage, totalPages);
    const pagedHosts = filteredHosts.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    
    const handleSelectAll = (checked) => setSelectedHosts(checked ? pagedHosts : []);
    const handleSelectSingle = (checked, host) => setSelectedHosts(prev => checked ? [...prev, host] : prev.filter(h => h['.id'] !== host['.id']));
    const openConfirmation = (type, data) => setActionState({ isOpen: true, type, data });
    const closeConfirmation = () => setActionState({ isOpen: false, type: null, data: null });
    
    const handleMakeBindingSingle = (host, type) => {
        setBindingFromHost({
            'mac-address': host['mac-address'],
            address: '',
            toAddress: '', // Ensure 'To Address' is always empty on dialog open
            comment: `Host: ${host['mac-address']}`,
            type: type,
            server: 'all'
        });
    };
    
    const handleActionSuccess = () => { mutate(); onMakeBindingSuccess(); setSelectedHosts([]); setBindingFromHost(null); };

    const handleConfirmAction = async () => {
        const { type, data } = actionState;
        if (type.startsWith('make')) {
            const bindingType = type.split('-')[1];
            const hostsArray = Array.isArray(data) ? data : [data];
            
            const hostsToBind = hostsArray.map(h => ({
                'mac-address': h['mac-address'],
                address: '0.0.0.0',
                comment: h.comment || `Host: ${h['mac-address']}`,
                server: h.server || 'all'
            }));
            
            toast.promise(
                axiosInstance.post('/mikrotik/hotspot/bindings', { hosts: hostsToBind, type: bindingType }, { headers: { Authorization: `Bearer ${token}` } }),
                {
                    loading: `Creating ${bindingType} binding(s)...`,
                    success: (res) => { handleActionSuccess(); return `${res.data.data.createdCount} binding(s) created.`; },
                    error: (err) => err.response?.data?.message || 'Failed to create bindings.',
                }
            );
        }
        closeConfirmation();
    };

    const getDialogDescription = () => {
        if (!actionState.type) return '';
        const count = Array.isArray(actionState.data) ? actionState.data.length : 1;
        switch (actionState.type) {
            case 'make-bypassed': return `This will create a "bypassed" IP Binding for the ${count} selected host(s).`;
            case 'make-blocked': return `This will create a "blocked" IP Binding for the ${count} selected host(s).`;
            default: return 'Are you sure?';
        }
    };

    const getHostStatusBadge = (host) => {
        if (host.bypassed === 'true') return <Badge variant="success">Bypassed</Badge>;
        if (host.authorized === 'true') return <Badge variant="default">Authorized</Badge>;
        return <Badge variant="secondary">Regular</Badge>;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <Input placeholder="Search all hosts..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="max-w-sm"/>
                {selectedHosts.length > 0 && (
                     <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => openConfirmation('make-bypassed', selectedHosts)}><ShieldCheck className="mr-2 h-4 w-4"/>Make Bypassed</Button>
                        <Button size="sm" variant="destructive" onClick={() => openConfirmation('make-blocked', selectedHosts)}><ShieldX className="mr-2 h-4 w-4"/>Make Blocked</Button>
                    </div>
                )}
            </div>
             <div className="border rounded-md">
                <Table>
                    <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={selectedHosts.length === pagedHosts.length && pagedHosts.length > 0} onCheckedChange={handleSelectAll} /></TableHead><TableHead>MAC Address</TableHead><TableHead>To Address</TableHead><TableHead>Server</TableHead><TableHead>Status</TableHead><TableHead>Comment</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading hosts...</TableCell></TableRow>}
                        {error && <TableRow><TableCell colSpan={7} className="h-24 text-center text-destructive">Failed to load hosts.</TableCell></TableRow>}
                        {!isLoading && pagedHosts.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center">No hosts found.</TableCell></TableRow>}
                        {pagedHosts.map(host => (
                            <TableRow key={host['.id']} data-state={selectedHosts.some(h => h['.id'] === host['.id']) && "selected"}>
                                <TableCell><Checkbox checked={selectedHosts.some(h => h['.id'] === host['.id'])} onCheckedChange={(checked) => handleSelectSingle(checked, host)}/></TableCell>
                                <TableCell className="font-mono">{host['mac-address']}</TableCell><TableCell className="font-mono">{host['to-address']}</TableCell><TableCell>{host.server}</TableCell><TableCell>{getHostStatusBadge(host)}</TableCell><TableCell>{host.comment}</TableCell>
                                <TableCell className="text-center">
                                     <div className="inline-flex items-center justify-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleMakeBindingSingle(host, 'bypassed')}><ShieldCheck className="h-4 w-4 text-green-600"/></Button></TooltipTrigger><TooltipContent><p>Make Bypass</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleMakeBindingSingle(host, 'blocked')}><ShieldX className="h-4 w-4 text-red-600"/></Button></TooltipTrigger><TooltipContent><p>Make Block</p></TooltipContent></Tooltip>
                                        </TooltipProvider>
                                     </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Label htmlFor="rows-per-page-all">Rows per page:</Label>
                    <Select value={`${rowsPerPage}`} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                        <SelectTrigger id="rows-per-page-all" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(n => (<SelectItem key={n} value={`${n}`}>{n}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({filteredHosts.length} items)
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                        Next
                    </Button>
                </div>
            </div>

            <AlertDialog open={actionState.isOpen} onOpenChange={closeConfirmation}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Action</AlertDialogTitle><AlertDialogDescription>{getDialogDescription()}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmAction}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            {bindingFromHost && (<IpBindingFormDialog isOpen={!!bindingFromHost} setIsOpen={() => setBindingFromHost(null)} initialData={bindingFromHost} onSave={handleActionSuccess} />)}
        </div>
    );
};