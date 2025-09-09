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
import { useTranslation } from 'react-i18next';
import { th, enUS } from 'date-fns/locale';

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
    const { t } = useTranslation();
    const [settings, setSettings] = useState({ logoUrl: '' });
    useEffect(() => {
        axiosInstance.get('/settings')
            .then(response => setSettings(response.data.data))
            .catch(() => toast.error(t('toast.portal_settings_load_failed')));
    }, [t]);
    return settings;
};

const PasswordRequirement = ({ met, text }) => (
    <div className={cn("flex items-center text-sm transition-colors", met ? "text-emerald-600" : "text-muted-foreground")}>
        {met ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2 text-red-500" />}
        <span>{text}</span>
    </div>
);

const PasswordValidationChecks = ({ checks, t }) => (
    <div className="space-y-1 p-3 bg-muted/50 rounded-md mt-2">
        <PasswordRequirement met={checks.length} text={t('password_reqs.length')} />
        <PasswordRequirement met={checks.lowercase} text={t('password_reqs.lowercase')} />
        <PasswordRequirement met={checks.uppercase} text={t('password_reqs.uppercase')} />
        <PasswordRequirement met={checks.number} text={t('password_reqs.number')} />
    </div>
);

const ChangePasswordDialog = ({ token }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [validation, setValidation] = useState({
        length: false, lowercase: false, uppercase: false, number: false,
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
            return toast.error(t('toast.password_req_not_met'));
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error(t('toast.passwords_do_not_match'));
        }
        setIsLoading(true);
        toast.promise(
            axiosInstance.post('/portal/me/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword,
            }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: t('toast.changing_password'),
                success: () => {
                    setIsOpen(false);
                    return t('toast.change_password_success');
                },
                error: (err) => err.response?.data?.message || t('toast.change_password_failed'),
                finally: () => setIsLoading(false)
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTriggerComponent asChild><Button variant="outline">{t('user_portal.change_password_button')}</Button></DialogTriggerComponent>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('user_portal.change_password_dialog.title')}</DialogTitle>
                    <DialogDescription>{t('user_portal.change_password_dialog.description')}</DialogDescription>
                </DialogHeader>
                <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label htmlFor="oldPassword">{t('form_labels.old_password')}</Label><Input id="oldPassword" type="password" value={passwords.oldPassword} onChange={handleInputChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="newPassword">{t('form_labels.new_password')}</Label><Input id="newPassword" type="password" value={passwords.newPassword} onChange={handleInputChange} required /></div>
                    {showValidation && <PasswordValidationChecks checks={validation} t={t} />}
                    <div className="space-y-2"><Label htmlFor="confirmPassword">{t('form_labels.confirm_new_password')}</Label><Input id="confirmPassword" type="password" value={passwords.confirmPassword} onChange={handleInputChange} required /></div>
                </form>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">{t('cancel')}</Button></DialogClose>
                    <Button type="submit" form="change-password-form" disabled={isLoading}>{isLoading ? t('saving') : t('save_changes')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const UserInfoCard = ({ profile, logoUrl, t, i18n }) => {
    const locale = i18n.language === 'th' ? th : enUS;
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="items-center text-center">
                <div className="w-24 h-24 rounded-full border overflow-hidden mb-4 bg-slate-200">
                    <img src={logoUrl || "/uploads/logo.png"} alt="Avatar" className="object-cover w-full h-full" />
                </div>
                <CardTitle>{profile.full_name}</CardTitle>
                <CardDescription>@{profile.username}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="border-t pt-4 space-y-3 text-sm">
                    <InfoRow icon={Mail} label={t('form_labels.email')} value={profile.email} t={t} />
                    <InfoRow icon={Phone} label={t('form_labels.phone_number')} value={profile.phoneNumber} t={t} />
                    <InfoRow icon={Building} label={t('form_labels.organization')} value={profile.organization?.name} t={t} />
                    <InfoRow icon={CalendarOff} label={t('user_portal.account_expires')} value={profile.expirationDate ? format(new Date(profile.expirationDate), 'dd MMM yyyy, HH:mm', { locale }) : t('user_portal.no_expiration')} t={t} />
                </div>
            </CardContent>
        </Card>
    );
};

const SessionInfoCard = ({ session, t, i18n }) => {
    const locale = i18n.language === 'th' ? th : enUS;
    if (!session) {
        return (
            <Card className="h-full flex flex-col">
                <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-muted-foreground"/>{t('user_portal.current_session')}</CardTitle></CardHeader>
                <CardContent className="flex-grow flex items-center justify-center text-center text-muted-foreground py-10"><p>{t('user_portal.not_connected')}</p></CardContent>
            </Card>
        );
    }

    const dataUp = BigInt(session.dataUp || 0);
    const dataDown = BigInt(session.dataDown || 0);
    const totalData = dataUp + dataDown;

    return (
         <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-emerald-500"/>{t('user_portal.current_session')}</CardTitle>
                <CardDescription>{t('user_portal.active_connection_details')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 pt-2">
                <InfoRow label={t('table_headers.ip_address')} value={session.ip} t={t} />
                <InfoRow label={t('table_headers.mac_address')} value={formatMacAddress(session.mac)} t={t} />
                <InfoRow label={t('user_portal.connection_time')} value={formatDistanceToNowStrict(new Date(session.loginTime), { addSuffix: true, locale })} t={t} />
                <InfoRow label={t('user_portal.connected_via')} value={session.nas} t={t} />
                <InfoRow icon={ArrowDown} label={t('table_headers.data_down')} value={formatBytes(dataDown)} t={t} />
                <InfoRow icon={ArrowUp} label={t('table_headers.data_up')} value={formatBytes(dataUp)} t={t} />
                <div className="col-span-1 sm:col-span-2 border-t pt-4"><InfoRow icon={Server} label={t('user_portal.total_data_used')} value={formatBytes(totalData)} t={t} /></div>
            </CardContent>
        </Card>
    )
}

const InfoRow = ({ icon: Icon, label, value, t }) => (
    <div className="flex items-start gap-3">
        {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />}
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium break-words text-sm">{value || t('not_set')}</p>
        </div>
    </div>
);


export default function UserPortalDashboardPage() {
    const { t, i18n } = useTranslation();
    const { token, logout, setUser, user: initialProfile, pendingAd, clearPendingAd } = useUserAuthStore();
    const navigate = useNavigate();
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    
    const { data: profile, error, mutate } = useSWR('/portal/me', fetcher, {
      fallbackData: initialProfile,
      revalidateOnFocus: true,
    });

    const settings = usePortalSettings();

    useEffect(() => {
        if (pendingAd && pendingAd.status === 'active') {
            navigate('/ad-landing', { state: { ad: pendingAd }, replace: true });
            clearPendingAd();
        }
    }, [pendingAd, navigate, clearPendingAd]);

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
            }).catch(error => {
                console.error("Could not clear remote session:", error);
            });
        }, 100);
    };

    const handleClearOtherSessions = () => {
        toast.promise(axiosInstance.post('/portal/me/clear-sessions', {}, { headers: { Authorization: `Bearer ${token}` } }), {
            loading: t('toast.disconnecting_sessions'),
            success: (res) => {
                mutate();
                return res.data.message || t('toast.disconnect_sessions_success');
            },
            error: (err) => err.response?.data?.message || t('toast.clear_sessions_failed'),
        });
    };

    if (error && !profile) return <div>{t('profile_load_failed')}</div>
    if (!profile) return <div>{t('loading_profile')}</div>

    if (pendingAd && pendingAd.status === 'active') {
        return <div className="p-4">{t('loading_ad')}</div>;
    }

    return (
        <motion.div className="min-h-screen bg-slate-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-800">{t('user_portal.connection_status')}</h1>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {/* Column 1: User Info */}
                <div className="md:col-span-1">
                    <UserInfoCard profile={profile} logoUrl={settings.logoUrl} t={t} i18n={i18n} />
                </div>

                {/* Column 2: Session Info */}
                <div className="md:col-span-1">
                    <SessionInfoCard session={profile.currentSession} t={t} i18n={i18n} />
                </div>

                {/* Column 3: Security & Sessions */}
                <div className="md:col-span-1">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> {t('user_portal.security_sessions.title')}</CardTitle>
                            <CardDescription>{t('user_portal.security_sessions.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between space-y-4">
                            <div className="space-y-4">
                                {/* Change Password Section */}
                                <div>
                                    <h4 className="font-semibold">{t('user_portal.change_password_button')}</h4>
                                    <p className="text-sm text-muted-foreground mb-2">{t('user_portal.security_sessions.change_password_desc')}</p>
                                    <ChangePasswordDialog token={token} />
                                </div>
                                <hr/>
                                {/* Active Connections Section */}
                                <div>
                                    <h4 className="font-semibold">{t('user_portal.security_sessions.active_connections_title')}</h4>
                                    <p className="text-sm text-muted-foreground mb-2">{t('user_portal.security_sessions.active_connections_desc')}</p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="destructive"><WifiOff className="mr-2 h-4 w-4" /> {t('user_portal.security_sessions.disconnect_button')}</Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                                                <AlertDialogDescription>{t('user_portal.security_sessions.disconnect_dialog_desc')}</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleClearOtherSessions}>{t('user_portal.security_sessions.disconnect_dialog_confirm')}</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            
                            {/* Logout Section */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold">{t('logout')}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {t('user_portal.security_sessions.logout_desc', 'Securely log out of your account and end your session.')}
                                </p>
                                <Button variant="outline" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" /> {t('logout')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </motion.div>
    );
}