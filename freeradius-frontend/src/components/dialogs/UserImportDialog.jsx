// src/components/dialogs/UserImportDialog.jsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { Upload, Download, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";

// --- Component สำหรับแสดงตัวอย่างข้อมูลจาก `ตัวอย่างCSV.pdf` ---
const CsvPreviewDialog = () => {
    const { t } = useTranslation();
    return (
        <DialogContent className="sm:max-w-6xl">
            <DialogHeader>
                <DialogTitle>{t('import_dialog.csv_preview.title')}</DialogTitle>
                <DialogDescription>
                    {t('import_dialog.csv_preview.description')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>organizationName</TableHead>
                            <TableHead>fullName</TableHead>
                            <TableHead>password</TableHead>
                            <TableHead>username</TableHead>
                            <TableHead>national_id</TableHead>
                            <TableHead>employee_id</TableHead>
                            <TableHead>student_id</TableHead>
                            <TableHead>email</TableHead>
                            <TableHead>phoneNumber</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>สร้างผู้ใช้ด้วยตัวเอง</TableCell>
                            <TableCell>นายสมัคร ด้วยตัวเอง</TableCell>
                            <TableCell>Pass1234</TableCell>
                            <TableCell>samack1234</TableCell>
                            <TableCell className="text-green-700 bg-green-50/50"><i>{t('import_dialog.optional_field')}</i></TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>samarg@email.com</TableCell>
                            <TableCell>0810000000</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>สร้างผู้ใช้ด้วยตัวเอง</TableCell>
                            <TableCell>นายสมหมาย สมัครเล่น</TableCell>
                            <TableCell>Pass1234</TableCell>
                            <TableCell>sommal2537</TableCell>
                            <TableCell className="text-green-700 bg-green-50/50"><i>{t('import_dialog.optional_field')}</i></TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>kommm@mall.com</TableCell>
                            <TableCell>0890000001</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>บัตรประชาชน</TableCell>
                            <TableCell>นางสาวสมศรี มีบัตร</TableCell>
                            <TableCell>Pass1234</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>1112223334455</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>kumimi@email.com</TableCell>
                            <TableCell>0810000002</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>บัตรประชาชน</TableCell>
                            <TableCell>นายสมบัติ มากมี</TableCell>
                            <TableCell>Pass1234</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>1112223333712</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>sombut@emall.com</TableCell>
                            <TableCell>0841281900</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>พนักงานบริษัท</TableCell>
                            <TableCell>นายสามารถ หลากหลายด้าน</TableCell>
                            <TableCell>Pass1234</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell className="text-green-700 bg-green-50/50"><i>{t('import_dialog.optional_field')}</i></TableCell>
                            <TableCell>EMP007</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>samart@email.com</TableCell>
                            <TableCell>0810000003</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>พนักงานบริษัท</TableCell>
                            <TableCell>นางสาวตั้งใจ ทํางาน</TableCell>
                            <TableCell>Pass1234</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell className="text-green-700 bg-green-50/50"><i>{t('import_dialog.optional_field')}</i></TableCell>
                            <TableCell>EMPOGB</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>tanjai@email.com</TableCell>
                            <TableCell>0812318800</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>นักเรียน</TableCell>
                            <TableCell>เด็กหญิงมานี เรียนดี</TableCell>
                            <TableCell>Pass1234</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell className="text-green-700 bg-green-50/50"><i>{t('import_dialog.optional_field')}</i></TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>6601011</TableCell>
                            <TableCell>manee@email.com</TableCell>
                            <TableCell>0814751801</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>นักเรียน</TableCell>
                            <TableCell>เด็กชายมานพ ประสบโชค</TableCell>
                            <TableCell>Pass1234</TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell className="text-green-700 bg-green-50/50"><i>{t('import_dialog.optional_field')}</i></TableCell>
                            <TableCell className="text-red-700 bg-red-50/50"><i>{t('import_dialog.empty_field')}</i></TableCell>
                            <TableCell>6801010</TableCell>
                            <TableCell>manop@email.com</TableCell>
                            <TableCell>0814287102</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button">{t('close')}</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    )
};

const FormatPreviewDialog = () => {
    const { t } = useTranslation();
    return (
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>{t('import_dialog.format_preview.title')}</DialogTitle>
                <DialogDescription>{t('import_dialog.format_preview.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                {/* Manual Type */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">{t('import_dialog.format_preview.manual_title')}</h3>
                    <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: t('import_dialog.format_preview.manual_desc') }} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>organizationName</TableHead>
                                <TableHead>fullName</TableHead>
                                <TableHead>password</TableHead>
                                <TableHead className="text-green-600">username</TableHead>
                                <TableHead className="text-red-600">national_id</TableHead>
                                <TableHead className="text-red-600">employee_id</TableHead>
                                <TableHead className="text-red-600">student_id</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>สร้างผู้ใช้ด้วยตัวเอง</TableCell>
                                <TableCell>นายสมัคร ด้วยตัวเอง</TableCell>
                                <TableCell>Pass1234</TableCell>
                                <TableCell className="text-green-600">samack1234</TableCell>
                                <TableCell className="text-red-600 bg-red-50">ไม่ต้องกรอก</TableCell>
                                <TableCell className="text-red-600 bg-red-50">ไม่ต้องกรอก</TableCell>
                                <TableCell className="text-red-600 bg-red-50">ไม่ต้องกรอก</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* National ID Type */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">{t('import_dialog.format_preview.national_id_title')}</h3>
                    <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: t('import_dialog.format_preview.national_id_desc') }} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>organizationName</TableHead>
                                <TableHead>fullName</TableHead>
                                <TableHead>password</TableHead>
                                <TableHead className="text-red-600">username</TableHead>
                                <TableHead className="text-green-600">national_id</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>บัตรประชาชน</TableCell>
                                <TableCell>นางสาวสมศรี มีบัตร</TableCell>
                                <TableCell>Pass1234</TableCell>
                                <TableCell className="text-red-600 bg-red-50">ไม่ต้องกรอก</TableCell>
                                <TableCell className="text-green-600">1112223334455</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                {/* Employee ID Type */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">{t('import_dialog.format_preview.employee_id_title')}</h3>
                    <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: t('import_dialog.format_preview.employee_id_desc') }} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>organizationName</TableHead>
                                <TableHead>fullName</TableHead>
                                <TableHead>password</TableHead>
                                <TableHead className="text-red-600">username</TableHead>
                                <TableHead className="text-green-600">employee_id</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>พนักงานบริษัท</TableCell>
                                <TableCell>นายสามารถ หลากหลาย</TableCell>
                                <TableCell>Pass1234</TableCell>
                                <TableCell className="text-red-600 bg-red-50">ไม่ต้องกรอก</TableCell>
                                <TableCell className="text-green-600">EMP007</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                {/* Student ID Type */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">{t('import_dialog.format_preview.student_id_title')}</h3>
                    <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: t('import_dialog.format_preview.student_id_desc') }} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>organizationName</TableHead>
                                <TableHead>fullName</TableHead>
                                <TableHead>password</TableHead>
                                <TableHead className="text-red-600">username</TableHead>
                                <TableHead className="text-green-600">student_id</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>นักเรียน</TableCell>
                                <TableCell>เด็กหญิงมานี เรียนดี</TableCell>
                                <TableCell>Pass1234</TableCell>
                                <TableCell className="text-red-600 bg-red-50">ไม่ต้องกรอก</TableCell>
                                <TableCell className="text-green-600">6601011</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button">{t('close')}</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};


