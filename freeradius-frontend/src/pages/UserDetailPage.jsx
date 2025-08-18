// src/pages/UserDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';
import { formatDistanceStrict } from 'date-fns';
import UserFormDialog from '@/components/dialogs/UserFormDialog';

// --- Helper Functions (ไม่เปลี่ยนแปลง) ---
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

const calculateDuration = (startTime, stopTime) => {
    if (!startTime) return 'N/A';
    if (!stopTime) return formatDistanceStrict(new Date(), new Date(startTime));
    return formatDistanceStrict(new Date(stopTime), new Date(startTime));
};

const UserInfoCard = ({ user, onEdit }) => {
    if (!user) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle>{user.full_name}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <div className="mt-1">
                            <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                                {user.status === 'active' ? 'Active' : 'Disabled'}
                            </Badge>
                        </div>
                    </div>
                     <div>
                        <Label className="text-muted-foreground">Organization</Label>
                        <p className="font-medium">{user.organization?.name}</p>
                    </div>
                    
                    {user.email ? (
                        <div>
                            <Label className="text-muted-foreground">Email</Label>
                            <p className="font-medium break-words">{user.email}</p>
                        </div>
                    ) : (
                        <div>
                            <Label className="text-muted-foreground">Email</Label>
                            <div className="flex items-center gap-2 text-sm text-yellow-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>Not provided</span>
                            </div>
                        </div>
                    )}

                    {user.phoneNumber ? (
                        <div>
                            <Label className="text-muted-foreground">Phone Number</Label>
                            <p className="font-medium">{user.phoneNumber}</p>
                        </div>
                    ) : (
                        <div>
                            <Label className="text-muted-foreground">Phone Number</Label>
                             <div className="flex items-center gap-2 text-sm text-yellow-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>Not provided</span>
                            </div>
                        </div>
                    )}

                    {user.national_id && <div><Label className="text-muted-foreground">National ID</Label><p className="font-medium">{user.national_id}</p></div>}
                    {user.employee_id && <div><Label className="text-muted-foreground">Employee ID</Label><p className="font-medium">{user.employee_id}</p></div>}
                    {user.student_id && <div><Label className="text-muted-foreground">Student ID</Label><p className="font-medium">{user.student_id}</p></div>}
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit User</Button>
            </CardFooter>
        </Card>
    );
};

const UserHistoryTable = ({ username }) => {
     const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
     });

     const { 
        data: history, 
        pagination, 
        isLoading, 
        handlePageChange,
        handleItemsPerPageChange,
    } = usePaginatedFetch("/history", 5, {
        searchTerm: username,
        ...filters 
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Connection History</CardTitle>
                <CardDescription>Reviewing past sessions for this user.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex gap-4 mb-4">
                    <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
                    <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
                </div>
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                           <TableRow>
                                <TableHead>Login Time</TableHead>
                                <TableHead>Logout Time</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Data Up</TableHead>
                                <TableHead>Data Down</TableHead>
                                <TableHead>Total Data</TableHead>
                                <TableHead>Terminate Cause</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(pagination.itemsPerPage)].map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>
                                ))
                            ) : history.length > 0 ? (
                                history.map((rec) => {
                                    const dataUp = BigInt(rec.acctoutputoctets || 0);
                                    const dataDown = BigInt(rec.acctinputoctets || 0);
                                    return (
                                        <TableRow key={rec.radacctid}>
                                            <TableCell>{rec.acctstarttime ? new Date(rec.acctstarttime).toLocaleString() : 'N/A'}</TableCell>
                                            <TableCell>{rec.acctstoptime ? new Date(rec.acctstoptime).toLocaleString() : <Badge variant="success" className="w-auto">Still Online</Badge>}</TableCell>
                                            <TableCell>{calculateDuration(rec.acctstarttime, rec.acctstoptime)}</TableCell>
                                            <TableCell>{formatBytes(dataUp)}</TableCell>
                                            <TableCell>{formatBytes(dataDown)}</TableCell>
                                            <TableCell className="font-semibold">{formatBytes(dataUp + dataDown)}</TableCell>
                                            <TableCell>{rec.acctterminatecause}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No history records found for this user.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex-shrink-0 flex items-center justify-between gap-2 pt-4">
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
    )
}

export default function UserDetailPage() {
    const { username } = useParams();
    const token = useAuthStore((state) => state.token);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const fetchUser = async () => {
        try {
            const response = await axiosInstance.get(`/users/${username}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data.data);
        } catch (error) {
            toast.error("Failed to fetch user details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchUser();
    }, [username, token]);

    if (isLoading) {
        return <div className="p-4">Loading user details...</div>
    }

    if (!user) {
        return <div className="p-4">User not found.</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <Link to="/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Back to All Users
                </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <UserInfoCard user={user} onEdit={() => setIsEditDialogOpen(true)} />
                </div>
                <div className="lg:col-span-2">
                    <UserHistoryTable username={user.username} />
                </div>
            </div>

            {isEditDialogOpen && (
                <UserFormDialog
                    isOpen={isEditDialogOpen}
                    setIsOpen={setIsEditDialogOpen}
                    user={user}
                    onSave={fetchUser}
                />
            )}
        </div>
    );
}