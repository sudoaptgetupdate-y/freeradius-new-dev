// src/pages/UserPortalDashboardPage.jsx
import { useEffect, useState } from 'react';
import useUserAuthStore from '@/store/userAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, KeyRound, WifiOff, Check, X, Mail, Phone, Building, CalendarOff, Globe } from 'lucide-react';
import useSWR from 'swr';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, 
  DialogDescription, DialogClose, DialogTrigger as DialogTriggerComponent 
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNowStrict } from 'date-fns';

// Custom Hook สำหรับดึงข้อมูล Settings
const usePortalSettings = () => {
    const [settings, setSettings] = useState({ logoUrl: '' });
    useEffect(() => {
        axiosInstance.get('/settings')
            .then(response => setSettings(response.data.data))
            .catch(() => toast.error("Could not load portal settings."));
    }, []);
    return settings;
};


// Component สำหรับแสดงผลการตรวจสอบรหัสผ่าน
const PasswordRequirement = ({ met, text }) => (
    <div className={cn("flex items-center text-sm transition-colors", met ? "text-emerald-600" : "text-muted-foreground")}>
        {met ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2 text-red-500" />}
        <span>{text}</span>
    </div>
);

const PasswordValidationChecks = ({ checks }) => (
    <div className="space-y-1 p-3 bg-muted/50 rounded-md mt-2">
        <PasswordRequirement met={checks.length} text="At least 8 characters long" />
        <PasswordRequirement met={checks.lowercase} text="At least one lowercase letter (a-z)" />
        <PasswordRequirement met={checks.uppercase} text="At least one uppercase letter (A-Z)" />
        <PasswordRequirement met={checks.number} text="At least one number (0-9)" />
    </div>
);

// Component สำหรับ Dialog เปลี่ยนรหัสผ่าน
const ChangePasswordDialog = ({ token }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [validation, setValidation] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
    });
    const [showValidation, setShowValidation] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setPasswords(prev => ({ ...prev, [id]: value }));

        if (id === 'newPassword') {
            setShowValidation(value.length > 0);
            setValidation({
                length: value.length >= 8,
                lowercase: /[a-z]/.test(value),
                uppercase: /[A-Z]/.test(value),
                number: /[0-9]/.test(value),
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Object.values(validation).some(v => !v)) {
            return toast.error("New password does not meet all requirements.");
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error("New passwords do not match.");
        }
        setIsLoading(true);
        toast.promise(
            axiosInstance.post('/portal/me/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword,
            }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Changing password...',
                success: () => {
                    setIsOpen(false);
                    return "Password changed successfully!";
                },
                error: (err) => err.response?.data?.message || 'Failed to change password.',
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTriggerComponent asChild>
                <Button variant="outline">Change Password</Button>
            </DialogTriggerComponent>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Your Password</DialogTitle>
                    <DialogDescription>
                        Enter your old password and create a new one.
                    </DialogDescription>
                </DialogHeader>
                <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="oldPassword">Old Password</Label>
                        <Input id="oldPassword" type="password" value={passwords.oldPassword} onChange={handleInputChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" value={passwords.newPassword} onChange={handleInputChange} required />
                    </div>
                    {showValidation && <PasswordValidationChecks checks={validation} />}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" value={passwords.confirmPassword} onChange={handleInputChange} required />
                    </div>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" form="change-password-form" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Component สำหรับการ์ดข้อมูลผู้ใช้ที่ออกแบบใหม่
const UserInfoCard = ({ profile, logoUrl }) => {
    const currentSession = profile.currentSession;
    const expirationDate = profile.expirationDate;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="items-center text-center">
                <div className="w-24 h-24 rounded-full border overflow-hidden mb-4 bg-slate-200">
                    <img
                        src={logoUrl || "/uploads/logo.png"} // ใช้ logoUrl ถ้ามี, ถ้าไม่มีให้ใช้รูป Default
                        alt="Avatar"
                        className="object-cover w-full h-full"
                    />
                </div>
                <CardTitle>{profile.full_name}</CardTitle>
                <CardDescription>@{profile.username}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="border-t pt-4 space-y-3 text-sm">
                    <InfoRow icon={Mail} label="Email" value={profile.email} />
                    <InfoRow icon={Phone} label="Phone" value={profile.phoneNumber} />
                    <InfoRow icon={Building} label="Organization" value={profile.organization?.name} />
                    <InfoRow icon={CalendarOff} label="Expires On" value={expirationDate ? format(new Date(expirationDate), 'dd MMM yyyy') : 'No expiration'} />
                </div>
                {currentSession && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                           <Globe className="h-4 w-4 text-emerald-500"/> Current Session
                        </h4>
                        <div className="space-y-3 text-sm">
                            <InfoRow label="IP Address" value={currentSession.ip} />
                            <InfoRow label="Logged In" value={formatDistanceToNowStrict(new Date(currentSession.loginTime), { addSuffix: true })} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Component ย่อยสำหรับแสดงข้อมูลแต่ละแถว
const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />}
        <div className="flex-1">
            <p className="text-muted-foreground">{label}</p>
            <p className="font-medium break-words">{value || 'Not set'}</p>
        </div>
    </div>
);


export default function UserPortalDashboardPage() {
    const { token, logout, setUser, user: initialProfile } = useUserAuthStore();
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    
    const { data: profile, error } = useSWR('/portal/me', fetcher, {
      fallbackData: initialProfile
    });

    const settings = usePortalSettings(); // เรียกใช้ Hook เพื่อดึงข้อมูล Settings

    useEffect(() => {
        if (profile) {
            setUser(profile);
        }
    }, [profile, setUser]);
    
    const handleClearSessions = () => {
        toast.promise(axiosInstance.post('/portal/me/clear-sessions', {}, { headers: { Authorization: `Bearer ${token}` } }), {
            loading: 'Clearing sessions...',
            success: (res) => res.data.message,
            error: (err) => err.response?.data?.message || 'Failed to clear sessions.',
        });
    };

    if (error && !profile) return <div>Failed to load profile. Please try again.</div>
    if (!profile) return <div>Loading your profile...</div>

    return (
        <motion.div
            className="min-h-screen bg-slate-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-800">User Portal</h1>
                    <Button variant="ghost" size="sm" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </header>
            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-1">
                    <UserInfoCard profile={profile} logoUrl={settings.logoUrl} />
                </div>
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Security</CardTitle>
                            <CardDescription>Manage your password and active sessions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Change Password</h4>
                                <p className="text-sm text-muted-foreground mb-2">It's a good idea to use a strong password that you're not using elsewhere.</p>
                                <ChangePasswordDialog token={token} />
                            </div>
                            <hr/>
                            <div>
                                <h4 className="font-semibold">Active Sessions</h4>
                                <p className="text-sm text-muted-foreground mb-2">If you can't log in on a new device, clear your old sessions.</p>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <WifiOff className="mr-2 h-4 w-4" /> Clear All Sessions
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will disconnect all devices currently logged in with your account.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleClearSessions}>Confirm & Disconnect</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </motion.div>
    );
}