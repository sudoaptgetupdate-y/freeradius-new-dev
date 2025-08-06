// src/pages/UserDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label'; // <-- เพิ่มบรรทัดนี้
import { ArrowLeft, Edit, Trash2, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';
import { format, formatDistanceStrict } from 'date-fns';

// --- Helper Functions ---
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


// --- User Detail Component ---
const UserInfoCard = ({ user, onEdit }) => {
    if (!user) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle>{user.full_name}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
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
                {user.national_id && <div><Label className="text-muted-foreground">National ID</Label><p className="font-medium">{user.national_id}</p></div>}
                {user.employee_id && <div><Label className="text-muted-foreground">Employee ID</Label><p className="font-medium">{user.employee_id}</p></div>}
                {user.student_id && <div><Label className="text-muted-foreground">Student ID</Label><p className="font-medium">{user.student_id}</p></div>}
            </CardContent>
            <CardFooter>
                 <Button onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit User</Button>
            </CardFooter>
        </Card>
    );
};

// --- History Table Component ---
const UserHistoryTable = ({ username }) => {
     const { 
        data: history, 
        pagination, 
        isLoading, 
        handlePageChange,
        handleItemsPerPageChange,
    } = usePaginatedFetch("/history", 10, { searchTerm: username });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Connection History</CardTitle>
            </CardHeader>
            <CardContent>
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
                                [...Array(5)].map((_, i) => (
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
            {/* Pagination for history table can be added here if needed */}
        </Card>
    )
}


export default function UserDetailPage() {
    const { username } = useParams();
    const token = useAuthStore((state) => state.token);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        setIsLoading(true);
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
        fetchUser();
    }, [username, token]);

    if (isLoading) {
        return <div>Loading user details...</div>
    }

    if (!user) {
        return <div>User not found.</div>
    }

    return (
        <div className="space-y-6">
            <Link to="/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to All Users
            </Link>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <UserInfoCard user={user} onEdit={() => alert("Edit dialog will open here")} />
                </div>
                <div className="lg:col-span-2">
                    <UserHistoryTable username={user.username} />
                </div>
            </div>
        </div>
    );
}