export default function UserImportDialog({ isOpen, setIsOpen, onImportSuccess }) {
    const { t } = useTranslation();
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
            toast.error(t('toast.select_csv_file'));
            setSelectedFile(null);
            event.target.value = null;
        }
    };
    
    const handleDownloadTemplate = () => {
        const headers = ["organizationName", "fullName", "password", "username", "national_id", "employee_id", "student_id", "email", "phoneNumber"];
        const rows = [
            headers,
            ["สร้างผู้ใช้ด้วยตัวเอง", "นายสมัคร ด้วยตัวเอง", "Pass1234", "samack1234", "", "", "", "samarn@email.com", "0810000000"],
            ["สร้างผู้ใช้ด้วยตัวเอง", "นายสมหมาย สมัครเล่น", "Pass1234", "sommai2537", "", "", "", "sommai@email.com", "0890000001"],
            ["บัตรประชาชน", "นางสาวสมศรี มีบัตร", "Pass1234", "", '="1112223334455"', "", "", "somsri@email.com", "0810000002"],
            ["บัตรประชาชน", "นายสมบัติ มากมี", "Pass1234", "", '="1112223333712"', "", "", "sombat@email.com", "0841281900"],
            ["พนักงานบริษัท", "นายสามารถ หลากหลายด้าน", "Pass1234", "", "", "EMP007", "", "samart@email.com", "0810000003"],
            ["พนักงานบริษัท", "นางสาวตั้งใจ ทำงาน", "Pass1234", "", '="1839851984796"', "EMP008", "", "tangjai@email.com", "0812318800"],
            ["นักเรียน", "เด็กหญิงมานี เรียนดี", "Pass1234", "", '="123847386212"', "", "6601009", "manee@email.com", "0814751801"],
            ["นักเรียน", "เด็กชายมานพ ประสบโชค", "Pass1234", "", "", "", "6801010", "manop@email.com", "0814287102"]
        ];

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

    const handleImport = async () => {
        if (!selectedFile) {
            toast.warning(t('toast.please_select_file'));
            return;
        }
        setIsImporting(true);
        setImportResult(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axiosInstance.post('/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            setImportResult({ success: true, ...response.data });
            toast.success(t('toast.import_successful'));
            onImportSuccess();
        } catch (error) {
            const errorData = error.response?.data;
            setImportResult({ success: false, ...errorData });
            toast.error(t('toast.import_failed'));
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
                    <DialogTitle>{t('import_dialog.title')}</DialogTitle>
                    <DialogDescription>{t('import_dialog.description')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="grid grid-cols-2 gap-2">
                        <Dialog>
                            <DialogTrigger asChild><Button variant="outline" className="w-full"><Eye className="mr-2 h-4 w-4" /> {t('import_dialog.view_format_button')}</Button></DialogTrigger>
                            <FormatPreviewDialog />
                        </Dialog>
                        <Dialog>
                            <DialogTrigger asChild><Button variant="outline" className="w-full"><Eye className="mr-2 h-4 w-4" /> {t('import_dialog.view_csv_example_button')}</Button></DialogTrigger>
                            <CsvPreviewDialog />
                        </Dialog>
                    </div>

                    <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                        <Download className="mr-2 h-4 w-4" /> {t('import_dialog.download_template_button')}
                    </Button>
                    
                    <div>
                        <Label htmlFor="csv-file">{t('import_dialog.upload_label')}</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>

                    {importResult && (
                        <div className={`p-4 rounded-md text-sm ${importResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {importResult.success ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <p>{t('import_dialog.success_message', { count: importResult.data.successCount })}</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2 font-bold mb-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        <p>{t('import_dialog.error_title')}</p>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                                        {importResult.errors ? (
                                            importResult.errors.map((err, index) => (
                                                <li key={index}>{t('import_dialog.error_row', { row: err.row })}: {err.message}</li>
                                            ))
                                        ) : (
                                            <li>{importResult.message || t('toast.generic_error')}</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={handleClose}>{t('close')}</Button>
                    <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
                        {isImporting ? t('importing') : <><Upload className="mr-2 h-4 w-4" /> {t('import_dialog.start_import_button')}</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}