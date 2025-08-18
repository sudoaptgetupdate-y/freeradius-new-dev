// src/pages/RadiusProfilesPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, Trash2, Settings } from "lucide-react";
import ProfileFormDialog from "@/components/dialogs/ProfileFormDialog";
import AttributeFormDialog from "@/components/dialogs/AttributeFormDialog";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RadiusProfilesPage() {
    const token = useAuthStore((state) => state.token);
    
    const { 
        data: profiles, 
        isLoading, 
        refreshData, 
        searchTerm, 
        handleSearchChange 
    } = usePaginatedFetch("/radius-profiles");

    const [selectedProfile, setSelectedProfile] = useState(null);
    const [detailedProfile, setDetailedProfile] = useState(null);
    const [isAttrLoading, setIsAttrLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('reply');

    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [isAttrDialogOpen, setIsAttrDialogOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [profileToDelete, setProfileToDelete] = useState(null);
    const [attrDialogData, setAttrDialogData] = useState({ type: '', name: '' });

    // The usePaginatedFetch hook handles filtering on the backend via searchTerm,
    // so client-side filtering with useMemo is no longer needed if the backend supports it.
    // If the backend doesn't filter, this useMemo is still correct.
    const filteredProfiles = useMemo(() => {
        if (!searchTerm) return profiles;
        return profiles.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [profiles, searchTerm]);


    useEffect(() => {
        setDetailedProfile(null);
        if (!selectedProfile) {
            return;
        }
        
        const fetchDetailedProfile = async () => {
            setIsAttrLoading(true);
            try {
                const response = await axiosInstance.get(`/radius-profiles/${selectedProfile.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDetailedProfile(response.data.data);
            } catch (error) {
                toast.error("Failed to fetch profile attributes.");
                setSelectedProfile(null);
            } finally {
                setIsAttrLoading(false);
            }
        };

        fetchDetailedProfile();
    }, [selectedProfile, token]);

    const handleAddNewProfile = () => {
        setEditingProfile(null);
        setIsProfileDialogOpen(true);
    };

    const handleEditProfile = (profile) => {
        setEditingProfile(profile);
        setIsProfileDialogOpen(true);
    };

    const handleDeleteProfile = (profile) => {
        setProfileToDelete(profile);
    };

    const confirmDeleteProfile = async () => {
        if (!profileToDelete) return;
        toast.promise(
            axiosInstance.delete(`/radius-profiles/${profileToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Deleting profile...',
                success: () => {
                    if (selectedProfile?.id === profileToDelete.id) {
                        setSelectedProfile(null);
                    }
                    refreshData();
                    return `Profile '${profileToDelete.name}' deleted successfully!`;
                },
                error: (err) => err.response?.data?.message || "Failed to delete profile.",
                finally: () => setProfileToDelete(null)
            }
        );
    };
    
    const openAttributeDialog = (type) => {
        if (!selectedProfile) return;
        setActiveTab(type);
        setAttrDialogData({ type: type, name: selectedProfile.name });
        setIsAttrDialogOpen(true);
    };

    const refreshAttributes = () => {
        if (selectedProfile) {
            const tempProfile = { ...selectedProfile };
            setSelectedProfile(null); 
            setTimeout(() => setSelectedProfile(tempProfile), 50); // Force re-trigger of useEffect
        }
    }

    const handleDeleteAttribute = async (attributeId, type) => {
        toast.promise(
            axiosInstance.delete(`/attributes/${type}/${attributeId}`, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Deleting attribute...',
                success: () => {
                    refreshAttributes();
                    return "Attribute deleted successfully!";
                },
                error: (err) => err.response?.data?.message || "Failed to delete attribute."
            }
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Radius Profiles</CardTitle>
                            <Button size="sm" onClick={handleAddNewProfile}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add New
                            </Button>
                        </div>
                        <div className="pt-4">
                            <Input 
                                placeholder="Search profiles..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="max-h-[60vh] overflow-y-auto">
                        {isLoading && <p className="text-center text-muted-foreground py-4">Loading profiles...</p>}
                        <div className="space-y-2">
                           {profiles.map(profile => (
                                <div 
                                    key={profile.id}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedProfile?.id === profile.id ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-accent'}`}
                                    onClick={() => setSelectedProfile(profile)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold">{profile.name}</div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); handleEditProfile(profile);}}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => {e.stopPropagation(); handleDeleteProfile(profile);}}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{profile.description || 'No description'}</p>
                                </div>
                           ))}
                           {!isLoading && profiles.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No profiles found.</p>
                           )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Settings className="h-6 w-6" />
                           Profile Attributes
                        </CardTitle>
                        <CardDescription>
                           {selectedProfile ? `Managing attributes for "${selectedProfile.name}"` : "Select a profile to manage its attributes."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isAttrLoading ? (
                             <div className="flex items-center justify-center h-64">
                               <p className="text-muted-foreground">Loading attributes...</p>
                            </div>
                        ) : !selectedProfile || !detailedProfile ? (
                            <div className="flex items-center justify-center h-64">
                               <p className="text-muted-foreground">Please select a profile from the list.</p>
                            </div>
                        ) : (
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="reply">Reply Attributes</TabsTrigger>
                                    <TabsTrigger value="check">Check Attributes</TabsTrigger>
                                </TabsList>
                                <TabsContent value="reply" className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold">Reply Attributes ({detailedProfile.replyAttributes.length})</h3>
                                        <Button variant="outline" size="sm" onClick={() => openAttributeDialog('reply')}>
                                            <PlusCircle className="h-4 w-4 mr-2" /> Add Reply
                                        </Button>
                                    </div>
                                    <div className="max-h-[50vh] overflow-y-auto">
                                        <AttributeTable attributes={detailedProfile.replyAttributes} type="reply" onDelete={handleDeleteAttribute} />
                                    </div>
                                </TabsContent>
                                <TabsContent value="check" className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold">Check Attributes ({detailedProfile.checkAttributes.length})</h3>
                                        <Button variant="outline" size="sm" onClick={() => openAttributeDialog('check')}>
                                            <PlusCircle className="h-4 w-4 mr-2" /> Add Check
                                        </Button>
                                    </div>
                                     <div className="max-h-[50vh] overflow-y-auto">
                                        <AttributeTable attributes={detailedProfile.checkAttributes} type="check" onDelete={handleDeleteAttribute} />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </div>

            {isProfileDialogOpen && (
                <ProfileFormDialog 
                    isOpen={isProfileDialogOpen}
                    setIsOpen={setIsProfileDialogOpen}
                    profile={editingProfile}
                    onSave={refreshData}
                />
            )}
            {isAttrDialogOpen && (
                 <AttributeFormDialog
                    isOpen={isAttrDialogOpen}
                    setIsOpen={setIsAttrDialogOpen}
                    profileName={attrDialogData.name}
                    attributeType={attrDialogData.type}
                    onSave={refreshAttributes}
                />
            )}
            <AlertDialog open={!!profileToDelete} onOpenChange={(isOpen) => !isOpen && setProfileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the profile: <strong>{profileToDelete?.name}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteProfile} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

const AttributeTable = ({ attributes, type, onDelete }) => {
    if (!attributes || attributes.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">No attributes defined.</p>;
    }
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Attribute</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-[50px] text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {attributes.map(attr => (
                        <TableRow key={attr.id}>
                            <TableCell className="font-mono text-sm">{attr.attribute}</TableCell>
                            <TableCell className="font-mono text-sm">{attr.op}</TableCell>
                            <TableCell className="font-mono text-sm">{attr.value}</TableCell>
                            <TableCell className="text-right">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => onDelete(attr.id, type)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};