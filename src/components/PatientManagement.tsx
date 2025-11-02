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
import {
    Users, Plus, Search, UserCheck, Heart,
    Phone, Mail, MapPin, Calendar, Clock,
    AlertCircle, CheckCircle, User as UserIcon
} from 'lucide-react';
import { User, Patient, VitalSigns, PatientRegistrationForm, CheckInForm } from '@/types';
import { PatientService, AppointmentService } from '@/lib/mockServices';
import { toast } from 'sonner';

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

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // In a real app, you'd find the appointment ID based on the patient
            const mockAppointmentId = `apt-${Date.now()}`;
            const response = await AppointmentService.checkInPatient(mockAppointmentId, checkInForm);
            if (response.success) {
                toast.success('Patient checked in successfully');
                setShowCheckInDialog(false);
                resetCheckInForm();
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

    const filteredPatients = patients.filter(patient =>
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
                    <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
                    <p className="text-gray-500">Manage patient records and check-ins</p>
                </div>
                <div className="flex space-x-2">
                    <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
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
                                        onValueChange={(value) => setCheckInForm(prev => ({ ...prev, patientId: value }))}
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
                                        onChange={(e) => setCheckInForm(prev => ({ ...prev, painLevel: parseInt(e.target.value) }))}
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    Check In Patient
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
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
                </div>
            </div>

            {/* Search */}
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
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setCheckInForm(prev => ({ ...prev, patientId: patient.id }));
                                        setShowCheckInDialog(true);
                                    }}
                                >
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Check In
                                </Button>
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
                    <Button onClick={() => setShowRegistrationDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Register New Patient
                    </Button>
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