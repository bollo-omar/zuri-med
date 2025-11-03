import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
    Calendar as CalendarIcon, Clock, User, FileText,
    Search, Plus
} from 'lucide-react';
import { User as UserType, Patient, Appointment, AppointmentStatus, UserRole } from '@/types';
import { PatientService, AppointmentService, mockPractitioners } from '@/lib/mockServices';
import { toast } from 'sonner';

interface AppointmentSchedulingProps {
    user: UserType;
}

interface AppointmentFormData {
    patientId: string;
    practitionerId: string;
    appointmentType: string;
    scheduledDate: Date;
    scheduledTime: string;
    duration: number;
    notes: string;
    contactMethod: 'online' | 'phone' | 'walk-in';
    contactDetails: string;
}

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

const AppointmentScheduling: React.FC<AppointmentSchedulingProps> = ({ user }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [practitioners] = useState(mockPractitioners);
    const [shouldResetForm, setShouldResetForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState<AppointmentFormData>({
        patientId: '',
        practitionerId: '',
        appointmentType: '',
        scheduledDate: new Date(),
        scheduledTime: '',
        duration: 30,
        notes: '',
        contactMethod: 'online',
        contactDetails: ''
    });

    // Available time slots based on practitioner and date
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(timeSlots);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const [appointmentsResponse, patientsResponse] = await Promise.all([
                AppointmentService.getAppointments(),
                PatientService.getPatients(1, 100)
            ]);

            let appointmentsData = appointmentsResponse.success ? appointmentsResponse.data : [];
            
            // Filter appointments based on user role
            if (user.role === UserRole.PATIENT) {
                // Find patient record by email match
                const patientRecord = patientsResponse.success 
                    ? patientsResponse.data.data.find(p => p.email?.toLowerCase() === user.email.toLowerCase())
                    : null;
                
                if (patientRecord) {
                    // Patients can only see their own appointments
                    appointmentsData = appointmentsData.filter(appt => appt.patientId === patientRecord.id);
                } else {
                    // No patient record found, show no appointments
                    appointmentsData = [];
                }
            } else if (user.role === UserRole.PRACTITIONER) {
                // Practitioners see only their appointments
                appointmentsData = appointmentsData.filter(appt => appt.practitionerId === user.id);
            }
            
            setAppointments(appointmentsData);
            if (patientsResponse.success) setPatients(patientsResponse.data.data);
        } catch (error) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAppointment = async () => {
        try {
            // Validate form data
            if (!formData.patientId || !formData.practitionerId || !formData.appointmentType || 
                !formData.scheduledDate || !formData.scheduledTime) {
                toast.error('Please fill in all required fields');
                return;
            }

            const scheduledDateTime = new Date(formData.scheduledDate);
            const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
            scheduledDateTime.setHours(hours, minutes);

            const appointmentData = {
                patientId: formData.patientId,
                practitionerId: formData.practitionerId,
                scheduledDate: format(formData.scheduledDate, 'yyyy-MM-dd'),
                scheduledTime: formData.scheduledTime,
                duration: formData.duration,
                appointmentType: formData.appointmentType,
                status: AppointmentStatus.SCHEDULED,
                notes: `${formData.notes}\nContact Method: ${formData.contactMethod}\nContact Details: ${formData.contactDetails}`,
            };

            const response = await AppointmentService.createAppointment(appointmentData);
            
            if (response.success) {
                toast.success('Appointment scheduled successfully');
                setShouldResetForm(true);
                setShowCreateDialog(false);
                loadAppointments();
                
                // Reset form
                setFormData({
                    patientId: '',
                    practitionerId: '',
                    appointmentType: '',
                    scheduledDate: new Date(),
                    scheduledTime: '',
                    duration: 30,
                    notes: '',
                    contactMethod: 'online',
                    contactDetails: ''
                });
            } else {
                toast.error('Failed to schedule appointment');
            }
        } catch (error) {
            toast.error('An error occurred while scheduling the appointment');
        }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        try {
            const response = await AppointmentService.updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED);
            
            if (response.success) {
                toast.success('Appointment cancelled successfully');
                loadAppointments();
                setShowDetailsDialog(false);
            } else {
                toast.error('Failed to cancel appointment');
            }
        } catch (error) {
            toast.error('An error occurred while cancelling the appointment');
        }
    };

    const handlePractitionerChange = (practitionerId: string) => {
        setFormData(prev => ({ ...prev, practitionerId }));
        
        // Simulate checking practitioner availability
        // In a real app, this would call an API to get available slots
        const busySlots = ['09:00', '09:30', '14:00', '14:30'];
        setAvailableTimeSlots(timeSlots.filter(slot => !busySlots.includes(slot)));
    };

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.SCHEDULED:
                return <Badge className="bg-blue-500">Scheduled</Badge>;
            case AppointmentStatus.CHECKED_IN:
                return <Badge className="bg-green-500">Checked In</Badge>;
            case AppointmentStatus.IN_TRIAGE:
                return <Badge className="bg-yellow-500">In Triage</Badge>;
            case AppointmentStatus.WAITING:
                return <Badge className="bg-purple-500">Waiting</Badge>;
            case AppointmentStatus.IN_TREATMENT:
                return <Badge className="bg-indigo-500">In Treatment</Badge>;
            case AppointmentStatus.COMPLETED:
                return <Badge className="bg-green-700">Completed</Badge>;
            case AppointmentStatus.CANCELLED:
                return <Badge className="bg-red-500">Cancelled</Badge>;
            case AppointmentStatus.NO_SHOW:
                return <Badge className="bg-gray-500">No Show</Badge>;
            default:
                return <Badge>Unknown</Badge>;
        }
    };

    const getPatientName = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
    };

    const getPractitionerName = (practitionerId: string) => {
        const practitioner = practitioners.find(p => p.id === practitionerId);
        return practitioner ? `Dr. ${practitioner.firstName} ${practitioner.lastName}` : 'Unknown Practitioner';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Appointment Scheduling</CardTitle>
                            <CardDescription>Schedule, view, and manage patient appointments</CardDescription>
                        </div>
                        <Button onClick={() => {
                            // Reset form when opening dialog for new appointment
                            if (!showCreateDialog) {
                                setFormData({
                                    patientId: '',
                                    practitionerId: '',
                                    appointmentType: '',
                                    scheduledDate: new Date(),
                                    scheduledTime: '',
                                    duration: 30,
                                    notes: '',
                                    contactMethod: 'online',
                                    contactDetails: ''
                                });
                                setShouldResetForm(false);
                            }
                            setShowCreateDialog(true);
                        }}>
                            <Plus className="mr-2 h-4 w-4" /> Schedule Appointment
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search appointments..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Specialist</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">Loading appointments...</TableCell>
                                    </TableRow>
                                ) : appointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">No appointments found</TableCell>
                                    </TableRow>
                                ) : (
                                    appointments
                                        .filter(appointment => {
                                            // Filter by search term
                                            const patientName = getPatientName(appointment.patientId).toLowerCase();
                                            const practitionerName = getPractitionerName(appointment.practitionerId).toLowerCase();
                                            const searchLower = searchTerm.toLowerCase();
                                            
                                            return patientName.includes(searchLower) || 
                                                practitionerName.includes(searchLower) ||
                                                appointment.appointmentType.toLowerCase().includes(searchLower);
                                        })
                                        .filter(appointment => {
                                            // Filter by selected date
                                            if (!date) return true;
                                            return appointment.scheduledDate === format(date, 'yyyy-MM-dd');
                                        })
                                        .map(appointment => (
                                            <TableRow key={appointment.id}>
                                                <TableCell>{getPatientName(appointment.patientId)}</TableCell>
                                                <TableCell>{getPractitionerName(appointment.practitionerId)}</TableCell>
                                                <TableCell>
                                                    {appointment.scheduledDate} at {appointment.scheduledTime}
                                                </TableCell>
                                                <TableCell>{appointment.appointmentType}</TableCell>
                                                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAppointment(appointment);
                                                            setShowDetailsDialog(true);
                                                        }}
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
                </CardContent>
            </Card>

            {/* Create Appointment Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={(open) => {
                setShowCreateDialog(open);
                // Only reset form when dialog closes AND appointment was successfully created
                if (!open && shouldResetForm) {
                    setShouldResetForm(false);
                } else if (!open && !shouldResetForm) {
                    // User cancelled, don't reset form data in case they want to reopen
                }
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Schedule New Appointment</DialogTitle>
                        <DialogDescription>
                            Fill in the details to schedule a new appointment for a patient.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patient">Patient</Label>
                            <Select
                                value={formData.patientId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select patient" />
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

                        <div className="space-y-2">
                            <Label htmlFor="practitioner">Specialist</Label>
                            <Select
                                value={formData.practitionerId}
                                onValueChange={handlePractitionerChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select specialist" />
                                </SelectTrigger>
                                <SelectContent>
                                    {practitioners.map(practitioner => (
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
                                value={formData.appointmentType}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, appointmentType: value }))}
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
                            <Label>Duration (minutes)</Label>
                            <Select
                                value={formData.duration.toString()}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
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

                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.scheduledDate ? (
                                            format(formData.scheduledDate, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.scheduledDate}
                                        onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduledDate: date }))}
                                        disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 3))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Select
                                value={formData.scheduledTime}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, scheduledTime: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTimeSlots.map(time => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Contact Method</Label>
                            <Select
                                value={formData.contactMethod}
                                onValueChange={(value: 'online' | 'phone' | 'walk-in') => 
                                    setFormData(prev => ({ ...prev, contactMethod: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select contact method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="walk-in">Walk-in</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Contact Details</Label>
                            <Input
                                value={formData.contactDetails}
                                onChange={(e) => setFormData(prev => ({ ...prev, contactDetails: e.target.value }))}
                                placeholder="Phone number or email"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Reason for visit, special requirements, etc."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateAppointment}>
                            Schedule Appointment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Appointment Details Dialog */}
            {selectedAppointment && (
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Appointment Details</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold">Status</div>
                                <div>{getStatusBadge(selectedAppointment.status)}</div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    <span className="font-semibold">Patient:</span>
                                    <span className="ml-2">{getPatientName(selectedAppointment.patientId)}</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    <span className="font-semibold">Specialist:</span>
                                    <span className="ml-2">{getPractitionerName(selectedAppointment.practitionerId)}</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span className="font-semibold">Date:</span>
                                    <span className="ml-2">{selectedAppointment.scheduledDate}</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span className="font-semibold">Time:</span>
                                    <span className="ml-2">{selectedAppointment.scheduledTime}</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span className="font-semibold">Type:</span>
                                    <span className="ml-2">{selectedAppointment.appointmentType}</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span className="font-semibold">Duration:</span>
                                    <span className="ml-2">{selectedAppointment.duration} minutes</span>
                                </div>
                            </div>
                            
                            {selectedAppointment.notes && (
                                <>
                                    <Separator />
                                    <div>
                                        <div className="font-semibold mb-1">Notes:</div>
                                        <div className="text-sm whitespace-pre-line">{selectedAppointment.notes}</div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                            {selectedAppointment.status === AppointmentStatus.SCHEDULED && (
                                <Button 
                                    variant="destructive" 
                                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                                >
                                    Cancel Appointment
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default AppointmentScheduling;