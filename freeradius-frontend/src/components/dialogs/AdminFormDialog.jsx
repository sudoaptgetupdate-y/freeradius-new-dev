// src/components/dialogs/AdminFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Check, X } from 'lucide-react'; // 1. Import icons
import { cn } from '@/lib/utils';

// --- START: เพิ่ม Component สำหรับแสดงผลการตรวจสอบรหัสผ่าน ---
const PasswordRequirement = ({ met, text }) => (
    <div className={cn("flex items-center text-sm", met ? "text-emerald-600" : "text-muted-foreground")}>
        {met ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2 text-red-500" />}
        <span>{text}</span>
    </div>
);

const PasswordValidation = ({ checks }) => (
    <div className="space-y-1 p-3 bg-muted/50 rounded-md mt-2">
        <PasswordRequirement met={checks.length} text="At least 8 characters long" />
        <PasswordRequirement met={checks.lowercase} text="At least one lowercase letter (a-z)" />
        <PasswordRequirement met={checks.uppercase} text="At least one uppercase letter (A-Z)" />
        <PasswordRequirement met={checks.number} text="At least one number (0-9)" />
        <PasswordRequirement met={checks.special} text="At least one special character (!@#$%^*)" />
    </div>
);
// --- END: สิ้นสุด Component ---

export default function AdminFormDialog({ isOpen, setIsOpen, admin, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phoneNumber: '',
        role: 'admin',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!admin;

    // --- START: เพิ่ม State สำหรับการตรวจสอบรหัสผ่าน ---
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
    });
    const [showValidation, setShowValidation] = useState(false);
    // --- END: สิ้นสุด State ---

    useEffect(() => {
        if (admin) {
            setFormData({
                fullName: admin.fullName || '',
                username: admin.username || '',
                email: admin.email || '',
                phoneNumber: admin.phoneNumber || '',
                role: admin.role || 'admin',
                password: '',
            });
        } else {
            setFormData({
                fullName: '', username: '', email: '', phoneNumber: '', role: 'admin', password: ''
            });
        }
        // Reset validation state when dialog opens
        setShowValidation(false);
        setPasswordValidation({ length: false, lowercase: false, uppercase: false, number: false, special: false });
    }, [admin, isOpen]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });

        // --- START: เพิ่ม Logic การตรวจสอบรหัสผ่าน ---
        if (id === 'password') {
            const isPasswordEntered = value.length > 0;
            setShowValidation(isPasswordEntered);

            if (isPasswordEntered) {
                const checks = {
                    length: value.length >= 8,
                    lowercase: /[a-z]/.test(value),
                    uppercase: /[A-Z]/.test(value),
                    number: /[0-9]/.test(value),
                    special: /[!@#$%^&*]/.test(value),
                };
                setPasswordValidation(checks);
            }
        }
        // --- END: สิ้นสุด Logic ---
    };

    const handleRoleChange = (value) => {
        setFormData({ ...formData, role: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- START: เพิ่มเงื่อนไขการตรวจสอบก่อน Submit ---
        if (formData.password) {
            if (Object.values(passwordValidation).some(met => !met)) {
                toast.error("Password does not meet all security requirements.");
                return;
            }
        }
        // --- END: สิ้นสุดเงื่อนไข ---
        
        setIsLoading(true);
        const url = isEditMode ? `/admins/${admin.id}` : '/admins';
        const method = isEditMode ? 'put' : 'post';
        
        let payload = { ...formData };
        if (isEditMode && !payload.password) {
            delete payload.password;
        }

        try {
            await axiosInstance[method](url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Admin ${isEditMode ? 'updated' : 'created'} successfully!`);
            onSave();
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Administrator' : 'Add New Administrator'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={formData.fullName} onChange={handleInputChange} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" value={formData.username} onChange={handleInputChange} required disabled={isEditMode} />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" onChange={handleInputChange} placeholder={isEditMode ? "Leave blank to keep current" : ""} required={!isEditMode} />
                        </div>
                    </div>

                    {/* --- START: แสดงผล Checklist --- */}
                    {showValidation && (
                        <PasswordValidation checks={passwordValidation} />
                    )}
                    {/* --- END: สิ้นสุดการแสดงผล --- */}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={formData.role} onValueChange={handleRoleChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}