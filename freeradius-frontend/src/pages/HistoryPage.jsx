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
import { History, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceStrict } from 'date-fns';
import { Badge } from "@/components/ui/badge";

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

const calculateDuration = (startTime, stopTime) => {
    if (!startTime) return 'N/A';
    if (!stopTime) {
        return formatDistanceStrict(new Date(), new Date(startTime));
    }
    return formatDistanceStrict(new Date(stopTime), new Date(startTime));
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
    const token = useAuthStore((state) => state.token);
    const [organizations, setOrganizations] = useState([]);
    const [filters, setFilters] = useState({
        organizationId: "",
        startDate: "",
        endDate: "",
    });
    const [sortConfig, setSortConfig] = useState({ key: 'logintime', direction: 'desc' });

    const { 
        data: history, 
        pagination, 
        isLoading, 
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData 
    } = usePaginatedFetch("/history", 5, {
        ...filters,
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
                toast.error("Failed to load organizations for filtering.");
            }
        };
        fetchOrgs();
    }, [token]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><History className="h-6 w-6" />Connection History</CardTitle>
                        <CardDescription>Review past user sessions and connection details.</CardDescription>
                    </div>
                    <Button onClick={refreshData} variant="outline">Refresh</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <Input
                        placeholder="Search user, IP, MAC..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="sm:col-span-2 lg:col-span-1"
                    />
                     <Select value={filters.organizationId || "all"} onValueChange={(value) => handleFilterChange('organizationId', value === 'all' ? '' : value)}>
                        <SelectTrigger><SelectValue placeholder="Filter by organization..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Organizations</SelectItem>
                            {organizations.map((org) => (
                                <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
                    <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Client IP</TableHead>
                                <SortableHeader columnKey="logintime" sortConfig={sortConfig} setSortConfig={setSortConfig}>Login Time</SortableHeader>
                                <SortableHeader columnKey="logouttime" sortConfig={sortConfig} setSortConfig={setSortConfig}>Logout Time</SortableHeader>
                                <SortableHeader columnKey="duration" sortConfig={sortConfig} setSortConfig={setSortConfig}>Duration</SortableHeader>
                                <TableHead>MAC Address</TableHead>
                                <SortableHeader columnKey="dataup" sortConfig={sortConfig} setSortConfig={setSortConfig}>Data Up</SortableHeader>
                                <SortableHeader columnKey="datadown" sortConfig={sortConfig} setSortConfig={setSortConfig}>Data Down</SortableHeader>
                                <SortableHeader columnKey="totaldata" sortConfig={sortConfig} setSortConfig={setSortConfig}>Total Data</SortableHeader>
                                <TableHead>Terminate Cause</TableHead>
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
                                            {/* --- START: แก้ไขส่วนนี้ --- */}
                                            <TableCell>{rec.acctstarttime ? format(new Date(rec.acctstarttime), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}</TableCell>
                                            <TableCell>
                                                {rec.acctstoptime ? (
                                                    format(new Date(rec.acctstoptime), 'dd/MM/yyyy HH:mm:ss')
                                                ) : (
                                                    <Badge variant="success" className="w-auto">Still Online</Badge>
                                                )}
                                            </TableCell>
                                            {/* --- END --- */}
                                            <TableCell>{calculateDuration(rec.acctstarttime, rec.acctstoptime)}</TableCell>
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
                                    <TableCell colSpan={10} className="h-24 text-center">No history records found.</TableCell>
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
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.currentPage || pagination.currentPage <= 1}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.totalPages || pagination.currentPage >= pagination.totalPages}>
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}