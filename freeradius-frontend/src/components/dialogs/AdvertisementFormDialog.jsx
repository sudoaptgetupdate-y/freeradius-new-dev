// src/components/dialogs/AdvertisementFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

const initialFormData = {
    name: '',
    type: 'A',
    imageUrl: '',
    headerText: '',
    bodyText: '',
    buttonText: 'Continue to Internet',
    // buttonUrl is no longer needed
    countdown: 5,
    status: 'active',
};

export default function AdvertisementFormDialog({ isOpen, setIsOpen, ad, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!ad;

    useEffect(() => {
        if (ad) {
            setFormData({
                name: ad.name || '',
                type: ad.type || 'A',
                imageUrl: ad.imageUrl || '',
                headerText: ad.headerText || '',
                bodyText: ad.bodyText || '',
                buttonText: ad.buttonText || 'Continue to Internet',
                countdown: ad.countdown === null ? 0 : ad.countdown,
                status: ad.status || 'active',
            });
        } else {
            setFormData(initialFormData);
        }
    }, [ad, isOpen]);

    const handleInputChange = (e) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? (value === '' ? null : parseInt(value)) : value }));
    };
    
    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (id, checked) => {
        setFormData(prev => ({ ...prev, [id]: checked ? 'active' : 'inactive' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/advertisements/${ad.id}` : '/advertisements';
        const method = isEditMode ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Saving campaign...',
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return `Campaign ${isEditMode ? 'updated' : 'created'} successfully!`;
                },
                error: (err) => err.response?.data?.message || "An error occurred.",
                finally: () => setIsLoading(false),
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Advertisement' : 'Add New Advertisement'}</DialogTitle>
                </DialogHeader>
                <form id="ad-form" onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Summer Promotion" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Template Type</Label>
                            <Select value={formData.type} onValueChange={(val) => handleSelectChange('type', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">Hero Page (รูปแนวนอน)</SelectItem>
                                    <SelectItem value="B">Split-Screen (รูปแนวนอน)</SelectItem>
                                    <SelectItem value="C">Image Focused (รูปแนวตั้ง)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="status">Status</Label>
                           <div className="flex items-center space-x-2 pt-2">
                                <Switch 
                                    id="status" 
                                    checked={formData.status === 'active'} 
                                    onCheckedChange={(checked) => handleSwitchChange('status', checked)}
                                />
                                <Label htmlFor="status">{formData.status === 'active' ? 'Active' : 'Inactive'}</Label>
                           </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input id="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="headerText">Header Text (สำหรับ A, B)</Label>
                        <Input id="headerText" value={formData.headerText} onChange={handleInputChange} placeholder="Welcome to Our WiFi!" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bodyText">Body Text (สำหรับ A, B)</Label>
                        <Textarea id="bodyText" value={formData.bodyText} onChange={handleInputChange} placeholder="Enjoy high-speed internet access." />
                    </div>
                    {/* --- START: แก้ไขส่วนนี้ --- */}
                    <div className="space-y-2">
                        <Label htmlFor="buttonText">Button Text</Label>
                        <Input id="buttonText" value={formData.buttonText} onChange={handleInputChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="countdown">Countdown (seconds)</Label>
                        <Input id="countdown" type="number" value={formData.countdown ?? ''} onChange={handleInputChange} placeholder="e.g., 5. Leave blank for no countdown." />
                    </div>
                    {/* --- END --- */}
                </form>
                <DialogFooter className="mt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" form="ad-form" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}