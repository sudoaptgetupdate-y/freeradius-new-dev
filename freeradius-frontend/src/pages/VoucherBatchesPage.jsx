// src/pages/VoucherBatchesPage.jsx
import { useState, useEffect } from 'react';
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// --- START: เพิ่มการ import Ticket icon และ PlusCircle ---
import { History, Printer, PlusCircle, Settings, Ticket } from 'lucide-react';
// --- END ---
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import VoucherGenerationDialog from '@/components/dialogs/VoucherGenerationDialog';
import VoucherSettingsDialog from '@/components/dialogs/VoucherSettingsDialog';
// --- START: เพิ่มการ import PackageFormDialog ---
import PackageFormDialog from '@/components/dialogs/PackageFormDialog';
// --- END ---

export default function VoucherBatchesPage() {
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        packageId: "",
        adminId: "",
        startDate: "",
        endDate: "",
    });
    
    const [packages, setPackages] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    // --- START: เพิ่ม State สำหรับ Package Dialog ---
    const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
    // --- END ---

    const {
        data: batches,
        pagination,
        isLoading,
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData
    } = usePaginatedFetch("/vouchers/batches", 5, filters);

    useEffect(() => {
        const fetchDataForFilters = async () => {
            try {
                const [pkgRes, adminRes] = await Promise.all([
                    axiosInstance.get('/vouchers/packages', { headers: { Authorization: `Bearer ${token}` } }),
                    axiosInstance.get('/admins', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setPackages(pkgRes.data.data);
                setAdmins(adminRes.data.data);
            } catch (error) {
                toast.error("Failed to load filter options.");
            }
        };
        fetchDataForFilters();
    }, [token]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-6 w-6" />
                                Voucher Batches
                            </CardTitle>
                            <CardDescription>History of all generated voucher batches.</CardDescription>
                        </div>
                        {/* --- START: แก้ไขกลุ่มของปุ่ม --- */}
                        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                            <Button variant="outline" size="sm" onClick={() => setIsSettingsDialogOpen(true)}>
                                <Settings className="mr-2 h-4 w-4" /> Voucher Settings
                            </Button>
                             <Button variant="outline" size="sm" onClick={() => setIsPackageDialogOpen(true)}>
                                <Ticket className="mr-2 h-4 w-4" /> Add New Package
                            </Button>
                            <Button size="sm" onClick={() => setIsGenerateDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New Batch
                            </Button>
                        </div>
                        {/* --- END --- */}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* ... (เนื้อหาส่วนที่เหลือของ CardContent ไม่เปลี่ยนแปลง) ... */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <Input
                            placeholder="Search by package, creator..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="lg:col-span-3"
                        />
                        <Select value={filters.packageId} onValueChange={(value) => handleFilterChange('packageId', value === 'all' ? '' : value)}>
                            <SelectTrigger><SelectValue placeholder="Filter by package..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Packages</SelectItem>
                                {packages.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
                        <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Package</TableHead>
                                    <TableHead className="text-center">Quantity</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {isLoading ? (
                                    [...Array(pagination.itemsPerPage)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={5}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>
                                    ))
                                ) : batches.length > 0 ? (
                                    batches.map((batch) => (
                                        <TableRow key={batch.id}>
                                            <TableCell>{new Date(batch.createdAt).toLocaleString()}</TableCell>
                                            <TableCell>{batch.packageName}</TableCell>
                                            <TableCell className="text-center">{batch.quantity}</TableCell>
                                            <TableCell>{batch.createdBy?.fullName || batch.createdBy?.username || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => navigate(`/vouchers/batches/${batch.id}`)}>
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No voucher batches found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Label htmlFor="rows-per-page">Rows per page:</Label>
                        <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[5, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords || 0} items)
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>
                            Next
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            
            {isGenerateDialogOpen && (
                <VoucherGenerationDialog 
                    isOpen={isGenerateDialogOpen}
                    setIsOpen={setIsGenerateDialogOpen}
                    onGenerationSuccess={refreshData}
                />
            )}
            
            {isSettingsDialogOpen && (
                <VoucherSettingsDialog
                    isOpen={isSettingsDialogOpen}
                    setIsOpen={setIsSettingsDialogOpen}
                />
            )}

            {/* --- START: เพิ่มการเรียกใช้ PackageFormDialog --- */}
            {isPackageDialogOpen && (
                <PackageFormDialog
                    isOpen={isPackageDialogOpen}
                    setIsOpen={setIsPackageDialogOpen}
                    pkg={null}
                    onSave={() => {
                        // ไม่ต้องทำอะไรเมื่อ Save สำเร็จ เพราะ Dialog จะปิดตัวเอง
                        // และเราไม่จำเป็นต้อง refresh ข้อมูลหน้านี้
                    }}
                />
            )}
            {/* --- END --- */}
        </>
    );
}