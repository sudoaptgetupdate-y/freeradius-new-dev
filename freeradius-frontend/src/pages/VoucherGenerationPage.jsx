// src/pages/VoucherGenerationPage.jsx
import { useState } from 'react';
import useSWR from 'swr';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function VoucherGenerationPage() {
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    const { data: packages } = useSWR('/vouchers/packages', fetcher);

    // --- START: เพิ่ม state สำหรับความยาว user/pass ---
    const [formData, setFormData] = useState({
        quantity: 10,
        packageId: '',
        usernamePrefix: 'card-',
        passwordType: 'alnum',
        usernameLength: 6, // ค่าเริ่มต้น
        passwordLength: 6, // ค่าเริ่มต้น
    });
    // --- END ---
    const [isLoading, setIsLoading] = useState(false);
    
    const handleInputChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value});
    };

    const handleSelectChange = (id, value) => {
        setFormData({...formData, [id]: value});
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        toast.promise(axiosInstance.post('/vouchers/generate', formData, { headers: { Authorization: `Bearer ${token}` } }), {
            loading: 'Generating vouchers...',
            success: (response) => {
                const batchId = response.data.data.id;
                navigate(`/vouchers/batches/${batchId}`);
                return 'Vouchers generated successfully! Redirecting to print page...';
            },
            error: 'Failed to generate vouchers.',
            finally: () => setIsLoading(false),
        });
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Generate Vouchers</CardTitle>
                <CardDescription>Create a new batch of voucher users.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required min="1" max="1000"/>
                        </div>
                        <div>
                            <Label htmlFor="packageId">Package</Label>
                             <Select onValueChange={(val) => handleSelectChange('packageId', val)} required>
                                <SelectTrigger><SelectValue placeholder="Select a package..." /></SelectTrigger>
                                <SelectContent>
                                    {packages?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {/* --- START: เพิ่ม field สำหรับกำหนดความยาว --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="usernamePrefix">Username Prefix</Label>
                            <Input id="usernamePrefix" value={formData.usernamePrefix} onChange={handleInputChange} />
                        </div>
                         <div>
                            <Label htmlFor="usernameLength">Username Length (random part)</Label>
                            <Input id="usernameLength" type="number" value={formData.usernameLength} onChange={handleInputChange} required min="4" max="16"/>
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
                            <Input id="passwordLength" type="number" value={formData.passwordLength} onChange={handleInputChange} required min="4" max="16"/>
                        </div>
                    </div>
                    {/* --- END --- */}

                </CardContent>
                <CardFooter>
                     <Button type="submit" disabled={isLoading}>{isLoading ? 'Generating...' : 'Generate & Preview'}</Button>
                </CardFooter>
            </form>
        </Card>
    );
}