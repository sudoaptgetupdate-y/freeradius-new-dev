// src/pages/OnlineUsersPage.jsx
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
import { Wifi, ZapOff, ArrowUpDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';

// --- Helper Functions (ไม่เปลี่ยนแปลง) ---
const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const b = typeof bytes === 'bigint' || typeof bytes === 'number' ? bytes : BigInt(bytes);
    if (b === 0n) return '0 Bytes';
    const k = 1024n;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Number(BigInt(Math.floor(String(b).length / 3.01029995664))) / 3);
    return `${parseFloat((Number(b) / Number(k**BigInt(i))).toFixed(dm))} ${sizes[i]}`;
};

const formatMacAddress = (mac) => {
    if (!mac || typeof mac !== 'string') return 'N/A';
    const cleanedMac = mac.replace(/[:-]/g, '');
    return (cleanedMac.match(/.{1,2}/g) || []).join(':').toUpperCase();
};

const calculateDuration = (startTime) => {
    if (!startTime) return 'N/A';
    return formatDistanceToNow(new Date(startTime), { addSuffix: false });
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
            <Button variant="ghost" onClick={handleClick}>
                {children}
                <ArrowUpDown className={`ml-2 h-4 w-4 ${isSorted ? '' : 'text-muted-foreground'}`} />
            </Button>
        </TableHead>
    );
};


export default function OnlineUsersPage() {
    const token = useAuthStore((state) => state.token);
    const [sortConfig, setSortConfig] = useState({ key: 'logintime', direction: 'desc' });
    const [organizations, setOrganizations] = useState([]);
    const [orgFilter, setOrgFilter] = useState("");

    const { 
        data: onlineUsers, 
        pagination, 
        isLoading, 
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData 
    } = usePaginatedFetch("/online-users", 15, {
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        organizationId: orgFilter,
    });

    const [userToKick, setUserToKick] = useState(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000);
        
        const fetchOrgs = async () => {
            try {
                const response = await axiosInstance.get('/organizations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrganizations(response.data.data);
            } catch (error) {
                toast.error("Failed to load organizations for filtering.");
            }
        };

        fetchOrgs();

        return () => clearInterval(timer);
    }, [token]);

    const handleOrgFilterChange = (value) => {
        setOrgFilter(value === "all" ? "" : value);
    };

    const handleKickUser = (user) => setUserToKick(user);

    const confirmKickUser = async () => {
        if (!userToKick) return;
        try {
            const payload = {
                username: userToKick.username,
                nasipaddress: userToKick.nasipaddress,
                acctsessionid: userToKick.acctsessionid,
            };
            await axiosInstance.post('/online-users/kick', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Kick command sent for user '${userToKick.username}'.`);
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to kick user.");
        } finally {
            setUserToKick(null);
        }
    };

    return (
        // --- START: แก้ไขส่วนนี้ ---
        <div className="h-full">
            <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Wifi className="h-6 w-6" />Online Users</CardTitle>
                            <CardDescription>Showing currently active user sessions.</CardDescription>
                        </div>
                        <Button onClick={refreshData} variant="outline">Refresh</Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4 mb-4">
                        <Input
                            placeholder="Search by username, IP, or MAC..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="flex-grow"
                        />
                        <Select onValueChange={handleOrgFilterChange} value={orgFilter || "all"}>
                            <SelectTrigger className="w-full sm:w-[250px]">
                                <SelectValue placeholder="Filter by organization..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Organizations</SelectItem>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={String(org.id)}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="border rounded-md flex-grow overflow-y-auto relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Client IP</TableHead>
                                    <SortableHeader columnKey="logintime" sortConfig={sortConfig} setSortConfig={setSortConfig}>Login Time</SortableHeader>
                                    <SortableHeader columnKey="duration" sortConfig={sortConfig} setSortConfig={setSortConfig}>Duration</SortableHeader>
                                    <TableHead>MAC Address</TableHead>
                                    <SortableHeader columnKey="dataup" sortConfig={sortConfig} setSortConfig={setSortConfig}>Data Up</SortableHeader>
                                    <SortableHeader columnKey="datadown" sortConfig={sortConfig} setSortConfig={setSortConfig}>Data Down</SortableHeader>
                                    <SortableHeader columnKey="totaldata" sortConfig={sortConfig} setSortConfig={setSortConfig}>Total Data</SortableHeader>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={9}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>
                                    ))
                                ) : onlineUsers.length > 0 ? (
                                    onlineUsers.map((user) => {
                                        const dataUp = BigInt(user.acctoutputoctets || 0);
                                        const dataDown = BigInt(user.acctinputoctets || 0);
                                        const totalData = dataUp + dataDown;

                                        return (
                                            <TableRow key={user.radacctid}>
                                                <TableCell className="font-medium">{user.full_name}<br/><span className="text-xs text-muted-foreground">{user.username}</span></TableCell>
                                                <TableCell className="font-mono">{user.framedipaddress}</TableCell>
                                                <TableCell>{new Date(user.acctstarttime).toLocaleString()}</TableCell>
                                                <TableCell>{calculateDuration(user.acctstarttime)}</TableCell>
                                                <TableCell className="font-mono">{formatMacAddress(user.callingstationid)}</TableCell>
                                                <TableCell>{formatBytes(dataUp)}</TableCell>
                                                <TableCell>{formatBytes(dataDown)}</TableCell>
                                                <TableCell className="font-semibold">{formatBytes(totalData)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="destructive" size="sm" onClick={() => handleKickUser(user)}>
                                                        <ZapOff className="h-4 w-4 mr-2" /> Kick
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">No online users found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Label htmlFor="rows-per-page">Rows per page:</Label>
                        <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[15, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
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

            <AlertDialog open={!!userToKick} onOpenChange={(isOpen) => !isOpen && setUserToKick(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Kick User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to disconnect the user: <strong>{userToKick?.username}</strong>? They might be able to reconnect immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmKickUser} className="bg-destructive hover:bg-destructive/90">Confirm Kick</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        // --- END: สิ้นสุดส่วนที่แก้ไข ---
    );
}