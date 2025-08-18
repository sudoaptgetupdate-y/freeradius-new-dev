// src/components/ui/OnlineUsersChartCard.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const timePeriods = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
];

export default function OnlineUsersChartCard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState('day');
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/dashboard/online-users-graph?period=${activePeriod}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data.data);
            } catch (error) {
                toast.error(`Failed to load graph data for period: ${activePeriod}`);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchData();
        }
    }, [activePeriod, token]);

    return (
        <Card className="shadow-sm border-subtle h-full flex flex-col">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>Online Users Trend</CardTitle>
                        <CardDescription>Peak concurrent users over time.</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                        {timePeriods.map((period) => (
                            <Button
                                key={period.key}
                                size="sm"
                                className={cn(
                                    "flex-1 justify-center",
                                    activePeriod === period.key ? "bg-background text-foreground shadow" : "bg-transparent text-muted-foreground hover:bg-muted/50"
                                )}
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
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading chart data...</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                            <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))"
                                }}
                            />
                            <Line type="monotone" dataKey="value" name="Online Users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}