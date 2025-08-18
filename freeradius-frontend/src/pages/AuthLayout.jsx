// src/pages/AuthLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/api/axiosInstance';
import { toast } from "sonner";
import { Building } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';

export default function AuthLayout() {
    const [settings, setSettings] = useState({
        logoUrl: '',
        backgroundUrl: '',
    });
    const location = useLocation();

    useEffect(() => {
        axiosInstance.get('/settings')
          .then(response => {
            setSettings(response.data.data);
          })
          .catch(() => {
            toast.error("Could not load page settings.");
          });
    }, []);

    const pageStyle = settings.backgroundUrl ? {
        backgroundImage: `url(${settings.backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {
        backgroundColor: 'hsl(220 14.3% 95.9%)'
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 transition-colors" style={pageStyle}>
            <Card className="w-full max-w-md shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="text-center">
                    <div className="mx-auto">
                        {settings.logoUrl ? (
                           <img 
                             src={settings.logoUrl} 
                             alt="Company Logo" 
                             className="h-[125px] max-w-48 object-contain"
                           />
                        ) : (
                           <div className="bg-slate-100 p-3 rounded-full w-fit">
                               <Building className="h-10 w-10 text-primary" />
                           </div>
                        )}
                    </div>
                </CardHeader>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </Card>
        </div>
    );
}