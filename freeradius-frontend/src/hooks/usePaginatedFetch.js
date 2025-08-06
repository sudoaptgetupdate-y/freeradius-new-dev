// src/hooks/usePaginatedFetch.js
import { useState, useEffect, useCallback } from "react";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function usePaginatedFetch(apiPath, initialItemsPerPage = 10, defaultFilters = {}) {
    const token = useAuthStore((state) => state.token);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: initialItemsPerPage
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState(defaultFilters);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const params = {
                page: pagination.currentPage,
                pageSize: pagination.itemsPerPage,
                searchTerm: debouncedSearchTerm,
                ...filters,
            };

            const response = await axiosInstance.get(apiPath, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            
            const responseData = response.data.data;

            // --- START: เพิ่ม Logic ตรวจสอบรูปแบบข้อมูลที่ได้รับ ---
            if (Array.isArray(responseData)) {
                // กรณีที่ API ส่งกลับมาเป็น Array ตรงๆ (เช่น /organizations)
                setData(responseData);
                setPagination(prev => ({
                    ...prev,
                    totalItems: responseData.length,
                    totalPages: Math.ceil(responseData.length / prev.itemsPerPage) || 1,
                }));
            } else {
                // กรณีที่ API ส่งกลับมาเป็น Object พร้อมข้อมูล Pagination (เช่น /users)
                setData(responseData.users || responseData.organizations || []);
                setPagination({
                    currentPage: responseData.currentPage,
                    totalPages: responseData.totalPages,
                    totalItems: responseData.totalUsers || responseData.totalOrgs || 0,
                    itemsPerPage: pagination.itemsPerPage,
                });
            }
            // --- END: สิ้นสุด Logic ที่เพิ่ม ---

        } catch (error) {
            toast.error(`Failed to fetch data from ${apiPath}`);
        } finally {
            setIsLoading(false);
        }
    }, [token, apiPath, pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm, JSON.stringify(filters)]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    const handleItemsPerPageChange = (newSize) => {
        setPagination({
            ...pagination,
            itemsPerPage: parseInt(newSize, 10),
            currentPage: 1,
        });
    };

    return {
        data,
        pagination,
        isLoading,
        searchTerm,
        handleSearchChange,
        handlePageChange,
        handleItemsPerPageChange,
        refreshData: fetchData
    };
}