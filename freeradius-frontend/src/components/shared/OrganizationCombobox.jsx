// src/components/shared/OrganizationCombobox.jsx
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

import useAuthStore from '@/store/authStore';
import axiosInstance from '@/api/axiosInstance';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const OrganizationCombobox = ({ selectedValue, onSelect, compatibleOrgs, placeholder }) => {
    const { t } = useTranslation();
    const token = useAuthStore((state) => state.token);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // รอ 300ms หลังจากผู้ใช้หยุดพิมพ์

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const fetcher = (url) => axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { searchTerm: debouncedSearchTerm, pageSize: 50 } // ค้นหาและจำกัดผลลัพธ์ที่ 50
    }).then(res => res.data.data.organizations);

    const { data: searchedOrgs, error } = useSWR(
      // จะเริ่ม fetch ก็ต่อเมื่อมีการพิมพ์ค้นหา
      debouncedSearchTerm ? `/organizations` : null, 
      fetcher
    );

    const organizations = debouncedSearchTerm ? searchedOrgs : compatibleOrgs;
    
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
                    {error && <div className="p-4 text-sm text-destructive text-center">Error fetching data.</div>}
                    {organizations && organizations.length > 0 ? (
                        organizations.map(org => (
                            <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                        ))
                    ) : (
                        !error && <div className="p-4 text-sm text-muted-foreground text-center">{t('import_dialog.format_preview.no_orgs_found', 'ไม่พบข้อมูล')}</div>
                    )}
                </div>
            </SelectContent>
        </Select>
    );
};

export default OrganizationCombobox;