// src/components/dialogs/NasFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

const initialFormData = {
    nasname: '',
    shortname: '',
    secret: '',
    description: '',
};

export default function NasFormDialog({ isOpen, setIsOpen, nas, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!nas;

    useEffect(() => {
        if (isOpen) {
            if (nas) {
                setFormData({
                    nasname: nas.nasname || '',
                    shortname: nas.shortname || '',
                    secret: '', // ไม่แสดง secret เดิมเพื่อความปลอดภัย
                    description: nas.description || '',
                });
            } else {
                setFormData(initialFormData);
            }
        }
    }, [nas, isOpen]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        const url = isEditMode ? `/nas/${nas.id}` : '/nas';
        const method = isEditMode ? 'put' : 'post';
        
        let payload = { ...formData };
        // ถ้าเป็นโหมดแก้ไขและไม่ได้กรอก secret ใหม่ ให้ลบออกจาก payload
        if (isEditMode && !payload.secret) {
            delete payload.secret;
        }

        try {
            await axiosInstance[method](url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`NAS ${isEditMode ? 'updated' : 'created'} successfully!`);
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
                    <DialogTitle>{isEditMode ? 'Edit NAS Client' : 'Add New NAS Client'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nasname">NAS Name (IP Address / Hostname)</Label>
                        <Input id="nasname" value={formData.nasname} onChange={handleInputChange} placeholder="e.g., 192.168.1.1" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="shortname">Short Name</Label>
                        <Input id="shortname" value={formData.shortname} onChange={handleInputChange} placeholder="e.g., main-router" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="secret">Secret</Label>
                        <Input id="secret" type="password" onChange={handleInputChange} placeholder={isEditMode ? "Leave blank to keep current secret" : "Enter a strong secret"} required={!isEditMode} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="e.g., Main office FortiGate" />
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