// src/pages/SessionsClearedPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SessionsClearedPage() {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (countdown <= 0) {
            // Redirect ไปยังเว็บที่ไม่ใช้ HTTPS เพื่อหลีกเลี่ยงปัญหา HSTS
            window.location.href = 'http://neverssl.com';
            return;
        }

        const timerId = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);

        return () => clearTimeout(timerId);
    }, [countdown]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                        <CardTitle className="text-2xl">Sessions Cleared</CardTitle>
                        <CardDescription>
                            All your other active sessions have been disconnected. You can now log in on a new device.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This page will redirect in {countdown} seconds.
                        </p>
                        <Button asChild className="w-full">
                            <Link to="/portal/dashboard">Back to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}