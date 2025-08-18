// src/components/dialogs/VoucherGenerationDialog.jsx
import { useState } from 'react';
import useSWR from 'swr';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function VoucherGenerationDialog({ isOpen, setIsOpen, onGenerationSuccess }) {
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    const { data: packages, error: packagesError } = useSWR('/vouchers/packages', fetcher);

    // --- START: แก้ไขค่าเริ่มต้นใน State นี้ ---
    const [formData, setFormData] = useState({
        quantity: 10,
        packageId: '',
        usernamePrefix: 'nt', // <--- แก้ไข Username Prefix
        passwordType: 'alnum',
        usernameLength: 2,      // <--- แก้ไขความยาว Username
        passwordLength: 4,      // <--- แก้ไขความยาว Password
    });
    // --- END ---

    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleSelectChange = (id, value) => {
        setFormData({ ...formData, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        toast.promise(axiosInstance.post('/vouchers/generate', formData, { headers: { Authorization: `Bearer ${token}` } }), {
            loading: 'Generating vouchers...',
            success: (response) => {
                const batchId = response.data.data.id;
                onGenerationSuccess(); // Refresh the batch list
                setIsOpen(false); // Close the dialog
                navigate(`/vouchers/batches/${batchId}`); // Navigate to print page
                return 'Vouchers generated successfully! Redirecting...';
            },
            error: (err) => err.response?.data?.message || 'Failed to generate vouchers.',
            finally: () => setIsLoading(false),
        });
    };
    
    if (packagesError) {
        toast.error("Failed to load packages for selection.");
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Generate New Voucher Batch</DialogTitle>
                    <DialogDescription>Create a new set of voucher users based on a package.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input id="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required min="1" max="1000"/>
                            </div>
                            <div>
                                <Label htmlFor="packageId">Package</Label>
                                <Select onValueChange={(val) => handleSelectChange('packageId', val)} required>
                                    <SelectTrigger disabled={!packages}><SelectValue placeholder="Select a package..." /></SelectTrigger>
                                    <SelectContent>
                                        {packages?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="usernamePrefix">Username Prefix</Label>
                                <Input id="usernamePrefix" value={formData.usernamePrefix} onChange={handleInputChange} />
                            </div>
                            <div>
                                <Label htmlFor="usernameLength">Username Length (random part)</Label>
                                <Input id="usernameLength" type="number" value={formData.usernameLength} onChange={handleInputChange} required min="2" max="16"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="passwordType">Password Type</Label>
                                <Select onValueChange={(val) => handleSelectChange('passwordType', val)} defaultValue="alnum">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="alnum">Alphanumeric</SelectItem>
                                        <SelectItem value="numeric">Numeric Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="passwordLength">Password Length</Label>
                                <Input id="passwordLength" type="number" value={formData.passwordLength} onChange={handleInputChange} required min="2" max="16"/>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Generating...' : 'Generate & Preview'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}