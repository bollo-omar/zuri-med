import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
    User, FileText, Beaker, Clipboard, 
    FilePlus, Activity, Search, Calendar, Clock,
    AlertCircle, CheckCircle, XCircle, Plus, Upload
} from 'lucide-react';
import { 
    User as UserType, Patient, Appointment, AppointmentStatus, 
    UserRole, DiagnosticTest, DiagnosticTestStatus, DiagnosticTestType
} from '@/types';
import { 
    PatientService, AppointmentService
} from '@/lib/mockServices';
import { toast } from 'sonner';

interface DiagnosticTestingProps {
    user: UserType;
}

const DiagnosticTesting: React.FC<DiagnosticTestingProps> = ({ user }) => {
    const [tests, setTests] = useState<DiagnosticTest[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [testResult, setTestResult] = useState({
        result: '',
        notes: '',
        attachmentUrl: '',
        performedBy: `${user.firstName} ${user.lastName}`,
        performedDate: new Date().toISOString().split('T')[0]
    });

    // Common lab tests in Kenya
    const commonLabTests = [
        'Complete Blood Count (CBC)', 'Malaria Parasite Test', 'Urinalysis',
        'Blood Glucose', 'HIV Test', 'Liver Function Test', 'Renal Function Test',
        'Stool Analysis', 'Widal Test (Typhoid)', 'TB Test'
    ];

    // Common imaging tests in Kenya
    const commonImaging = [
        'X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'Echocardiogram'
    ];

    useEffect(() => {
        loadDiagnosticData();
    }, [activeTab]);

    const loadDiagnosticData = async () => {
        try {
            setLoading(true);
            // In a real app, this would be an API call
            // For now, using empty array - tests would come from API
            let testsData: DiagnosticTest[] = [];
            
            // Filter tests based on user role and specialization
            if (user.role === UserRole.LAB_TECHNICIAN) {
                testsData = testsData.filter(test => test.type === DiagnosticTestType.LAB);
            } else if (user.role === UserRole.PRACTITIONER && user.specialization === 'Radiology') {
                testsData = testsData.filter(test => test.type === DiagnosticTestType.IMAGING);
            }
            
            // Filter by tab
            if (activeTab === 'pending') {
                testsData = testsData.filter(test => test.status === DiagnosticTestStatus.ORDERED);
            } else if (activeTab === 'in_progress') {
                testsData = testsData.filter(test => test.status === DiagnosticTestStatus.IN_PROGRESS);
            } else if (activeTab === 'completed') {
                testsData = testsData.filter(test => test.status === DiagnosticTestStatus.COMPLETED);
            }
            
            setTests(testsData);
            
            // Get patients data
            const patientsResponse = await PatientService.getPatients(1, 100);
            if (patientsResponse.success) setPatients(patientsResponse.data.data);
        } catch (error) {
            toast.error('Failed to load diagnostic data');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = async (test: DiagnosticTest) => {
        try {
            // In a real app, this would be an API call
            const updatedTest = { ...test, status: DiagnosticTestStatus.IN_PROGRESS };
            // Update the test in the mock data
            const updatedTests = tests.map(t => t.id === test.id ? updatedTest : t);
            setTests(updatedTests);
            setSelectedTest(updatedTest);
            toast.success('Test marked as in progress');
        } catch (error) {
            toast.error('Failed to update test status');
        }
    };

    const handleCompleteTest = async () => {
        try {
            if (!selectedTest) return;
            
            // Validate test result
            if (!testResult.result) {
                toast.error('Please enter test result');
                return;
            }
            
            // In a real app, this would be an API call
            const updatedTest = { 
                ...selectedTest, 
                status: DiagnosticTestStatus.COMPLETED,
                result: testResult.result,
                notes: testResult.notes,
                attachmentUrl: testResult.attachmentUrl,
                performedBy: testResult.performedBy,
                performedDate: testResult.performedDate
            };
            
            // Update the test in the mock data
            const updatedTests = tests.map(t => t.id === selectedTest.id ? updatedTest : t);
            setTests(updatedTests);
            setShowResultDialog(false);
            toast.success('Test result saved');
            // Reset form after successful save
            setTestResult({
                result: '',
                notes: '',
                attachmentUrl: '',
                performedBy: `${user.firstName} ${user.lastName}`,
                performedDate: new Date().toISOString().split('T')[0]
            });
            setSelectedTest(null);
            loadDiagnosticData();
        } catch (error) {
            toast.error('Failed to save test result');
        }
    };

    const handleViewResult = (test: DiagnosticTest) => {
        setSelectedTest(test);
        setTestResult({
            result: test.result || '',
            notes: test.notes || '',
            attachmentUrl: test.attachmentUrl || '',
            performedBy: test.performedBy || `${user.firstName} ${user.lastName}`,
            performedDate: test.performedDate || new Date().toISOString().split('T')[0]
        });
        setShowResultDialog(true);
    };

    const getPatientName = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
    };

    const getTestTypeBadge = (type: DiagnosticTestType) => {
        switch (type) {
            case DiagnosticTestType.LAB:
                return <Badge className="bg-blue-500">Laboratory</Badge>;
            case DiagnosticTestType.IMAGING:
                return <Badge className="bg-purple-500">Imaging</Badge>;
            default:
                return <Badge>Unknown</Badge>;
        }
    };

    const getStatusBadge = (status: DiagnosticTestStatus) => {
        switch (status) {
            case DiagnosticTestStatus.ORDERED:
                return <Badge className="bg-yellow-500">Pending</Badge>;
            case DiagnosticTestStatus.IN_PROGRESS:
                return <Badge className="bg-indigo-500">In Progress</Badge>;
            case DiagnosticTestStatus.COMPLETED:
                return <Badge className="bg-green-700">Completed</Badge>;
            case DiagnosticTestStatus.CANCELLED:
                return <Badge className="bg-red-500">Cancelled</Badge>;
            default:
                return <Badge>Unknown</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Diagnostic Testing</CardTitle>
                    <CardDescription>Manage laboratory tests and imaging studies</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="pending" className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Test Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Ordered By</TableHead>
                                            <TableHead>Ordered Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4">Loading...</TableCell>
                                            </TableRow>
                                        ) : tests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4">No pending tests</TableCell>
                                            </TableRow>
                                        ) : (
                                            tests.map(test => (
                                                <TableRow key={test.id}>
                                                    <TableCell>{getPatientName(test.patientId)}</TableCell>
                                                    <TableCell>{test.name}</TableCell>
                                                    <TableCell>{getTestTypeBadge(test.type)}</TableCell>
                                                    <TableCell>{test.orderedBy}</TableCell>
                                                    <TableCell>{test.orderedDate}</TableCell>
                                                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleStartTest(test)}
                                                        >
                                                            Start Test
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="in_progress" className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Test Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Ordered By</TableHead>
                                            <TableHead>Ordered Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4">Loading...</TableCell>
                                            </TableRow>
                                        ) : tests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4">No tests in progress</TableCell>
                                            </TableRow>
                                        ) : (
                                            tests.map(test => (
                                                <TableRow key={test.id}>
                                                    <TableCell>{getPatientName(test.patientId)}</TableCell>
                                                    <TableCell>{test.name}</TableCell>
                                                    <TableCell>{getTestTypeBadge(test.type)}</TableCell>
                                                    <TableCell>{test.orderedBy}</TableCell>
                                                    <TableCell>{test.orderedDate}</TableCell>
                                                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedTest(test);
                                                                setTestResult({
                                                                    result: '',
                                                                    notes: '',
                                                                    attachmentUrl: '',
                                                                    performedBy: `${user.firstName} ${user.lastName}`,
                                                                    performedDate: new Date().toISOString().split('T')[0]
                                                                });
                                                                setShowResultDialog(true);
                                                            }}
                                                        >
                                                            Enter Results
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="completed" className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Test Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Performed By</TableHead>
                                            <TableHead>Performed Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4">Loading...</TableCell>
                                            </TableRow>
                                        ) : tests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4">No completed tests</TableCell>
                                            </TableRow>
                                        ) : (
                                            tests.map(test => (
                                                <TableRow key={test.id}>
                                                    <TableCell>{getPatientName(test.patientId)}</TableCell>
                                                    <TableCell>{test.name}</TableCell>
                                                    <TableCell>{getTestTypeBadge(test.type)}</TableCell>
                                                    <TableCell>{test.performedBy}</TableCell>
                                                    <TableCell>{test.performedDate}</TableCell>
                                                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewResult(test)}
                                                        >
                                                            View Results
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Test Result Dialog */}
            {selectedTest && (
                <Dialog open={showResultDialog} onOpenChange={(open) => {
                    setShowResultDialog(open);
                    // Don't reset form when dialog closes - preserve user input
                    // Form will be reset after successful save
                }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedTest.status === DiagnosticTestStatus.COMPLETED ? 
                                    'Test Results' : 'Enter Test Results'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedTest.name} for {getPatientName(selectedTest.patientId)}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Test Type</Label>
                                    <div className="mt-1">{getTestTypeBadge(selectedTest.type)}</div>
                                </div>
                                <div>
                                    <Label>Ordered By</Label>
                                    <div className="mt-1">{selectedTest.orderedBy}</div>
                                </div>
                                <div>
                                    <Label>Ordered Date</Label>
                                    <div className="mt-1">{selectedTest.orderedDate}</div>
                                </div>
                                <div>
                                    <Label>Clinical Information</Label>
                                    <div className="mt-1">{selectedTest.clinicalInfo || 'None provided'}</div>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="result">Test Result</Label>
                                    <Textarea
                                        id="result"
                                        value={testResult.result}
                                        onChange={(e) => setTestResult(prev => ({ ...prev, result: e.target.value }))}
                                        placeholder="Enter test results"
                                        className="min-h-[100px]"
                                        disabled={selectedTest.status === DiagnosticTestStatus.COMPLETED}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={testResult.notes}
                                        onChange={(e) => setTestResult(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Enter any additional notes"
                                        disabled={selectedTest.status === DiagnosticTestStatus.COMPLETED}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="attachment">Attachment URL</Label>
                                    <div className="flex space-x-2">
                                        <Input
                                            id="attachment"
                                            value={testResult.attachmentUrl}
                                            onChange={(e) => setTestResult(prev => ({ ...prev, attachmentUrl: e.target.value }))}
                                            placeholder="Enter URL to attachment (e.g., image)"
                                            disabled={selectedTest.status === DiagnosticTestStatus.COMPLETED}
                                        />
                                        {selectedTest.status !== DiagnosticTestStatus.COMPLETED && (
                                            <Button variant="outline" size="icon">
                                                <Upload className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="performedBy">Performed By</Label>
                                        <Input
                                            id="performedBy"
                                            value={testResult.performedBy}
                                            onChange={(e) => setTestResult(prev => ({ ...prev, performedBy: e.target.value }))}
                                            disabled={selectedTest.status === DiagnosticTestStatus.COMPLETED}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="performedDate">Performed Date</Label>
                                        <Input
                                            id="performedDate"
                                            type="date"
                                            value={testResult.performedDate}
                                            onChange={(e) => setTestResult(prev => ({ ...prev, performedDate: e.target.value }))}
                                            disabled={selectedTest.status === DiagnosticTestStatus.COMPLETED}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
                                {selectedTest.status === DiagnosticTestStatus.COMPLETED ? 'Close' : 'Cancel'}
                            </Button>
                            {selectedTest.status !== DiagnosticTestStatus.COMPLETED && (
                                <Button onClick={handleCompleteTest}>
                                    Save Results
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default DiagnosticTesting;