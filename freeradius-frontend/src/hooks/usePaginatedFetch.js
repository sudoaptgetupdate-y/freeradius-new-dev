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

export function usePaginatedFetch(apiPath, initialItemsPerPage = 10, filtersProp = {}) {
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
    const [filters, setFilters] = useState(filtersProp);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        setFilters(filtersProp);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [JSON.stringify(filtersProp)]);

    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            // กรองเอาเฉพาะ filter ที่มีค่า ไม่ส่งค่าว่างไป
            const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const params = {
                page: pagination.currentPage,
                pageSize: pagination.itemsPerPage,
                searchTerm: debouncedSearchTerm,
                ...activeFilters,
            };

            const response = await axiosInstance.get(apiPath, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            
            const responseData = response.data.data;

            if (Array.isArray(responseData)) {
                setData(responseData);
                setPagination(prev => ({
                    ...prev,
                    totalItems: responseData.length,
                    totalPages: Math.ceil(responseData.length / prev.itemsPerPage) || 1,
                }));
            } else {
                // --- START: แก้ไขส่วนนี้ ---
                // เพิ่ม 'history' เข้าไปในรายการตรวจสอบ
                setData(responseData.users || responseData.organizations || responseData.history || []);
                setPagination({
                    currentPage: responseData.currentPage,
                    totalPages: responseData.totalPages,
                    // เพิ่ม 'totalRecords' สำหรับหน้า History
                    totalItems: responseData.totalUsers || responseData.totalOrgs || responseData.totalRecords || 0,
                    itemsPerPage: pagination.itemsPerPage,
                });
                // --- END ---
            }

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