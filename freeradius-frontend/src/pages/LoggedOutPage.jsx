// src/pages/LoggedOutPage.jsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoggedOutPage() {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // ถ้า countdown หมดแล้ว ให้ redirect
        if (countdown <= 0) {
            window.location.href = 'http://neverssl.com';
            return;
        }

        // ตั้งเวลาลดค่า countdown ทุก 1 วินาที
        const timerId = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);

        // Clear timer เมื่อ component ถูก unmount
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
                        <CardTitle className="text-2xl">Logged Out Successfully</CardTitle>
                        <CardDescription>
                            You have been securely disconnected. You can now safely close this window.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Redirecting to Login agian {countdown} seconds...
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}