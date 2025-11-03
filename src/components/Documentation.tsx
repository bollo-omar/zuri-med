import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
    FileText, Search, Save, Printer, Clock, 
    Calendar, User as UserIcon, ClipboardList 
} from 'lucide-react';
import { Patient, User, UserRole } from '@/types';
import { PatientService } from '@/lib/mockServices';
import { toast } from 'sonner';

interface DocumentationProps {
    user: User;
}

const Documentation: React.FC<DocumentationProps> = ({ user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Document state
    const [documentType, setDocumentType] = useState('progress_note');
    const [documentContent, setDocumentContent] = useState('');
    const [documentHistory, setDocumentHistory] = useState<{
        id: string;
        type: string;
        date: string;
        author: string;
    }[]>([]);
    
    // Mock document templates for Kenya
    const documentTemplates = {
        progress_note: "SOAP Note:\n\nSubjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n",
        referral_letter: "REFERRAL LETTER\n\nDate: [Today's Date]\n\nDear Colleague,\n\nRE: Patient Referral - [Patient Name]\n\nI am referring the above patient for specialist assessment and management.\n\nClinical History:\n\nExamination Findings:\n\nInvestigations:\n\nProvisional Diagnosis:\n\nReason for Referral:\n\nThank you for seeing this patient.\n\nYours sincerely,\n\nDr. [Your Name]\nMedical Registration Number: [Your Registration Number]",
        sick_note: "MEDICAL CERTIFICATE\n\nThis is to certify that [Patient Name] has been under my medical care from [Start Date] to [End Date].\n\nDiagnosis (optional):\n\nThe patient is advised to refrain from work/school for [Number] days.\n\nDate: [Today's Date]\n\nDoctor's Name: [Your Name]\nMedical Registration Number: [Your Registration Number]\nSignature: ________________"
    };
    
    useEffect(() => {
        loadPatients();
        // Don't clear document content when component mounts - preserve user work
    }, []);
    
    const loadPatients = async () => {
        try {
            const response = await PatientService.getPatients(1, 100);
            if (response.success && response.data) {
                setPatients(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load patients');
        }
    };
    
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        try {
            const response = await PatientService.getPatients(1, 100, searchQuery);
            if (response.success && response.data && response.data.data.length > 0) {
                const found = response.data.data[0];
                setSelectedPatient(found);
                // Fetch patient's document history
                setDocumentHistory([
                    { id: '1', type: 'progress_note', date: '2023-05-15', author: 'Dr. Njoroge' },
                    { id: '2', type: 'referral_letter', date: '2023-04-22', author: 'Dr. Wambui' },
                    { id: '3', type: 'sick_note', date: '2023-03-10', author: 'Dr. Ochieng' }
                ]);
            } else {
                toast.error('Patient not found');
            }
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDocumentTypeChange = (type: string) => {
        setDocumentType(type);
        setDocumentContent(documentTemplates[type as keyof typeof documentTemplates] || '');
    };
    
    const handleSaveDocument = () => {
        if (!selectedPatient || !documentContent.trim()) {
            toast.error('Please select a patient and add document content');
            return;
        }
        
        // Simulate saving document
        toast.success('Document saved successfully');
        
        // Add to history
        setDocumentHistory([
            {
                id: Date.now().toString(),
                type: documentType,
                date: new Date().toISOString().split('T')[0],
                author: `${user.firstName} ${user.lastName}`
            },
            ...documentHistory
        ]);
        
        // Clear document content only after successful save
        setDocumentContent('');
    };
    
    const handlePrintDocument = () => {
        if (!documentContent.trim()) {
            toast.error('No document content to print');
            return;
        }
        
        toast.success('Document sent to printer');
    };
    
    return (
        <div className="container mx-auto p-4">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center">
                        <FileText className="mr-2" /> Medical Documentation
                    </CardTitle>
                    <CardDescription>
                        Create and manage patient medical records and documentation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-6">
                        <Input
                            placeholder="Search patient by name or ID number"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-md"
                        />
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? 'Searching...' : <Search className="mr-2" />}
                            Search
                        </Button>
                    </div>
                    
                    {selectedPatient && (
                        <div className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <UserIcon className="mr-2" />
                                        {selectedPatient.firstName} {selectedPatient.lastName}
                                    </CardTitle>
                                    <CardDescription>
                                        {Math.floor((Date.now() - new Date(selectedPatient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years • {selectedPatient.gender} • 
                                        {selectedPatient.address.city}, {selectedPatient.address.state}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="create" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="create">Create Document</TabsTrigger>
                                            <TabsTrigger value="history">Document History</TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="create" className="space-y-4">
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="documentType" className="text-right">
                                                        Document Type
                                                    </Label>
                                                    <Select
                                                        value={documentType}
                                                        onValueChange={handleDocumentTypeChange}
                                                    >
                                                        <SelectTrigger className="col-span-3">
                                                            <SelectValue placeholder="Select document type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="progress_note">Progress Note</SelectItem>
                                                            <SelectItem value="referral_letter">Referral Letter</SelectItem>
                                                            <SelectItem value="sick_note">Sick Note / Medical Certificate</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                
                                                <div className="grid grid-cols-4 items-start gap-4">
                                                    <Label htmlFor="documentContent" className="text-right pt-2">
                                                        Content
                                                    </Label>
                                                    <Textarea
                                                        id="documentContent"
                                                        className="col-span-3"
                                                        rows={15}
                                                        value={documentContent}
                                                        onChange={(e) => setDocumentContent(e.target.value)}
                                                    />
                                                </div>
                                                
                                                <div className="flex justify-end space-x-2 pt-4">
                                                    <Button variant="outline" onClick={handlePrintDocument}>
                                                        <Printer className="mr-2" /> Print
                                                    </Button>
                                                    <Button onClick={handleSaveDocument}>
                                                        <Save className="mr-2" /> Save Document
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>
                                        
                                        <TabsContent value="history">
                                            <div className="space-y-4">
                                                {documentHistory.length > 0 ? (
                                                    documentHistory.map((doc) => (
                                                        <Card key={doc.id} className="cursor-pointer hover:bg-gray-50">
                                                            <CardContent className="p-4 flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    <ClipboardList className="mr-3" />
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {doc.type === 'progress_note' ? 'Progress Note' : 
                                                                             doc.type === 'referral_letter' ? 'Referral Letter' : 
                                                                             'Sick Note / Medical Certificate'}
                                                                        </p>
                                                                        <p className="text-sm text-gray-500">
                                                                            <Calendar className="inline mr-1 h-3 w-3" /> {doc.date} • 
                                                                            <UserIcon className="inline mx-1 h-3 w-3" /> {doc.author}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="sm">
                                                                    View
                                                                </Button>
                                                            </CardContent>
                                                        </Card>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <ClipboardList className="mx-auto h-12 w-12 opacity-30" />
                                                        <p className="mt-2">No document history found</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Documentation;