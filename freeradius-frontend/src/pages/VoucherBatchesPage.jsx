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
import { History, Printer, PlusCircle, Settings, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import VoucherGenerationDialog from '@/components/dialogs/VoucherGenerationDialog';
import VoucherSettingsDialog from '@/components/dialogs/VoucherSettingsDialog';
import PackageFormDialog from '@/components/dialogs/PackageFormDialog';
import { useTranslation } from 'react-i18next'; // <-- 1. Import useTranslation

export default function VoucherBatchesPage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
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
    const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);

    const {
        data: batches,
        pagination,
        isLoading,
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData
    } = usePaginatedFetch("/vouchers/batches", 15, filters); // <-- เพิ่มจำนวนแถวเริ่มต้น

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
                toast.error(t('toast.filter_load_failed'));
            }
        };
        fetchDataForFilters();
    }, [token, t]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-6 w-6" />
                                {t('voucher_batches_page.title')}
                            </CardTitle>
                            <CardDescription>{t('voucher_batches_page.description')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                            <Button variant="outline" size="sm" onClick={() => setIsSettingsDialogOpen(true)}>
                                <Settings className="mr-2 h-4 w-4" /> {t('voucher_batches_page.voucher_settings')}
                            </Button>
                             <Button variant="outline" size="sm" onClick={() => setIsPackageDialogOpen(true)}>
                                <Ticket className="mr-2 h-4 w-4" /> {t('voucher_batches_page.add_package')}
                            </Button>
                            <Button size="sm" onClick={() => setIsGenerateDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> {t('voucher_batches_page.add_batch')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <Input
                            placeholder={t('voucher_batches_page.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="lg:col-span-3"
                        />
                        <Select value={filters.packageId} onValueChange={(value) => handleFilterChange('packageId', value === 'all' ? '' : value)}>
                            <SelectTrigger><SelectValue placeholder={t('voucher_batches_page.filter_package_placeholder')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('all_packages')}</SelectItem>
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
                                    <TableHead>{t('table_headers.date')}</TableHead>
                                    <TableHead>{t('table_headers.package')}</TableHead>
                                    <TableHead className="text-center">{t('table_headers.quantity')}</TableHead>
                                    <TableHead>{t('table_headers.created_by')}</TableHead>
                                    <TableHead className="text-right">{t('table_headers.actions')}</TableHead>
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
                                        <TableCell colSpan={5} className="h-24 text-center">{t('voucher_batches_page.no_batches_found')}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Label htmlFor="rows-per-page">{t('pagination.rows_per_page')}</Label>
                        <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[15, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {t('pagination.page_info', { currentPage: pagination.currentPage, totalPages: pagination.totalPages, totalItems: pagination.totalRecords || 0 })}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>
                            {t('pagination.previous')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>
                            {t('pagination.next')}
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

            {isPackageDialogOpen && (
                <PackageFormDialog
                    isOpen={isPackageDialogOpen}
                    setIsOpen={setIsPackageDialogOpen}
                    pkg={null}
                    onSave={refreshData}
                />
            )}
        </>
    );
}