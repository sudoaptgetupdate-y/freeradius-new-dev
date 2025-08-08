// src/pages/VoucherBatchesPage.jsx
import useSWR from 'swr';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VoucherBatchesPage() {
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

    const { data: batches, error } = useSWR('/vouchers/batches', fetcher);

    if (error) return <div>Failed to load batches.</div>;
    if (!batches) return <div>Loading...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Voucher Batches</CardTitle>
                <CardDescription>History of all generated voucher batches.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Package</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.map((batch) => (
                            <TableRow key={batch.id}>
                                <TableCell>{new Date(batch.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{batch.packageName}</TableCell>
                                <TableCell>{batch.quantity}</TableCell>
                                <TableCell>{batch.createdBy.fullName}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => navigate(`/vouchers/batches/${batch.id}`)}>
                                        <Printer className="h-4 w-4 mr-2" />Reprint
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}