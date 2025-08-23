// src/pages/AttributeManagementPage.jsx
import { useState, useMemo } from "react";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, ListChecks } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AttributeDefinitionFormDialog from "@/components/dialogs/AttributeDefinitionFormDialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next"; // <-- 1. Import hook

export default function AttributeManagementPage() {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ hook
    const token = useAuthStore((state) => state.token);
    const { data: attributes, isLoading, refreshData } = usePaginatedFetch("/attribute-definitions");

    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [attributeToDelete, setAttributeToDelete] = useState(null);

    const filteredAttributes = useMemo(() => {
        return attributes
            .filter(attr => {
                if (filterType === 'all') return true;
                return attr.type === filterType;
            })
            .filter(attr => 
                attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (attr.description && attr.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [attributes, searchTerm, filterType]);

    const handleAddNew = () => {
        setEditingAttribute(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (attribute) => {
        setEditingAttribute(attribute);
        setIsDialogOpen(true);
    };

    const handleDelete = (attribute) => {
        setAttributeToDelete(attribute);
    };

    const confirmDelete = async () => {
        if (!attributeToDelete) return;
        toast.promise(
            axiosInstance.delete(`/attribute-definitions/${attributeToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            {
                loading: t('toast.deleting_attribute'),
                success: () => {
                    refreshData();
                    return t('toast.delete_attribute_success_def', { name: attributeToDelete.name });
                },
                error: (err) => err.response?.data?.message || t('toast.delete_attribute_failed_def'),
                finally: () => setAttributeToDelete(null),
            }
        );
    };

    // --- 3. แปลภาษาในส่วน JSX ทั้งหมด ---
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ListChecks className="h-6 w-6" />
                                {t('attribute_management_page.title')}
                            </CardTitle>
                            <CardDescription>{t('attribute_management_page.description')}</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('attribute_management_page.add_new_button')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <Input 
                            placeholder={t('attribute_management_page.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow"
                        />
                        <ToggleGroup 
                            type="single" 
                            value={filterType} 
                            onValueChange={(value) => value && setFilterType(value)}
                            className="w-full sm:w-auto"
                        >
                            <ToggleGroupItem value="all" className="flex-1">{t('all')}</ToggleGroupItem>
                            <ToggleGroupItem value="reply" className="flex-1">{t('reply')}</ToggleGroupItem>
                            <ToggleGroupItem value="check" className="flex-1">{t('check')}</ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                    <div className="border rounded-md">
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('table_headers.attribute_name')}</TableHead>
                                        <TableHead>{t('table_headers.type')}</TableHead>
                                        <TableHead>{t('table_headers.description')}</TableHead>
                                        <TableHead className="text-center">{t('table_headers.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={4}><div className="h-8 bg-muted rounded animate-pulse"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredAttributes.length > 0 ? (
                                        filteredAttributes.map((attr) => (
                                            <TableRow key={attr.id}>
                                                <TableCell className="font-medium font-mono">{attr.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={attr.type === 'reply' ? 'default' : 'secondary'}>
                                                        {attr.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{attr.description}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(attr)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.edit_attribute')}</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(attr)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('actions.delete_attribute')}</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">{t('attribute_management_page.no_attributes_found')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>

            {isDialogOpen && (
                <AttributeDefinitionFormDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    attribute={editingAttribute}
                    onSave={refreshData}
                />
            )}

            <AlertDialog open={!!attributeToDelete} onOpenChange={(isOpen) => !isOpen && setAttributeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('delete_attribute_dialog.description', { name: attributeToDelete?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_attribute_dialog.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}