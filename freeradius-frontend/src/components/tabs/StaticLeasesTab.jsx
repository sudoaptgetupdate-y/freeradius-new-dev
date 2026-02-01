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
import { useTranslation } from "react-i18next"; //

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

export default function StaticLeasesTab({ token }) {
    const { t } = useTranslation(); //
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeases, setSelectedLeases] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLease, setEditingLease] = useState(null);
    const [formMode, setFormMode] = useState('addStatic');
    const [leasesToDelete, setLeasesToDelete] = useState([]);

    const { data: allLeases, mutate, isLoading } = useSWR(['/mikrotik/dhcp/leases', token], ([url, t]) => fetcher(url, t), { revalidateOnFocus: true });

    const staticLeases = useMemo(() => {
        const list = Array.isArray(allLeases) ? allLeases.filter(l => l.dynamic === 'false' || !l.dynamic) : [];
        const q = searchTerm.toLowerCase();
        return q ? list.filter(l => Object.values(l).some(v => String(v).toLowerCase().includes(q))) : list;
    }, [allLeases, searchTerm]);
    
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(staticLeases.length / rowsPerPage));
    const page = Math.min(currentPage, totalPages);
    const paged = staticLeases.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const handleSelectAll = (checked) => setSelectedLeases(checked ? paged : []);
    const handleSelectSingle = (checked, l) => setSelectedLeases(prev => checked ? [...prev, l] : prev.filter(x => x['.id'] !== l['.id']));

    const confirmDelete = async () => {
        const ids = leasesToDelete.map(l => l['.id']);
        toast.promise(
            axiosInstance.post(`/mikrotik/dhcp/leases/delete`, { ids }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('saving'),
                success: () => { mutate(); setSelectedLeases([]); return t('ip_management_page.toast.delete_static_success', { count: ids.length }); },
                error: (err) => err.response?.data?.message || t('ip_management_page.toast.delete_static_error'),
                finally: () => setLeasesToDelete([])
            }
        );
    };
    
    return (
        <div>
             <div className="flex justify-between items-center mb-4">
                <Input placeholder={t('ip_management_page.search_static')} value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="max-w-sm" />
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => { setEditingLease(null); setFormMode('addStatic'); setIsFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> {t('ip_management_page.add_static')}</Button>
                    {selectedLeases.length > 0 && <Button variant="destructive" size="sm" onClick={() => setLeasesToDelete(selectedLeases)}><Trash2 className="mr-2 h-4 w-4" /> {t('ip_management_page.delete_selected', { count: selectedLeases.length })}</Button>}
                </div>
            </div>
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"><Checkbox checked={selectedLeases.length === paged.length && paged.length > 0} onCheckedChange={handleSelectAll} /></TableHead>
                            <TableHead>{t('table_headers.ip_address')}</TableHead><TableHead>{t('table_headers.mac_address')}</TableHead><TableHead>{t('table_headers.radius_profile')}</TableHead><TableHead>{t('table_headers.description')}</TableHead><TableHead className="text-center">{t('table_headers.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? <TableRow><TableCell colSpan={6} className="h-24 text-center">{t('loading')}</TableCell></TableRow> : paged.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">{t('ip_management_page.no_static_found')}</TableCell></TableRow> : paged.map((l) => (
                             <TableRow key={l['.id']} data-state={selectedLeases.some(x => x['.id'] === l['.id']) && "selected"}>
                                <TableCell><Checkbox checked={selectedLeases.some(x => x['.id'] === l['.id'])} onCheckedChange={(c) => handleSelectSingle(c, l)} /></TableCell>
                                <TableCell className="font-mono">{l.address}</TableCell><TableCell className="font-mono">{l['mac-address']}</TableCell><TableCell>{l.server}</TableCell><TableCell>{l.comment}</TableCell>
                                <TableCell className="text-center"><Button variant="ghost" size="icon" onClick={() => { setEditingLease(l); setFormMode('editStatic'); setIsFormOpen(true); }}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => setLeasesToDelete([l])}><Trash2 className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Label htmlFor="rows-static">{t('pagination.rows_per_page')}</Label><Select value={`${rowsPerPage}`} onValueChange={(v)=>{ setRowsPerPage(Number(v)); setCurrentPage(1); }}><SelectTrigger id="rows-static" className="w-20"><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 50, 100].map(n => (<SelectItem key={n} value={`${n}`}>{n}</SelectItem>))}</SelectContent></Select></div>
                <div className="text-sm text-muted-foreground">{t('pagination.page_info', { currentPage: page, totalPages: totalPages, totalItems: staticLeases.length })}</div>
                <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={page<=1}>{t('pagination.previous')}</Button><Button variant="outline" size="sm" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>{t('pagination.next')}</Button></div>
            </div>
            {(isFormOpen || editingLease) && <DhcpLeaseFormDialog isOpen={isFormOpen || !!editingLease} setIsOpen={() => { setIsFormOpen(false); setEditingLease(null); }} lease={editingLease} mode={isFormOpen && !editingLease ? 'addStatic' : 'editStatic'} onSave={mutate} />}
            <AlertDialog open={leasesToDelete.length > 0} onOpenChange={() => setLeasesToDelete([])}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('ip_management_page.dialogs.delete_title')}</AlertDialogTitle><AlertDialogDescription>{t('ip_management_page.dialogs.delete_static_desc', { count: leasesToDelete.length })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
    );
}