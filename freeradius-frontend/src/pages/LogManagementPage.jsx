// src/pages/LogManagementPage.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import LogVolumeChartCard from "@/components/ui/LogVolumeChartCard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DashboardTab = ({ token }) => {
    const { data, error, isLoading } = useSWR('/logs/dashboard', (url) => fetcher(url, token));

    if (isLoading) return <div className="p-4 text-center">Loading dashboard...</div>;
    if (error || !data) return <div className="p-4 text-center text-destructive">Failed to load dashboard data.</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Disk Usage</CardTitle></CardHeader>
                    <CardContent className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total: {data.diskUsage.size}</p>
                        <p className="text-sm text-muted-foreground">Used: {data.diskUsage.used} ({data.diskUsage.usePercent})</p>
                        <p className="text-sm text-muted-foreground">Available: {data.diskUsage.available}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">GPG Encryption Key</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground break-words" title={data.gpgKey.recipient || 'Not Set'}>
                            Recipient: {data.gpgKey.recipient || 'Not Set'}
                        </p>
                    </CardContent>
                </Card>
                 <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="text-base">Top 5 Largest Log Days</CardTitle></CardHeader>
                    <CardContent>
                        {data.top5LargestLogDays && data.top5LargestLogDays.length > 0 ? (
                            <ul className="space-y-2">
                                {data.top5LargestLogDays.map(day => (
                                    <li key={`${day.host}-${day.name}`} className="text-sm text-muted-foreground flex justify-between items-center">
                                        <div className="font-mono">
                                            <span>{day.host}</span>
                                            <span className="text-xs opacity-70 ml-2">{day.name.replace('.log.gz.gpg', '')}</span>
                                        </div>
                                        <span className="font-medium text-foreground">{formatBytes(day.size)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No log files found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="h-[400px]">
                <LogVolumeChartCard />
            </div>
        </div>
    );
};

const LogArchiveTab = ({ token }) => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 15 });

    const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        pageSize: pagination.itemsPerPage,
    });

    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const { data: responseData, error, isLoading } = useSWR(`/logs/files?${queryParams.toString()}`, (url) => fetcher(url, token), { revalidateOnFocus: false });
    
    const files = responseData?.files || [];
    const totalPages = responseData?.totalPages || 1;

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };
    
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };
    
    const handleItemsPerPageChange = (newSize) => {
        setPagination(prev => ({
            ...prev,
            itemsPerPage: parseInt(newSize, 10),
            currentPage: 1,
        }));
    };

    const handleDownload = (fileId, fileName) => {
        toast.info("Preparing download...", { description: "Your file will begin downloading shortly." });
        axiosInstance.get(`/logs/files/download?id=${fileId}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
        }).then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        }).catch(() => toast.error("Download failed."));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Archived Log Files</CardTitle>
                <CardDescription>Filter and download encrypted log files for offline analysis.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
                    </div>
                </div>
                <div className="border rounded-md max-h-[60vh] overflow-y-auto">
                    <Table>
                         <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead>Hostname</TableHead>
                                <TableHead>Filename</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Modified Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading log files...</TableCell></TableRow>
                            )}
                            {error && (
                                <TableRow><TableCell colSpan={5} className="text-center h-24 text-destructive">Failed to load log files.</TableCell></TableRow>
                            )}
                            {!isLoading && files.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">No log files found for the selected criteria.</TableCell></TableRow>
                            )}
                            {files.map(file => (
                                <TableRow key={file.id}>
                                    <TableCell className="font-mono">{file.host}</TableCell>
                                    <TableCell className="font-mono">{file.name}</TableCell>
                                    <TableCell>{formatBytes(file.size)}</TableCell>
                                    <TableCell>{format(new Date(file.modified), 'Pp')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(file.id, file.name)}>
                                            <Download className="mr-2 h-4 w-4" /> Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Label htmlFor="rows-per-page-archive">Rows per page:</Label>
                    <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger id="rows-per-page-archive" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[15, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {totalPages} ({responseData?.totalRecords || 0} files)
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= totalPages}>
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const DownloadHistoryTab = ({ token }) => {
    const [filters, setFilters] = useState({ adminId: '', startDate: '', endDate: '', hostname: '' });
    
    const { data: admins } = useSWR('/admins', (url) => fetcher(url, token));
    const { data: hostnames } = useSWR('/logs/hostnames', (url) => fetcher(url, token));

    const {
        data: history,
        pagination,
        isLoading,
        handlePageChange,
        handleItemsPerPageChange
    } = usePaginatedFetch("/logs/history", 15, filters);
    
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) return <div className="p-4 text-center">Loading download history...</div>;
    if (!history) return <div className="p-4 text-center text-destructive">Failed to load history.</div>;

    return (
        <Card>
            <CardHeader><CardTitle>Download History</CardTitle><CardDescription>An audit trail of all log file downloads.</CardDescription></CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="adminFilter">Administrator</Label>
                        <Select value={filters.adminId} onValueChange={(value) => handleFilterChange('adminId', value === 'all' ? '' : value)}>
                            <SelectTrigger id="adminFilter">
                                <SelectValue placeholder="Filter by admin..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Admins</SelectItem>
                                {admins?.map(admin => (
                                    <SelectItem key={admin.id} value={String(admin.id)}>
                                        {admin.fullName || admin.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hostnameFilter">Hostname</Label>
                        <Select value={filters.hostname} onValueChange={(value) => handleFilterChange('hostname', value === 'all' ? '' : value)}>
                            <SelectTrigger id="hostnameFilter">
                                <SelectValue placeholder="Filter by hostname..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Hostnames</SelectItem>
                                {hostnames?.map(host => (
                                    <SelectItem key={host} value={host}>{host}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="startDateHistory">Start Date</Label>
                        <Input id="startDateHistory" type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDateHistory">End Date</Label>
                        <Input id="endDateHistory" type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
                    </div>
                </div>
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hostname</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Administrator</TableHead>
                                <TableHead>Filename</TableHead>
                                <TableHead>Source IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {history.length > 0 ? history.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-mono text-sm">{entry.hostname}</TableCell>
                                    <TableCell>{format(new Date(entry.createdAt), 'Pp')}</TableCell>
                                    <TableCell>{entry.admin.fullName || entry.admin.username}</TableCell>
                                    <TableCell className="font-mono">{entry.fileName}</TableCell>
                                    <TableCell className="font-mono">{entry.ipAddress}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                     <TableCell colSpan={5} className="text-center h-24">No download history found for the selected criteria.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Label htmlFor="rows-per-page-history">Rows per page:</Label>
                    <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger id="rows-per-page-history" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[15, 30, 50].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords || 0} items)
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ConfigurationTab = ({ token }) => {
    const { data: initialConfig, error, isLoading, mutate } = useSWR('/logs/config', (url) => fetcher(url, token));

    const [deviceIPs, setDeviceIPs] = useState([]);
    const [newIp, setNewIp] = useState('');
    const [isIpsSaving, setIsIpsSaving] = useState(false);
    const [isIpsDirty, setIsIpsDirty] = useState(false);
    const [ipToDelete, setIpToDelete] = useState(null);

    const [settings, setSettings] = useState({ retentionDays: '', failsafe: { critical: '', target: '' } });
    const [isSettingsSaving, setIsSettingsSaving] = useState(false);
    const [isSettingsDirty, setIsSettingsDirty] = useState(false);

    useEffect(() => {
        if (initialConfig) {
            setDeviceIPs(initialConfig.deviceIPs || []);
            setSettings({
                retentionDays: initialConfig.retentionDays || '',
                failsafe: initialConfig.failsafe || { critical: '', target: '' },
            });
            setIsIpsDirty(false);
            setIsSettingsDirty(false);
        }
    }, [initialConfig]);

    const addDeviceIp = () => {
        if (newIp && !deviceIPs.includes(newIp)) {
            setDeviceIPs([...deviceIPs, newIp]);
            setNewIp('');
            setIsIpsDirty(true);
        } else {
            toast.info("IP address is empty or already exists.");
        }
    };
    
    const confirmRemoveIp = () => {
        if (!ipToDelete) return;
        setDeviceIPs(deviceIPs.filter(ip => ip !== ipToDelete));
        setIsIpsDirty(true);
        setIpToDelete(null);
    };

    const handleSettingsChange = (key, value) => {
        const keys = key.split('.');
        setSettings(prev => {
            const newSettings = JSON.parse(JSON.stringify(prev));
            let current = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
        setIsSettingsDirty(true);
    };

    const handleSaveIPs = async () => {
        setIsIpsSaving(true);
        try {
            const payload = {
                deviceIPs: deviceIPs,
                deviceIPsChanged: JSON.stringify(deviceIPs) !== JSON.stringify(initialConfig.deviceIPs)
            };
            await axiosInstance.post('/logs/config/ips', payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Device IPs saved successfully!");
            mutate();
        } catch (err) {
            toast.error("Failed to save Device IPs.", { description: err.response?.data?.message || err.message });
        } finally {
            setIsIpsSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSettingsSaving(true);
        try {
            await axiosInstance.post('/logs/config/settings', settings, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Settings saved successfully!");
            mutate();
        } catch (err) {
            toast.error("Failed to save settings.", { description: err.response?.data?.message || err.message });
        } finally {
            setIsSettingsSaving(false);
        }
    };

    if (isLoading) return <div className="p-4 text-center">Loading configuration...</div>;
    if (error || !initialConfig) return <div className="p-4 text-center text-destructive">Failed to load configuration.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Device IPs</CardTitle>
                    <CardDescription>Manage IP addresses that can send logs to this server. Changes require a service restart.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="space-y-2">
                        {deviceIPs.map(ip => (
                            <div key={ip} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <span className="font-mono">{ip}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIpToDelete(ip)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                         {deviceIPs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No device IPs configured.</p>}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Input placeholder="Enter new IP address" value={newIp} onChange={(e) => setNewIp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDeviceIp()} />
                        <Button onClick={addDeviceIp}>Add IP</Button>
                    </div>
                </CardContent>
                <CardFooter className="justify-end bg-slate-50 p-4 border-t mt-auto">
                    <Button onClick={handleSaveIPs} disabled={!isIpsDirty || isIpsSaving}>
                        {isIpsSaving ? "Saving..." : "Save IP Changes"}
                    </Button>
                </CardFooter>
            </Card>
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Retention & Failsafe</CardTitle>
                    <CardDescription>Settings for log rotation and disk space protection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="retentionDays">Retention Days</Label>
                        <Input id="retentionDays" type="number" value={settings.retentionDays} onChange={(e) => handleSettingsChange('retentionDays', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="criticalThreshold">Critical Disk Usage (%)</Label>
                        <Input id="criticalThreshold" type="number" value={settings.failsafe.critical} onChange={(e) => handleSettingsChange('failsafe.critical', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="targetThreshold">Target Disk Usage (%) after cleanup</Label>
                        <Input id="targetThreshold" type="number" value={settings.failsafe.target} onChange={(e) => handleSettingsChange('failsafe.target', e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="justify-end bg-slate-50 p-4 border-t mt-auto">
                     <Button onClick={handleSaveSettings} disabled={!isSettingsDirty || isSettingsSaving}>
                        {isSettingsSaving ? "Saving..." : "Save Settings"}
                    </Button>
                </CardFooter>
            </Card>
            <AlertDialog open={!!ipToDelete} onOpenChange={() => setIpToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove the IP address: <strong>{ipToDelete}</strong> from the configuration.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveIp}>Confirm Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};


export default function LogManagementPage() {
    const token = useAuthStore((state) => state.token);
    const location = useLocation();
    const navigate = useNavigate();

    const getCurrentTab = () => location.hash.replace('#', '') || 'dashboard';

    const [activeTab, setActiveTab] = useState(getCurrentTab());

    const handleTabChange = (tabValue) => {
        setActiveTab(tabValue);
        navigate(`#${tabValue}`, { replace: true });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Log Management</h1>
                    <p className="text-muted-foreground">Monitor and manage system log archives.</p>
                </div>
            </div>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="archive">Log Archive</TabsTrigger>
                    <TabsTrigger value="history">Download History</TabsTrigger>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard" className="mt-4"><DashboardTab token={token} /></TabsContent>
                <TabsContent value="archive" className="mt-4"><LogArchiveTab token={token} /></TabsContent>
                <TabsContent value="history" className="mt-4"><DownloadHistoryTab token={token} /></TabsContent>
                <TabsContent value="config" className="mt-4"><ConfigurationTab token={token} /></TabsContent>
            </Tabs>
        </div>
    );
}