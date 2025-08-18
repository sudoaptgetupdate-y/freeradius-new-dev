// src/components/dialogs/OrganizationFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import useSWR from 'swr'; // <-- 1. Import SWR

export default function OrganizationFormDialog({ isOpen, setIsOpen, org, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        name: '',
        radiusProfileId: '',
        login_identifier_type: 'manual',
        advertisementId: '', // <-- 2. เพิ่ม state สำหรับเก็บ ID โฆษณา
    });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!org;

    // --- START: 3. ดึงข้อมูล Profiles และ Advertisements ด้วย SWR ---
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    const { data: profiles, error: profilesError } = useSWR('/radius-profiles', fetcher);
    const { data: advertisements, error: adsError } = useSWR('/advertisements', fetcher);
    // --- END ---

    const isProtectedOrg = isEditMode && (org.name === 'Register' || org.name === 'Voucher');

    useEffect(() => {
        if (isOpen) {
            if (org) {
                setFormData({
                    name: org.name || '',
                    radiusProfileId: org.radiusProfileId ? String(org.radiusProfileId) : '',
                    login_identifier_type: org.login_identifier_type || 'manual',
                    advertisementId: org.advertisementId ? String(org.advertisementId) : '', // <-- 4. Set ค่าเริ่มต้น
                });
            } else {
                setFormData({
                    name: '',
                    radiusProfileId: '',
                    login_identifier_type: 'manual',
                    advertisementId: '',
                });
            }
        }
    }, [org, isOpen]);

    if (profilesError || adsError) {
        toast.error("Failed to load required data for the form.");
        setIsOpen(false);
    }
    
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id, value) => {
        // --- 5. แก้ไขให้รองรับการเลือก "None" ---
        setFormData(prev => ({ ...prev, [id]: value === 'null' ? null : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = org ? `/organizations/${org.id}` : '/organizations';
        const method = org ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Saving organization...',
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return `Organization ${org ? 'updated' : 'created'} successfully!`;
                },
                error: (err) => err.response?.data?.message || "An error occurred.",
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{org ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {/* ... (ส่วนของ Name, Radius Profile, Login Type ไม่เปลี่ยนแปลง) ... */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Organization Name</Label>
                        <Input 
                            id="name" 
                            value={formData.name} 
                            onChange={handleInputChange} 
                            placeholder="e.g., Corporate HQ" 
                            required 
                            disabled={isProtectedOrg}
                        />
                         {isProtectedOrg && (
                            <p className="text-xs text-muted-foreground pt-1">
                                The name of this critical organization cannot be changed.
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="radiusProfileId">Radius Profile</Label>
                        <Select
                            value={formData.radiusProfileId}
                            onValueChange={(value) => handleSelectChange('radiusProfileId', value)}
                            required
                        >
                            <SelectTrigger id="radiusProfileId" disabled={!profiles}>
                                <SelectValue placeholder={!profiles ? "Loading..." : "Select a profile..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles?.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="login_identifier_type">Login Identifier Type</Label>
                         <Select
                            value={formData.login_identifier_type}
                            onValueChange={(value) => handleSelectChange('login_identifier_type', value)}
                            disabled={isProtectedOrg}
                        >
                            <SelectTrigger id="login_identifier_type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">Manual Username</SelectItem>
                                <SelectItem value="national_id">National ID</SelectItem>
                                <SelectItem value="employee_id">Employee ID</SelectItem>
                                <SelectItem value="student_id">Student ID</SelectItem>
                            </SelectContent>
                        </Select>
                        {isProtectedOrg && (
                            <p className="text-xs text-muted-foreground pt-1">
                                The login type for this critical organization must be 'manual'.
                            </p>
                        )}
                    </div>

                    {/* --- START: 6. เพิ่ม Dropdown สำหรับเลือกโฆษณา --- */}
                    <div className="space-y-2">
                        <Label htmlFor="advertisementId">Advertisement Campaign</Label>
                        <Select
                            value={formData.advertisementId === null ? 'null' : formData.advertisementId}
                            onValueChange={(value) => handleSelectChange('advertisementId', value)}
                        >
                            <SelectTrigger id="advertisementId" disabled={!advertisements}>
                                <SelectValue placeholder={!advertisements ? "Loading..." : "Select a campaign..."} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">None (Disable Ads)</SelectItem>
                                {advertisements?.map(ad => (
                                    <SelectItem key={ad.id} value={ad.id.toString()}>{ad.name} ({ad.type})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* --- END --- */}

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}