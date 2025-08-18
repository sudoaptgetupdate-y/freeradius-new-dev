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
import { Users, Building, Server, Wifi, ArrowRight, RefreshCw, CheckCircle2, XCircle, PauseCircle } from 'lucide-react';
import { format } from 'date-fns';
import OnlineUsersChartCard from '@/components/ui/OnlineUsersChartCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

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

const StatCard = ({ title, value, icon: Icon, onClick, iconBgColor }) => (
    <Card 
        className="shadow-sm border-subtle cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onClick}
    >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={cn("p-2 rounded-md", iconBgColor)}>
                <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">Click to view details</p>
        </CardContent>
    </Card>
);

const StatusCard = ({ status, onRestart, isSuperAdmin }) => {
    const getStatusInfo = () => {
        switch (status) {
            case 'active':
                return { variant: 'success', text: 'Active', Icon: CheckCircle2 };
            case 'inactive':
                return { variant: 'secondary', text: 'Inactive', Icon: PauseCircle };
            case 'failed':
                return { variant: 'destructive', text: 'Failed', Icon: XCircle };
            default:
                return { variant: 'secondary', text: 'Unknown', Icon: PauseCircle };
        }
    };
    const { variant, text, Icon } = getStatusInfo();
    return (
        <Card className="shadow-sm border-subtle flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">FreeRADIUS Status</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
                <Badge variant={variant} className="text-sm h-10 px-4">
                    <Icon className="mr-2 h-4 w-4" />
                    {text}
                </Badge>
            </CardContent>
            {isSuperAdmin && (
                <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={onRestart}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Restart Service
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

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
    const isSuperAdmin = user?.role === 'superadmin';
    const [isRestarting, setIsRestarting] = useState(false);
    const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);

    const fetchStats = async () => {
        if (!token) return;
        setLoading(true);
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
    
    useEffect(() => {
        fetchStats();
    }, [token]);

    const handleRestartService = async () => {
        setIsRestarting(true);
        try {
            await axiosInstance.post('/status/restart', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.info("Restart command sent.", {
                description: "It may take a moment for the service to restart. Refreshing data in 5 seconds...",
            });
            setTimeout(() => {
                fetchStats();
            }, 5000);
        } catch (error) {
            toast.error("Failed to restart service.", {
                description: error.response?.data?.message || "Please check server logs.",
            });
        } finally {
            setIsRestarting(false);
            setIsRestartDialogOpen(false);
        }
    };

    if (loading) {
        return <p>Loading dashboard...</p>;
    }
    if (!stats) {
        return <p>Could not load dashboard data.</p>;
    }

    const recentLoginsColumns = [
        { key: 'user', header: 'User', render: (row) => <div><p className="font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.username}</p></div> },
        { key: 'ip', header: 'IP Address', render: (row) => row.framedipaddress, className: "font-mono" },
        // --- START: แก้ไขส่วนนี้ ---
        { key: 'time', header: 'Time', render: (row) => format(new Date(row.acctstarttime), 'dd/MM/yyyy HH:mm'), className: "text-right" },
        // --- END ---
    ];
    
    const topUsersColumns = [
        { key: 'user', header: 'User', render: (row) => <div><p className="font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.username}</p></div> },
        { key: 'org', header: 'Organization', render: (row) => row.org_name },
        { key: 'data', header: 'Data Usage', render: (row) => formatBytes(row.total_data), className: "text-right font-medium" },
    ];

    return (
        <>
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
                        iconBgColor="bg-blue-500"
                    />
                    <StatCard 
                        title="Total Users"
                        value={stats.summary.totalUsers || 0}
                        icon={Users}
                        onClick={() => navigate('/users')}
                        iconBgColor="bg-emerald-500"
                    />
                    <StatCard 
                        title="Organizations"
                        value={stats.summary.totalOrgs || 0}
                        icon={Building}
                        onClick={() => navigate('/organizations')}
                        iconBgColor="bg-orange-500"
                    />
                    <StatCard 
                        title="NAS / Clients"
                        value={stats.summary.totalNas || 0}
                        icon={Server}
                        onClick={() => navigate('/nas')}
                        iconBgColor="bg-purple-500"
                    />
                    <StatusCard 
                        status={stats.summary.serviceStatus} 
                        isSuperAdmin={isSuperAdmin}
                        onRestart={() => setIsRestartDialogOpen(true)} 
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="h-[350px]">
                        <OnlineUsersChartCard />
                    </div>
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
            
            <AlertDialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will restart the FreeRADIUS service. All active user sessions may be disconnected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestartService} disabled={isRestarting}>
                            {isRestarting ? 'Restarting...' : 'Confirm Restart'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}