// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, Users, Building, ArrowRight, RefreshCw, CheckCircle2, XCircle, PauseCircle, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import OnlineUsersChartCard from '@/components/ui/OnlineUsersChartCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';

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

// "Paper Dashboard" Style Card Component
const PaperStatCard = ({ title, value, icon: Icon, onClick, borderColor, bgColor, iconColor, footerText, t }) => (
    <div
        className={cn(
            "group relative overflow-hidden rounded-lg bg-white p-5 shadow-md",
            "border-l-4 transition-all duration-300 ease-in-out",
            borderColor,
            onClick && "cursor-pointer"
        )}
        onClick={onClick}
    >
        <div
            className={cn(
                "absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100",
                bgColor
            )}
        />
        <div className={cn(
            "absolute right-5 top-2 text-5xl opacity-20 transition-transform duration-300 ease-in-out group-hover:scale-125 group-hover:text-white",
            iconColor
        )}>
            <Icon size={48} />
        </div>
        <div className="relative z-10 transition-colors duration-300 ease-in-out">
            <p className="mb-1 text-sm font-medium text-gray-500 group-hover:text-white/80">{title}</p>
            <p className="m-0 text-3xl font-bold text-gray-800 group-hover:text-white">{value}</p>
            <div className="mt-3 text-xs text-gray-500 group-hover:text-white/80">{footerText}</div>
        </div>
    </div>
);

// Updated RecentActivityTable with Hover Effect
const RecentActivityTable = ({ title, description, data, columns, viewAllLink }) => {
    const navigate = useNavigate();
    return (
        <Card 
            className="shadow-sm border-subtle h-full flex flex-col"
            onClick={() => viewAllLink && navigate(viewAllLink)}
        >
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                {viewAllLink && <ArrowRight className="h-5 w-5 text-slate-400" />}
            </CardHeader>
            <CardContent className="flex-1 pt-0">
                <div className="border rounded-md">
                    <Table>
                        <TableHeader className="bg-slate-100">
                            <TableRow className="border-b-0">
                                {columns.map((col) => (
                                    <TableHead key={col.key} className={cn("text-xs uppercase text-slate-500", col.className)}>{col.header}</TableHead>
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

    const getStatusInfo = (status) => {
        switch (status) {
            case 'active':
                return { value: t('status.active'), Icon: CheckCircle2, borderColor: 'border-l-green-500', iconColor: 'text-green-500', bgColor: 'bg-green-500' };
            case 'inactive':
                return { value: t('status.inactive'), Icon: PauseCircle, borderColor: 'border-l-gray-400', iconColor: 'text-gray-400', bgColor: 'bg-gray-400' };
            case 'failed':
                return { value: t('status.failed'), Icon: XCircle, borderColor: 'border-l-red-500', iconColor: 'text-red-500', bgColor: 'bg-red-500' };
            default:
                return { value: t('status.unknown'), Icon: PauseCircle, borderColor: 'border-l-gray-400', iconColor: 'text-gray-400', bgColor: 'bg-gray-400' };
        }
    };

    if (loading) {
        return <p>{t('loading_dashboard')}</p>;
    }
    if (!stats) {
        return <p>{t('dashboard_load_error')}</p>;
    }

    const { value: statusValue, Icon: StatusIcon, borderColor: statusBorderColor, iconColor: statusIconColor, bgColor: statusBgColor } = getStatusInfo(stats.summary.serviceStatus);

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

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    <PaperStatCard
                        title={t('online_users')}
                        value={stats.summary.onlineUsers || 0}
                        icon={Wifi}
                        onClick={() => navigate('/online-users')}
                        borderColor="border-l-emerald-500"
                        bgColor="bg-emerald-500"
                        iconColor="text-emerald-500"
                        footerText={t('click_to_view_details')}
                        t={t}
                    />
                    <PaperStatCard
                        title={t('total_users')}
                        value={stats.summary.totalUsers || 0}
                        icon={Users}
                        onClick={() => navigate('/users')}
                        borderColor="border-l-blue-500"
                        bgColor="bg-blue-500"
                        iconColor="text-blue-500"
                        footerText={t('click_to_view_details')}
                        t={t}
                    />
                     <PaperStatCard
                        title={t('registered_users')}
                        value={stats.summary.registeredUsers || 0}
                        icon={UserPlus}
                        onClick={() => navigate('/users', { state: { statusFilter: 'registered' } })}
                        borderColor="border-l-teal-500"
                        bgColor="bg-teal-500"
                        iconColor="text-teal-500"
                        footerText={t('click_to_view_details')}
                        t={t}
                    />
                    <PaperStatCard
                        title={t('organizations')}
                        value={stats.summary.totalOrgs || 0}
                        icon={Building}
                        onClick={() => navigate('/organizations')}
                        borderColor="border-l-orange-500"
                        bgColor="bg-orange-500"
                        iconColor="text-orange-500"
                        footerText={t('click_to_view_details')}
                        t={t}
                    />
                    <PaperStatCard
                        title={t('freeradius_status')}
                        value={statusValue}
                        icon={StatusIcon}
                        onClick={isSuperAdmin ? () => setIsRestartDialogOpen(true) : undefined}
                        borderColor={statusBorderColor}
                        iconColor={statusIconColor}
                        bgColor={statusBgColor}
                        footerText={isSuperAdmin ? t('restart_service') : 'Service Status'}
                        t={t}
                    />
                </div>

                <div className="h-[350px]">
                    <OnlineUsersChartCard />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-1">
                        <RecentActivityTable
                            title={t('recent_logins.title')}
                            description={t('recent_logins.description')}
                            data={stats.recentLogins}
                            columns={recentLoginsColumns}
                            viewAllLink="/history"
                        />
                    </div>
                    <div className="lg:col-span-1">
                         <RecentActivityTable
                            title={t('top_users.title')}
                            description={t('top_users.description')}
                            data={stats.topUsersToday}
                            columns={topUsersColumns}
                            viewAllLink="/history"
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