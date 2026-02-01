// src/components/tabs/ActiveHostsTab.jsx
import { useState, useMemo } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ZapOff, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import IpBindingFormDialog from "@/components/dialogs/IpBindingFormDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next"; //

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

export default function ActiveHostsTab({ token, onMakeBindingSuccess }) {
    const { t } = useTranslation(); //
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHosts, setSelectedHosts] = useState([]);
    const [actionState, setActionState] = useState({ isOpen: false, type: null, data: null });
    const [bindingFromHost, setBindingFromHost] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data: allHosts, error, isLoading, mutate } = useSWR(
        ['/mikrotik/hotspot/active', token],
        ([url, token]) => fetcher(url, token)
    );

    const filteredHosts = useMemo(() => {
        if (!allHosts) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        return allHosts.filter(host =>
            Object.values(host).some(val =>
                String(val).toLowerCase().includes(lowercasedFilter)
            )
        );
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
            '.id': host['.id'],
            'mac-address': host['mac-address'],
            address: host.address,
            toAddress: host.address,
            comment: host.user || host.comment,
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
                '.id': h['.id'],
                'mac-address': h['mac-address'],
                address: h.address,
                toAddress: h.address,
                comment: h.comment || h.user,
                server: h.server || 'all'
            }));

            toast.promise(
                axiosInstance.post('/mikrotik/hotspot/bindings', { hosts: hostsToBind, type: bindingType }, { headers: { Authorization: `Bearer ${token}` } }),
                {
                    loading: t('hotspot_management_page.toast.creating_bindings', { type: bindingType }),
                    success: (res) => { handleActionSuccess(); return t('hotspot_management_page.toast.bindings_created', { count: res.data.data.createdCount }); },
                    error: (err) => err.response?.data?.message || t('hotspot_management_page.toast.create_failed'),
                }
            );
        } else if (type === 'kick') {
            const idsToKick = (Array.isArray(data) ? data : [data]).map(h => h['.id']);
             toast.promise(
                axiosInstance.post('/mikrotik/hotspot/kick', { ids: idsToKick }, { headers: { Authorization: `Bearer ${token}` } }),
                {
                    loading: t('hotspot_management_page.toast.kicking'),
                    success: (res) => { mutate(); setSelectedHosts([]); return res.data.message; },
                    error: (err) => err.response?.data?.message || t('kick_dialog.error'),
                }
            );
        }
        closeConfirmation();
    };

    const getDialogDescription = () => {
        if (!actionState.type) return '';
        const count = Array.isArray(actionState.data) ? actionState.data.length : 1;
        switch (actionState.type) {
            case 'make-bypassed': return t('hotspot_management_page.dialogs.bypassed_confirm', { count });
            case 'make-blocked': return t('hotspot_management_page.dialogs.blocked_confirm', { count });
            case 'kick': return t('hotspot_management_page.dialogs.kick_confirm', { count });
            default: return t('are_you_sure');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <Input placeholder={t('hotspot_management_page.search_active')} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="max-w-sm"/>
                {selectedHosts.length > 0 && (
                     <div className="flex items-center gap-2">
                         <Button size="sm" onClick={() => openConfirmation('make-bypassed', selectedHosts)}><ShieldCheck className="mr-2 h-4 w-4"/>{t('hotspot_management_page.buttons.make_bypassed')}</Button>
                         <Button size="sm" variant="destructive" onClick={() => openConfirmation('make-blocked', selectedHosts)}><ShieldX className="mr-2 h-4 w-4"/>{t('hotspot_management_page.buttons.make_blocked')}</Button>
                         <Button size="sm" variant="outline" onClick={() => openConfirmation('kick', selectedHosts)}><ZapOff className="mr-2 h-4 w-4"/>{t('hotspot_management_page.buttons.kick_selected')}</Button>
                     </div>
                )}
            </div>
             <div className="border rounded-md">
                <Table>
                    <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={selectedHosts.length === pagedHosts.length && pagedHosts.length > 0} onCheckedChange={handleSelectAll} /></TableHead><TableHead>{t('table_headers.user')}</TableHead><TableHead>{t('table_headers.ip_address')}</TableHead><TableHead>{t('table_headers.mac_address')}</TableHead><TableHead>{t('hotspot_management_page.table.uptime')}</TableHead><TableHead>{t('table_headers.description')}</TableHead><TableHead className="text-center">{t('table_headers.actions')}</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={7} className="h-24 text-center">{t('hotspot_management_page.loading_active')}</TableCell></TableRow>}
                        {error && <TableRow><TableCell colSpan={7} className="h-24 text-center text-destructive">{t('hotspot_management_page.error_active')}</TableCell></TableRow>}
                        {!isLoading && pagedHosts.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center">{t('hotspot_management_page.no_active_found')}</TableCell></TableRow>}
                        {pagedHosts.map(host => (
                            <TableRow key={host['.id']} data-state={selectedHosts.some(h => h['.id'] === host['.id']) && "selected"}>
                                <TableCell><Checkbox checked={selectedHosts.some(h => h['.id'] === host['.id'])} onCheckedChange={(checked) => handleSelectSingle(checked, host)}/></TableCell>
                                <TableCell>{host.user || 'N/A'}</TableCell><TableCell className="font-mono">{host.address}</TableCell><TableCell className="font-mono">{host['mac-address']}</TableCell><TableCell>{host.uptime}</TableCell><TableCell>{host.comment}</TableCell>
                                <TableCell className="text-center">
                                     <div className="inline-flex items-center justify-center gap-1">
                                         <TooltipProvider>
                                             <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleMakeBindingSingle(host, 'bypassed')}><ShieldCheck className="h-4 w-4 text-green-600"/></Button></TooltipTrigger><TooltipContent><p>{t('hotspot_management_page.tooltips.make_bypass')}</p></TooltipContent></Tooltip>
                                             <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleMakeBindingSingle(host, 'blocked')}><ShieldX className="h-4 w-4 text-red-600"/></Button></TooltipTrigger><TooltipContent><p>{t('hotspot_management_page.tooltips.make_block')}</p></TooltipContent></Tooltip>
                                             <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openConfirmation('kick', host)}><ZapOff className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>{t('hotspot_management_page.tooltips.kick_host')}</p></TooltipContent></Tooltip>
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
                    <Label htmlFor="rows-per-page-active">{t('pagination.rows_per_page')}</Label>
                    <Select value={`${rowsPerPage}`} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                        <SelectTrigger id="rows-per-page-active" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(n => (<SelectItem key={n} value={`${n}`}>{n}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    {t('pagination.page_info', { currentPage: page, totalPages: totalPages, totalItems: filteredHosts.length })}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                        {t('pagination.previous')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                        {t('pagination.next')}
                    </Button>
                </div>
            </div>

             <AlertDialog open={actionState.isOpen} onOpenChange={closeConfirmation}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('hotspot_management_page.dialogs.confirm_action')}</AlertDialogTitle><AlertDialogDescription>{getDialogDescription()}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={handleConfirmAction}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            {bindingFromHost && (<IpBindingFormDialog isOpen={!!bindingFromHost} setIsOpen={() => setBindingFromHost(null)} initialData={bindingFromHost} onSave={handleActionSuccess} />)}
        </div>
    );
}