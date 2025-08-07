// src/components/dialogs/UserImportDialog.jsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Upload, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function UserImportDialog({ isOpen, setIsOpen, onImportSuccess }) {
    const token = useAuthStore((state) => state.token);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.name.toLowerCase().endsWith(".csv")) {
            setSelectedFile(file);
            setImportResult(null);
        } else {
            toast.error("Please select a valid .csv file.");
            setSelectedFile(null);
            event.target.value = null; 
        }
    };

    // --- START: แก้ไขฟังก์ชันนี้ ---
    const handleDownloadTemplate = () => {
        const headers = ["organizationName", "fullName", "password", "username", "national_id", "employee_id", "student_id", "email", "phoneNumber"];
        
        const rows = [
            headers,
            ["สมัครสมาชิก", "นายกำหนดเอง ใจดี", "Pass@1234", "customuser", '="1234567890123"', "", "", "custom@email.com", '="0810000001"'],
            ["ลงทะเบียนด้วยเลขบัตรประชาชน", "นางสาวสมศรี มีบัตร", "Pass@1234", "", '="1112223334455"', "", "", "somsri@email.com", '="0810000002"'],
            ["เจ้าหน้าที่", "นายสามารถ ทำงาน", "Pass@1234", "", "", "EMP007", "", "samart@email.com", '="0810000003"'],
            ["มัธยมศึกษาปีที่2", "เด็กหญิงมานี เรียนดี", "Pass@1234", "", "", "", "6601009", "manee@email.com", '="0810000004"']
        ];
        
        // สร้างเนื้อหา CSV โดยการ join แต่ละแถวด้วย Comma และแต่ละบรรทัดด้วย \n
        const csvContent = rows.map(row => row.join(',')).join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "user_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    // --- END ---

    const handleImport = async () => {
        if (!selectedFile) {
            toast.warning("Please select a file to import.");
            return;
        }
        setIsImporting(true);
        setImportResult(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axiosInstance.post('/users/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setImportResult({ success: true, ...response.data });
            toast.success("Import successful!");
            onImportSuccess();
        } catch (error) {
            const errorData = error.response?.data;
            setImportResult({ success: false, ...errorData });
            toast.error("Import failed. Please check the errors below.");
        } finally {
            setIsImporting(false);
        }
    };
    
    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            setSelectedFile(null);
            setImportResult(null);
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Users from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to add multiple users at once.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                        <p className="font-semibold mb-2">Instructions:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Download the template to see the required format.</li>
                            <li>The `organizationName`, `fullName`, and `password` columns are always required.</li>
                            <li>Other columns like `username`, `national_id`, etc., are required based on the organization's login type.</li>
                        </ul>
                    </div>

                    <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Download CSV Template
                    </Button>
                    
                    <div>
                        <Label htmlFor="csv-file">Upload CSV File</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>

                    {importResult && (
                        <div className={`p-4 rounded-md text-sm ${importResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {importResult.success ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <p><span className="font-bold">{importResult.data.successCount}</span> users were imported successfully.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2 font-bold mb-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        <p>Import failed. Please fix the following errors:</p>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                                        {importResult.errors ? (
                                            importResult.errors.map((err, index) => (
                                                <li key={index}>Row {err.row}: {err.message}</li>
                                            ))
                                        ) : (
                                            <li>{importResult.message || "An unknown error occurred."}</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={handleClose}>Close</Button>
                    <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
                        {isImporting ? 'Importing...' : <><Upload className="mr-2 h-4 w-4" /> Start Import</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}