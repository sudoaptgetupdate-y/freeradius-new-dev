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
import { ArrowLeft, Edit, AlertCircle, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';
import { format, formatDistanceStrict } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import UserFormDialog from '@/components/dialogs/UserFormDialog';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

const calculateDuration = (startTime, stopTime, locale) => {
  if (!startTime) return 'N/A';
  if (!stopTime) return formatDistanceStrict(new Date(), new Date(startTime), { locale });
  return formatDistanceStrict(new Date(stopTime), new Date(startTime), { locale });
};

// Format date for UI with Thai Buddhist Era (BE) when language is 'th'
const formatDateLocalized = (date, language = 'en', { withTime = false } = {}) => {
  if (!date) return '';
  const d = new Date(date);
  const pattern = withTime ? 'dd/MM/yyyy, HH:mm:ss' : 'dd/MM/yyyy';
  if (language === 'th') {
    const yearAD = d.getFullYear();
    const yearBE = yearAD + 543; // convert AD -> BE
    // Use Thai locale for month/day names (even though we use numeric), then replace AD year with BE
    const base = format(d, pattern, { locale: th });
    return base.replace(yearAD.toString(), yearBE.toString());
  }
  return format(d, pattern, { locale: enUS });
};

// --- UserInfoCard Component ---
const UserInfoCard = ({ user, onEdit, t }) => {
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
            <Label className="text-muted-foreground">{t('table_headers.status')}</Label>
            <div className="mt-1">
              <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                {user.status === 'active' ? t('status.active') : t('status.disabled')}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">{t('table_headers.organization')}</Label>
            <p className="font-medium">{user.organization?.name}</p>
          </div>
          {user.email && <div><Label className="text-muted-foreground">{t('form_labels.email')}</Label><p className="font-medium break-words">{user.email}</p></div>}
          {user.phoneNumber && <div><Label className="text-muted-foreground">{t('form_labels.phone_number')}</Label><p className="font-medium">{user.phoneNumber}</p></div>}
          {user.national_id && <div><Label className="text-muted-foreground">{t('form_labels.national_id')}</Label><p className="font-medium">{user.national_id}</p></div>}
          {user.employee_id && <div><Label className="text-muted-foreground">{t('form_labels.employee_id')}</Label><p className="font-medium">{user.employee_id}</p></div>}
          {user.student_id && <div><Label className="text-muted-foreground">{t('form_labels.student_id')}</Label><p className="font-medium">{user.student_id}</p></div>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> {t('actions.edit_user')}</Button>
      </CardFooter>
    </Card>
  );
};

const UserHistoryTable = ({ username }) => {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState({ startDate: null, endDate: null });
  const {
    data: history,
    pagination,
    isLoading,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePaginatedFetch("/history", 5, {
    searchTerm: username,
    startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : '',
    endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''
  });

  const currentLocale = i18n.language === 'th' ? th : enUS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('user_detail_page.history.title')}</CardTitle>
        <CardDescription>{t('user_detail_page.history.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate
                  ? formatDateLocalized(filters.startDate, i18n.language, { withTime: false })
                  : <span>{t('form_labels.start_date')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                initialFocus
                locale={currentLocale}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate
                  ? formatDateLocalized(filters.endDate, i18n.language, { withTime: false })
                  : <span>{t('form_labels.end_date')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                initialFocus
                locale={currentLocale}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table_headers.login_time')}</TableHead>
                <TableHead>{t('table_headers.logout_time')}</TableHead>
                <TableHead>{t('table_headers.duration')}</TableHead>
                <TableHead>{t('table_headers.data_up')}</TableHead>
                <TableHead>{t('table_headers.data_down')}</TableHead>
                <TableHead>{t('table_headers.total_data')}</TableHead>
                <TableHead>{t('table_headers.terminate_cause')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(pagination.itemsPerPage)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : history.length > 0 ? (
                history.map((rec) => {
                  const dataUp = BigInt(rec.acctoutputoctets || 0);
                  const dataDown = BigInt(rec.acctinputoctets || 0);
                  return (
                    <TableRow key={rec.radacctid}>
                      <TableCell>
                        {rec.acctstarttime
                          ? formatDateLocalized(rec.acctstarttime, i18n.language, { withTime: true })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {rec.acctstoptime
                          ? formatDateLocalized(rec.acctstoptime, i18n.language, { withTime: true })
                          : <Badge variant="success" className="w-auto">{t('status.still_online')}</Badge>}
                      </TableCell>
                      <TableCell>{calculateDuration(rec.acctstarttime, rec.acctstoptime, currentLocale)}</TableCell>
                      <TableCell>{formatBytes(dataUp)}</TableCell>
                      <TableCell>{formatBytes(dataDown)}</TableCell>
                      <TableCell className="font-semibold">{formatBytes(dataUp + dataDown)}</TableCell>
                      <TableCell>{rec.acctterminatecause}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">{t('user_detail_page.history.no_records')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0 flex items-center justify-between gap-2 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Label htmlFor="rows-per-page">{t('pagination.rows_per_page')}</Label>
          <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 30, 50, 100].map(size => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {t('pagination.page_info', { currentPage: pagination.currentPage, totalPages: pagination.totalPages, totalItems: pagination.totalRecords || 0 })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.currentPage || pagination.currentPage <= 1}>{t('pagination.previous')}</Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.totalPages || pagination.currentPage >= pagination.totalPages}>{t('pagination.next')}</Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function UserDetailPage() {
  const { t } = useTranslation();
  const { username } = useParams();
  const token = useAuthStore((state) => state.token);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get(`/users/${username}`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(response.data.data);
    } catch (error) {
      toast.error(t('toast.user_detail_load_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchUser();
  }, [username, token, t]);

  if (isLoading) { return <div className="p-4">{t('user_detail_page.loading')}</div> }
  if (!user) { return <div className="p-4">{t('user_detail_page.not_found')}</div> }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          {t('user_detail_page.back_link')}
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><UserInfoCard user={user} onEdit={() => setIsEditDialogOpen(true)} t={t} /></div>
        <div className="lg:col-span-2"><UserHistoryTable username={user.username} /></div>
      </div>
      {isEditDialogOpen && (
        <UserFormDialog isOpen={isEditDialogOpen} setIsOpen={setIsEditDialogOpen} user={user} onSave={fetchUser} />
      )}
    </div>
  );
}