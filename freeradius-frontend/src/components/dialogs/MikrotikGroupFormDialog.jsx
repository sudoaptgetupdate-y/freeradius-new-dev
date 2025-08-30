// src/components/dialogs/MikrotikGroupFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

const initialFormData = {
    name: '',
    rateLimit: '',
    sessionTimeout: '',
    idleTimeout: '',
    sharedUsers: '',
    acctInterimInterval: ''
};

// --- START: ADDED HELPER FUNCTIONS ---
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
// --- END: ADDED HELPER FUNCTIONS ---


export default function MikrotikGroupFormDialog({ isOpen, setIsOpen, profile, onSave }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!profile;

    // --- START: ADDED STATE FOR TIME INPUTS ---
    const [timeInputs, setTimeInputs] = useState({
        session: { hours: '', minutes: '' },
        idle: { hours: '', minutes: '' },
        accounting: { hours: '', minutes: '' },
    });
    // --- END: ADDED STATE ---

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
            // --- START: CONVERT SECONDS TO H/M FOR UI ---
            setTimeInputs({
                session: secondsToTime(profile.sessionTimeout),
                idle: secondsToTime(profile.idleTimeout),
                accounting: secondsToTime(profile.acctInterimInterval),
            });
            // --- END: CONVERT ---
        } else {
            setFormData(initialFormData);
            // --- START: RESET TIME INPUTS ---
            setTimeInputs({
                session: { hours: '', minutes: '' },
                idle: { hours: '', minutes: '' },
                accounting: { hours: '', minutes: '' },
            });
            // --- END: RESET ---
        }
    }, [profile, isOpen]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    // --- START: ADDED FUNCTION TO HANDLE TIME CHANGES ---
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
    // --- END: ADDED FUNCTION ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const url = isEditMode ? `/mikrotik-profiles/${profile.id}` : '/mikrotik-profiles';
        const method = isEditMode ? 'put' : 'post';

        toast.promise(
            axiosInstance[method](url, formData, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: "Saving Mikrotik group...",
                success: () => {
                    onSave();
                    setIsOpen(false);
                    return `Group '${formData.name}' saved successfully.`;
                },
                error: (err) => err.response?.data?.message || "An error occurred.",
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Mikrotik Group' : 'Add New Mikrotik Group'}</DialogTitle>
                </DialogHeader>
                <form id="mikrotik-group-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., gold-package" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rateLimit">Rate Limit (Upload/Download)</Label>
                        <Input id="rateLimit" value={formData.rateLimit} onChange={handleInputChange} placeholder="e.g., 5M/10M (leave blank for unlimited)" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sharedUsers">Shared Users (Simultaneous Login)</Label>
                        <Input id="sharedUsers" type="number" value={formData.sharedUsers} onChange={handleInputChange} placeholder="e.g., 1" />
                    </div>
                    
                    {/* --- START: UPDATED UI --- */}
                    <div className="space-y-2">
                        <Label>Session Timeout</Label>
                        <div className="flex items-center gap-2">
                            <Input id="sessionHours" type="number" placeholder="Hours" value={timeInputs.session.hours} onChange={(e) => handleTimeChange('session', 'hours', e.target.value)} />
                            <Input id="sessionMinutes" type="number" placeholder="Minutes" value={timeInputs.session.minutes} onChange={(e) => handleTimeChange('session', 'minutes', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Idle Timeout</Label>
                         <div className="flex items-center gap-2">
                            <Input id="idleHours" type="number" placeholder="Hours" value={timeInputs.idle.hours} onChange={(e) => handleTimeChange('idle', 'hours', e.target.value)} />
                            <Input id="idleMinutes" type="number" placeholder="Minutes" value={timeInputs.idle.minutes} onChange={(e) => handleTimeChange('idle', 'minutes', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Accounting Interval</Label>
                         <div className="flex items-center gap-2">
                             <Input id="accountingHours" type="number" placeholder="Hours" value={timeInputs.accounting.hours} onChange={(e) => handleTimeChange('accounting', 'hours', e.target.value)} />
                             <Input id="accountingMinutes" type="number" placeholder="Minutes" value={timeInputs.accounting.minutes} onChange={(e) => handleTimeChange('accounting', 'minutes', e.target.value)} />
                        </div>
                    </div>
                    {/* --- END: UPDATED UI --- */}

                </form>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" form="mikrotik-group-form" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}