// src/components/shared/OrganizationCombobox.jsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const OrganizationCombobox = ({ selectedValue, onSelect, allOrgs, placeholder }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrgs = useMemo(() => {
        if (!searchTerm) {
            return allOrgs;
        }
        return allOrgs.filter(org => 
            org.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allOrgs]);
    
    return (
        <Select value={selectedValue ? String(selectedValue) : ""} onValueChange={onSelect}>
            <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
                <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t('import_dialog.format_preview.search_org_placeholder', 'ค้นหากลุ่มผู้ใช้...')}
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                    {filteredOrgs && filteredOrgs.length > 0 ? (
                        filteredOrgs.map(org => (
                            <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                        ))
                    ) : (
                        <div className="p-4 text-sm text-muted-foreground text-center">{t('import_dialog.format_preview.no_orgs_found', 'ไม่พบข้อมูล')}</div>
                    )}
                </div>
            </SelectContent>
        </Select>
    );
};

export default OrganizationCombobox;