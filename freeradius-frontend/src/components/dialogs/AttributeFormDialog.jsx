// src/components/dialogs/AttributeFormDialog.jsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { COMMON_ATTRIBUTES, OPERATORS } from "@/lib/radiusAttributes";

export default function AttributeFormDialog({ isOpen, setIsOpen, profileName, attributeType, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        attribute: '',
        op: attributeType === 'reply' ? ':=' : ':=',
        value: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axiosInstance.post('/attributes', {
                profileName: profileName,
                type: attributeType,
                ...formData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Attribute added successfully!");
            onSave();
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add attribute.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const attributeList = COMMON_ATTRIBUTES[attributeType] || [];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add {attributeType === 'reply' ? 'Reply' : 'Check'} Attribute to "{profileName}"</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="attribute">Attribute</Label>
                        <Select value={formData.attribute} onValueChange={(value) => handleSelectChange('attribute', value)} required>
                            <SelectTrigger id="attribute">
                                <SelectValue placeholder="Select a common attribute..." />
                            </SelectTrigger>
                            <SelectContent>
                                {attributeList.map(attr => (
                                    <SelectItem key={attr.name} value={attr.name}>
                                        {attr.name} <span className="text-muted-foreground ml-2">- {attr.description}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="op">Operator</Label>
                        <Select value={formData.op} onValueChange={(value) => handleSelectChange('op', value)} required>
                            <SelectTrigger id="op">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {OPERATORS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="value">Value</Label>
                        <Input id="value" value={formData.value} onChange={handleInputChange} placeholder="Enter the attribute value" required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Attribute'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}