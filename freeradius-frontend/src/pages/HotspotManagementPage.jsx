// src/pages/HotspotManagementPage.jsx
import { useState, useCallback } from "react";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2 } from "lucide-react";
import { useTranslation } from "react-i18next"; //

// --- Import คอมโพเนนต์ของแต่ละแท็บ ---
import ActiveHostsTab from "@/components/tabs/ActiveHostsTab";
import AllHostsTab from "@/components/tabs/AllHostsTab";
import IpBindingsTab from "@/components/tabs/IpBindingsTab";

export default function HotspotManagementPage() {
    const { t } = useTranslation(); //
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
                    {t('hotspot_management_page.title')}
                </CardTitle>
                <CardDescription>
                    {t('hotspot_management_page.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="active-hosts" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="active-hosts">{t('hotspot_management_page.tabs.active')}</TabsTrigger>
                        <TabsTrigger value="all-hosts">{t('hotspot_management_page.tabs.all')}</TabsTrigger>
                        <TabsTrigger value="ip-bindings">{t('hotspot_management_page.tabs.bindings')}</TabsTrigger>
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