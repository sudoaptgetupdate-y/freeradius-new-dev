// src/components/ui/LogVolumeChartCard.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const timePeriods = [
    { key: 'day', label: 'Daily' },
    { key: 'week', label: 'Weekly' },
    { key: 'month', label: 'Monthly' },
    { key: 'year', label: 'Yearly' },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function LogVolumeChartCard() {
    const [data, setData] = useState({ chartData: [], hosts: [] });
    const [loading, setLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState('day');
    const token = useAuthStore((state) => state.token);
    
    // --- START: 1. เพิ่ม State สำหรับจัดการการซ่อนกราฟ ---
    const [hiddenHosts, setHiddenHosts] = useState({});
    // --- END ---

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setHiddenHosts({}); // Reset การซ่อนทุกครั้งที่เปลี่ยนช่วงเวลา
            try {
                const response = await axiosInstance.get(`/logs/volume-graph?period=${activePeriod}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data.data);
            } catch (error) {
                toast.error(`Failed to load graph data for period: ${activePeriod}`);
                setData({ chartData: [], hosts: [] });
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchData();
    }, [activePeriod, token]);

    // --- START: 2. สร้างฟังก์ชันสำหรับจัดการการคลิก Legend ---
    const handleLegendClick = (dataKey) => {
        setHiddenHosts(prev => ({
            ...prev,
            [dataKey]: !prev[dataKey] // สลับค่า true/false
        }));
    };
    // --- END ---

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>Log Volume Trend</CardTitle>
                        <CardDescription>Total log size per device over time. Click legend to toggle.</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                        {timePeriods.map((period) => (
                            <Button
                                key={period.key}
                                size="sm"
                                className={cn("flex-1", activePeriod === period.key ? "bg-background text-foreground shadow" : "bg-transparent text-muted-foreground hover:bg-muted/50")}
                                onClick={() => setActivePeriod(period.key)}
                            >
                                {period.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 -ml-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full"><p>Loading chart data...</p></div>
                ) : data.chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full"><p>No data to display for this period.</p></div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatBytes} />
                            <Tooltip formatter={(value) => formatBytes(value)} contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }} />
                            
                            {/* --- START: 3. เพิ่ม onClick ให้กับ Legend --- */}
                            <Legend onClick={(e) => handleLegendClick(e.dataKey)} wrapperStyle={{ cursor: 'pointer' }} />
                            {/* --- END --- */}
                            
                            {data.hosts.map((host, index) => (
                                <Line 
                                    key={host} 
                                    type="monotone" 
                                    dataKey={host} 
                                    stroke={COLORS[index % COLORS.length]} 
                                    strokeWidth={2} 
                                    dot={false}
                                    // --- START: 4. ซ่อนกราฟตาม State ---
                                    hide={hiddenHosts[host]}
                                    // --- END ---
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}