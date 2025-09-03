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

export default function DhcpLeaseFormDialog({ isOpen, setIsOpen, lease, mode, onSave }) {
  const token = useAuthStore((state) => state.token);
  const [formData, setFormData] = useState({
    macAddress: "",
    address: "",
    comment: "",
    server: "all",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Derive a safe server list that always contains the current value (if any)
  const [serverOptions, setServerOptions] = useState(["all"]);

  useEffect(() => {
    if (!isOpen) return;

    // Prefill fields depending on mode
    if (lease) {
      // Prefer host-name, then active-host-name, then existing comment
      const inferredComment =
        lease["host-name"] ||
        lease["active-host-name"] ||
        lease.comment ||
        "";

      // Server could be in different fields depending on API mapping
      const currentServer =
        lease.server ||
        lease["dhcp-server"] ||
        lease["server-name"] ||
        "all";

      const initial = {
        macAddress: lease["mac-address"] || "",
        address: lease.address || "",
        comment:
          mode === "makeStatic" ? inferredComment : (lease.comment || ""),
        server: mode === "editStatic" ? currentServer : "all",
      };
      setFormData(initial);

      // Ensure server dropdown shows at least current value + 'all'
      const opts = new Set(["all"]);
      if (currentServer && currentServer !== "all") opts.add(currentServer);
      setServerOptions(Array.from(opts));
    } else {
      setFormData({ macAddress: "", address: "", comment: "", server: "all" });
      setServerOptions(["all"]);
    }
  }, [isOpen, lease, mode]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id, value) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = { ...formData };

    // Always include comment + server in payload if present
    try {
      if (mode === "makeStatic") {
        // Update fields first (so comment is saved), then convert to static
        await axiosInstance.put(
          `/mikrotik/dhcp/leases/${lease[".id"]}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await axiosInstance.post(
          `/mikrotik/dhcp/leases/${lease[".id"]}/make-static`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (mode === "editStatic") {
        await axiosInstance.put(
          `/mikrotik/dhcp/leases/${lease[".id"]}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // addStatic
        await axiosInstance.post(`/mikrotik/dhcp/leases`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(`Saved.`);
      onSave?.();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save lease.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (mode) {
      case "makeStatic":
        return "Make Lease Static";
      case "editStatic":
        return "Edit Static Lease";
      case "addStatic":
        return "Add Manual Static Lease";
      default:
        return "Manage Lease";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        <form id="lease-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="server">Server</Label>
            <Select
              value={formData.server}
              onValueChange={(v) => handleSelectChange("server", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select server" />
              </SelectTrigger>
              <SelectContent>
                {serverOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              placeholder="e.g., John's Laptop"
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="lease-form" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
