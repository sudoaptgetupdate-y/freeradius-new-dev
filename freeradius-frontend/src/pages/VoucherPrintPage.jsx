// src/pages/VoucherPrintPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns'; // <-- ตรวจสอบว่ามีบรรทัดนี้

// VoucherCard Component
const VoucherCard = ({ logoUrl, ssid, headerText, footerText, user, expirationDate }) => (
    <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-center break-inside-avoid-page flex flex-col items-center justify-center aspect-[3/2]">
        {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 object-contain mb-1" />}
        <h3 className="font-bold text-sm">{headerText}</h3>
        <p className="text-xs text-gray-500 mb-1">SSID: {ssid}</p>
        <div className="my-1 p-2 bg-gray-100 rounded-md w-full">
            <p className="text-xs">Username</p>
            <p className="font-mono font-bold tracking-wider text-sm">{user.username}</p>
            <p className="text-xs mt-1">Password</p>
            <p className="font-mono font-bold tracking-wider text-sm">{user.password}</p>
        </div>
        <p className="text-xs text-gray-600 mt-1 font-medium">
            Expires on: {expirationDate}
        </p>
        <p className="text-xs text-gray-500 mt-auto">{footerText}</p>
    </div>
);

// PrintableView Component
const PrintableView = React.forwardRef((props, ref) => {
    const { batch, settings } = props;
    if (!batch) return null;

    const expirationDate = batch.durationDays
        ? format(addDays(new Date(batch.createdAt), batch.durationDays), 'dd MMM yyyy, HH:mm')
        : 'N/A';

    return (
        <div ref={ref} className="print-area grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {batch.usersJson.map((user, index) => (
                <VoucherCard
                    key={index}
                    user={user}
                    logoUrl={settings?.voucherLogoUrl || settings?.logoUrl}
                    ssid={settings?.voucherSsid || 'Free-WiFi'}
                    headerText={settings?.voucherHeaderText || 'WiFi Voucher'}
                    footerText={settings?.voucherFooterText || 'Enjoy your connection!'}
                    expirationDate={expirationDate}
                />
            ))}
        </div>
    );
});
PrintableView.displayName = 'PrintableView';


export default function VoucherPrintPage() {
    const { id } = useParams();
    const token = useAuthStore((state) => state.token);
    const [batch, setBatch] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef(null);

    const handlePrint = () => {
        if (!componentRef.current) {
            toast.error('Content not ready for printing');
            return;
        }
        const noPrintElements = document.querySelectorAll('.no-print');
        noPrintElements.forEach(el => {
            el.style.display = 'none';
        });
        const printStyles = document.createElement('style');
        printStyles.setAttribute('media', 'print');
        printStyles.innerHTML = `
            @page { 
                size: A4; 
                margin: 10mm; 
            }
            body { 
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .print-area {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 10px !important;
            }
            .print-area > div {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            @media print {
                .no-print {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(printStyles);
        window.print();
        setTimeout(() => {
            noPrintElements.forEach(el => {
                el.style.display = '';
            });
            if (printStyles.parentNode) {
                printStyles.parentNode.removeChild(printStyles);
            }
        }, 1000);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [batchRes, settingsRes] = await Promise.all([
                    axiosInstance.get(`/vouchers/batches/${id}`, { 
                        headers: { Authorization: `Bearer ${token}` } 
                    }),
                    axiosInstance.get('/settings')
                ]);
                setBatch(batchRes.data.data);
                setSettings(settingsRes.data.data);
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error("Failed to load voucher data.");
                setBatch(null);
            } finally {
                setLoading(false);
            }
        };
        
        if (id && token) {
            fetchData();
        }
    }, [id, token]);

    if (loading) {
        return <div className="text-center p-8">Loading voucher batch...</div>;
    }
    
    if (!batch) {
        return <div className="text-center p-8">Voucher batch not found or could not be loaded.</div>;
    }

    return (
        <>
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: A4; 
                        margin: 10mm; 
                    }
                    body { 
                        -webkit-print-color-adjust: exact; 
                    }
                    .no-print { 
                        display: none !important; 
                    }
                    .print-area { 
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 8px !important;
                        padding: 0 !important; 
                    }
                    .print-area > div {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                `}
            </style>
            
            <div className="max-w-4xl mx-auto space-y-4 p-4">
                <div className="flex justify-between items-center no-print">
                    <div>
                        <Button variant="ghost" asChild>
                            <Link to="/vouchers/batches">
                                <ArrowLeft className="mr-2 h-4 w-4"/>
                                Back to Batches
                            </Link>
                        </Button>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold">
                            Voucher Batch: {batch.batchIdentifier}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {batch.quantity} vouchers for package "{batch.packageName}"
                        </p>
                    </div>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print Vouchers
                    </Button>
                </div>
                
                <PrintableView 
                    ref={componentRef} 
                    batch={batch} 
                    settings={settings} 
                />
            </div>
        </>
    );
}