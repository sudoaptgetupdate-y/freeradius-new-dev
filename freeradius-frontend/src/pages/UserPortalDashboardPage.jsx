// src/pages/UserPortalDashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserAuthStore from '@/store/userAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, KeyRound, WifiOff, Check, X, Mail, Phone, Building, CalendarOff, Globe, ArrowDown, ArrowUp, Server } from 'lucide-react';
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

// --- (ส่วนของ Helper Functions และ Components ย่อยๆ ด้านบนยังคงเหมือนเดิม) ---

const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === "0") return '0 Bytes';
    const b = BigInt(bytes);
    if (b === 0n) return '0 Bytes';
    const k = 1024n;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let tempBytes = b;
    while (tempBytes >= k && i < sizes.length - 1) {
        tempBytes /= k;
        i++;
    }
    return `${parseFloat((Number(b) / Number(k ** BigInt(i))).toFixed(dm))} ${sizes[i]}`;
};

const formatMacAddress = (mac) => {
    if (!mac || typeof mac !== 'string') return 'N/A';
    const cleanedMac = mac.replace(/[:-]/g, '');
    return (cleanedMac.match(/.{1,2}/g) || []).join(':').toUpperCase();
};

const usePortalSettings = () => {
    const [settings, setSettings] = useState({ logoUrl: '' });
    useEffect(() => {
        axiosInstance.get('/settings')
            .then(response => setSettings(response.data.data))
            .catch(() => toast.error("Could not load portal settings."));
    }, []);
    return settings;
};

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

const UserInfoCard = ({ profile, logoUrl }) => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="items-center text-center">
                <div className="w-24 h-24 rounded-full border overflow-hidden mb-4 bg-slate-200">
                    <img
                        src={logoUrl || "/uploads/logo.png"}
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
                    <InfoRow icon={CalendarOff} label="Account Expires" value={profile.expirationDate ? format(new Date(profile.expirationDate), 'dd MMM yyyy, HH:mm') : 'No expiration'} />
                </div>
            </CardContent>
        </Card>
    );
};

const SessionInfoCard = ({ session }) => {
    if (!session) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-muted-foreground"/>Current Session</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-10">
                    <p>You are not currently connected to the network.</p>
                </CardContent>
            </Card>
        );
    }

    const dataUp = BigInt(session.dataUp || 0);
    const dataDown = BigInt(session.dataDown || 0);
    const totalData = dataUp + dataDown;

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-emerald-500"/>Current Session</CardTitle>
                <CardDescription>Details of your active connection.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-6 pt-2">
                <InfoRow label="IP Address" value={session.ip} />
                <InfoRow label="MAC Address" value={formatMacAddress(session.mac)} />
                <InfoRow label="Connection Time" value={formatDistanceToNowStrict(new Date(session.loginTime), { addSuffix: true })} />
                <InfoRow label="Connected via" value={session.nas} />
                <InfoRow icon={ArrowDown} label="Data Down" value={formatBytes(dataDown)} />
                <InfoRow icon={ArrowUp} label="Data Up" value={formatBytes(dataUp)} />
                <div className="col-span-2 border-t pt-4">
                     <InfoRow icon={Server} label="Total Data Used" value={formatBytes(totalData)} />
                </div>
            </CardContent>
        </Card>
    )
}

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />}
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium break-words text-sm">{value || 'Not set'}</p>
        </div>
    </div>
);


export default function UserPortalDashboardPage() {
    // ดึง pendingAd และ clearPendingAd มาจาก store
    const { token, logout, setUser, user: initialProfile, pendingAd, clearPendingAd } = useUserAuthStore();
    const navigate = useNavigate();
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    
    const { data: profile, error, mutate } = useSWR('/portal/me', fetcher, {
      fallbackData: initialProfile,
      revalidateOnFocus: true,
    });

    const settings = usePortalSettings();

    // --- START: เพิ่ม useEffect สำหรับจัดการโฆษณา ---
    useEffect(() => {
        // ตรวจสอบว่ามีโฆษณาที่ต้องแสดง และมีสถานะเป็น active หรือไม่
        if (pendingAd && pendingAd.status === 'active') {
            // ส่งต่อไปยังหน้าโฆษณา และส่งข้อมูลโฆษณาไปด้วย
            navigate('/ad-landing', { state: { ad: pendingAd }, replace: true });
            // เคลียร์ข้อมูลโฆษณาออกจาก store ทันที ป้องกันการวนลูป
            clearPendingAd();
        }
    }, [pendingAd, navigate, clearPendingAd]);
    // --- END ---

    useEffect(() => {
        if (profile) {
            setUser(profile);
        }
    }, [profile, setUser]);
    
    const handleLogout = async () => {
        navigate('/portal/logged-out', { replace: true });
        setTimeout(() => {
            logout();
            axiosInstance.post('/portal/me/clear-sessions', {}, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(response => {
                console.log('Remote sessions cleared:', response.data.message);
            }).catch(error => {
                console.error("Could not clear remote session:", error);
            });
        }, 100);
    };

    const handleClearOtherSessions = () => {
        toast.promise(axiosInstance.post('/portal/me/clear-sessions', {}, { headers: { Authorization: `Bearer ${token}` } }), {
            loading: 'Disconnecting other sessions...',
            success: (res) => {
                mutate();
                return res.data.message || "Successfully disconnected other sessions.";
            },
            error: (err) => err.response?.data?.message || 'Failed to clear sessions.',
        });
    };

    if (error && !profile) return <div>Failed to load profile. Please try again.</div>
    if (!profile) return <div>Loading your profile...</div>

    // ถ้ากำลังจะ redirect ไปหน้าโฆษณา ให้แสดงหน้าว่างๆ ไปก่อน
    if (pendingAd && pendingAd.status === 'active') {
        return <div className="p-4">Loading advertisement...</div>;
    }

    return (
        <motion.div
            className="min-h-screen bg-slate-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-800">Connection Status</h1>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </header>
            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-1">
                    <UserInfoCard profile={profile} logoUrl={settings.logoUrl} />
                </div>
                <div className="md:col-span-2 space-y-8">
                    <SessionInfoCard session={profile.currentSession} />
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Security & Sessions</CardTitle>
                            <CardDescription>Manage your password and active connections.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Change Password</h4>
                                <p className="text-sm text-muted-foreground mb-2">It's a good idea to use a strong password that you're not using elsewhere.</p>
                                <ChangePasswordDialog token={token} />
                            </div>
                            <hr/>
                            <div>
                                <h4 className="font-semibold">Active Connections</h4>
                                <p className="text-sm text-muted-foreground mb-2">If you're having trouble logging in on a new device, you can disconnect all your other sessions.</p>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <WifiOff className="mr-2 h-4 w-4" /> Disconnect All Other Devices
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will disconnect all devices currently logged in with your account. You will remain logged in on this device.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleClearOtherSessions}>Confirm & Disconnect</AlertDialogAction>
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