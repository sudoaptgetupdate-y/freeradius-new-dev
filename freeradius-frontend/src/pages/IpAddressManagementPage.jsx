// src/pages/IpAddressManagementPage.jsx
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network } from "lucide-react";
import DhcpLeasesTab from "@/components/tabs/DhcpLeasesTab";
import StaticLeasesTab from "@/components/tabs/StaticLeasesTab";

export default function IpAddressManagementPage() {
  const token = useAuthStore((state) => state.token);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-6 w-6" />
          IP Address Management
        </CardTitle>
        <CardDescription>Oversee DHCP leases and manage static IP reservations for your network devices.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dhcp-leases" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dhcp-leases">DHCP Leases</TabsTrigger>
            <TabsTrigger value="static-leases">Static Leases</TabsTrigger>
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
