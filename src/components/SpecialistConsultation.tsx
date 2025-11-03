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
    User, FileText, Stethoscope, Clipboard, 
    FilePlus, Activity, Search, Calendar, Clock,
    AlertCircle, CheckCircle, XCircle, Plus
} from 'lucide-react';
import { 
    User as UserType, Patient, Appointment, AppointmentStatus, 
    TreatmentRecord, VitalSigns, TriageAssessment, UserRole 
} from '@/types';
import { 
    PatientService, AppointmentService, TriageService, 
    mockPractitioners, mockTreatmentRecords 
} from '@/lib/mockServices';
import { toast } from 'sonner';

interface SpecialistConsultationProps {
    user: UserType;
}

interface ConsultationNotes {
    patientId: string;
    appointmentId: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    diagnosis: string[];
    followUpNeeded: boolean;
    followUpTimeframe: string;
    labTests: string[];
    imaging: string[];
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
    }[];
}

const SpecialistConsultation: React.FC<SpecialistConsultationProps> = ({ user }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [triageData, setTriageData] = useState<TriageAssessment | null>(null);
    const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null);
    const [showConsultationDialog, setShowConsultationDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('waiting');

    // Consultation notes form
    const [consultationNotes, setConsultationNotes] = useState<ConsultationNotes>({
        patientId: '',
        appointmentId: '',
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        diagnosis: [],
        followUpNeeded: false,
        followUpTimeframe: '',
        labTests: [],
        imaging: [],
        medications: []
    });

    // Common Kenyan diagnoses
    const commonDiagnoses = [
        'Malaria', 'Upper Respiratory Tract Infection', 'Hypertension', 
        'Diabetes Mellitus', 'Urinary Tract Infection', 'Pneumonia',
        'Gastroenteritis', 'HIV/AIDS', 'Tuberculosis', 'Typhoid Fever'
    ];

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
        loadConsultationData();
    }, [activeTab]);

    const loadConsultationData = async () => {
        try {
            setLoading(true);
            const [appointmentsResponse, patientsResponse] = await Promise.all([
                AppointmentService.getAppointments(),
                PatientService.getPatients(1, 100)
            ]);

            let appointmentsData = appointmentsResponse.success ? appointmentsResponse.data : [];
            
            // Filter appointments based on user role and status
            if (user.role === UserRole.PRACTITIONER) {
                // Practitioners see only their appointments
                appointmentsData = appointmentsData.filter(appt => appt.practitionerId === user.id);
            }
            
            // Filter by tab
            if (activeTab === 'waiting') {
                appointmentsData = appointmentsData.filter(
                    appt => appt.status === AppointmentStatus.WAITING || 
                           appt.status === AppointmentStatus.CHECKED_IN
                );
            } else if (activeTab === 'in_treatment') {
                appointmentsData = appointmentsData.filter(
                    appt => appt.status === AppointmentStatus.IN_TREATMENT
                );
            } else if (activeTab === 'completed') {
                appointmentsData = appointmentsData.filter(
                    appt => appt.status === AppointmentStatus.COMPLETED
                );
            }
            
            setAppointments(appointmentsData);
            if (patientsResponse.success) setPatients(patientsResponse.data.data);
        } catch (error) {
            toast.error('Failed to load consultation data');
        } finally {
            setLoading(false);
        }
    };

    const handleStartConsultation = async (appointment: Appointment) => {
        try {
            // Update appointment status
            const response = await AppointmentService.updateAppointmentStatus(
                appointment.id, 
                AppointmentStatus.IN_TREATMENT
            );
            
            if (response.success) {
                // Get patient data
                const patient = patients.find(p => p.id === appointment.patientId);
                if (patient) {
                    setSelectedPatient(patient);
                }
                
                // Get triage data if available
                const triageResponse = await TriageService.getTriageAssessment(appointment.id);
                if (triageResponse.success && triageResponse.data) {
                    setTriageData(triageResponse.data);
                    if (triageResponse.data.vitalSigns) {
                        setVitalSigns(triageResponse.data.vitalSigns);
                    }
                }
                
                // Initialize consultation notes
                setConsultationNotes({
                    patientId: appointment.patientId,
                    appointmentId: appointment.id,
                    subjective: triageResponse.success && triageResponse.data ? 
                        `Chief Complaint: ${triageResponse.data.chiefComplaint}\n` +
                        `Symptoms: ${triageResponse.data.symptoms.join(', ')}\n` +
                        `Pain Level: ${triageResponse.data.painLevel}/10` : '',
                    objective: '',
                    assessment: '',
                    plan: '',
                    diagnosis: [],
                    followUpNeeded: false,
                    followUpTimeframe: '',
                    labTests: [],
                    imaging: [],
                    medications: []
                });
                
                setSelectedAppointment(appointment);
                setShowConsultationDialog(true);
                
                toast.success('Consultation started');
                loadConsultationData();
            } else {
                toast.error('Failed to start consultation');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleCompleteConsultation = async () => {
        try {
            if (!selectedAppointment) return;
            
            // Validate consultation notes
            if (!consultationNotes.assessment || !consultationNotes.plan) {
                toast.error('Please complete assessment and plan before finishing consultation');
                return;
            }
            
            // Update appointment status
            const response = await AppointmentService.updateAppointmentStatus(
                selectedAppointment.id, 
                AppointmentStatus.COMPLETED
            );
            
            if (response.success) {
                // Save treatment record
                // In a real app, this would call an API to save the record
                
                toast.success('Consultation completed');
                setShowConsultationDialog(false);
                // Reset consultation notes after successful completion
                setConsultationNotes({
                    patientId: '',
                    appointmentId: '',
                    subjective: '',
                    objective: '',
                    assessment: '',
                    plan: '',
                    diagnosis: [],
                    followUpNeeded: false,
                    followUpTimeframe: '',
                    labTests: [],
                    imaging: [],
                    medications: []
                });
                setSelectedAppointment(null);
                setSelectedPatient(null);
                loadConsultationData();
            } else {
                toast.error('Failed to complete consultation');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleAddMedication = () => {
        setConsultationNotes(prev => ({
            ...prev,
            medications: [
                ...prev.medications,
                {
                    name: '',
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: ''
                }
            ]
        }));
    };

    const handleUpdateMedication = (index: number, field: string, value: string) => {
        setConsultationNotes(prev => {
            const updatedMedications = [...prev.medications];
            updatedMedications[index] = {
                ...updatedMedications[index],
                [field]: value
            };
            return {
                ...prev,
                medications: updatedMedications
            };
        });
    };

    const handleRemoveMedication = (index: number) => {
        setConsultationNotes(prev => ({
            ...prev,
            medications: prev.medications.filter((_, i) => i !== index)
        }));
    };

    const getPatientName = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
    };

    const getPractitionerName = (practitionerId: string) => {
        const practitioner = mockPractitioners.find(p => p.id === practitionerId);
        return practitioner ? `Dr. ${practitioner.firstName} ${practitioner.lastName}` : 'Unknown Practitioner';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Specialist Consultation</CardTitle>
                    <CardDescription>Manage patient consultations and treatment</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="waiting" value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="waiting">Waiting</TabsTrigger>
                            <TabsTrigger value="in_treatment">In Treatment</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="waiting" className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Appointment Time</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                                            </TableRow>
                                        ) : appointments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">No patients waiting</TableCell>
                                            </TableRow>
                                        ) : (
                                            appointments.map(appointment => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>{getPatientName(appointment.patientId)}</TableCell>
                                                    <TableCell>
                                                        {appointment.scheduledDate} at {appointment.scheduledTime}
                                                    </TableCell>
                                                    <TableCell>{appointment.appointmentType}</TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-yellow-500">Waiting</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleStartConsultation(appointment)}
                                                        >
                                                            Start Consultation
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="in_treatment" className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Started At</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                                            </TableRow>
                                        ) : appointments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">No active consultations</TableCell>
                                            </TableRow>
                                        ) : (
                                            appointments.map(appointment => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>{getPatientName(appointment.patientId)}</TableCell>
                                                    <TableCell>
                                                        {appointment.treatmentStartTime || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell>{appointment.appointmentType}</TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-indigo-500">In Treatment</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleStartConsultation(appointment)}
                                                        >
                                                            Continue Consultation
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
                                            <TableHead>Completed At</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                                            </TableRow>
                                        ) : appointments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">No completed consultations</TableCell>
                                            </TableRow>
                                        ) : (
                                            appointments.map(appointment => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>{getPatientName(appointment.patientId)}</TableCell>
                                                    <TableCell>
                                                        {appointment.treatmentEndTime || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell>{appointment.appointmentType}</TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-green-700">Completed</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleStartConsultation(appointment)}
                                                        >
                                                            View Details
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

            {/* Consultation Dialog */}
            {selectedPatient && selectedAppointment && (
                <Dialog open={showConsultationDialog} onOpenChange={(open) => {
                    setShowConsultationDialog(open);
                    // Don't reset consultation notes when dialog closes - preserve user input
                }}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Patient Consultation</DialogTitle>
                            <DialogDescription>
                                {selectedPatient.firstName} {selectedPatient.lastName} - {selectedAppointment.appointmentType}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Patient Information */}
                            <Card className="md:col-span-1">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-lg">Patient Information</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 space-y-2 text-sm">
                                    <div>
                                        <span className="font-semibold">Name:</span> {selectedPatient.firstName} {selectedPatient.lastName}
                                    </div>
                                    <div>
                                        <span className="font-semibold">DOB:</span> {selectedPatient.dateOfBirth}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Gender:</span> {selectedPatient.gender}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Phone:</span> {selectedPatient.phone}
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div>
                                        <span className="font-semibold">Allergies:</span>
                                        <div className="mt-1">
                                            {selectedPatient.medicalHistory.allergies.length > 0 ? (
                                                <ul className="list-disc pl-4">
                                                    {selectedPatient.medicalHistory.allergies.map((allergy, index) => (
                                                        <li key={index}>{allergy}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-muted-foreground">No known allergies</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <span className="font-semibold">Current Medications:</span>
                                        <div className="mt-1">
                                            {selectedPatient.medicalHistory.medications.length > 0 ? (
                                                <ul className="list-disc pl-4">
                                                    {selectedPatient.medicalHistory.medications.map((med) => (
                                                        <li key={med.id}>{med.name} {med.dosage} {med.frequency}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-muted-foreground">No current medications</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <span className="font-semibold">Medical Conditions:</span>
                                        <div className="mt-1">
                                            {selectedPatient.medicalHistory.conditions.length > 0 ? (
                                                <ul className="list-disc pl-4">
                                                    {selectedPatient.medicalHistory.conditions.map((condition, index) => (
                                                        <li key={index}>{condition}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-muted-foreground">No known conditions</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* Vital Signs */}
                            <Card className="md:col-span-2">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-lg">Vital Signs</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2">
                                    {vitalSigns ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">Temperature</div>
                                                <div className="text-lg">{vitalSigns.temperature || '--'} °C</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">Blood Pressure</div>
                                                <div className="text-lg">
                                                    {vitalSigns.bloodPressureSystolic || '--'}/{vitalSigns.bloodPressureDiastolic || '--'} mmHg
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">Heart Rate</div>
                                                <div className="text-lg">{vitalSigns.heartRate || '--'} bpm</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">Respiratory Rate</div>
                                                <div className="text-lg">{vitalSigns.respiratoryRate || '--'} breaths/min</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">Oxygen Saturation</div>
                                                <div className="text-lg">{vitalSigns.oxygenSaturation || '--'}%</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">Weight</div>
                                                <div className="text-lg">{vitalSigns.weight || '--'} kg</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">Height</div>
                                                <div className="text-lg">{vitalSigns.height || '--'} cm</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">BMI</div>
                                                <div className="text-lg">{vitalSigns.bmi || '--'}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground">
                                            No vital signs recorded
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            
                            {/* SOAP Notes */}
                            <Card className="md:col-span-3">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-lg">Consultation Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subjective">Subjective (Patient's complaints and history)</Label>
                                        <Textarea
                                            id="subjective"
                                            value={consultationNotes.subjective}
                                            onChange={(e) => setConsultationNotes(prev => ({ ...prev, subjective: e.target.value }))}
                                            placeholder="Enter patient's complaints, symptoms, and relevant history"
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="objective">Objective (Examination findings)</Label>
                                        <Textarea
                                            id="objective"
                                            value={consultationNotes.objective}
                                            onChange={(e) => setConsultationNotes(prev => ({ ...prev, objective: e.target.value }))}
                                            placeholder="Enter physical examination findings and observations"
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="assessment">Assessment (Diagnosis)</Label>
                                        <Textarea
                                            id="assessment"
                                            value={consultationNotes.assessment}
                                            onChange={(e) => setConsultationNotes(prev => ({ ...prev, assessment: e.target.value }))}
                                            placeholder="Enter your assessment and diagnosis"
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Common Diagnoses</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {commonDiagnoses.map((diagnosis, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`diagnosis-${index}`}
                                                        checked={consultationNotes.diagnosis.includes(diagnosis)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setConsultationNotes(prev => ({
                                                                    ...prev,
                                                                    diagnosis: [...prev.diagnosis, diagnosis]
                                                                }));
                                                            } else {
                                                                setConsultationNotes(prev => ({
                                                                    ...prev,
                                                                    diagnosis: prev.diagnosis.filter(d => d !== diagnosis)
                                                                }));
                                                            }
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <Label htmlFor={`diagnosis-${index}`} className="text-sm">
                                                        {diagnosis}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="plan">Plan (Treatment plan)</Label>
                                        <Textarea
                                            id="plan"
                                            value={consultationNotes.plan}
                                            onChange={(e) => setConsultationNotes(prev => ({ ...prev, plan: e.target.value }))}
                                            placeholder="Enter treatment plan and recommendations"
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* Diagnostic Tests */}
                            <Card className="md:col-span-3">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-lg">Diagnostic Tests</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Laboratory Tests</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {commonLabTests.map((test, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`lab-${index}`}
                                                        checked={consultationNotes.labTests.includes(test)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setConsultationNotes(prev => ({
                                                                    ...prev,
                                                                    labTests: [...prev.labTests, test]
                                                                }));
                                                            } else {
                                                                setConsultationNotes(prev => ({
                                                                    ...prev,
                                                                    labTests: prev.labTests.filter(t => t !== test)
                                                                }));
                                                            }
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <Label htmlFor={`lab-${index}`} className="text-sm">
                                                        {test}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Imaging</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {commonImaging.map((image, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`imaging-${index}`}
                                                        checked={consultationNotes.imaging.includes(image)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setConsultationNotes(prev => ({
                                                                    ...prev,
                                                                    imaging: [...prev.imaging, image]
                                                                }));
                                                            } else {
                                                                setConsultationNotes(prev => ({
                                                                    ...prev,
                                                                    imaging: prev.imaging.filter(i => i !== image)
                                                                }));
                                                            }
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <Label htmlFor={`imaging-${index}`} className="text-sm">
                                                        {image}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* Medications */}
                            <Card className="md:col-span-3">
                                <CardHeader className="py-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Medications</CardTitle>
                                        <Button size="sm" variant="outline" onClick={handleAddMedication}>
                                            <Plus className="h-4 w-4 mr-1" /> Add Medication
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-2 space-y-4">
                                    {consultationNotes.medications.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground">
                                            No medications prescribed
                                        </div>
                                    ) : (
                                        consultationNotes.medications.map((medication, index) => (
                                            <div key={index} className="border rounded-md p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-medium">Medication #{index + 1}</h4>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        onClick={() => handleRemoveMedication(index)}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`med-name-${index}`}>Medication Name</Label>
                                                        <Input
                                                            id={`med-name-${index}`}
                                                            value={medication.name}
                                                            onChange={(e) => handleUpdateMedication(index, 'name', e.target.value)}
                                                            placeholder="Medication name"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`med-dosage-${index}`}>Dosage</Label>
                                                        <Input
                                                            id={`med-dosage-${index}`}
                                                            value={medication.dosage}
                                                            onChange={(e) => handleUpdateMedication(index, 'dosage', e.target.value)}
                                                            placeholder="e.g., 500mg"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`med-frequency-${index}`}>Frequency</Label>
                                                        <Input
                                                            id={`med-frequency-${index}`}
                                                            value={medication.frequency}
                                                            onChange={(e) => handleUpdateMedication(index, 'frequency', e.target.value)}
                                                            placeholder="e.g., Twice daily"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`med-duration-${index}`}>Duration</Label>
                                                        <Input
                                                            id={`med-duration-${index}`}
                                                            value={medication.duration}
                                                            onChange={(e) => handleUpdateMedication(index, 'duration', e.target.value)}
                                                            placeholder="e.g., 7 days"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-1 md:col-span-2">
                                                        <Label htmlFor={`med-instructions-${index}`}>Special Instructions</Label>
                                                        <Input
                                                            id={`med-instructions-${index}`}
                                                            value={medication.instructions}
                                                            onChange={(e) => handleUpdateMedication(index, 'instructions', e.target.value)}
                                                            placeholder="e.g., Take with food"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                            
                            {/* Follow-up */}
                            <Card className="md:col-span-3">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-lg">Follow-up</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="follow-up"
                                            checked={consultationNotes.followUpNeeded}
                                            onChange={(e) => setConsultationNotes(prev => ({ 
                                                ...prev, 
                                                followUpNeeded: e.target.checked 
                                            }))}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="follow-up">Follow-up needed</Label>
                                    </div>
                                    
                                    {consultationNotes.followUpNeeded && (
                                        <div className="space-y-2">
                                            <Label htmlFor="follow-up-timeframe">Timeframe</Label>
                                            <Select
                                                value={consultationNotes.followUpTimeframe}
                                                onValueChange={(value) => setConsultationNotes(prev => ({ 
                                                    ...prev, 
                                                    followUpTimeframe: value 
                                                }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select timeframe" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1_week">1 week</SelectItem>
                                                    <SelectItem value="2_weeks">2 weeks</SelectItem>
                                                    <SelectItem value="1_month">1 month</SelectItem>
                                                    <SelectItem value="3_months">3 months</SelectItem>
                                                    <SelectItem value="6_months">6 months</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" onClick={() => setShowConsultationDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCompleteConsultation}>
                                Complete Consultation
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default SpecialistConsultation;