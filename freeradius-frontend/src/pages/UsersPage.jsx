// src/pages/UsersPage.jsx
import { useState, useEffect } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, PlusCircle, Edit, Trash2, Move } from "lucide-react";
import UserFormDialog from "@/components/dialogs/UserFormDialog";
import UserMoveDialog from "@/components/dialogs/UserMoveDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function UsersPage() {
    const token = useAuthStore((state) => state.token);
    
    const [organizations, setOrganizations] = useState([]);
    const [orgFilter, setOrgFilter] = useState("");

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
        10, 
        { organizationId: orgFilter }
    );
    
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

    // --- เพิ่ม: ตัวแปรเช็คว่าควร disable การเลือกหรือไม่ ---
    const isSelectionDisabled = !orgFilter;

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const response = await axiosInstance.get('/organizations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrganizations(response.data.data);
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
        if (checked) {
            setSelectedUsers(users);
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectSingle = (checked, user) => {
        if (checked) {
            setSelectedUsers(prev => [...prev, user]);
        } else {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        }
    };

    const onMoveSuccess = () => {
        setSelectedUsers([]);
        refreshData();
    };

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

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
        try {
            await axiosInstance.delete(`/users/${userToDelete.username}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`User '${userToDelete.username}' deleted successfully!`);
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user.");
        } finally {
            setUserToDelete(null);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6" />
                                Users
                            </CardTitle>
                            <CardDescription>Manage all users in the system.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedUsers.length > 0 && !isSelectionDisabled && (
                                <Button variant="outline" onClick={() => setIsMoveDialogOpen(true)}>
                                    <Move className="mr-2 h-4 w-4" />
                                    Move Selected ({selectedUsers.length})
                                </Button>
                            )}
                            <Button onClick={handleAddNew}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <Input
                            placeholder="Search by username or full name..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="flex-grow"
                        />
                        <Select onValueChange={handleOrgFilterChange} value={orgFilter || "all"}>
                            <SelectTrigger className="w-full sm:w-[250px]">
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
                    </div>
                    
                    {/* --- เพิ่ม: คำอธิบายเมื่อ Checkbox ถูก disable --- */}
                    {isSelectionDisabled && (
                        <p className="text-sm text-muted-foreground mb-4">
                            Please select an organization from the filter to enable bulk actions.
                        </p>
                    )}

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            disabled={isSelectionDisabled}
                                            checked={!isSelectionDisabled && selectedUsers.length === users.length && users.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(10)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan="5"><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell></TableRow>
                                    ))
                                ) : users.length > 0 ? (
                                    users.map((user) => (
                                        <TableRow key={user.id} data-state={selectedUsers.some(u => u.id === user.id) && "selected"}>
                                            <TableCell>
                                                <Checkbox
                                                    disabled={isSelectionDisabled}
                                                    checked={selectedUsers.some(u => u.id === user.id)}
                                                    onCheckedChange={(checked) => handleSelectSingle(checked, user)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{user.full_name}</TableCell>
                                            <TableCell>{user.username}</TableCell>
                                            <TableCell>{user.organization.name}</TableCell>
                                            <TableCell className="text-center space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(user)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No users found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Label htmlFor="rows-per-page">Rows per page:</Label>
                        <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
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

            {isDialogOpen && (
                <UserFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    user={editingUser}
                    onSave={refreshData}
                />
            )}

            {isMoveDialogOpen && (
                <UserMoveDialog
                    isOpen={isMoveDialogOpen}
                    setIsOpen={setIsMoveDialogOpen}
                    selectedUsers={selectedUsers}
                    onMoveSuccess={onMoveSuccess}
                />
            )}

            <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user: <strong>{userToDelete?.username}</strong>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}