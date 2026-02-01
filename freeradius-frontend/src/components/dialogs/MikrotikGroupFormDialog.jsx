// src/components/dialogs/MikrotikGroupFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { useTranslation } from "react-i18next"; // เพิ่มการ Import

const initialFormData = {
    name: '',
    rateLimit: '',
    sessionTimeout: '',
    idleTimeout: '',
    sharedUsers: '',
    acctInterimInterval: ''
};

// Helper functions สำหรับจัดการเวลา
const secondsToTime = (sec) => {
    if (!sec || isNaN(sec)) return { hours: '', minutes: '' };
    const totalSeconds = parseInt(sec, 10);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return {
        hours: hours > 0 ? hours : '',
        minutes: minutes > 0 ? minutes : ''
    };
};

const timeToSeconds = (hours, minutes) => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    return (h * 3600) + (m * 60);
};

export default function MikrotikGroupFormDialog({ isOpen, setIsOpen, profile, onSave }) {
    const { t } = useTranslation(); // เรียกใช้ hook สำหรับแปลภาษา
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!profile;

    const [timeInputs, setTimeInputs] = useState({
        session: { hours: '', minutes: '' },
        idle: { hours: '', minutes: '' },
        accounting: { hours: '', minutes: '' },
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                rateLimit: profile.rateLimit || '',
                sessionTimeout: profile.sessionTimeout || '',
                idleTimeout: profile.idleTimeout || '',
                sharedUsers: profile.sharedUsers || '',
                acctInterimInterval: profile.acctInterimInterval || ''
            });
            setTimeInputs({
                session: secondsToTime(profile.sessionTimeout),
                idle: secondsToTime(profile.idleTimeout),
                accounting: secondsToTime(profile.acctInterimInterval),
            });
        } else {
            setFormData(initialFormData);
            setTimeInputs({
                session: { hours: '', minutes: '' },
                idle: { hours: '', minutes: '' },
                accounting: { hours: '', minutes: '' },
            });
        }
    }, [profile, isOpen]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleTimeChange = (type, unit, value) => {
        const newTimeInputs = { ...timeInputs };
        newTimeInputs[type][unit] = value;
        setTimeInputs(newTimeInputs);

        const { hours, minutes } = newTimeInputs[type];
        const totalSeconds = timeToSeconds(hours, minutes);

        const mapping = {
            session: 'sessionTimeout',
            idle: 'idleTimeout',
            accounting: 'acctInterimInterval'
        };
        
        setFormData(prev => ({ ...prev, [mapping[type]]: totalSeconds > 0 ? String(totalSeconds) : '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/mikrotik-profiles/${profile.id}` : '/mikrotik-profiles';
        const method = isEditMode ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('mikrotik_group_form.toast_saving'),
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return t('mikrotik_group_form.toast_save_success', { name: formData.name });
                },
                error: (err) => err.response?.data?.message || t('mikrotik_group_form.toast_save_error'),
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? t('mikrotik_group_form.edit_title') : t('mikrotik_group_form.add_title')}
                    </DialogTitle>
                </DialogHeader>
                <form id="mikrotik-group-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('mikrotik_group_form.name_label')}</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder={t('mikrotik_group_form.name_placeholder')} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rateLimit">{t('mikrotik_group_form.rate_limit_label')}</Label>
                        <Input id="rateLimit" value={formData.rateLimit} onChange={handleInputChange} placeholder={t('mikrotik_group_form.rate_limit_placeholder')} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sharedUsers">{t('mikrotik_group_form.shared_users_label')}</Label>
                        <Input id="sharedUsers" type="number" value={formData.sharedUsers} onChange={handleInputChange} placeholder="e.g., 1" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>{t('mikrotik_group_form.session_timeout_label')}</Label>
                        <div className="flex items-center gap-2">
                            <Input id="sessionHours" type="number" placeholder={t('mikrotik_group_form.hours')} value={timeInputs.session.hours} onChange={(e) => handleTimeChange('session', 'hours', e.target.value)} />
                            <Input id="sessionMinutes" type="number" placeholder={t('mikrotik_group_form.minutes')} value={timeInputs.session.minutes} onChange={(e) => handleTimeChange('session', 'minutes', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('mikrotik_group_form.idle_timeout_label')}</Label>
                         <div className="flex items-center gap-2">
                            <Input id="idleHours" type="number" placeholder={t('mikrotik_group_form.hours')} value={timeInputs.idle.hours} onChange={(e) => handleTimeChange('idle', 'hours', e.target.value)} />
                            <Input id="idleMinutes" type="number" placeholder={t('mikrotik_group_form.minutes')} value={timeInputs.idle.minutes} onChange={(e) => handleTimeChange('idle', 'minutes', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('mikrotik_group_form.acct_interval_label')}</Label>
                         <div className="flex items-center gap-2">
                             <Input id="accountingHours" type="number" placeholder={t('mikrotik_group_form.hours')} value={timeInputs.accounting.hours} onChange={(e) => handleTimeChange('accounting', 'hours', e.target.value)} />
                             <Input id="accountingMinutes" type="number" placeholder={t('mikrotik_group_form.minutes')} value={timeInputs.accounting.minutes} onChange={(e) => handleTimeChange('accounting', 'minutes', e.target.value)} />
                        </div>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="mikrotik-group-form" disabled={isLoading}>
                        {isLoading ? t('saving') : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}