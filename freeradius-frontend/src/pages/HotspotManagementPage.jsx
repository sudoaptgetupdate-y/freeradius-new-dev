// src/pages/HotspotManagementPage.jsx
import { useState, useCallback } from "react";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2 } from "lucide-react";

// --- Import คอมโพเนนต์ของแต่ละแท็บ ---
import ActiveHostsTab from "@/components/tabs/ActiveHostsTab";
import AllHostsTab from "@/components/tabs/AllHostsTab";
import IpBindingsTab from "@/components/tabs/IpBindingsTab";

export default function HotspotManagementPage() {
    const token = useAuthStore((state) => state.token);
    const [refreshBindings, setRefreshBindings] = useState(false);

    const handleMakeBindingSuccess = useCallback(() => {
        setRefreshBindings(true);
    }, []);

    const handleRefreshDone = useCallback(() => {
        setRefreshBindings(false);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-6 w-6" />
                    Hotspot Management
                </CardTitle>
                <CardDescription>
                    Oversee active users, known hosts, and manage permanent IP bindings for the Mikrotik Hotspot.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="active-hosts" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="active-hosts">Active Hosts</TabsTrigger>
                        <TabsTrigger value="all-hosts">All Hosts</TabsTrigger>
                        <TabsTrigger value="ip-bindings">IP Bindings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="active-hosts" className="mt-4">
                       <ActiveHostsTab token={token} onMakeBindingSuccess={handleMakeBindingSuccess} />
                    </TabsContent>
                    <TabsContent value="all-hosts" className="mt-4">
                       <AllHostsTab token={token} onMakeBindingSuccess={handleMakeBindingSuccess} />
                    </TabsContent>
                    <TabsContent value="ip-bindings" className="mt-4">
                        <IpBindingsTab token={token} refreshTrigger={refreshBindings} onRefreshDone={handleRefreshDone} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}