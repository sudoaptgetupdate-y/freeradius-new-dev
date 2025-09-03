// src/components/tabs/DhcpLeasesTab.jsx
import { useState, useMemo } from "react";
import useSWR from "swr";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DhcpLeaseFormDialog from "@/components/dialogs/DhcpLeaseFormDialog";

const fetcher = (url, token) =>
  axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data.data);

export default function DhcpLeasesTab({ token }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeases, setSelectedLeases] = useState([]);
  const [leaseToManage, setLeaseToManage] = useState(null);
  const [leasesToDelete, setLeasesToDelete] = useState([]);
  const { data: allLeases, error, isLoading, mutate } = useSWR(
    ["/mikrotik/dhcp/leases", token],
    ([url, token]) => fetcher(url, token),
    { revalidateOnFocus: true }
  );

  const filteredLeases = useMemo(() => {
    if (!allLeases) return [];
    if (!searchTerm) return allLeases;
    const q = searchTerm.toLowerCase();
    return allLeases.filter((lease) =>
      Object.values(lease).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [allLeases, searchTerm]);

  const handleSelectAll = (checked) => {
    setSelectedLeases(checked ? filteredLeases : []);
  };

  const handleSelectSingle = (checked, lease) => {
    setSelectedLeases((prev) => (checked ? [...prev, lease] : prev.filter((l) => l[".id"] !== lease[".id"])));
  };

  const confirmDelete = async () => {
    if (leasesToDelete.length === 0) return;
    const ids = leasesToDelete.map((l) => l[".id"]);
    toast.promise(
      axiosInstance.post(`/mikrotik/dhcp/leases/delete`, { ids }, { headers: { Authorization: `Bearer ${token}` } }),
      {
        loading: "Removing lease(s)...",
        success: () => {
          mutate();
          setSelectedLeases([]);
          return `${ids.length} lease(s) removed.`;
        },
        error: (err) => err.response?.data?.message || "Failed to remove leases.",
        finally: () => setLeasesToDelete([]),
      }
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search all leases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {selectedLeases.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setLeasesToDelete(selectedLeases)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedLeases.length})
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedLeases.length === filteredLeases.length && filteredLeases.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading DHCP leases...
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-destructive">
                  Failed to load DHCP leases.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredLeases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No DHCP leases found.
                </TableCell>
              </TableRow>
            )}

            {filteredLeases.map((lease) => (
              <TableRow key={lease[".id"]} data-state={selectedLeases.some((l) => l[".id"] === lease[".id"]) && "selected"}>
                <TableCell>
                  <Checkbox
                    checked={selectedLeases.some((l) => l[".id"] === lease[".id"])}
                    onCheckedChange={(checked) => handleSelectSingle(checked, lease)}
                  />
                </TableCell>
                <TableCell className="font-mono">{lease.address}</TableCell>
                <TableCell className="font-mono">{lease["mac-address"]}</TableCell>
                <TableCell>
                  {lease.dynamic === "false" ? <Badge>Static</Badge> : <Badge variant="secondary">Dynamic</Badge>}
                </TableCell>
                <TableCell>{lease.comment}</TableCell>
                <TableCell className="text-center">
                  {lease.dynamic !== "false" && (
                    <Button variant="outline" size="sm" onClick={() => setLeaseToManage(lease)}>
                      <Lock className="mr-2 h-4 w-4" />
                      Make Static
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setLeasesToDelete([lease])}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {leaseToManage && (
        <DhcpLeaseFormDialog
          isOpen={!!leaseToManage}
          setIsOpen={() => setLeaseToManage(null)}
          lease={leaseToManage}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
