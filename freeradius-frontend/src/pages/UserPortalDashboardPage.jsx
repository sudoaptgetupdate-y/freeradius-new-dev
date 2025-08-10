// src/pages/UserPortalDashboardPage.jsx
import { useEffect } from 'react'; // ไม่จำเป็นต้องใช้ useState แล้ว
import useUserAuthStore from '@/store/userAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, KeyRound, WifiOff } from 'lucide-react'; // ลบ User icon ที่ไม่ได้ใช้ออก
import useSWR from 'swr';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
// --- 1. Import motion ---
import { motion } from 'framer-motion';

export default function UserPortalDashboardPage() {
    // --- 2. ดึงข้อมูล user เริ่มต้นจาก Store และเปลี่ยนชื่อเป็น initialProfile ---
    const { token, logout, setUser, user: initialProfile } = useUserAuthStore();
    const fetcher = url => axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data.data);
    
    // --- 3. เพิ่ม option `fallbackData` ให้กับ useSWR ---
    const { data: profile, error, mutate } = useSWR('/portal/me', fetcher, {
      fallbackData: initialProfile // SWR จะใช้ข้อมูลนี้แสดงผลทันที แล้วไป re-fetch เบื้องหลัง
    });

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

    // --- 4. แก้ไขเงื่อนไขการ Loading ---
    // เนื่องจากมี fallbackData หน้า loading จะไม่แสดงผลในครั้งแรกหลัง login
    if (error && !profile) return <div>Failed to load profile. Please try again.</div>
    if (!profile) return <div>Loading your profile...</div>

    // --- 5. เพิ่ม motion.div ครอบเนื้อหาทั้งหมด ---
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
            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">{profile.full_name}</CardTitle>
                            <CardDescription className="text-center">@{profile.username}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                           <p><strong>Organization:</strong> {profile.organization?.name}</p>
                           <p><strong>Email:</strong> {profile.email || 'Not set'}</p>
                           <p><strong>Phone:</strong> {profile.phoneNumber || 'Not set'}</p>
                        </CardContent>
                    </Card>
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
                                <Button variant="outline" disabled>Change Password</Button>
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