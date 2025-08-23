// src/components/dialogs/UserMoveDialog.jsx
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { useTranslation } from "react-i18next"; // <-- Import

export default function UserMoveDialog({ isOpen, setIsOpen, selectedUsers, onMoveSuccess }) {
    const { t } = useTranslation(); // <-- เรียกใช้
    const token = useAuthStore((state) => state.token);
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [targetOrgId, setTargetOrgId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchOrgs = async () => {
                try {
                    const response = await axiosInstance.get('/organizations', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setAllOrganizations(response.data.data.organizations);
                } catch (error) {
                    toast.error(t('toast.org_load_failed'));
                }
            };
            fetchOrgs();
        }
    }, [isOpen, token, t]);

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
            toast.warning(t('toast.select_target_org'));
            return;
        }
        setIsLoading(true);
        toast.promise(
            axiosInstance.post('/users/bulk-move', {
                userIds: selectedUsers.map(u => u.id),
                targetOrganizationId: parseInt(targetOrgId)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.moving_users'),
                success: () => {
                    onMoveSuccess();
                    setIsOpen(false);
                    return t('toast.move_success', { count: selectedUsers.length });
                },
                error: (err) => err.response?.data?.message || t('toast.move_failed'),
                finally: () => setIsLoading(false),
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('move_users_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('move_users_dialog.description', { count: selectedUsers.length })}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="targetOrg">{t('move_users_dialog.target_org_label')}</Label>
                        <Select value={targetOrgId} onValueChange={setTargetOrgId} required>
                            <SelectTrigger id="targetOrg">
                                <SelectValue placeholder={t('move_users_dialog.select_org_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {compatibleOrgs.map(org => (
                                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <p className="text-xs text-muted-foreground pt-1">
                            {t('move_users_dialog.note')}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit" disabled={isLoading || !targetOrgId}>
                            {isLoading ? t('moving') : t('move_users_dialog.confirm_move')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}