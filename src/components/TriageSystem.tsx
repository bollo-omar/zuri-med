import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { Progress } from '@/components/ui/progress';
import {
    Heart, AlertTriangle, Clock,
    User as UserIcon, Stethoscope, Eye, CheckCircle, XCircle, Timer,
    ArrowUp, ArrowDown, Minus, Plus, Save, RefreshCw
} from 'lucide-react';
import {
    TriageAssessment, VitalSigns, QueueItem, Patient, User,
    TriagePriority, AppointmentStatus, UserRole
} from '@/types';
import {
    TriageService, QueueService, PatientService,
    mockPatients, mockVitalSigns
} from '@/lib/mockServices';
import { toast } from 'sonner';

interface TriageSystemProps {
    user: User;
}

interface TriageAssessmentForm {
    patientId: string;
    appointmentId: string;
    priority: TriagePriority;
    chiefComplaint: string;
    symptoms: string[];
    painLevel: number;
    assessmentNotes: string;
    estimatedWaitTime: number;
    vitalSigns: VitalSigns;
    triageNurse?: string;
}

const TriageSystem: React.FC<TriageSystemProps> = ({ user }) => {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    
    const [showAssessment, setShowAssessment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);



    const loadTriageData = useCallback(async () => {
        try {
            setRefreshing(true);
            const [queueResponse, patientsResponse] = await Promise.all([
                QueueService.getQueue(),
                PatientService.getPatients(1, 100)
            ]);

            const queueData = queueResponse.success ? queueResponse.data : [];

            // Filter queue based on user role
            // Triage nurses and admin see all queue items (already protected at route level)
            // But we ensure only authorized roles can access
            if (user.role === UserRole.TRIAGE_NURSE || user.role === UserRole.ADMIN) {
                setQueue(queueData);
            } else {
                // Should not reach here due to route protection, but safety check
                setQueue([]);
            }

            if (patientsResponse.success) setPatients(patientsResponse.data.data);
        } catch (error) {
            toast.error('Failed to load triage data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user.role]);

    useEffect(() => {
        loadTriageData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadTriageData, 30000);
        return () => clearInterval(interval);
    }, [loadTriageData]);

    const getPriorityColor = (priority: TriagePriority) => {
        switch (priority) {
            case TriagePriority.CRITICAL: return 'bg-red-500 text-white border-red-500';
            case TriagePriority.URGENT: return 'bg-orange-500 text-white border-orange-500';
            case TriagePriority.SEMI_URGENT: return 'bg-yellow-500 text-black border-yellow-500';
            case TriagePriority.NON_URGENT: return 'bg-green-500 text-white border-green-500';
            default: return 'bg-gray-500 text-white border-gray-500';
        }
    };

    const getPriorityLabel = (priority: TriagePriority) => {
        switch (priority) {
            case TriagePriority.CRITICAL: return 'Critical';
            case TriagePriority.URGENT: return 'Urgent';
            case TriagePriority.SEMI_URGENT: return 'Semi-Urgent';
            case TriagePriority.NON_URGENT: return 'Non-Urgent';
            default: return 'Unknown';
        }
    };

    const getPriorityDescription = (priority: TriagePriority) => {
        switch (priority) {
            case TriagePriority.CRITICAL: return 'Life-threatening condition requiring immediate attention';
            case TriagePriority.URGENT: return 'Serious condition requiring prompt medical care';
            case TriagePriority.SEMI_URGENT: return 'Condition requiring medical attention within 30-60 minutes';
            case TriagePriority.NON_URGENT: return 'Stable condition that can wait for routine care';
            default: return 'Priority not determined';
        }
    };

    const getStatusIcon = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.CHECKED_IN: return <UserIcon className="w-4 h-4 text-blue-500" />;
            case AppointmentStatus.IN_TRIAGE: return <Heart className="w-4 h-4 text-orange-500" />;
            case AppointmentStatus.WAITING: return <Clock className="w-4 h-4 text-yellow-500" />;
            case AppointmentStatus.IN_TREATMENT: return <Stethoscope className="w-4 h-4 text-green-500" />;
            case AppointmentStatus.COMPLETED: return <CheckCircle className="w-4 h-4 text-green-600" />;
            default: return <Timer className="w-4 h-4 text-gray-500" />;
        }
    };

    const TriageAssessmentDialog = () => {
        const [assessment, setAssessment] = useState<TriageAssessmentForm>({
            patientId: selectedPatient?.id || '',
            appointmentId: '', // Would be determined from context
            priority: TriagePriority.NON_URGENT,
            chiefComplaint: '',
            symptoms: [],
            painLevel: 0,
            assessmentNotes: '',
            estimatedWaitTime: 30,
            vitalSigns: {
                temperature: undefined,
                bloodPressureSystolic: undefined,
                bloodPressureDiastolic: undefined,
                heartRate: undefined,
                respiratoryRate: undefined,
                oxygenSaturation: undefined,
                weight: undefined,
                height: undefined
            }
        });

        const [symptomInput, setSymptomInput] = useState('');
        const [shouldResetAssessment, setShouldResetAssessment] = useState(false);
        
        // Only reset form when patient changes or after successful submission
        useEffect(() => {
            if (selectedPatient && selectedPatient.id !== assessment.patientId && !shouldResetAssessment) {
                setAssessment({
                    patientId: selectedPatient.id,
                    appointmentId: '',
                    priority: TriagePriority.NON_URGENT,
                    chiefComplaint: '',
                    symptoms: [],
                    painLevel: 0,
                    assessmentNotes: '',
                    estimatedWaitTime: 30,
                    vitalSigns: {
                        temperature: undefined,
                        bloodPressureSystolic: undefined,
                        bloodPressureDiastolic: undefined,
                        heartRate: undefined,
                        respiratoryRate: undefined,
                        oxygenSaturation: undefined,
                        weight: undefined,
                        height: undefined
                    }
                });
            }
        }, [selectedPatient?.id]);

        const handleAddSymptom = () => {
            if (symptomInput.trim()) {
                setAssessment({
                    ...assessment,
                    symptoms: [...assessment.symptoms, symptomInput.trim()]
                });
                setSymptomInput('');
            }
        };

        const handleRemoveSymptom = (index: number) => {
            const newSymptoms = [...assessment.symptoms];
            newSymptoms.splice(index, 1);
            setAssessment({ ...assessment, symptoms: newSymptoms });
        };

        const calculateBMI = () => {
            const { weight, height } = assessment.vitalSigns;
            if (weight && height) {
                const heightInMeters = (height * 2.54) / 100;
                const weightInKg = weight * 0.453592;
                return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
            }
            return null;
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            try {
                // Calculate BMI if height and weight are provided
                const vitalSigns = { ...assessment.vitalSigns };
                const bmi = calculateBMI();
                if (bmi) {
                    vitalSigns.bmi = parseFloat(bmi);
                }

                const assessmentData: Omit<TriageAssessment, 'id' | 'assessedAt'> = {
                    ...assessment,
                    vitalSigns,
                    appointmentId: `appt-${selectedPatient?.id}-${Date.now()}`,
                    triageNurse: user.id
                };

                const response = await TriageService.createAssessment(assessmentData);
                if (response.success) {
                    toast.success('Triage assessment completed successfully');
                    setShouldResetAssessment(true);
                    setShowAssessment(false);
                    loadTriageData();
                    // Reset form after a brief delay to allow dialog to close
                    setTimeout(() => {
                        setAssessment({
                            patientId: selectedPatient?.id || '',
                            appointmentId: '',
                            priority: TriagePriority.NON_URGENT,
                            chiefComplaint: '',
                            symptoms: [],
                            painLevel: 0,
                            assessmentNotes: '',
                            estimatedWaitTime: 30,
                            vitalSigns: {
                                temperature: undefined,
                                bloodPressureSystolic: undefined,
                                bloodPressureDiastolic: undefined,
                                heartRate: undefined,
                                respiratoryRate: undefined,
                                oxygenSaturation: undefined,
                                weight: undefined,
                                height: undefined
                            }
                        });
                        setSymptomInput('');
                        setShouldResetAssessment(false);
                    }, 100);
                }
            } catch (error) {
                toast.error('Failed to complete triage assessment');
            }
        };

        return (
            <Dialog open={showAssessment} onOpenChange={(open) => {
                setShowAssessment(open);
                // Only reset if user explicitly cancels and form wasn't successfully submitted
                if (!open && !shouldResetAssessment) {
                    // Don't reset - preserve form data in case user reopens
                }
            }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Triage Assessment</DialogTitle>
        <DialogDescription>
        Complete triage assessment for {selectedPatient?.firstName} {selectedPatient?.lastName}
        </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="assessment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
        <TabsTrigger value="priority">Priority & Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="assessment" className="space-y-4">
        <div>
            <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
        <Textarea
        id="chiefComplaint"
        required
        placeholder="Primary reason for visit"
        value={assessment.chiefComplaint}
        onChange={(e) => setAssessment({...assessment, chiefComplaint: e.target.value})}
        />
        </div>

        <div>
        <Label>Symptoms</Label>
        <div className="flex space-x-2 mb-2">
        <Input
            placeholder="Add symptom"
        value={symptomInput}
        onChange={(e) => setSymptomInput(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSymptom();
            }
        }}
        />
        <Button type="button" onClick={handleAddSymptom}>
        <Plus className="w-4 h-4" />
            </Button>
            </div>
            <div className="flex flex-wrap gap-2">
            {assessment.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveSymptom(index)}>
        {symptom} <XCircle className="w-3 h-3 ml-1" />
            </Badge>
    ))}
        </div>
        </div>

        <div>
        <Label htmlFor="painLevel">Pain Level (0-10)</Label>
        <div className="flex items-center space-x-4">
        <Select
            value={assessment.painLevel.toString()}
        onValueChange={(value) => setAssessment({...assessment, painLevel: parseInt(value)})}
    >
        <SelectTrigger className="w-32">
        <SelectValue placeholder="0" />
            </SelectTrigger>
            <SelectContent>
            {[0,1,2,3,4,5,6,7,8,9,10].map(level => (
            <SelectItem key={level} value={level.toString()}>
            {level}
            </SelectItem>
    ))}
        </SelectContent>
        </Select>
        <div className="flex-1">
        <Progress value={assessment.painLevel * 10} className="h-2" />
            </div>
            <span className="text-sm text-gray-600 w-16">
            {assessment.painLevel === 0 ? 'No pain' :
                    assessment.painLevel <= 3 ? 'Mild' :
                        assessment.painLevel <= 6 ? 'Moderate' : 'Severe'}
            </span>
            </div>
            </div>
            </TabsContent>

            <TabsContent value="vitals" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="temperature">Temperature (°F)</Label>
        <Input
        id="temperature"
        type="number"
        step="0.1"
        placeholder="98.6"
        value={assessment.vitalSigns.temperature || ''}
        onChange={(e) => setAssessment({
            ...assessment,
            vitalSigns: {...assessment.vitalSigns, temperature: parseFloat(e.target.value)}
        })}
        />
        </div>
        <div>
        <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
        <Input
        id="heartRate"
        type="number"
        placeholder="72"
        value={assessment.vitalSigns.heartRate || ''}
        onChange={(e) => setAssessment({
            ...assessment,
            vitalSigns: {...assessment.vitalSigns, heartRate: parseInt(e.target.value)}
        })}
        />
        </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="systolic">Blood Pressure - Systolic</Label>
        <Input
        id="systolic"
        type="number"
        placeholder="120"
        value={assessment.vitalSigns.bloodPressureSystolic || ''}
        onChange={(e) => setAssessment({
            ...assessment,
            vitalSigns: {...assessment.vitalSigns, bloodPressureSystolic: parseInt(e.target.value)}
        })}
        />
        </div>
        <div>
        <Label htmlFor="diastolic">Blood Pressure - Diastolic</Label>
        <Input
        id="diastolic"
        type="number"
        placeholder="80"
        value={assessment.vitalSigns.bloodPressureDiastolic || ''}
        onChange={(e) => setAssessment({
            ...assessment,
            vitalSigns: {...assessment.vitalSigns, bloodPressureDiastolic: parseInt(e.target.value)}
        })}
        />
        </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="respiratory">Respiratory Rate</Label>
        <Input
        id="respiratory"
        type="number"
        placeholder="16"
        value={assessment.vitalSigns.respiratoryRate || ''}
        onChange={(e) => setAssessment({
            ...assessment,
            vitalSigns: {...assessment.vitalSigns, respiratoryRate: parseInt(e.target.value)}
        })}
        />
        </div>
        <div>
        <Label htmlFor="oxygen">Oxygen Saturation (%)</Label>
        <Input
        id="oxygen"
        type="number"
        placeholder="98"
        value={assessment.vitalSigns.oxygenSaturation || ''}
        onChange={(e) => setAssessment({
            ...assessment,
            vitalSigns: {...assessment.vitalSigns, oxygenSaturation: parseInt(e.target.value)}
        })}
        />
        </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
        <div>
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
        id="weight"
        type="number"
        placeholder="150"
        value={assessment.vitalSigns.weight || ''}
        onChange={(e) => setAssessment({
            ...assessment,
            vitalSigns: {...assessment.vitalSigns, weight: parseInt(e.target.value)}
        })}
        />
        </div>
        <div>
        <Label htmlFor="height">Height (inches)</Label>
            <Input
        id="height"
        type="number"
        placeholder="68"
        value={assessment.vitalSigns.height || ''}
        onChange={(e) => setAssessment({
            ...assessment,
            vitalSigns: {...assessment.vitalSigns, height: parseInt(e.target.value)}
        })}
        />
        </div>
        <div>
        <Label>BMI</Label>
        <div className="h-10 flex items-center px-3 bg-gray-50 rounded-md text-sm">
            {calculateBMI() || 'N/A'}
        </div>
        </div>
        </div>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
            <div>
                <Label>Triage Priority *</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
            {Object.values(TriagePriority).map((priority) => (
                    <div
                        key={priority}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    assessment.priority === priority
                        ? getPriorityColor(priority)
                        : 'border-gray-200 hover:border-gray-300'
                }`}
        onClick={() => setAssessment({...assessment, priority: priority})}
    >
        <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">{getPriorityLabel(priority)}</span>
        {priority === TriagePriority.CRITICAL && <AlertTriangle className="w-5 h-5" />}
        {priority === TriagePriority.URGENT && <ArrowUp className="w-5 h-5" />}
        {priority === TriagePriority.SEMI_URGENT && <Minus className="w-5 h-5" />}
        {priority === TriagePriority.NON_URGENT && <ArrowDown className="w-5 h-5" />}
        </div>
        <p className="text-xs opacity-80">
            {getPriorityDescription(priority)}
            </p>
            </div>
    ))}
        </div>
        </div>

        <div>
        <Label htmlFor="estimatedWaitTime">Estimated Wait Time (minutes)</Label>
        <Select
        value={assessment.estimatedWaitTime.toString()}
        onValueChange={(value) => setAssessment({...assessment, estimatedWaitTime: parseInt(value)})}
    >
        <SelectTrigger>
            <SelectValue placeholder="30" />
        </SelectTrigger>
        <SelectContent>
        <SelectItem value="5">5 minutes</SelectItem>
        <SelectItem value="15">15 minutes</SelectItem>
        <SelectItem value="30">30 minutes</SelectItem>
        <SelectItem value="45">45 minutes</SelectItem>
        <SelectItem value="60">60 minutes</SelectItem>
        <SelectItem value="90">90 minutes</SelectItem>
        </SelectContent>
        </Select>
        </div>

        <div>
        <Label htmlFor="assessmentNotes">Assessment Notes</Label>
        <Textarea
        id="assessmentNotes"
        placeholder="Additional clinical observations and notes"
        rows={4}
        value={assessment.assessmentNotes}
        onChange={(e) => setAssessment({...assessment, assessmentNotes: e.target.value})}
        />
        </div>
        </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => setShowAssessment(false)}>
        Cancel
        </Button>
        <Button type="submit">
        <Save className="w-4 h-4 mr-2" />
            Complete Assessment
        </Button>
        </div>
        </form>
        </DialogContent>
        </Dialog>
    );
    };

    const QueueCard = ({ item }: { item: QueueItem }) => {
        const patient = patients.find(p => p.id === item.patientId);
        if (!patient) return null;

        const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

        return (
            <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs font-mono">
    #{item.position}
        </Badge>
        {getStatusIcon(item.status)}
        </div>
        <Avatar className="w-10 h-10">
        <AvatarFallback className="bg-blue-100 text-blue-600">
            {patient.firstName[0]}{patient.lastName[0]}
        </AvatarFallback>
        </Avatar>
        <div>
        <h3 className="font-semibold">
            {patient.firstName} {patient.lastName}
        </h3>
        <p className="text-sm text-gray-600">
            Age {age} • {patient.gender}
        </p>
        </div>
        </div>
        <Badge className={getPriorityColor(item.priority)}>
        {getPriorityLabel(item.priority)}
        </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
            <p className="text-gray-500">Check-in Time</p>
            <p className="font-medium">
        {new Date(item.checkInTime).toLocaleTimeString()}
        </p>
        </div>
        <div>
        <p className="text-gray-500">Current Wait</p>
        <p className="font-medium text-orange-600">
            {item.currentWaitTime} minutes
        </p>
        </div>
        </div>

        {item.practitionerName && (
            <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Assigned Practitioner</p>
                <p className="text-sm font-semibold text-blue-900">{item.practitionerName}</p>
                {item.estimatedAppointmentTime && (
                    <p className="text-xs text-gray-600 mt-1">
                        Est. appointment: {new Date(item.estimatedAppointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </div>
        )}

        {patient.medicalHistory.conditions.length > 0 && (
            <div className="mb-3">
            <p className="text-sm text-gray-500 mb-1">Medical History</p>
        <div className="flex flex-wrap gap-1">
            {patient.medicalHistory.conditions.slice(0, 2).map((condition, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                {condition}
                </Badge>
        ))}
            {patient.medicalHistory.conditions.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                +{patient.medicalHistory.conditions.length - 2}
                </Badge>
            )}
            </div>
            </div>
        )}

        <div className="flex space-x-2">
        <Button
            size="sm"
        variant="outline"
        onClick={() => {
            setSelectedPatient(patient);
            setShowAssessment(true);
        }}
        disabled={item.status === AppointmentStatus.IN_TRIAGE}
        >
        <Heart className="w-4 h-4 mr-1" />
            {item.status === AppointmentStatus.IN_TRIAGE ? 'In Progress' : 'Start Triage'}
            </Button>
            <Button size="sm" variant="ghost">
        <Eye className="w-4 h-4 mr-1" />
            View Details
        </Button>
        </div>
        </CardContent>
        </Card>
    );
    };

    const PriorityStats = () => {
        const stats = {
            critical: queue.filter(q => q.priority === TriagePriority.CRITICAL).length,
            urgent: queue.filter(q => q.priority === TriagePriority.URGENT).length,
            semiUrgent: queue.filter(q => q.priority === TriagePriority.SEMI_URGENT).length,
            nonUrgent: queue.filter(q => q.priority === TriagePriority.NON_URGENT).length
        };

        return (
            <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
                <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <div className="text-sm text-gray-600">Critical</div>
        </CardContent>
        </Card>
        <Card>
        <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
            <div className="text-sm text-gray-600">Urgent</div>
        </CardContent>
        </Card>
        <Card>
        <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-yellow-600">{stats.semiUrgent}</div>
            <div className="text-sm text-gray-600">Semi-Urgent</div>
        </CardContent>
        </Card>
        <Card>
        <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.nonUrgent}</div>
            <div className="text-sm text-gray-600">Non-Urgent</div>
            </CardContent>
            </Card>
            </div>
    );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
    <div>
        <h1 className="text-2xl font-bold text-gray-900">Triage System</h1>
    <p className="text-gray-600">Assess patients and assign priority levels</p>
    </div>
    <div className="flex items-center space-x-2">
    <Button
        variant="outline"
    onClick={loadTriageData}
    disabled={refreshing}
    >
    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
    Refresh
    </Button>
    <div className="flex items-center space-x-1 text-sm text-green-600">
    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Live Updates</span>
    </div>
    </div>
    </div>

    {/* Priority Statistics */}
    <PriorityStats />

    {/* Queue */}
    <Card>
    <CardHeader>
        <CardTitle className="flex items-center justify-between">
        <span>Patient Queue</span>
    <Badge variant="secondary">{queue.length} patients</Badge>
    </CardTitle>
    <CardDescription>
    Patients waiting for triage assessment, ordered by priority and check-in time
    </CardDescription>
    </CardHeader>
    <CardContent>
    {queue.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {queue.map((item) => (
                        <QueueCard key={item.id} item={item} />
))}
    </div>
) : (
        <div className="text-center py-12">
        <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients in triage queue</h3>
    <p className="text-gray-600">
        All patients have been assessed or there are no check-ins today
    </p>
    </div>
)}
    </CardContent>
    </Card>

    {/* Triage Assessment Dialog */}
    <TriageAssessmentDialog />
    </div>
);
};

export default TriageSystem;