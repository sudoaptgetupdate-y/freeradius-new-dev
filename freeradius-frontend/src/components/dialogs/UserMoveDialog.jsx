// src/components/dialogs/UserMoveDialog.jsx
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

export default function UserMoveDialog({ isOpen, setIsOpen, selectedUsers, onMoveSuccess }) {
    const token = useAuthStore((state) => state.token);
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [targetOrgId, setTargetOrgId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ดึงข้อมูลองค์กรทั้งหมดเมื่อ Dialog เปิด
    useEffect(() => {
        if (isOpen) {
            const fetchOrgs = async () => {
                try {
                    const response = await axiosInstance.get('/organizations', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // --- START: แก้ไขส่วนนี้ ---
                    // ดึง Array ที่อยู่ใน key "organizations" ออกมา
                    setAllOrganizations(response.data.data.organizations);
                    // --- END ---
                } catch (error) {
                    toast.error("Failed to load organizations.");
                }
            };
            fetchOrgs();
        }
    }, [isOpen, token]);

    // กรองรายชื่อองค์กรให้แสดงเฉพาะ Type เดียวกันกับผู้ใช้ที่ถูกเลือกคนแรก
    const compatibleOrgs = useMemo(() => {
        if (selectedUsers.length === 0 || !Array.isArray(allOrganizations) || allOrganizations.length === 0) {
            return [];
        }
        const firstUserOrgType = selectedUsers[0].organization.login_identifier_type;
        return allOrganizations.filter(org => org.login_identifier_type === firstUserOrgType);
    }, [selectedUsers, allOrganizations]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!targetOrgId) {
            toast.warning("Please select a target organization.");
            return;
        }
        setIsLoading(true);
        try {
            await axiosInstance.post('/users/bulk-move', {
                userIds: selectedUsers.map(u => u.id),
                targetOrganizationId: parseInt(targetOrgId)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${selectedUsers.length} user(s) moved successfully!`);
            onMoveSuccess(); // เรียกฟังก์ชันจากแม่เพื่อ refresh ข้อมูล
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred during the move.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Move Users</DialogTitle>
                    <DialogDescription>
                        You have selected {selectedUsers.length} user(s). Please choose a target organization.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="targetOrg">Target Organization</Label>
                        <Select value={targetOrgId} onValueChange={setTargetOrgId} required>
                            <SelectTrigger id="targetOrg">
                                <SelectValue placeholder="Select a compatible organization..." />
                            </SelectTrigger>
                            <SelectContent>
                                {compatibleOrgs.map(org => (
                                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <p className="text-xs text-muted-foreground pt-1">
                            Only organizations with the same login type are shown.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || !targetOrgId}>
                            {isLoading ? 'Moving...' : 'Confirm Move'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}