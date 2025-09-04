// src/components/dialogs/DhcpLeaseFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import useSWR from 'swr';

const fetcher = (url, token) =>
  axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

/**
 * Props:
 *  - isOpen: boolean
 *  - setIsOpen: (open:boolean)=>void
 *  - lease: Mikrotik lease object
 *  - mode: 'makeStatic' | 'editStatic' | 'addStatic'
 *  - onSave: () => void
 */
export default function DhcpLeaseFormDialog({ isOpen, setIsOpen, lease, mode, onSave }) {
  const token = useAuthStore((state) => state.token);

  // Reuse hotspot servers list for now (backend provides this route)
  const { data: servers } = useSWR(
    isOpen && mode !== 'makeStatic' ? ['/mikrotik/hotspot/servers', token] : null,
    ([url, token]) => fetcher(url, token)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    macAddress: "",
    address: "",
    comment: "",
    server: "all",
  });

  // Initialize form values per mode
  useEffect(() => {
    if (!isOpen) return;

    if (lease) {
      const mac = lease["mac-address"] || lease.macAddress || "";
      const addr = lease.address || "";
      const hostName = lease["active-host-name"] || lease["host-name"] || "";
      const comment = mode === "makeStatic" ? (hostName || lease.comment || "") : (lease.comment || "");
      const server = lease.server || "all";

      setFormData({
        macAddress: mac,
        address: addr,
        comment,
        server,
      });
    } else {
      // Add manual
      setFormData({
        macAddress: "",
        address: "",
        comment: "",
        server: "all",
      });
    }
  }, [isOpen, lease, mode]);

  // Keep server in sync with the current lease while making static
  useEffect(() => {
    if (isOpen && mode === "makeStatic" && lease?.server) {
      setFormData(prev => ({ ...prev, server: lease.server }));
    }
  }, [isOpen, mode, lease]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id, value) => {
    setFormData({ ...formData, [id]: value });
  };

  const close = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const id = lease?.[".id"] || lease?.id;
      if (mode === "makeStatic") {
        // Use the current lease's server automatically; do not allow editing in this dialog
        const payload = {
          address: formData.address,
          macAddress: formData.macAddress,
          comment: formData.comment ?? "",
          server: lease?.server || "all",
        };

        await axiosInstance.put(`/mikrotik/dhcp/leases/${encodeURIComponent(id)}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        await axiosInstance.post(`/mikrotik/dhcp/leases/${encodeURIComponent(id)}/make-static`, {}, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Converted to static lease.");
      } else if (mode === "editStatic") {
        const payload = {
          address: formData.address,
          macAddress: formData.macAddress,
          comment: formData.comment ?? "",
          server: formData.server,
        };
        await axiosInstance.put(`/mikrotik/dhcp/leases/${encodeURIComponent(id)}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Static lease updated.");
      } else {
        // addStatic
        const payload = {
          address: formData.address,
          macAddress: formData.macAddress,
          comment: formData.comment ?? "",
          server: formData.server,
        };
        await axiosInstance.post(`/mikrotik/dhcp/leases`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Static lease added.");
      }

      onSave?.();
      close();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save lease.");
    } finally {
      setIsLoading(false);
    }
  };

  const dialogTitle =
    mode === "makeStatic"
      ? "Make Static"
      : mode === "editStatic"
      ? "Edit Static Lease"
      : "Add Static Lease";

  const serverOptions = (() => {
    const list = Array.isArray(servers) ? servers : [];
    const value = formData.server;
    return value && !list.includes(value) ? [...list, value] : list;
  })();

  return (
    <Dialog open={!!isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="macAddress">MAC Address</Label>
            <Input
              id="macAddress"
              value={formData.macAddress}
              onChange={handleInputChange}
              placeholder="00:11:22:33:44:55"
              required
              disabled={mode === "makeStatic"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">IP Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="192.168.1.100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Input
              id="comment"
              value={formData.comment}
              onChange={handleInputChange}
              placeholder="e.g., host name"
            />
          </div>

          {mode !== "makeStatic" && (
            <div className="space-y-2">
              <Label htmlFor="server">Server</Label>
              <Select value={formData.server} onValueChange={(v) => handleSelectChange("server", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select server" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  {serverOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
