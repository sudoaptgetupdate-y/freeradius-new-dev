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

export default function OrganizationFormDialog({ isOpen, setIsOpen, org, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        name: '',
        radiusProfileId: '',
        login_identifier_type: 'manual'
    });
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchProfiles = async () => {
                try {
                    const response = await axiosInstance.get('/radius-profiles', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const fetchedProfiles = response.data.data;
                    setProfiles(fetchedProfiles);

                    // --- START: แก้ไขส่วนนี้ ---
                    if (org) { // Edit mode
                        setFormData({
                            name: org.name || '',
                            radiusProfileId: org.radiusProfileId ? String(org.radiusProfileId) : '',
                            login_identifier_type: org.login_identifier_type || 'manual'
                        });
                    } else { // Add mode
                        // Find the default profile
                        const defaultProfile = fetchedProfiles.find(p => p.name === 'default-profile');
                        setFormData({
                            name: '',
                            // If default profile is found, set its ID as the default value
                            radiusProfileId: defaultProfile ? String(defaultProfile.id) : '',
                            login_identifier_type: 'manual'
                        });
                    }
                    // --- END ---

                } catch (error) {
                    toast.error("Failed to load Radius Profiles.");
                }
            };
            fetchProfiles();
        }
    }, [org, isOpen, token]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = org ? `/organizations/${org.id}` : '/organizations';
        const method = org ? 'put' : 'post';

        try {
            await axiosInstance[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Organization ${org ? 'updated' : 'created'} successfully!`);
            onSave();
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{org ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Organization Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Corporate HQ" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="radiusProfileId">Radius Profile</Label>
                        <Select
                            value={formData.radiusProfileId}
                            onValueChange={(value) => handleSelectChange('radiusProfileId', value)}
                            required
                        >
                            <SelectTrigger id="radiusProfileId">
                                <SelectValue placeholder="Select a profile..." />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
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
                    </div>
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