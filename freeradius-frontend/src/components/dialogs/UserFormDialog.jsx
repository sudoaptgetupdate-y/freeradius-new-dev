// src/components/dialogs/UserFormDialog.jsx
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

const RequiredLabel = ({ htmlFor, children }) => (
    <Label htmlFor={htmlFor}>
        {children} <span className="text-red-500">*</span>
    </Label>
);

const OrganizationCombobox = ({ selectedValue, onSelect, organizations }) => (
    <Select value={selectedValue ? String(selectedValue) : ""} onValueChange={onSelect}>
        <SelectTrigger><SelectValue placeholder="Select an organization..." /></SelectTrigger>
        <SelectContent>
            {organizations.length > 0 ? (
                organizations.map(org => (
                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                ))
            ) : (
                <div className="p-4 text-sm text-muted-foreground">No compatible organizations found.</div>
            )}
        </SelectContent>
    </Select>
);

const initialFormData = {
    organizationId: '',
    full_name: '',
    password: '',
    username: '',
    national_id: '',
    employee_id: '',
    student_id: '',
    email: '',
    phoneNumber: '',
};

export default function UserFormDialog({ isOpen, setIsOpen, user, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [isDataReady, setIsDataReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = !!user;

    const isFieldsDisabled = !isEditMode && !formData.organizationId;

    useEffect(() => {
        if (isOpen) {
            setIsDataReady(false);
            axiosInstance.get('/organizations', { headers: { Authorization: `Bearer ${token}` } })
                .then(response => {
                    // --- START: แก้ไขส่วนนี้ ---
                    const fetchedOrgs = response.data.data.organizations;
                    // --- END ---
                    setAllOrganizations(fetchedOrgs);

                    if (user) {
                        setFormData({
                            ...initialFormData,
                            organizationId: user.organizationId || '',
                            full_name: user.full_name || '',
                            username: user.username || '',
                            national_id: user.national_id || '',
                            employee_id: user.employee_id || '',
                            student_id: user.student_id || '',
                            email: user.email || '',
                            phoneNumber: user.phoneNumber || '',
                            password: '',
                        });
                    } else {
                        setFormData(initialFormData);
                    }
                    setIsDataReady(true);
                })
                .catch(error => {
                    toast.error("Failed to load organizations.");
                    setIsOpen(false);
                });
        }
    }, [isOpen, user, token, setIsOpen]);

    const compatibleOrgs = useMemo(() => {
        if (!isDataReady) return [];
        if (!isEditMode) return allOrganizations;
        
        if (isEditMode && user) {
            const currentUserOrg = allOrganizations.find(
                o => String(o.id) === String(user.organizationId)
            );

            if (currentUserOrg) {
                return allOrganizations.filter(
                    o => o.login_identifier_type === currentUserOrg.login_identifier_type
                );
            }
        }
        return [];
    }, [isDataReady, isEditMode, allOrganizations, user]);

    const loginIdentifierType = useMemo(() => {
        if (formData.organizationId && allOrganizations.length > 0) {
            const org = allOrganizations.find(o => String(o.id) === String(formData.organizationId));
            return org ? org.login_identifier_type : 'manual';
        }
        return 'manual';
    }, [formData.organizationId, allOrganizations]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleOrgChange = (value) => {
        setFormData(prev => ({ ...initialFormData, organizationId: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const url = isEditMode ? `/users/${user.username}` : '/users';
        const method = isEditMode ? 'put' : 'post';
        
        let payload = { ...formData };
        if (isEditMode && !payload.password) delete payload.password;
        if (payload.organizationId) payload.organizationId = parseInt(payload.organizationId, 10);

        try {
            await axiosInstance[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`User ${isEditMode ? 'updated' : 'created'} successfully!`);
            onSave();
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
                </DialogHeader>
                {!isDataReady ? (
                    <div className="py-12 flex justify-center items-center"><span>Loading form data...</span></div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="organizationId">Organization</RequiredLabel>
                            <OrganizationCombobox
                                selectedValue={formData.organizationId}
                                onSelect={handleOrgChange}
                                organizations={compatibleOrgs}
                            />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="full_name">Full Name</RequiredLabel>
                            <Input id="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="e.g., John Doe" required disabled={isFieldsDisabled} />
                        </div>

                        {loginIdentifierType === 'manual' && (
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="username">Username</RequiredLabel>
                                <Input id="username" value={formData.username} onChange={handleInputChange} placeholder="e.g., johndoe" required disabled={isEditMode || isFieldsDisabled} />
                            </div>
                        )}
                        {loginIdentifierType === 'employee_id' && (
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="employee_id">Employee ID</RequiredLabel>
                                <Input id="employee_id" value={formData.employee_id} onChange={handleInputChange} placeholder="e.g., EMP001" required disabled={isEditMode || isFieldsDisabled} />
                            </div>
                        )}
                        {loginIdentifierType === 'student_id' && (
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="student_id">Student ID</RequiredLabel>
                                <Input id="student_id" value={formData.student_id} onChange={handleInputChange} placeholder="e.g., 6601001" required disabled={isEditMode || isFieldsDisabled} />
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            {loginIdentifierType === 'national_id' ? (
                                <RequiredLabel htmlFor="national_id">National ID</RequiredLabel>
                            ) : (
                                <Label htmlFor="national_id">National ID (Optional)</Label>
                            )}
                            <Input id="national_id" value={formData.national_id} onChange={handleInputChange} placeholder="13-digit ID number" required={loginIdentifierType === 'national_id'} disabled={isEditMode || isFieldsDisabled}/>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="e.g., user@example.com" disabled={isFieldsDisabled} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="e.g., 0812345678" disabled={isFieldsDisabled} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="password">Password</RequiredLabel>
                            <Input id="password" type="password" onChange={handleInputChange} placeholder={isEditMode ? "Leave blank to keep current password" : "Enter a strong password"} required={!isEditMode} disabled={isFieldsDisabled} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving || isFieldsDisabled}>{isSaving ? 'Saving...' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}