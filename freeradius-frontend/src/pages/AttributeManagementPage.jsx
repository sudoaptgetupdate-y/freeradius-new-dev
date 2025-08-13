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
// --- START: เพิ่มการ import Tooltip ---
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// --- END ---

export default function AttributeManagementPage() {
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
        try {
            await axiosInstance.delete(`/attribute-definitions/${attributeToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Attribute '${attributeToDelete.name}' deleted successfully!`);
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete attribute.");
        } finally {
            setAttributeToDelete(null);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ListChecks className="h-6 w-6" />
                                Attribute Management
                            </CardTitle>
                            <CardDescription>Manage RADIUS attribute definitions for selection in profiles.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Attribute
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <Input 
                            placeholder="Search by name or description..."
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
                            <ToggleGroupItem value="all" className="flex-1">All</ToggleGroupItem>
                            <ToggleGroupItem value="reply" className="flex-1">Reply</ToggleGroupItem>
                            <ToggleGroupItem value="check" className="flex-1">Check</ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                    <div className="border rounded-md">
                        {/* --- START: เพิ่ม TooltipProvider ครอบ Table --- */}
                        <TooltipProvider delayDuration={0}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Attribute Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
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
                                                {/* --- START: แก้ไขปุ่ม Action --- */}
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(attr)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit Attribute</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(attr)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Delete Attribute</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                                {/* --- END --- */}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No attribute definitions found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                        {/* --- END --- */}
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
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the attribute: <strong>{attributeToDelete?.name}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}