// src/components/dialogs/PackageFormDialog.jsx
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
    name: '',
    durationDays: 1,
    price: 0,
    radiusProfileId: '',
};

export default function PackageFormDialog({ isOpen, setIsOpen, pkg, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!pkg;

    // --- START: แก้ไข API Endpoint ---
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    const { data: profiles, error: profilesError } = useSWR('/radius-profiles', fetcher);
    // --- END ---

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setFormData({
                    name: pkg.name || '',
                    durationDays: pkg.durationDays || 1,
                    price: pkg.price || 0,
                    radiusProfileId: pkg.radiusProfileId ? String(pkg.radiusProfileId) : '',
                });
            } else {
                setFormData(initialFormData);
            }
        }
    }, [pkg, isEditMode, isOpen]);

    const handleInputChange = (e) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseInt(value) || 0 : value }));
    };
    
    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, radiusProfileId: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/vouchers/packages/${pkg.id}` : '/vouchers/packages';
        const method = isEditMode ? 'put' : 'post';
        
        const payload = {
            ...formData,
            radiusProfileId: parseInt(formData.radiusProfileId),
        };

        toast.promise(axiosInstance[method](url, payload, { headers: { Authorization: `Bearer ${token}` } }), {
            loading: `Saving package...`,
            success: () => {
                onSave();
                setIsOpen(false);
                return `Package ${isEditMode ? 'updated' : 'created'} successfully!`;
            },
            error: (err) => err.response?.data?.message || "An error occurred.",
            finally: () => setIsLoading(false)
        });
    };

    if (profilesError) {
        toast.error("Failed to load Radius Profiles.");
        setIsOpen(false);
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Voucher Package' : 'Add New Voucher Package'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Package Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., 24-Hour Access" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="durationDays">Duration (Days)</Label>
                            <Input id="durationDays" type="number" value={formData.durationDays} onChange={handleInputChange} required min="1" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (Optional)</Label>
                            <Input id="price" type="number" value={formData.price} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="radiusProfileId">Radius Profile</Label>
                        <Select value={formData.radiusProfileId} onValueChange={handleSelectChange} required>
                            <SelectTrigger id="radiusProfileId" disabled={!profiles}>
                                <SelectValue placeholder={!profiles ? "Loading profiles..." : "Select a profile..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles?.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}