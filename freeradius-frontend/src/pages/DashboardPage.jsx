// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Users, Building, Server, Wifi, ArrowRight, UserCheck, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

// --- Helper Function to format bytes ---
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


// -- Component for the main statistic cards --
const StatCard = ({ title, value, icon: Icon, onClick }) => (
    <Card 
        className="shadow-sm border-subtle cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onClick}
    >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">Click to view details</p>
        </CardContent>
    </Card>
);

// -- Component for Service Status card --
const StatusCard = ({ status }) => {
    const getStatusInfo = () => {
        switch (status) {
            case 'active':
                return { variant: 'success', text: 'Active' };
            case 'inactive':
                return { variant: 'secondary', text: 'Inactive' };
            case 'failed':
                return { variant: 'destructive', text: 'Failed' };
            default:
                return { variant: 'secondary', text: 'Unknown' };
        }
    };
    const { variant, text } = getStatusInfo();
    return (
        <Card className="shadow-sm border-subtle">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">FreeRADIUS Status</CardTitle>
            </CardHeader>
            <CardContent>
                <Badge variant={variant} className="text-lg">{text}</Badge>
            </CardContent>
        </Card>
    );
};


// -- Component for displaying recent activity tables --
const RecentActivityTable = ({ title, description, data, columns, viewAllLink, viewAllText }) => {
    const navigate = useNavigate();
    return (
        <Card className="shadow-sm border-subtle h-full flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data && data.length > 0 ? data.map((row, index) => (
                                <TableRow key={index}>
                                    {columns.map((col) => (
                                        <TableCell key={`${index}-${col.key}`} className={col.className}>
                                            {col.render(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No data available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            {viewAllLink && (
                <CardFooter>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(viewAllLink)}>
                        {viewAllText} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};


export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const response = await axiosInstance.get('/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data.data);
            } catch (error) {
                toast.error("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    if (loading) {
        return <p>Loading dashboard...</p>;
    }
    if (!stats) {
        return <p>Could not load dashboard data.</p>;
    }

    const recentLoginsColumns = [
        { key: 'user', header: 'User', render: (row) => <div><p className="font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.username}</p></div> },
        { key: 'ip', header: 'IP Address', render: (row) => row.framedipaddress, className: "font-mono" },
        { key: 'time', header: 'Time', render: (row) => format(new Date(row.acctstarttime), 'PP pp'), className: "text-right" },
    ];
    
    const topUsersColumns = [
        { key: 'user', header: 'User', render: (row) => <div><p className="font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.username}</p></div> },
        { key: 'org', header: 'Organization', render: (row) => row.org_name },
        { key: 'data', header: 'Data Usage', render: (row) => formatBytes(row.total_data), className: "text-right font-medium" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.fullName?.split(' ')[0] || user?.username}!</h1>
                <p className="text-muted-foreground">Here's a summary of your FreeRADIUS server.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <StatCard 
                    title="Online Users"
                    value={stats.summary.onlineUsers || 0}
                    icon={Wifi}
                    onClick={() => navigate('/online-users')}
                />
                <StatCard 
                    title="Total Users"
                    value={stats.summary.totalUsers || 0}
                    icon={Users}
                    onClick={() => navigate('/users')}
                />
                <StatCard 
                    title="Organizations"
                    value={stats.summary.totalOrgs || 0}
                    icon={Building}
                    onClick={() => navigate('/organizations')}
                />
                <StatCard 
                    title="NAS / Clients"
                    value={stats.summary.totalNas || 0}
                    icon={Server}
                    onClick={() => navigate('/nas')}
                />
                <StatusCard status={stats.summary.serviceStatus} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                    <RecentActivityTable
                        title="Recent Logins"
                        description="The 5 most recent user authentications."
                        data={stats.recentLogins}
                        columns={recentLoginsColumns}
                        viewAllLink="/history"
                        viewAllText="View all history"
                    />
                </div>
                <div className="lg:col-span-1">
                     <RecentActivityTable
                        title="Top 5 Users (Today)"
                        description="Users with the highest data usage today."
                        data={stats.topUsersToday}
                        columns={topUsersColumns}
                        viewAllLink="/history"
                        viewAllText="View all history"
                    />
                </div>
            </div>
        </div>
    );
}