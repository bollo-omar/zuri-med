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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Users, Plus, Search, UserCheck, Heart,
    Phone, Mail, MapPin, Calendar as CalendarIcon, Clock,
    AlertCircle, CheckCircle, User as UserIcon,
    FileText, CreditCard, Clipboard, AlertTriangle
} from 'lucide-react';
import { User, Patient, VitalSigns, PatientRegistrationForm, CheckInForm, UserRole, Insurance, InsuranceStatus, Appointment, AppointmentStatus } from '@/types';
import { PatientService, AppointmentService, mockPractitioners } from '@/lib/mockServices';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface PatientManagementProps {
    user: User;
}

const PatientManagement: React.FC<PatientManagementProps> = ({ user }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
    const [showCheckInDialog, setShowCheckInDialog] = useState(false);
    const [showVitalsDialog, setShowVitalsDialog] = useState(false);
    const [showScheduleAppointmentDialog, setShowScheduleAppointmentDialog] = useState(false);
    const [patientAppointment, setPatientAppointment] = useState<Appointment | null>(null);
    
    // Track if forms should be reset when dialogs close
    const [shouldResetRegistration, setShouldResetRegistration] = useState(false);
    const [shouldResetCheckIn, setShouldResetCheckIn] = useState(false);

    // Registration form state
    const [registrationForm, setRegistrationForm] = useState<PatientRegistrationForm>({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: ''
        },
        emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
        },
        insurance: {
            provider: '',
            policyNumber: '',
            groupNumber: '',
            subscriberId: ''
        }
    });

    // Check-in form state
    const [checkInForm, setCheckInForm] = useState<CheckInForm>({
        patientId: '',
        chiefComplaint: '',
        symptoms: [],
        painLevel: 0,
        hasInsuranceChanged: false,
        hasContactInfoChanged: false,
        hasMedicationsChanged: false
    });
    
    // Appointment scheduling form state
    const [appointmentForm, setAppointmentForm] = useState({
        practitionerId: '',
        appointmentType: 'General Consultation',
        scheduledDate: new Date(),
        scheduledTime: '',
        duration: 30,
        notes: ''
    });

    const appointmentTypes = [
        'General Consultation',
        'Follow-up',
        'Specialist Consultation',
        'Vaccination',
        'Laboratory Tests',
        'Imaging',
        'Procedure',
        'Emergency'
    ];

    const timeSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30'
    ];

    // Vital signs form state
    const [vitalsForm, setVitalsForm] = useState<VitalSigns>({
        temperature: undefined,
        bloodPressureSystolic: undefined,
        bloodPressureDiastolic: undefined,
        heartRate: undefined,
        respiratoryRate: undefined,
        oxygenSaturation: undefined,
        weight: undefined,
        height: undefined
    });

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const response = await PatientService.getPatients(1, 50, searchTerm);
            if (response.success && response.data) {
                setPatients(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await PatientService.createPatient(registrationForm);
            if (response.success && response.data) {
                toast.success('Patient registered successfully');
                setShouldResetRegistration(true);
                setShowRegistrationDialog(false);
                loadPatients();
                resetRegistrationForm();
            } else {
                toast.error(response.error || 'Registration failed');
            }
        } catch (error) {
            toast.error('An error occurred during registration');
        }
    };

    const checkPatientAppointment = async (patientId: string) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const appointmentsResponse = await AppointmentService.getAppointments(today);
            
            if (appointmentsResponse.success && appointmentsResponse.data) {
                const appointment = appointmentsResponse.data.find(
                    apt => apt.patientId === patientId && 
                    apt.status !== AppointmentStatus.CANCELLED &&
                    apt.status !== AppointmentStatus.COMPLETED
                );
                
                if (appointment) {
                    setPatientAppointment(appointment);
                    return appointment;
                } else {
                    setPatientAppointment(null);
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error('Error checking appointment:', error);
            return null;
        }
    };

    const handleScheduleAppointment = async (autoCheckIn: boolean = false) => {
        if (!checkInForm.patientId || !appointmentForm.practitionerId || !appointmentForm.scheduledTime) {
            toast.error('Please fill in all required fields');
            return false;
        }

        try {
            const appointmentData = {
                patientId: checkInForm.patientId,
                practitionerId: appointmentForm.practitionerId,
                scheduledDate: format(appointmentForm.scheduledDate, 'yyyy-MM-dd'),
                scheduledTime: appointmentForm.scheduledTime,
                duration: appointmentForm.duration,
                appointmentType: appointmentForm.appointmentType,
                status: AppointmentStatus.SCHEDULED,
                notes: appointmentForm.notes || 'Walk-in appointment scheduled during check-in'
            };

            const response = await AppointmentService.createAppointment(appointmentData);
            
            if (response.success && response.data) {
                setPatientAppointment(response.data);
                toast.success('Appointment scheduled successfully');
                
                // Reset appointment form
                setAppointmentForm({
                    practitionerId: '',
                    appointmentType: 'General Consultation',
                    scheduledDate: new Date(),
                    scheduledTime: '',
                    duration: 30,
                    notes: ''
                });
                
                // If auto check-in is requested, proceed with check-in
                if (autoCheckIn) {
                    setShowScheduleAppointmentDialog(false);
                    // Use the newly created appointment for check-in
                    const checkInResponse = await AppointmentService.checkInPatient(response.data.id, checkInForm);
                    if (checkInResponse.success) {
                        toast.success('Patient checked in successfully');
                        setShowCheckInDialog(false);
                        resetCheckInForm();
                        setPatientAppointment(null);
                        loadPatients();
                    } else {
                        toast.error(checkInResponse.error || 'Check-in failed');
                    }
                } else {
                    setShowScheduleAppointmentDialog(false);
                }
                
                return true;
            } else {
                toast.error('Failed to schedule appointment');
                return false;
            }
        } catch (error) {
            toast.error('An error occurred while scheduling the appointment');
            return false;
        }
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!checkInForm.patientId) {
            toast.error('Please select a patient');
            return;
        }

        try {
            // Check if patient has an appointment for today
            let appointment = await checkPatientAppointment(checkInForm.patientId);
            
            // If no appointment, show scheduling dialog
            if (!appointment) {
                setShowScheduleAppointmentDialog(true);
                return;
            }

            // Proceed with check-in
            const response = await AppointmentService.checkInPatient(appointment.id, checkInForm);
            if (response.success) {
                toast.success('Patient checked in successfully');
                setShouldResetCheckIn(true);
                setShowCheckInDialog(false);
                resetCheckInForm();
                setPatientAppointment(null);
                loadPatients();
            } else {
                toast.error(response.error || 'Check-in failed');
            }
        } catch (error) {
            toast.error('An error occurred during check-in');
        }
    };

    const handleCheckInWithScheduledAppointment = async () => {
        if (!patientAppointment) {
            toast.error('No appointment available for check-in');
            return;
        }

        try {
            const response = await AppointmentService.checkInPatient(patientAppointment.id, checkInForm);
            if (response.success) {
                toast.success('Patient checked in successfully');
                setShouldResetCheckIn(true);
                setShowCheckInDialog(false);
                setShowScheduleAppointmentDialog(false);
                resetCheckInForm();
                setPatientAppointment(null);
                loadPatients();
            } else {
                toast.error(response.error || 'Check-in failed');
            }
        } catch (error) {
            toast.error('An error occurred during check-in');
        }
    };

    const resetRegistrationForm = () => {
        setRegistrationForm({
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: '',
            phone: '',
            email: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: ''
            },
            emergencyContact: {
                name: '',
                relationship: '',
                phone: ''
            },
            insurance: {
                provider: '',
                policyNumber: '',
                groupNumber: '',
                subscriberId: ''
            }
        });
    };

    const resetCheckInForm = () => {
        setCheckInForm({
            patientId: '',
            chiefComplaint: '',
            symptoms: [],
            painLevel: 0,
            hasInsuranceChanged: false,
            hasContactInfoChanged: false,
            hasMedicationsChanged: false
        });
    };

    // Filter patients based on user role
    const getFilteredPatientsByRole = () => {
        if (user.role === UserRole.PATIENT) {
            // Patients can only see their own record
            return patients.filter(patient => patient.email?.toLowerCase() === user.email.toLowerCase());
        }
        // All other roles can see all patients
        return patients;
    };

    const roleFilteredPatients = getFilteredPatientsByRole();
    
    const filteredPatients = roleFilteredPatients.filter(patient =>
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {user.role === UserRole.PATIENT ? 'My Patient Record' : 'Patient Management'}
                    </h1>
                    <p className="text-gray-500">
                        {user.role === UserRole.PATIENT ? 'View your patient information and records' : 'Manage patient records and check-ins'}
                    </p>
                </div>
                {/* Only show action buttons for staff roles */}
                {user.role !== UserRole.PATIENT && (
                <div className="flex space-x-2">
                    {(user.role === UserRole.ADMIN || user.role === UserRole.RECEPTIONIST) && (
                    <Dialog open={showCheckInDialog} onOpenChange={(open) => {
                        setShowCheckInDialog(open);
                        // Only reset form when dialog closes AND we've successfully checked in
                        if (!open && shouldResetCheckIn) {
                            resetCheckInForm();
                            setShouldResetCheckIn(false);
                            setPatientAppointment(null);
                        } else if (open && !shouldResetCheckIn && !checkInForm.patientId) {
                            // When opening dialog from header button (not patient card), ensure fresh form
                            resetCheckInForm();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => {
                                // Reset form when explicitly opening from header button
                                resetCheckInForm();
                                setShouldResetCheckIn(false);
                                setPatientAppointment(null);
                            }}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Check In Patient
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Patient Check-In</DialogTitle>
                                <DialogDescription>
                                    Check in a patient for their appointment
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCheckIn} className="space-y-4">
                                <div>
                                    <Label htmlFor="patientSelect">Select Patient</Label>
                                    <Select
                                        value={checkInForm.patientId}
                                        onValueChange={async (value) => {
                                            setCheckInForm(prev => ({ ...prev, patientId: value }));
                                            // Check for existing appointment when patient is selected
                                            const appointment = await checkPatientAppointment(value);
                                            setPatientAppointment(appointment);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose patient..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {patients.map(patient => (
                                                <SelectItem key={patient.id} value={patient.id}>
                                                    {patient.firstName} {patient.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Show appointment status if exists */}
                                {patientAppointment && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <CalendarIcon className="w-4 h-4 text-blue-600" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-900">Appointment Found</p>
                                                <p className="text-xs text-blue-700">
                                                    {patientAppointment.scheduledDate} at {patientAppointment.scheduledTime} - {patientAppointment.appointmentType}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!patientAppointment && checkInForm.patientId && (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-yellow-900">No Appointment Found</p>
                                                <p className="text-xs text-yellow-700">
                                                    This patient doesn't have an appointment for today. You can schedule one during check-in.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                                    <Textarea
                                        id="chiefComplaint"
                                        value={checkInForm.chiefComplaint}
                                        onChange={(e) => setCheckInForm(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                                        placeholder="What brings you in today?"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="painLevel">Pain Level (0-10)</Label>
                                    <Input
                                        id="painLevel"
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={checkInForm.painLevel}
                                        onChange={(e) => setCheckInForm(prev => ({ ...prev, painLevel: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    {patientAppointment ? (
                                        <Button type="submit" className="flex-1">
                                            Check In Patient
                                        </Button>
                                    ) : (
                                        <>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                className="flex-1"
                                                onClick={() => {
                                                    setShowScheduleAppointmentDialog(true);
                                                }}
                                            >
                                                Schedule Appointment First
                                            </Button>
                                            <Button 
                                                type="button" 
                                                variant="secondary"
                                                onClick={() => {
                                                    // Allow walk-in without appointment
                                                    setShowScheduleAppointmentDialog(true);
                                                }}
                                            >
                                                Walk-in
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </form>
                            
                            {/* Schedule Appointment Dialog */}
                            <Dialog open={showScheduleAppointmentDialog} onOpenChange={(open) => {
                                if (!open) {
                                    // Only close if not in the middle of scheduling
                                    setShowScheduleAppointmentDialog(false);
                                }
                            }}>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Schedule Appointment</DialogTitle>
                                        <DialogDescription>
                                            {checkInForm.patientId ? 'Schedule an appointment for this patient' : 'Please select a patient first'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    {checkInForm.patientId && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="practitioner">Specialist</Label>
                                                    <Select
                                                        value={appointmentForm.practitionerId}
                                                        onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, practitionerId: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select specialist" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {mockPractitioners.map(practitioner => (
                                                                <SelectItem key={practitioner.id} value={practitioner.id}>
                                                                    Dr. {practitioner.firstName} {practitioner.lastName} - {practitioner.specialties.join(', ')}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="appointmentType">Appointment Type</Label>
                                                    <Select
                                                        value={appointmentForm.appointmentType}
                                                        onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, appointmentType: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {appointmentTypes.map(type => (
                                                                <SelectItem key={type} value={type}>
                                                                    {type}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Date</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start text-left font-normal"
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {appointmentForm.scheduledDate ? (
                                                                    format(appointmentForm.scheduledDate, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0">
                                                            <Calendar
                                                                mode="single"
                                                                selected={appointmentForm.scheduledDate}
                                                                onSelect={(date) => date && setAppointmentForm(prev => ({ ...prev, scheduledDate: date }))}
                                                                disabled={(date) => date < new Date()}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Time</Label>
                                                    <Select
                                                        value={appointmentForm.scheduledTime}
                                                        onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, scheduledTime: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select time" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {timeSlots.map(time => (
                                                                <SelectItem key={time} value={time}>
                                                                    {time}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Duration (minutes)</Label>
                                                    <Select
                                                        value={appointmentForm.duration.toString()}
                                                        onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, duration: parseInt(value) }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select duration" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="15">15 minutes</SelectItem>
                                                            <SelectItem value="30">30 minutes</SelectItem>
                                                            <SelectItem value="45">45 minutes</SelectItem>
                                                            <SelectItem value="60">60 minutes</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="notes">Notes</Label>
                                                <Textarea
                                                    id="notes"
                                                    value={appointmentForm.notes}
                                                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="Additional notes for the appointment"
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" onClick={() => setShowScheduleAppointmentDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button variant="outline" onClick={async () => {
                                                    const success = await handleScheduleAppointment(false);
                                                    if (success) {
                                                        // Just schedule, don't check in
                                                        setShowScheduleAppointmentDialog(false);
                                                    }
                                                }}>
                                                    Schedule Only
                                                </Button>
                                                <Button onClick={async () => {
                                                    await handleScheduleAppointment(true);
                                                }}>
                                                    Schedule & Check In
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </DialogContent>
                    </Dialog>
                    )}

                    {(user.role === UserRole.ADMIN || user.role === UserRole.RECEPTIONIST) && (
                    <Dialog open={showRegistrationDialog} onOpenChange={(open) => {
                        setShowRegistrationDialog(open);
                        // Only reset form when dialog closes AND registration was successful
                        if (!open && shouldResetRegistration) {
                            resetRegistrationForm();
                            setShouldResetRegistration(false);
                        } else if (open && !shouldResetRegistration) {
                            // When opening dialog for new registration, reset form if it's not already reset
                            // Check if form is already empty (means it's a fresh start)
                            if (registrationForm.firstName || registrationForm.lastName) {
                                // Form has data, don't reset - preserve user's work
                            } else {
                                // Form is empty, ensure it stays fresh
                                resetRegistrationForm();
                            }
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Register New Patient
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Register New Patient</DialogTitle>
                                <DialogDescription>
                                    Enter patient information to create a new record
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleRegistration} className="space-y-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={registrationForm.firstName}
                                                onChange={(e) => setRegistrationForm(prev => ({ ...prev, firstName: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={registrationForm.lastName}
                                                onChange={(e) => setRegistrationForm(prev => ({ ...prev, lastName: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                            <Input
                                                id="dateOfBirth"
                                                type="date"
                                                value={registrationForm.dateOfBirth}
                                                onChange={(e) => setRegistrationForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="gender">Gender</Label>
                                            <Select
                                                value={registrationForm.gender}
                                                onValueChange={(value) => setRegistrationForm(prev => ({ ...prev, gender: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={registrationForm.phone}
                                                onChange={(e) => setRegistrationForm(prev => ({ ...prev, phone: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={registrationForm.email}
                                                onChange={(e) => setRegistrationForm(prev => ({ ...prev, email: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Address */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Address</h3>
                                    <div>
                                        <Label htmlFor="street">Street Address</Label>
                                        <Input
                                            id="street"
                                            value={registrationForm.address.street}
                                            onChange={(e) => setRegistrationForm(prev => ({
                                                ...prev,
                                                address: { ...prev.address, street: e.target.value }
                                            }))}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={registrationForm.address.city}
                                                onChange={(e) => setRegistrationForm(prev => ({
                                                    ...prev,
                                                    address: { ...prev.address, city: e.target.value }
                                                }))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="state">State</Label>
                                            <Input
                                                id="state"
                                                value={registrationForm.address.state}
                                                onChange={(e) => setRegistrationForm(prev => ({
                                                    ...prev,
                                                    address: { ...prev.address, state: e.target.value }
                                                }))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="zipCode">ZIP Code</Label>
                                            <Input
                                                id="zipCode"
                                                value={registrationForm.address.zipCode}
                                                onChange={(e) => setRegistrationForm(prev => ({
                                                    ...prev,
                                                    address: { ...prev.address, zipCode: e.target.value }
                                                }))}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">
                                    Register Patient
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    )}
                </div>
                )}
            </div>

            {/* Search - Only for staff roles */}
            {user.role !== UserRole.PATIENT && (
                <div className="flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={loadPatients} variant="outline">
                        Refresh
                    </Button>
                </div>
            )}

            {/* Patient List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient) => (
                    <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <UserIcon className="w-5 h-5" />
                                    <span>{patient.firstName} {patient.lastName}</span>
                                </div>
                                <Badge variant="outline">
                                    {patient.gender}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span>{patient.phone}</span>
                                </div>
                                {patient.email && (
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        <span>{patient.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{patient.address.city}, {patient.address.state}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex space-x-2">
                                {/* Only show Check In button for Receptionist and Admin */}
                                {(user.role === UserRole.ADMIN || user.role === UserRole.RECEPTIONIST) && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                        // Reset check-in form when opening for a new patient
                                        resetCheckInForm();
                                        setCheckInForm(prev => ({ ...prev, patientId: patient.id }));
                                        // Check for existing appointment
                                        const appointment = await checkPatientAppointment(patient.id);
                                        setPatientAppointment(appointment);
                                        setShouldResetCheckIn(false);
                                        setShowCheckInDialog(true);
                                    }}
                                >
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Check In
                                </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    View Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredPatients.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm ? 'No patients match your search criteria.' : 'Get started by registering your first patient.'}
                    </p>
                    {user.role !== UserRole.PATIENT && (
                        <Button onClick={() => setShowRegistrationDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Register New Patient
                        </Button>
                    )}
                </div>
            )}

            {/* Patient Details Dialog */}
            {selectedPatient && (
                <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedPatient.firstName} {selectedPatient.lastName}
                            </DialogTitle>
                            <DialogDescription>
                                Patient ID: {selectedPatient.id}
                            </DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="medical">Medical History</TabsTrigger>
                                <TabsTrigger value="insurance">Insurance</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Date of Birth</Label>
                                        <p className="text-sm">{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <Label>Gender</Label>
                                        <p className="text-sm capitalize">{selectedPatient.gender}</p>
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <p className="text-sm">{selectedPatient.phone}</p>
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <p className="text-sm">{selectedPatient.email || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label>Address</Label>
                                    <p className="text-sm">
                                        {selectedPatient.address.street}<br />
                                        {selectedPatient.address.city}, {selectedPatient.address.state} {selectedPatient.address.zipCode}
                                    </p>
                                </div>
                                <div>
                                    <Label>Emergency Contact</Label>
                                    <p className="text-sm">
                                        {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relationship})<br />
                                        {selectedPatient.emergencyContact.phone}
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="medical" className="space-y-4">
                                <div>
                                    <Label>Allergies</Label>
                                    <p className="text-sm">
                                        {selectedPatient.medicalHistory.allergies.length > 0
                                            ? selectedPatient.medicalHistory.allergies.join(', ')
                                            : 'None reported'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <Label>Current Medications</Label>
                                    <p className="text-sm">
                                        {selectedPatient.medicalHistory.medications.length > 0
                                            ? selectedPatient.medicalHistory.medications.map(med => med.name).join(', ')
                                            : 'None reported'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <Label>Medical Conditions</Label>
                                    <p className="text-sm">
                                        {selectedPatient.medicalHistory.conditions.length > 0
                                            ? selectedPatient.medicalHistory.conditions.join(', ')
                                            : 'None reported'
                                        }
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="insurance" className="space-y-4">
                                {selectedPatient.insurance.length > 0 ? (
                                    selectedPatient.insurance.map((ins, index) => (
                                        <div key={index} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{ins.provider}</h4>
                                                <Badge variant={ins.isPrimary ? "default" : "secondary"}>
                                                    {ins.isPrimary ? 'Primary' : 'Secondary'}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <Label>Policy Number</Label>
                                                    <p>{ins.policyNumber}</p>
                                                </div>
                                                <div>
                                                    <Label>Group Number</Label>
                                                    <p>{ins.groupNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <Label>Subscriber ID</Label>
                                                    <p>{ins.subscriberId}</p>
                                                </div>
                                                <div>
                                                    <Label>Status</Label>
                                                    <Badge variant={ins.status === 'active' ? 'default' : 'secondary'}>
                                                        {ins.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No insurance information on file</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default PatientManagement;