// src/components/tabs/DhcpLeasesTab.jsx
import { useState, useMemo } from "react";
import useSWR from 'swr';
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import DhcpLeaseFormDialog from "@/components/dialogs/DhcpLeaseFormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

export default function DhcpLeasesTab({ token }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const { data: leases, mutate, isLoading } = useSWR(['/mikrotik/dhcp/leases', token], ([url, t]) => fetcher(url, t));

  const [selected, setSelected] = useState([]);
  const [leasesToDelete, setLeasesToDelete] = useState([]);
  const [makeStaticLease, setMakeStaticLease] = useState(null);

  // computed filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = Array.isArray(leases) ? leases : [];
    return list.filter(l => {
      const ip = (l.address || '').toLowerCase();
      const mac = (l["mac-address"] || l.macAddress || '').toLowerCase();
      const host = (l["active-host-name"] || l["host-name"] || '').toLowerCase();
      const status = (l.status || (l.dynamic ? "dynamic" : "static") || '').toLowerCase();
      const matchesSearch = !q || ip.includes(q) || mac.includes(q) || host.includes(q);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leases, search, statusFilter]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const toggleAll = (checked) => {
    setSelected(checked ? paged : []);
  };
  const toggleRow = (lease, checked) => {
    setSelected(prev => checked ? [...prev, lease] : prev.filter(x => (x[".id"]||x.id) !== (lease[".id"]||lease.id)));
  };

  const confirmDelete = async () => {
    const items = leasesToDelete;
    setLeasesToDelete([]);
    try {
      for (const l of items) {
        const id = encodeURIComponent(l[".id"] || l.id);
        await axiosInstance.delete(`/mikrotik/dhcp/leases/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      }
      toast.success(`Deleted ${items.length} lease(s).`);
      mutate();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete some leases.");
    }
  };

  const formatStatus = (l) => {
    const s = (l.status || "").toLowerCase();
    if (s) return s;
    return l.dynamic ? "dynamic" : "static";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <Label>Search</Label>
          <Input placeholder="Search IP / MAC / Hostname" value={search} onChange={(e)=>{ setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <div className="min-w-[200px]">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={(v)=>{ setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="bound">bound</SelectItem>
              <SelectItem value="waiting">waiting</SelectItem>
              <SelectItem value="offered">offered</SelectItem>
              <SelectItem value="busy">busy</SelectItem>
              <SelectItem value="testing">testing</SelectItem>
              <SelectItem value="expired">expired</SelectItem>
              <SelectItem value="blocked">blocked</SelectItem>
              <SelectItem value="static">static</SelectItem>
              <SelectItem value="dynamic">dynamic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-end gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setLeasesToDelete(selected)}
            disabled={selected.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.length > 0 && selected.length === paged.length}
                  onCheckedChange={(v)=>toggleAll(!!v)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Hostname</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No data</TableCell></TableRow>
            ) : paged.map((l) => {
              const id = l[".id"] || l.id;
              const status = formatStatus(l);
              const host = l["active-host-name"] || l["host-name"] || "-";
              return (
                <TableRow key={id}>
                  <TableCell>
                    <Checkbox
                      checked={!!selected.find(x => (x[".id"]||x.id) === id)}
                      onCheckedChange={(v)=>toggleRow(l, !!v)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell>{l.address || "-"}</TableCell>
                  <TableCell>{(l["mac-address"] || l.macAddress || "").toUpperCase()}</TableCell>
                  <TableCell>{host}</TableCell>
                  <TableCell>
                    <Badge variant={status === "bound" || status === "static" ? "default" : status === "dynamic" ? "secondary" : "outline"}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setMakeStaticLease(l)}>
                      <Lock className="w-4 h-4 mr-1" /> Make Static
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(page-1)*rowsPerPage + 1}–{Math.min(page*rowsPerPage, filtered.length)} of {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <Label className="mr-2">Rows per page</Label>
          <Select value={`${rowsPerPage}`} onValueChange={(v)=>{ setRowsPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[110px]"><SelectValue placeholder={`${rowsPerPage}`} /></SelectTrigger>
            <SelectContent>
              {[10,20,50,100].map(n => <SelectItem key={n} value={`${n}`}>{n} rows</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={page<=1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>Next</Button>
        </div>
      </div>

      {makeStaticLease && (
        <DhcpLeaseFormDialog
          isOpen={!!makeStaticLease}
          setIsOpen={() => setMakeStaticLease(null)}
          lease={makeStaticLease}
          mode="makeStatic"
          onSave={mutate}
        />
      )}

      <AlertDialog open={leasesToDelete.length > 0} onOpenChange={() => setLeasesToDelete([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {leasesToDelete.length} lease(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
