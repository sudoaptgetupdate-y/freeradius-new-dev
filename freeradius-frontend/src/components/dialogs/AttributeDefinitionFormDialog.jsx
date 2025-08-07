// src/components/dialogs/AttributeDefinitionFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

export default function AttributeDefinitionFormDialog({ isOpen, setIsOpen, attribute, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({ name: '', description: '', type: 'reply' });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!attribute;

    useEffect(() => {
        if (attribute) {
            setFormData({
                name: attribute.name || '',
                description: attribute.description || '',
                type: attribute.type || 'reply',
            });
        } else {
            setFormData({ name: '', description: '', type: 'reply' });
        }
    }, [attribute]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleTypeChange = (value) => {
        setFormData({ ...formData, type: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/attribute-definitions/${attribute.id}` : '/attribute-definitions';
        const method = isEditMode ? 'put' : 'post';

        try {
            await axiosInstance[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Attribute ${isEditMode ? 'updated' : 'created'} successfully!`);
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
                    <DialogTitle>{isEditMode ? 'Edit Attribute Definition' : 'Add New Attribute Definition'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Attribute Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Session-Timeout" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Attribute Type</Label>
                        <Select value={formData.type} onValueChange={handleTypeChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="reply">Reply</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="A short description of this attribute's purpose." />
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