// src/pages/VoucherSettingsPage.jsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from 'lucide-react';

export default function VoucherSettingsPage() {
    // This is a placeholder for state management (e.g., fetching/saving settings)
    const [logo, setLogo] = useState(null);
    const [ssid, setSsid] = useState('My-WiFi');
    const [headerText, setHeaderText] = useState('WiFi Voucher');
    const [footerText, setFooterText] = useState('Thank you!');

    const handleSave = () => {
        // Placeholder for save logic
        alert('Settings saved!');
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Voucher Customization</CardTitle>
                    <CardDescription>Customize the appearance of printed vouchers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="logo">Logo</Label>
                        <Input id="logo" type="file" onChange={(e) => setLogo(e.target.files[0])} />
                    </div>
                     <div>
                        <Label htmlFor="ssid">WiFi Name (SSID)</Label>
                        <Input id="ssid" value={ssid} onChange={(e) => setSsid(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="headerText">Header Text</Label>
                        <Input id="headerText" value={headerText} onChange={(e) => setHeaderText(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="footerText">Footer Text</Label>
                        <Textarea id="footerText" value={footerText} onChange={(e) => setFooterText(e.target.value)} />
                    </div>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Settings</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 border-2 border-dashed rounded-lg text-center">
                        {logo && <img src={URL.createObjectURL(logo)} alt="logo" className="mx-auto h-12 mb-2"/>}
                        <h3 className="font-bold">{headerText}</h3>
                        <p className="text-sm">SSID: {ssid}</p>
                        <div className="my-4 p-2 bg-gray-100 rounded">
                            <p>Username: <strong>sampleuser</strong></p>
                            <p>Password: <strong>samplepass</strong></p>
                        </div>
                        <p className="text-xs">{footerText}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}