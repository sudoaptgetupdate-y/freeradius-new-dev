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
import { Users, Building, Server, Wifi, ArrowRight, RefreshCw, CheckCircle2, XCircle, PauseCircle, UserPlus } from 'lucide-react'; // <-- ADDED UserPlus
import { format } from 'date-fns';
import OnlineUsersChartCard from '@/components/ui/OnlineUsersChartCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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

const StatCard = ({ title, value, icon: Icon, onClick, iconBgColor, t }) => (
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
            <p className="text-xs text-muted-foreground">{t('click_to_view_details')}</p>
        </CardContent>
    </Card>
);

const StatusCard = ({ status, onRestart, isSuperAdmin, t }) => {
    const getStatusInfo = () => {
        switch (status) {
            case 'active':
                return { variant: 'success', text: t('status.active'), Icon: CheckCircle2 };
            case 'inactive':
                return { variant: 'secondary', text: t('status.inactive'), Icon: PauseCircle };
            case 'failed':
                return { variant: 'destructive', text: t('status.failed'), Icon: XCircle };
            default:
                return { variant: 'secondary', text: t('status.unknown'), Icon: PauseCircle };
        }
    };
    const { variant, text, Icon } = getStatusInfo();
    return (
        <Card className="shadow-sm border-subtle flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('freeradius_status')}</CardTitle>
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
                        <RefreshCw className="mr-2 h-4 w-4" /> {t('restart_service')}
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
    const { t } = useTranslation();
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
            toast.error(t('toast.dashboard_load_failed'));
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
            toast.info(t('toast.restart_sent_title'), {
                description: t('toast.restart_sent_desc'),
            });
            setTimeout(() => {
                fetchStats();
            }, 5000);
        } catch (error) {
            toast.error(t('toast.restart_failed_title'), {
                description: error.response?.data?.message || t('toast.restart_failed_desc'),
            });
        } finally {
            setIsRestarting(false);
            setIsRestartDialogOpen(false);
        }
    };

    if (loading) {
        return <p>{t('loading_dashboard')}</p>;
    }
    if (!stats) {
        return <p>{t('dashboard_load_error')}</p>;
    }

    const recentLoginsColumns = [
        { key: 'user', header: t('table_headers.user'), render: (row) => <div><p className="font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.username}</p></div> },
        { key: 'ip', header: t('table_headers.ip_address'), render: (row) => row.framedipaddress, className: "font-mono" },
        { key: 'time', header: t('table_headers.time'), render: (row) => format(new Date(row.acctstarttime), 'dd/MM/yyyy HH:mm'), className: "text-right" },
    ];
    
    const topUsersColumns = [
        { key: 'user', header: t('table_headers.user'), render: (row) => <div><p className="font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.username}</p></div> },
        { key: 'org', header: t('table_headers.organization'), render: (row) => row.org_name },
        { key: 'data', header: t('table_headers.data_usage'), render: (row) => formatBytes(row.total_data), className: "text-right font-medium" },
    ];

    return (
        <>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('welcome_back', { name: user?.fullName?.split(' ')[0] || user?.username })}</h1>
                    <p className="text-muted-foreground">{t('dashboard_subtitle')}</p>
                </div>

                {/* --- START: MODIFIED GRID --- */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
                    <StatCard 
                        title={t('online_users')}
                        value={stats.summary.onlineUsers || 0}
                        icon={Wifi}
                        onClick={() => navigate('/online-users')}
                        iconBgColor="bg-blue-500"
                        t={t}
                    />
                    <StatCard 
                        title={t('total_users')}
                        value={stats.summary.totalUsers || 0}
                        icon={Users}
                        onClick={() => navigate('/users')}
                        iconBgColor="bg-emerald-500"
                        t={t}
                    />
                    {/* --- ADDED CARD --- */}
                     <StatCard 
                        title={t('registered_users')}
                        value={stats.summary.registeredUsers || 0}
                        icon={UserPlus}
                        onClick={() => navigate('/users', { state: { statusFilter: 'registered' } })}
                        iconBgColor="bg-yellow-500"
                        t={t}
                    />
                    <StatCard 
                        title={t('organizations')}
                        value={stats.summary.totalOrgs || 0}
                        icon={Building}
                        onClick={() => navigate('/organizations')}
                        iconBgColor="bg-orange-500"
                        t={t}
                    />
                    <StatCard 
                        title={t('nas_clients')}
                        value={stats.summary.totalNas || 0}
                        icon={Server}
                        onClick={() => navigate('/nas')}
                        iconBgColor="bg-purple-500"
                        t={t}
                    />
                    <StatusCard 
                        status={stats.summary.serviceStatus} 
                        isSuperAdmin={isSuperAdmin}
                        onRestart={() => setIsRestartDialogOpen(true)} 
                        t={t}
                    />
                </div>
                {/* --- END MODIFIED GRID --- */}

                <div className="grid grid-cols-1 gap-6">
                    <div className="h-[350px]">
                        <OnlineUsersChartCard />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-1">
                        <RecentActivityTable
                            title={t('recent_logins.title')}
                            description={t('recent_logins.description')}
                            data={stats.recentLogins}
                            columns={recentLoginsColumns}
                            viewAllLink="/history"
                            viewAllText={t('view_all_history')}
                        />
                    </div>
                    <div className="lg:col-span-1">
                         <RecentActivityTable
                            title={t('top_users.title')}
                            description={t('top_users.description')}
                            data={stats.topUsersToday}
                            columns={topUsersColumns}
                            viewAllLink="/history"
                            viewAllText={t('view_all_history')}
                        />
                    </div>
                </div>
            </div>
            
            <AlertDialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('restart_dialog.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('restart_dialog.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestartService} disabled={isRestarting}>
                            {isRestarting ? t('restarting') : t('confirm_restart')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}