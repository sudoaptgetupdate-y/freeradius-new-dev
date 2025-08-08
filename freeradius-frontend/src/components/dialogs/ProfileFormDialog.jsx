// src/components/dialogs/ProfileFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

export default function ProfileFormDialog({ isOpen, setIsOpen, profile, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!profile;

    useEffect(() => {
        if (isOpen) {
            if (profile) {
                setFormData({ name: profile.name || '', description: profile.description || '' });
            } else {
                setFormData({ name: '', description: '' });
            }
        }
    }, [profile, isOpen]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // --- START: แก้ไข URL ---
        const url = isEditMode ? `/radius-profiles/${profile.id}` : '/radius-profiles';
        // --- END ---
        const method = isEditMode ? 'put' : 'post';

        try {
            await axiosInstance[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Profile ${isEditMode ? 'updated' : 'created'} successfully!`);
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
                    <DialogTitle>{isEditMode ? 'Edit Profile' : 'Add New Profile'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Profile Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., vip-users" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="A short description of this profile's purpose." />
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