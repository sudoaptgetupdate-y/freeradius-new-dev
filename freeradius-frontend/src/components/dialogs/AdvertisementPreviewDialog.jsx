// src/components/dialogs/AdvertisementPreviewDialog.jsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Reusing Templates from AdLandingPage
const TemplateA = ({ ad }) => (
    <div 
        className="relative w-full h-[400px] bg-cover bg-center flex flex-col justify-end rounded-lg overflow-hidden"
        style={{ backgroundImage: `url(${ad.imageUrl || 'https://via.placeholder.com/1920x1080?text=Advertisement'})` }}
    >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="relative z-10 p-6 text-white text-center">
            <h1 className="text-3xl font-bold">{ad.headerText || 'Welcome'}</h1>
            {ad.bodyText && <p className="mt-2 text-sm text-white/90">{ad.bodyText}</p>}
            <Button size="sm" className="mt-4">{ad.buttonText || 'Continue'}</Button>
        </div>
    </div>
);

const TemplateB = ({ ad }) => (
    <div className="w-full h-[400px] flex flex-row bg-background rounded-lg overflow-hidden border">
        <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: `url(${ad.imageUrl || 'https://via.placeholder.com/800x600?text=Ad'})` }} />
        <div className="w-1/2 flex flex-col items-center justify-center p-6 text-center">
             <h1 className="text-2xl font-bold">{ad.headerText || 'Information'}</h1>
             <p className="mt-2 text-sm text-muted-foreground">{ad.bodyText}</p>
             <Button className="mt-6">{ad.buttonText || 'Continue'}</Button>
        </div>
    </div>
);

const TemplateC = ({ ad }) => (
    <div className="relative w-full h-[400px] bg-black overflow-hidden flex items-center justify-center rounded-lg">
        <img src={ad.imageUrl || 'https://via.placeholder.com/600x800?text=Ad'} alt={ad.name} className="max-w-full max-h-full object-contain" />
        <div className="absolute bottom-4 right-4">
            <Button>{ad.buttonText || 'Continue'}</Button>
        </div>
    </div>
);

const AdComponent = ({ ad }) => {
    switch (ad.type) {
        case 'B': return <TemplateB ad={ad} />;
        case 'C': return <TemplateC ad={ad} />;
        default: return <TemplateA ad={ad} />;
    }
};

export default function AdvertisementPreviewDialog({ isOpen, setIsOpen, ad }) {
    if (!ad) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-3xl p-0 border-0">
                <div className="p-6">
                    <DialogHeader>
                        <DialogTitle>Ad Preview: {ad.name}</DialogTitle>
                        <DialogDescription>
                            This is how the advertisement campaign will appear to the user.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="px-6 pb-6">
                    <AdComponent ad={ad} />
                </div>
            </DialogContent>
        </Dialog>
    );
}