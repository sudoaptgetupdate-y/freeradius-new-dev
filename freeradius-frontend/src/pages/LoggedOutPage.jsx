// src/pages/LoggedOutPage.jsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoggedOutPage() {
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
                        <CardDescription>You have been securely logged out of your account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link to="/user-login">Return to Login Page</Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}