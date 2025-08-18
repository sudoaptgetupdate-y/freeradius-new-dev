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
// --- START: เพิ่มการ import Tooltip ---
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// --- END ---
import { toast } from "sonner";
import { format } from 'date-fns';


// ... (โค้ดส่วนอื่นๆ ที่ไม่เปลี่ยนแปลง) ...
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


export default function UsersPage() {
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();

    const [organizations, setOrganizations] = useState([]);
    const [orgFilter, setOrgFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
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
        5,
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
                toast.error("Failed to load organizations for filtering.");
            }
        };
        fetchOrgs();
        setSelectedUsers([]);
    }, [token, pagination.currentPage, pagination.itemsPerPage, searchTerm, orgFilter]);

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
                loading: 'Deleting users...',
                success: (res) => {
                    onActionSuccess();
                    return `${res.data.data.deletedCount} user(s) deleted successfully!`;
                },
                error: (err) => err.response?.data?.message || "Failed to delete users.",
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
                loading: 'Updating status...',
                success: (res) => {
                    refreshData();
                    return `User '${userToToggle.username}' status updated.`;
                },
                error: (err) => err.response?.data?.message || "Failed to update status.",
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
                loading: 'Deleting user...',
                success: () => {
                    refreshData();
                    return `User '${userToDelete.username}' deleted successfully!`;
                },
                error: (err) => err.response?.data?.message || "Failed to delete user.",
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
                 {/* ... (ส่วน CardHeader และ CardContent ด้านบนไม่เปลี่ยนแปลง) ... */}
                 <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6" />
                                Users
                            </CardTitle>
                            <CardDescription>Manage all users in the system.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                            {selectedUsers.length > 0 && isBulkActionsEnabled && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => setIsMoveDialogOpen(true)}>
                                        <Move className="mr-2 h-4 w-4" />
                                        Move ({selectedUsers.length})
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete ({selectedUsers.length})
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" /> Import Users
                            </Button>
                            <Button size="sm" onClick={handleAddNew}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <Input
                            placeholder="Search by username or full name..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="lg:col-span-1"
                        />
                        <Select onValueChange={(value) => setOrgFilter(value === "all" ? "" : value)} value={orgFilter || "all"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by organization..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Organizations</SelectItem>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={String(org.id)}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        {/* 3. เพิ่ม Dropdown สำหรับ Status Filter */}
                        <Select onValueChange={setStatusFilter} value={statusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {!isBulkActionsEnabled && (
                        <p className="flex-shrink-0 text-sm text-muted-foreground mb-4">
                            Please select an organization from the filter to enable bulk actions.
                        </p>
                    )}

                    <div className="border rounded-md">
                        {/* --- START: เพิ่ม TooltipProvider ครอบ Table --- */}
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
                                    <SortableHeader columnKey="full_name" sortConfig={sortConfig} setSortConfig={setSortConfig}>Full Name</SortableHeader>
                                    <SortableHeader columnKey="username" sortConfig={sortConfig} setSortConfig={setSortConfig}>Username</SortableHeader>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <SortableHeader columnKey="createdAt" sortConfig={sortConfig} setSortConfig={setSortConfig}>Created At</SortableHeader>
                                    <TableHead className="text-center">Actions</TableHead>
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
                                                    <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                                                        {user.status === 'active' ? 'Active' : 'Disabled'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                                                <TableCell className="text-center">
                                                    {/* --- START: แก้ไขปุ่ม Action ทั้งหมด --- */}
                                                    <div className="inline-flex items-center justify-center flex-wrap gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(user.username)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>View Details</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit User</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setUserToToggle(user)}>
                                                                    {user.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{user.status === 'active' ? 'Disable' : 'Enable'} User</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(user)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Delete User</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    {/* --- END --- */}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={isBulkActionsEnabled ? 7 : 6} className="h-24 text-center">No users found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                         {/* --- END: ปิด TooltipProvider --- */}
                    </div>
                </CardContent>
                 {/* ... (ส่วน CardFooter และ Dialogs ไม่เปลี่ยนแปลง) ... */}
                 <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
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
                        Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems || 0} items)
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

            {isDialogOpen && ( <UserFormDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} user={editingUser} onSave={refreshData} /> )}
            {isMoveDialogOpen && ( <UserMoveDialog isOpen={isMoveDialogOpen} setIsOpen={setIsMoveDialogOpen} selectedUsers={selectedUsers} onMoveSuccess={onActionSuccess} /> )}
            {isImportDialogOpen && ( <UserImportDialog isOpen={isImportDialogOpen} setIsOpen={setIsImportDialogOpen} onImportSuccess={onActionSuccess} /> )}
            
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the selected <strong>{selectedUsers.length} user(s)</strong>. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!userToToggle} onOpenChange={(isOpen) => !isOpen && setUserToToggle(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirm Status Change</AlertDialogTitle><AlertDialogDescription>Are you sure you want to {userToToggle?.status === 'active' ? 'disable' : 'enable'} the user: <strong>{userToToggle?.username}</strong>?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmToggleStatus}>Confirm</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the user: <strong>{userToDelete?.username}</strong>. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}