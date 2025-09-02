// src/components/dialogs/IpBindingFormDialog.jsx
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

const initialFormData = {
    macAddress: '',
    address: '',
    toAddress: '',
    comment: '',
    type: 'bypassed',
    server: 'all', 
};

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

export default function IpBindingFormDialog({ isOpen, setIsOpen, binding, onSave, initialData }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!binding;

    const { data: hotspotServers } = useSWR(isOpen ? ['/mikrotik/hotspot/servers', token] : null, ([url, token]) => fetcher(url, token));

    useEffect(() => {
        if (isOpen) {
            if (binding) {
                setFormData({
                    macAddress: binding['mac-address'] || '',
                    address: binding.address || '',
                    toAddress: binding['to-address'] || '',
                    comment: binding.comment || '',
                    type: binding.type || 'bypassed',
                    server: binding.server || 'all',
                });
            } else if (initialData) {
                 setFormData({
                    macAddress: initialData['mac-address'] || '',
                    address: initialData.address || '',
                    toAddress: initialData.toAddress || '',
                    comment: initialData.comment || '',
                    type: initialData.type || 'bypassed',
                    server: initialData.server || 'all',
                });
            }
            else {
                setFormData(initialFormData);
            }
        }
    }, [binding, initialData, isOpen]);

    const handleMacAddressChange = (e) => {
        const { id, value } = e.target;
        const rawValue = value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
        const limitedValue = rawValue.slice(0, 12);
        const formattedValue = limitedValue.match(/.{1,2}/g)?.join(':') || '';
        setFormData({ ...formData, [id]: formattedValue });
    };

    const handleIpAddressChange = (e) => {
        const { id, value } = e.target;
        const formattedValue = value.replace(/[^0-9.]/g, '');
        setFormData({ ...formData, [id]: formattedValue });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (id, value) => {
        setFormData({ ...formData, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        const url = isEditMode ? `/mikrotik/bindings/${binding['.id']}` : '/mikrotik/bindings';
        const method = isEditMode ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: isEditMode ? "Updating IP Binding..." : "Adding IP Binding...",
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return `IP Binding ${isEditMode ? 'updated' : 'added'} successfully.`;
                },
                error: (err) => err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} binding.`,
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit' : 'Add'} IP Binding</DialogTitle>
                </DialogHeader>
                <form id="ip-binding-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="macAddress">MAC Address</Label>
                        <Input 
                            id="macAddress" 
                            value={formData.macAddress} 
                            onChange={handleMacAddressChange} 
                            placeholder="00:11:22:33:44:55" 
                            maxLength={17}
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">IP Address (Optional)</Label>
                        <Input 
                            id="address" 
                            value={formData.address} 
                            onChange={handleIpAddressChange} 
                            placeholder="e.g., 192.168.88.10" 
                            maxLength={15}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="toAddress">To Address (Optional)</Label>
                        <Input 
                            id="toAddress" 
                            value={formData.toAddress} 
                            onChange={handleIpAddressChange} 
                            placeholder="e.g., 192.168.88.20" 
                            maxLength={15}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="server">Hotspot Server</Label>
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
                        <Label htmlFor="type">Type</Label>
                         <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bypassed">Bypassed</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="comment">Comment (Optional)</Label>
                        <Input id="comment" value={formData.comment} onChange={handleInputChange} placeholder="e.g., Admin PC" />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" form="ip-binding-form" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}