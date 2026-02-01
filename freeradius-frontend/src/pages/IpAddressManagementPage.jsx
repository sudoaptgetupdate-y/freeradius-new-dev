// src/pages/IpAddressManagementPage.jsx
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network } from "lucide-react";
import DhcpLeasesTab from "@/components/tabs/DhcpLeasesTab";
import StaticLeasesTab from "@/components/tabs/StaticLeasesTab";
import { useTranslation } from "react-i18next"; //

export default function IpAddressManagementPage() {
    const { t } = useTranslation(); //
    const token = useAuthStore((state) => state.token);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Network className="h-6 w-6" />
                    {t('ip_management_page.title')}
                </CardTitle>
                <CardDescription>
                    {t('ip_management_page.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="dhcp-leases" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="dhcp-leases">{t('ip_management_page.tabs.dhcp_leases')}</TabsTrigger>
                        <TabsTrigger value="static-leases">{t('ip_management_page.tabs.static_leases')}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="dhcp-leases" className="mt-4">
                       <DhcpLeasesTab token={token} />
                    </TabsContent>
                    <TabsContent value="static-leases" className="mt-4">
                       <StaticLeasesTab token={token} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}