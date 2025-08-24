// src/pages/LogManagementPage.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ShieldCheck, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import LogVolumeChartCard from "@/components/ui/LogVolumeChartCard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


const fetcher = (url, token) => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);

const formatDateLocalized = (date, language = 'en', options = {}) => {
    const { withTime = false } = options;
    if (!date) return '';
    const d = new Date(date);
    
    const pattern = withTime ? 'dd/MM/yyyy, HH:mm:ss' : 'dd/MM/yyyy';

    if (language === 'th') {
        const yearAD = d.getFullYear();
        const yearBE = yearAD + 543;
        const baseFormatted = format(d, pattern, { locale: th });
        return baseFormatted.replace(yearAD.toString(), yearBE.toString());
    }
    
    return format(d, pattern, { locale: enUS });
};

const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DashboardTab = ({ token }) => {
    const { t } = useTranslation();
    const { data, error, isLoading } = useSWR('/logs/dashboard', (url) => fetcher(url, token));

    if (isLoading) return <div className="p-4 text-center">{t('loading_dashboard')}</div>;
    if (error || !data) return <div className="p-4 text-center text-destructive">{t('toast.dashboard_load_failed')}</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">{t('log_management_page.dashboard.disk_usage')}</CardTitle></CardHeader>
                    <CardContent className="space-y-1">
                        <p className="text-sm text-muted-foreground">{t('total')}: {data.diskUsage.size}</p>
                        <p className="text-sm text-muted-foreground">{t('used')}: {data.diskUsage.used} ({data.diskUsage.usePercent})</p>
                        <p className="text-sm text-muted-foreground">{t('available')}: {data.diskUsage.available}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">{t('log_management_page.dashboard.gpg_key')}</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground break-words" title={data.gpgKey.recipient || t('not_set')}>
                            {t('recipient')}: {data.gpgKey.recipient || t('not_set')}
                        </p>
                    </CardContent>
                </Card>
                 <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="text-base">{t('log_management_page.dashboard.top_5_logs')}</CardTitle></CardHeader>
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
                            <p className="text-sm text-muted-foreground">{t('no_log_files_found')}</p>
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
    const { t, i18n } = useTranslation();
    const [filters, setFilters] = useState({ startDate: null, endDate: null });
    const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 15 });
    
    const currentLocale = i18n.language === 'th' ? th : enUS;

    const queryParams = new URLSearchParams({ page: pagination.currentPage, pageSize: pagination.itemsPerPage });
    if (filters.startDate) queryParams.append('startDate', format(filters.startDate, 'yyyy-MM-dd'));
    if (filters.endDate) queryParams.append('endDate', format(filters.endDate, 'yyyy-MM-dd'));

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
        setPagination(prev => ({ ...prev, itemsPerPage: parseInt(newSize, 10), currentPage: 1 }));
    };

    const handleDownload = (fileId, fileName) => {
        toast.info(t('toast.preparing_download_title'), { description: t('toast.preparing_download_desc') });
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
        }).catch(() => toast.error(t('toast.download_failed')));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('log_management_page.archive.title')}</CardTitle>
                <CardDescription>{t('log_management_page.archive.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="startDate">{t('form_labels.start_date')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.startDate ? formatDateLocalized(filters.startDate, i18n.language) : <span>{t('form_labels.start_date')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.startDate} onSelect={(date) => handleFilterChange('startDate', date)} initialFocus locale={currentLocale} /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="endDate">{t('form_labels.end_date')}</Label>
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
                </div>
                <div className="border rounded-md max-h-[60vh] overflow-y-auto">
                    <Table>
                         <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead>{t('table_headers.hostname')}</TableHead>
                                <TableHead>{t('table_headers.filename')}</TableHead>
                                <TableHead>{t('table_headers.size')}</TableHead>
                                <TableHead>{t('table_headers.modified_date')}</TableHead>
                                <TableHead className="text-right">{t('table_headers.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={5} className="text-center h-24">{t('loading_log_files')}</TableCell></TableRow>}
                            {error && <TableRow><TableCell colSpan={5} className="text-center h-24 text-destructive">{t('toast.log_files_load_failed')}</TableCell></TableRow>}
                            {!isLoading && files.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">{t('no_log_files_found_criteria')}</TableCell></TableRow>}
                            {files.map(file => (
                                <TableRow key={file.id}>
                                    <TableCell className="font-mono">{file.host}</TableCell>
                                    <TableCell className="font-mono">{file.name}</TableCell>
                                    <TableCell>{formatBytes(file.size)}</TableCell>
                                    <TableCell>{formatDateLocalized(file.modified, i18n.language, { withTime: true })}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(file.id, file.name)}>
                                            <Download className="mr-2 h-4 w-4" /> {t('download')}
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
                    <Label htmlFor="rows-per-page-archive">{t('pagination.rows_per_page')}</Label>
                    <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger id="rows-per-page-archive" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[15, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    {t('pagination.page_info_files', { currentPage: pagination.currentPage, totalPages: totalPages, totalItems: responseData?.totalRecords || 0 })}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>{t('pagination.previous')}</Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= totalPages}>{t('pagination.next')}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const DownloadHistoryTab = ({ token }) => {
    const { t, i18n } = useTranslation();
    const [filters, setFilters] = useState({ adminId: '', startDate: null, endDate: null, hostname: '' });
    
    const { data: admins } = useSWR('/admins', (url) => fetcher(url, token));
    const { data: hostnames } = useSWR('/logs/hostnames', (url) => fetcher(url, token));

    const { data: history, pagination, isLoading, handlePageChange, handleItemsPerPageChange } = usePaginatedFetch("/logs/history", 15, {
        ...filters,
        startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : '',
        endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''
    });
    
    const currentLocale = i18n.language === 'th' ? th : enUS;

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    if (isLoading && !history) return <div className="p-4 text-center">{t('loading_history')}</div>;
    if (!history) return <div className="p-4 text-center text-destructive">{t('toast.history_load_failed')}</div>;

    return (
        <Card>
            <CardHeader><CardTitle>{t('log_management_page.history.title')}</CardTitle><CardDescription>{t('log_management_page.history.description')}</CardDescription></CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2"><Label htmlFor="adminFilter">{t('administrator')}</Label><Select value={filters.adminId} onValueChange={(value) => handleFilterChange('adminId', value === 'all' ? '' : value)}><SelectTrigger id="adminFilter"><SelectValue placeholder={t('filter_by_admin')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('all_admins')}</SelectItem>{admins?.map(admin => (<SelectItem key={admin.id} value={String(admin.id)}>{admin.fullName || admin.username}</SelectItem>))}</SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor="hostnameFilter">{t('hostname')}</Label><Select value={filters.hostname} onValueChange={(value) => handleFilterChange('hostname', value === 'all' ? '' : value)}><SelectTrigger id="hostnameFilter"><SelectValue placeholder={t('filter_by_hostname')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('all_hostnames')}</SelectItem>{hostnames?.map(host => (<SelectItem key={host} value={host}>{host}</SelectItem>))}</SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor="startDateHistory">{t('form_labels.start_date')}</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filters.startDate ? formatDateLocalized(filters.startDate, i18n.language) : <span>{t('form_labels.start_date')}</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.startDate} onSelect={(date) => handleFilterChange('startDate', date)} initialFocus locale={currentLocale} /></PopoverContent></Popover></div>
                    <div className="space-y-2"><Label htmlFor="endDateHistory">{t('form_labels.end_date')}</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filters.endDate ? formatDateLocalized(filters.endDate, i18n.language) : <span>{t('form_labels.end_date')}</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.endDate} onSelect={(date) => handleFilterChange('endDate', date)} initialFocus locale={currentLocale} /></PopoverContent></Popover></div>
                </div>
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader><TableRow><TableHead>{t('table_headers.hostname')}</TableHead><TableHead>{t('table_headers.timestamp')}</TableHead><TableHead>{t('administrator')}</TableHead><TableHead>{t('table_headers.filename')}</TableHead><TableHead>{t('table_headers.source_ip')}</TableHead></TableRow></TableHeader>
                        <TableBody>
                             {history.length > 0 ? history.map(entry => (
                                <TableRow key={entry.id}><TableCell className="font-mono text-sm">{entry.hostname}</TableCell><TableCell>{formatDateLocalized(entry.createdAt, i18n.language, { withTime: true })}</TableCell><TableCell>{entry.admin.fullName || entry.admin.username}</TableCell><TableCell className="font-mono">{entry.fileName}</TableCell><TableCell className="font-mono">{entry.ipAddress}</TableCell></TableRow>
                            )) : (<TableRow><TableCell colSpan={5} className="text-center h-24">{t('no_history_found_criteria')}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground"><Label htmlFor="rows-per-page-history">{t('pagination.rows_per_page')}</Label><Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}><SelectTrigger id="rows-per-page-history" className="w-20"><SelectValue /></SelectTrigger><SelectContent>{[15, 30, 50].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}</SelectContent></Select></div>
                <div className="text-sm text-muted-foreground">{t('pagination.page_info', { currentPage: pagination.currentPage, totalPages: pagination.totalPages, totalItems: pagination.totalRecords || 0 })}</div>
                <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>{t('pagination.previous')}</Button><Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>{t('pagination.next')}</Button></div>
            </CardFooter>
        </Card>
    );
};

const ConfigurationTab = ({ token }) => {
    const { t } = useTranslation();
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
            setSettings({ retentionDays: initialConfig.retentionDays || '', failsafe: initialConfig.failsafe || { critical: '', target: '' } });
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
            toast.info(t('toast.ip_empty_or_exists'));
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
            for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
        setIsSettingsDirty(true);
    };

    const handleSaveIPs = async () => {
        setIsIpsSaving(true);
        toast.promise(
            axiosInstance.post('/logs/config/ips', { deviceIPs, deviceIPsChanged: JSON.stringify(deviceIPs) !== JSON.stringify(initialConfig.deviceIPs) }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_ips'),
                success: () => { mutate(); return t('toast.save_ips_success'); },
                error: (err) => err.response?.data?.message || t('toast.save_ips_failed'),
                finally: () => setIsIpsSaving(false)
            }
        );
    };

    const handleSaveSettings = async () => {
        setIsSettingsSaving(true);
        toast.promise(
            axiosInstance.post('/logs/config/settings', settings, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.saving_settings'),
                success: () => { mutate(); return t('toast.save_settings_success'); },
                error: (err) => err.response?.data?.message || t('toast.save_settings_failed'),
                finally: () => setIsSettingsSaving(false)
            }
        );
    };

    if (isLoading) return <div className="p-4 text-center">{t('loading_config')}</div>;
    if (error || !initialConfig) return <div className="p-4 text-center text-destructive">{t('toast.config_load_failed')}</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card className="flex flex-col h-full"><CardHeader><CardTitle>{t('log_management_page.config.ips_title')}</CardTitle><CardDescription>{t('log_management_page.config.ips_desc')}</CardDescription></CardHeader><CardContent className="flex-grow"><div className="space-y-2">{deviceIPs.map(ip => (<div key={ip} className="flex items-center justify-between p-2 rounded-md hover:bg-muted"><span className="font-mono">{ip}</span><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIpToDelete(ip)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>))}{deviceIPs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t('no_device_ips')}</p>}</div><div className="flex gap-2 mt-4"><Input placeholder={t('enter_new_ip')} value={newIp} onChange={(e) => setNewIp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDeviceIp()} /><Button onClick={addDeviceIp}>{t('add_ip')}</Button></div></CardContent><CardFooter className="justify-end bg-slate-50 p-4 border-t mt-auto"><Button onClick={handleSaveIPs} disabled={!isIpsDirty || isIpsSaving}>{isIpsSaving ? t('saving') : t('save_ip_changes')}</Button></CardFooter></Card>
            <Card className="flex flex-col h-full"><CardHeader><CardTitle>{t('log_management_page.config.retention_title')}</CardTitle><CardDescription>{t('log_management_page.config.retention_desc')}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="retentionDays">{t('form_labels.retention_days')}</Label><Input id="retentionDays" type="number" value={settings.retentionDays} onChange={(e) => handleSettingsChange('retentionDays', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="criticalThreshold">{t('form_labels.critical_disk_usage')}</Label><Input id="criticalThreshold" type="number" value={settings.failsafe.critical} onChange={(e) => handleSettingsChange('failsafe.critical', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="targetThreshold">{t('form_labels.target_disk_usage')}</Label><Input id="targetThreshold" type="number" value={settings.failsafe.target} onChange={(e) => handleSettingsChange('failsafe.target', e.target.value)} /></div></CardContent><CardFooter className="justify-end bg-slate-50 p-4 border-t mt-auto"><Button onClick={handleSaveSettings} disabled={!isSettingsDirty || isSettingsSaving}>{isSettingsSaving ? t('saving') : t('save_settings')}</Button></CardFooter></Card>
            <AlertDialog open={!!ipToDelete} onOpenChange={() => setIpToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle><AlertDialogDescription dangerouslySetInnerHTML={{ __html: t('delete_ip_dialog.description', { ip: ipToDelete }) }}/></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmRemoveIp}>{t('delete_ip_dialog.confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
    );
};


export default function LogManagementPage() {
    const { t } = useTranslation();
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
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> {t('log_management_page.title')}</h1><p className="text-muted-foreground">{t('log_management_page.description')}</p></div>
            </div>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
                    <TabsTrigger value="archive">{t('log_management_page.tabs.archive')}</TabsTrigger>
                    <TabsTrigger value="history">{t('log_management_page.tabs.history')}</TabsTrigger>
                    <TabsTrigger value="config">{t('log_management_page.tabs.config')}</TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard" className="mt-4"><DashboardTab token={token} /></TabsContent>
                <TabsContent value="archive" className="mt-4"><LogArchiveTab token={token} /></TabsContent>
                <TabsContent value="history" className="mt-4"><DownloadHistoryTab token={token} /></TabsContent>
                <TabsContent value="config" className="mt-4"><ConfigurationTab token={token} /></TabsContent>
            </Tabs>
        </div>
    );
}