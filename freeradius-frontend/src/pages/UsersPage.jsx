// src/pages/UsersPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, PlusCircle, Edit, Trash2, Move, Eye, Ban, CheckCircle, Upload, ArrowUpDown } from "lucide-react";
import UserFormDialog from "@/components/dialogs/UserFormDialog";
import UserMoveDialog from "@/components/dialogs/UserMoveDialog";
import UserImportDialog from "@/components/dialogs/UserImportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format } from 'date-fns';
import { useTranslation } from "react-i18next";
import { useLocation } from 'react-router-dom'; // <-- ADDED

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
            <Button variant="ghost" onClick={handleClick} className="px-2">
                {children}
                <ArrowUpDown className={`ml-2 h-4 w-4 ${isSorted ? '' : 'text-muted-foreground'}`} />
            </Button>
        </TableHead>
    );
};

// --- START: ADDED ---
const StatusBadge = ({ status, t }) => {
    const statusConfig = {
        active: { variant: "success", label: t('status.active') },
        disabled: { variant: "secondary", label: t('status.disabled') },
        registered: { variant: "outline", label: t('status.registered') },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
};
// --- END ---


export default function UsersPage() {
    const { t } = useTranslation(); 
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();
    const location = useLocation(); // <-- ADDED

    const [organizations, setOrganizations] = useState([]);
    const [orgFilter, setOrgFilter] = useState("");
    // --- START: MODIFIED ---
    const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || "all");
    // --- END ---
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    const {
        data: users,
        pagination,
        isLoading,
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData
    } = usePaginatedFetch(
        "/users",
        15, 
        { 
            organizationId: orgFilter,
            sortBy: sortConfig.key,
            sortOrder: sortConfig.direction,
            status: statusFilter,
        }
    );

    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    const isBulkActionsEnabled = !!orgFilter;

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const response = await axiosInstance.get('/organizations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrganizations(response.data.data.organizations);
            } catch (error) {
                toast.error(t('toast.org_load_failed'));
            }
        };
        fetchOrgs();
        setSelectedUsers([]);
    }, [token, pagination.currentPage, pagination.itemsPerPage, searchTerm, orgFilter, t]);

    const handleOrgFilterChange = (value) => {
        setOrgFilter(value === "all" ? "" : value);
    };

    const handleSelectAll = (checked) => {
        setSelectedUsers(checked ? users : []);
    };

    const handleSelectSingle = (checked, user) => {
        setSelectedUsers(prev => 
            checked ? [...prev, user] : prev.filter(u => u.id !== user.id)
        );
    };

    const onActionSuccess = () => {
        setSelectedUsers([]);
        refreshData();
    };

    const confirmBulkDelete = async () => {
        if (selectedUsers.length === 0) return;
        toast.promise(
            axiosInstance.post('/users/bulk-delete', { usernames: selectedUsers.map(u => u.username) }, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.deleting_users'),
                success: (res) => {
                    onActionSuccess();
                    return t('toast.bulk_delete_success', { count: res.data.data.deletedCount });
                },
                error: (err) => err.response?.data?.message || t('toast.bulk_delete_failed'),
                finally: () => setIsBulkDeleteDialogOpen(false),
            }
        );
    };

    const confirmToggleStatus = async () => {
        if (!userToToggle) return;
        toast.promise(
            axiosInstance.put(`/users/${userToToggle.username}/status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.updating_status'),
                success: (res) => {
                    refreshData();
                    return t('toast.status_update_success', { username: userToToggle.username });
                },
                error: (err) => err.response?.data?.message || t('toast.status_update_failed'),
                finally: () => setUserToToggle(null),
            }
        );
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsDialogOpen(true);
    };

    const handleDelete = (user) => {
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        toast.promise(
            axiosInstance.delete(`/users/${userToDelete.username}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.deleting_user'),
                success: () => {
                    refreshData();
                    return t('toast.delete_success', { username: userToDelete.username });
                },
                error: (err) => err.response?.data?.message || t('toast.delete_failed'),
                finally: () => setUserToDelete(null),
            }
        );
    };
    
    const handleViewDetails = (username) => {
        navigate(`/users/${username}`);
    };
    
    return (
        <>
            <Card>
                 <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6" />
                                {t('users_page.title')}
                            </CardTitle>
                            <CardDescription>{t('users_page.description')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                            {selectedUsers.length > 0 && isBulkActionsEnabled && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => setIsMoveDialogOpen(true)}>
                                        <Move className="mr-2 h-4 w-4" />
                                        {t('users_page.move_button', { count: selectedUsers.length })}
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t('users_page.delete_button', { count: selectedUsers.length })}
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" /> {t('users_page.import_button')}
                            </Button>
                            <Button size="sm" onClick={handleAddNew}>
                                <PlusCircle className="mr-2 h-4 w-4" /> {t('users_page.add_new_button')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <Input
                            placeholder={t('users_page.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="lg:col-span-1"
                        />
                        <Select onValueChange={(value) => setOrgFilter(value === "all" ? "" : value)} value={orgFilter || "all"}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('users_page.filter_org_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('all_organizations')}</SelectItem>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={String(org.id)}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        {/* --- START: MODIFIED --- */}
                        <Select onValueChange={setStatusFilter} value={statusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('users_page.filter_status_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('all_statuses')}</SelectItem>
                                <SelectItem value="active">{t('status.active')}</SelectItem>
                                <SelectItem value="registered">{t('status.registered')}</SelectItem>
                                <SelectItem value="disabled">{t('status.disabled')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {/* --- END --- */}
                    </div>

                    {!isBulkActionsEnabled && (
                        <p className="flex-shrink-0 text-sm text-muted-foreground mb-4">
                            {t('users_page.bulk_actions_prompt')}
                        </p>
                    )}

                    <div className="border rounded-md">
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                         {isBulkActionsEnabled && (
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={users.length > 0 && selectedUsers.length === users.length}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                    )}
                                    <SortableHeader columnKey="full_name" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.full_name')}</SortableHeader>
                                    <SortableHeader columnKey="username" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.username')}</SortableHeader>
                                    <TableHead>{t('table_headers.organization')}</TableHead>
                                    <TableHead>{t('table_headers.status')}</TableHead>
                                    <SortableHeader columnKey="createdAt" sortConfig={sortConfig} setSortConfig={setSortConfig}>{t('table_headers.created_at')}</SortableHeader>
                                    <TableHead className="text-center">{t('table_headers.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: pagination.itemsPerPage }).map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={isBulkActionsEnabled ? 7 : 6}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>
                                        ))
                                    ) : users.length > 0 ? (
                                        users.map((user) => (
                                            <TableRow key={user.id} data-state={selectedUsers.some(u => u.id === user.id) && "selected"}>
                                                {isBulkActionsEnabled && (
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedUsers.some(u => u.id === user.id)}
                                                        onCheckedChange={(checked) => handleSelectSingle(checked, user)}
                                                    />
                                                </TableCell>
                                                )}
                                                <TableCell className="font-medium">{user.full_name}</TableCell>
                                                <TableCell>{user.username}</TableCell>
                                                <TableCell>{user.organization.name}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={user.status} t={t} />
                                                </TableCell>
                                                <TableCell>{format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center flex-wrap gap-1">
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(user.username)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>{t('actions.view_details')}</p></TooltipContent></Tooltip>
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>{t('actions.edit')}</p></TooltipContent></Tooltip>
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setUserToToggle(user)}>{user.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent><p>{user.status === 'active' ? t('actions.disable') : t('actions.enable')}</p></TooltipContent></Tooltip>
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(user)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>{t('actions.delete')}</p></TooltipContent></Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={isBulkActionsEnabled ? 7 : 6} className="h-24 text-center">{t('users_page.no_users_found')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
                 <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Label htmlFor="rows-per-page">{t('pagination.rows_per_page')}</Label>
                        <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[15, 30, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {t('pagination.page_info', { currentPage: pagination.currentPage, totalPages: pagination.totalPages, totalItems: pagination.totalItems || 0 })}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1}>
                            {t('pagination.previous')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages}>
                            {t('pagination.next')}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {isDialogOpen && ( <UserFormDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} user={editingUser} onSave={refreshData} /> )}
            {isMoveDialogOpen && ( <UserMoveDialog isOpen={isMoveDialogOpen} setIsOpen={setIsMoveDialogOpen} selectedUsers={selectedUsers} onMoveSuccess={onActionSuccess} /> )}
            {isImportDialogOpen && ( <UserImportDialog isOpen={isImportDialogOpen} setIsOpen={setIsImportDialogOpen} onImportSuccess={onActionSuccess} /> )}
            
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription dangerouslySetInnerHTML={{ __html: t('bulk_delete_dialog.description', { count: selectedUsers.length }) }} />
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90">{t('bulk_delete_dialog.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!userToToggle} onOpenChange={(isOpen) => !isOpen && setUserToToggle(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('toggle_status_dialog.title')}</AlertDialogTitle>
                        <AlertDialogDescription dangerouslySetInnerHTML={{ __html: t(userToToggle?.status === 'active' ? 'toggle_status_dialog.disable_desc' : 'toggle_status_dialog.enable_desc', { username: userToToggle?.username }) }} />
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmToggleStatus}>{t('confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle><AlertDialogDescription dangerouslySetInnerHTML={{ __html: t('delete_dialog.description', { username: userToDelete?.username }) }} /></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_dialog.confirm')}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}