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

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

export default function DhcpLeaseFormDialog({ isOpen, setIsOpen, lease, mode, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        macAddress: '',
        address: '',
        comment: '',
        server: 'all'
    });
    const [isLoading, setIsLoading] = useState(false);

    const { data: hotspotServers } = useSWR(isOpen ? ['/mikrotik/hotspot/servers', token] : null, ([url, token]) => fetcher(url, token));

    useEffect(() => {
        if (isOpen) {
            if (lease) {
                // **START: แก้ไขตรรกะ**
                // 1. กำหนดค่าเริ่มต้นสำหรับ comment และ server
                let initialComment = '';
                let initialServer = 'all';

                // 2. ตรวจสอบโหมดเพื่อกำหนดค่าที่ถูกต้อง
                if (mode === 'editStatic') {
                    // ถ้าเป็นการแก้ไข ให้ดึงค่าปัจจุบันมาใช้
                    initialComment = lease.comment || '';
                    initialServer = lease.server || 'all';
                } else if (mode === 'makeStatic') {
                    // ถ้าเป็นการทำให้เป็น Static ให้ใช้ค่าเริ่มต้นตามที่กำหนด
                    initialComment = lease['active-host-name'] || lease.comment || '';
                    initialServer = 'all'; // Server ต้องเป็น 'all' เสมอ
                }
                // **END: แก้ไขตรรกะ**

                setFormData({
                    macAddress: lease['mac-address'] || '',
                    address: lease.address || '',
                    comment: initialComment,
                    server: initialServer
                });

            } else {
                // กรณี "Add Manual" ให้รีเซ็ตฟอร์ม
                setFormData({ macAddress: '', address: '', comment: '', server: 'all' });
            }
        }
    }, [lease, isOpen, mode]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (id, value) => {
        setFormData({ ...formData, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        let promise;
        const payload = { ...formData };
        
        if (mode === 'makeStatic') {
            promise = axiosInstance.put(`/mikrotik/dhcp/leases/${lease['.id']}`, payload, { headers: { Authorization: `Bearer ${token}` } })
              .then(() => axiosInstance.post(`/mikrotik/dhcp/leases/${lease['.id']}/make-static`, {}, { headers: { Authorization: `Bearer ${token}` } }));
        } else if (mode === 'editStatic') {
            promise = axiosInstance.put(`/mikrotik/dhcp/leases/${lease['.id']}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        } else { // addStatic
            promise = axiosInstance.post('/mikrotik/dhcp/leases', payload, { headers: { Authorization: `Bearer ${token}` } });
        }

        toast.promise(promise, {
            loading: `Saving lease...`,
            success: () => {
                onSave();
                setIsOpen(false);
                return `Lease for ${formData.macAddress} saved successfully.`;
            },
            error: (err) => err.response?.data?.message || "Failed to save lease.",
            finally: () => setIsLoading(false)
        });
    };
    
    const getDialogTitle = () => {
        switch(mode) {
            case 'makeStatic': return 'Make Lease Static';
            case 'editStatic': return 'Edit Static Lease';
            case 'addStatic': return 'Add Manual Static Lease';
            default: return 'Manage Lease';
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{getDialogTitle()}</DialogTitle>
                </DialogHeader>
                <form id="lease-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="server">Server</Label>
                        <Select value={formData.server} onValueChange={(value) => handleSelectChange('server', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">all</SelectItem>
                                {hotspotServers?.map(serverName => (
                                    <SelectItem key={serverName} value={serverName}>{serverName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="macAddress">MAC Address</Label>
                        <Input id="macAddress" value={formData.macAddress} onChange={handleInputChange} placeholder="00:11:22:33:44:55" required disabled={mode === 'makeStatic'} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">IP Address</Label>
                        <Input id="address" value={formData.address} onChange={handleInputChange} placeholder="192.168.1.100" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Input id="comment" value={formData.comment} onChange={handleInputChange} placeholder="e.g., John's Laptop" />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" form="lease-form" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}