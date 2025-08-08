// src/hooks/usePaginatedFetch.js
import { useState, useEffect, useCallback, useRef } from "react";
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
    const stringifiedFilters = JSON.stringify(filtersProp);

    useEffect(() => {
        setFilters(filtersProp);
        setPagination(prev => ({ ...prev, currentPage: 1, itemsPerPage: initialItemsPerPage }));
    }, [stringifiedFilters, initialItemsPerPage]);

    // --- START: แก้ไขโครงสร้าง Hook ทั้งหมดเพื่อแก้ปัญหา Loop ---
    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value) acc[key] = value;
                return acc;
            }, {});

            const params = {
                page: pagination.currentPage,
                pageSize: pagination.itemsPerPage,
                searchTerm: debouncedSearchTerm,
                ...activeFilters,
            };

            const response = await axiosInstance.get(apiPath, { params, headers: { Authorization: `Bearer ${token}` } });
            const responseData = response.data.data;

            if (Array.isArray(responseData)) {
                setData(responseData);
                const newTotalItems = responseData.length;
                const newTotalPages = Math.ceil(newTotalItems / pagination.itemsPerPage) || 1;
                setPagination(prev => ({ ...prev, totalItems: newTotalItems, totalPages: newTotalPages }));
            } else {
                const items = responseData.users || responseData.organizations || responseData.history || responseData.admins || responseData.batches || [];
                const total = responseData.totalUsers || responseData.totalOrgs || responseData.totalRecords || responseData.totalAdmins || responseData.totalBatches || 0;
                setData(items);
                setPagination(prev => ({
                    ...prev,
                    currentPage: responseData.currentPage,
                    totalPages: responseData.totalPages,
                    totalItems: total,
                }));
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
    // --- END: สิ้นสุดการแก้ไขโครงสร้าง Hook ---

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => {
            if (newPage > 0 && newPage <= prev.totalPages) {
                return { ...prev, currentPage: newPage };
            }
            return prev;
        });
    };

    const handleItemsPerPageChange = (newSize) => {
        setPagination(prev => ({
            ...prev,
            itemsPerPage: parseInt(newSize, 10),
            currentPage: 1,
        }));
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