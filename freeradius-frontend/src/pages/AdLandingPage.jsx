// src/pages/AdLandingPage.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const TemplateA = ({ ad, onContinue }) => {
    const [countdown, setCountdown] = useState(ad.countdown === null ? -1 : ad.countdown);
    const imageUrl = ad.imageUrl || 'https://via.placeholder.com/1920x1080?text=Advertisement';

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            onContinue();
        }
    }, [countdown, onContinue]);

    return (
        <div 
            className="relative w-full h-full bg-cover bg-center flex flex-col justify-end"
            style={{ backgroundImage: `url(${imageUrl})` }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-4xl mx-auto p-8 text-white text-center"
            >
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                    {ad.headerText || 'Welcome'}
                </h1>
                {ad.bodyText && (
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                        {ad.bodyText}
                    </p>
                )}
                <Button onClick={onContinue} size="lg" className="mt-6 text-lg px-8 py-6">
                    {ad.buttonText || 'Continue to Internet'}
                </Button>
                {countdown > -1 && (
                    <p className="mt-4 text-sm text-white/70">
                        Redirecting in {countdown}s...
                    </p>
                )}
            </motion.div>
        </div>
    );
};

const TemplateB = ({ ad, onContinue }) => {
    const imageUrl = ad.imageUrl || 'https://via.placeholder.com/1280x720?text=Advertisement';
    return (
        <div className="w-full h-full flex flex-col md:flex-row bg-background">
            <div className="relative w-full md:w-1/2 h-64 md:h-full bg-black overflow-hidden flex items-center justify-center">
                <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${imageUrl})`, filter: 'blur(20px)', transform: 'scale(1.1)' }}
                />
                <img 
                    src={imageUrl} 
                    alt={ad.name || 'Advertisement'} 
                    className="relative w-full h-full object-contain"
                />
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 text-center">
                 <h1 className="text-3xl font-bold">{ad.headerText || 'Information'}</h1>
                 <div className="mt-4 text-muted-foreground prose prose-sm max-w-full"><p>{ad.bodyText}</p></div>
                 <Button onClick={onContinue} className="mt-8 w-full sm:w-auto">{ad.buttonText || 'Continue'}</Button>
            </div>
        </div>
    );
};

const TemplateC = ({ ad, onContinue }) => {
    const countdownDuration = ad.countdown === null ? -1 : ad.countdown;
    const [countdown, setCountdown] = useState(countdownDuration);
    const imageUrl = ad.imageUrl || 'https://via.placeholder.com/1280x720?text=Advertisement';

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            onContinue();
        }
    }, [countdown, onContinue]);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{
                    backgroundImage: `url(${imageUrl})`,
                    filter: 'blur(32px)',
                    transform: 'scale(1.2)',
                }}
            />
            <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src={imageUrl} 
                alt={ad.name || 'Advertisement'} 
                className="relative max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-lg rounded-xl p-4 flex flex-col items-center justify-center gap-3 w-48"
            >
                <Button onClick={onContinue} size="lg" className="w-full bg-white text-black hover:bg-gray-200">
                    {ad.buttonText || 'Continue'}
                </Button>
                 {countdown > -1 && (
                    <div className="text-white text-xs opacity-75">
                        Continue in {countdown}s
                    </div>
                )}
            </motion.div>
        </div>
    );
};


export default function AdLandingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { ad } = location.state || {};

    useEffect(() => {
        if (!ad) {
            navigate('/user-login', { replace: true });
        }
    }, [ad, navigate]);

    const handleContinue = () => {
        navigate('/portal/dashboard', { replace: true });
    };

    if (!ad) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    
    let AdComponent;
    switch (ad.type) {
        case 'B':
            AdComponent = TemplateB;
            break;
        case 'C':
            AdComponent = TemplateC;
            break;
        default:
            AdComponent = TemplateA;
    }

    return (
        <motion.div 
            className="w-screen h-screen bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <AdComponent ad={ad} onContinue={handleContinue} />
        </motion.div>
    );
}