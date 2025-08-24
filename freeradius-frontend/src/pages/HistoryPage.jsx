// src/pages/HistoryPage.jsx
import { useState, useEffect } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, ArrowUpDown, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceStrict } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// --- START: เพิ่ม Helper Function สำหรับจัดการวันที่ พ.ศ. ---
const formatDateLocalized = (date, language = 'en', options = {}) => {
    const { withTime = false } = options;
    if (!date) return '';
    const d = new Date(date);
    
    // กำหนด Pattern พื้นฐาน
    const pattern = withTime ? 'dd/MM/yyyy, HH:mm:ss' : 'dd/MM/yyyy';

    // ถ้าเป็นภาษาไทย ให้แปลงปี ค.ศ. เป็น พ.ศ.
    if (language === 'th') {
        const yearAD = d.getFullYear();
        const yearBE = yearAD + 543;
        // ใช้ format ของ date-fns เพื่อให้ได้ชื่อเดือน/วันที่ถูกต้องตาม locale
        const baseFormatted = format(d, pattern, { locale: th });
        // จากนั้นแทนที่เฉพาะส่วนของปีที่เป็น ค.ศ. ด้วย พ.ศ.
        return baseFormatted.replace(yearAD.toString(), yearBE.toString());
    }
    
    // ถ้าเป็นภาษาอื่น ให้ใช้ format ปกติ
    return format(d, pattern, { locale: enUS });
};
// --- END ---

const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === "0") return '0 Bytes';
    const b = BigInt(bytes);
    if (b === 0n) return '0 Bytes';
    const k = 1024n;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let tempBytes = b;
    while (tempBytes >= k && i < sizes.length - 1) {
        tempBytes /= k;
        i++;
    }
    return `${parseFloat((Number(b) / Number(k ** BigInt(i))).toFixed(dm))} ${sizes[i]}`;
};

const formatMacAddress = (mac) => {
    if (!mac || typeof mac !== 'string') return 'N/A';
    const cleanedMac = mac.replace(/[:-]/g, '');
    return (cleanedMac.match(/.{1,2}/g) || []).join(':').toUpperCase();
};

const calculateDuration = (startTime, stopTime, locale) => {
    if (!startTime) return 'N/A';
    if (!stopTime) {
        return formatDistanceStrict(new Date(), new Date(startTime), { locale });
    }
    return formatDistanceStrict(new Date(stopTime), new Date(startTime), { locale });
};

const SortableHeader = ({ children, columnKey, sortConfig, setSortConfig }) => {
    const isSorted = sortConfig.key === columnKey;
    const direction = isSorted ? sortConfig.direction : 'desc';

    const handleClick = () => {
        setSortConfig({
            key: columnKey,
            direction: isSorted && direction === 'desc' ? 'asc' : 'desc',
        });
    };

    return (
        <TableHead>
            <Button variant="ghost" onClick={handleClick} className="px-2">
                {children}
                <ArrowUpDown className={`ml-2 h-4 w-4 ${isSorted ? '' : 'text-muted-foreground'}`} />
            </Button>
        </TableHead>
    );
};

export default function HistoryPage() {
    const { t, i18n } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const [organizations, setOrganizations] = useState([]);
    const [filters, setFilters] = useState({
        organizationId: "",
        startDate: null,
        endDate: null,
    });
    const [sortConfig, setSortConfig] = useState({ key: 'logintime', direction: 'desc' });
    
    const currentLocale = i18n.language === 'th' ? th : enUS;

    const { 
        data: history, 
        pagination, 
        isLoading, 
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData 
    } = usePaginatedFetch("/history", 15, {
        organizationId: filters.organizationId,
        startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : '',
        endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : '',
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
    });

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const response = await axiosInstance.get('/organizations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrganizations(response.data.data.organizations);
            } catch (error) {
                toast.error(t('toast.org_load_failed'));
            }
        };
        fetchOrgs();
    }, [token, t]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><History className="h-6 w-6" />{t('history_page.title')}</CardTitle>
                        <CardDescription>{t('history_page.description')}</CardDescription>
                    </div>
                    <Button onClick={refreshData} variant="outline">{t('refresh')}</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <Input
                        placeholder={t('history_page.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="sm:col-span-2 lg:col-span-1"
                    />
                     <Select value={filters.organizationId || "all"} onValueChange={(value) => handleFilterChange('organizationId', value === 'all' ? '' : value)}>
                        <SelectTrigger><SelectValue placeholder={t('history_page.filter_org_placeholder')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_organizations')}</SelectItem>
                            {organizations.map((org) => (
                                <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.startDate ? formatDateLocalized(filters.startDate, i18n.language) : <span>{t('form_labels.start_date')}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.startDate} onSelect={(date) => handleFilterChange('startDate', date)} initialFocus locale={currentLocale} /></PopoverContent>
                    </Popover>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.endDate ? formatDateLocalized(filters.endDate, i18n.language) : <span>{t('form_labels.end_date')}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.endDate} onSelect={(date) => handleFilterChange('endDate', date)} initialFocus locale={currentLocale} /></PopoverContent>
                    </Popover>
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('table_headers.user')}</TableHead>
                                <TableHead>{t('table_headers.client_ip')}</TableHead>
                                <SortableHeader columnKey="logintime" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.login_time')}</SortableHeader>
                                <SortableHeader columnKey="logouttime" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.logout_time')}</SortableHeader>
                                <SortableHeader columnKey="duration" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.duration')}</SortableHeader>
                                <TableHead>{t('table_headers.mac_address')}</TableHead>
                                <SortableHeader columnKey="dataup" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.data_up')}</SortableHeader>
                                <SortableHeader columnKey="datadown" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.data_down')}</SortableHeader>
                                <SortableHeader columnKey="totaldata" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.total_data')}</SortableHeader>
                                <TableHead>{t('table_headers.terminate_cause')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(pagination.itemsPerPage)].map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={10}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>
                                ))
                            ) : history.length > 0 ? (
                                history.map((rec) => {
                                    const dataUp = BigInt(rec.acctoutputoctets || 0);
                                    const dataDown = BigInt(rec.acctinputoctets || 0);
                                    return (
                                        <TableRow key={rec.radacctid}>
                                            <TableCell className="font-medium">{rec.full_name}<br/><span className="text-xs text-muted-foreground">{rec.username}</span></TableCell>
                                            <TableCell className="font-mono">{rec.framedipaddress}</TableCell>
                                            <TableCell>{rec.acctstarttime ? formatDateLocalized(rec.acctstarttime, i18n.language, { withTime: true }) : 'N/A'}</TableCell>
                                            <TableCell>
                                                {rec.acctstoptime ? (
                                                    formatDateLocalized(rec.acctstoptime, i18n.language, { withTime: true })
                                                ) : (
                                                    <Badge variant="success" className="w-auto">{t('status.still_online')}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{calculateDuration(rec.acctstarttime, rec.acctstoptime, currentLocale)}</TableCell>
                                            <TableCell className="font-mono">{formatMacAddress(rec.callingstationid)}</TableCell>
                                            <TableCell>{formatBytes(dataUp)}</TableCell>
                                            <TableCell>{formatBytes(dataDown)}</TableCell>
                                            <TableCell className="font-semibold">{formatBytes(dataUp + dataDown)}</TableCell>
                                            <TableCell>{rec.acctterminatecause}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">{t('history_page.no_records_found')}</TableCell>
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
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.currentPage || pagination.currentPage <= 1}>
                        {t('pagination.previous')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.totalPages || pagination.currentPage >= pagination.totalPages}>
                        {t('pagination.next')}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}