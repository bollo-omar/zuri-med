// User Management
export enum UserRole {
    ADMIN = 'admin',
    PRACTITIONER = 'practitioner',
    TRIAGE_NURSE = 'triage_nurse',
    BILLING_STAFF = 'billing_staff',
    RECEPTIONIST = 'receptionist',
    PATIENT = 'patient',
    LAB_TECHNICIAN = 'lab_technician'
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone: string;
    department?: string;
    specialization?: string;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
    permissions: string[];
}

// Patient Management
export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    prescribedBy: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
}

export interface Surgery {
    id: string;
    procedure: string;
    date: string;
    surgeon: string;
    hospital: string;
    notes?: string;
}

export interface SocialHistory {
    smoking: boolean;
    alcohol: boolean;
    drugs: boolean;
    notes?: string;
}

export interface MedicalHistory {
    allergies: string[];
    medications: Medication[];
    conditions: string[];
    surgeries: Surgery[];
    familyHistory: string[];
    socialHistory: SocialHistory;
}

export enum InsuranceStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
    EXPIRED = 'expired'
}

export interface Insurance {
    id: string;
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    subscriberId: string;
    subscriberName: string;
    relationship: string;
    isPrimary: boolean;
    status: InsuranceStatus;
    effectiveDate: string;
    expirationDate?: string;
    copay?: number;
    deductible?: number;
    coinsurance?: number;
    balance?: number; // Available insurance coverage amount (in currency units)
}

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email?: string;
    address: Address;
    emergencyContact: EmergencyContact;
    medicalHistory: MedicalHistory;
    insurance: Insurance[];
    createdAt: string;
    updatedAt: string;
}

// Appointments & Scheduling
export enum AppointmentStatus {
    SCHEDULED = 'scheduled',
    CHECKED_IN = 'checked_in',
    IN_TRIAGE = 'in_triage',
    WAITING = 'waiting',
    IN_TREATMENT = 'in_treatment',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show'
}

export interface Appointment {
    id: string;
    patientId: string;
    practitionerId: string;
    scheduledDate: string;
    scheduledTime: string;
    duration: number; // in minutes
    appointmentType: string;
    status: AppointmentStatus;
    checkInTime?: string;
    triageTime?: string;
    treatmentStartTime?: string;
    treatmentEndTime?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Triage System
export enum TriagePriority {
    CRITICAL = 'critical',
    URGENT = 'urgent',
    SEMI_URGENT = 'semi_urgent',
    NON_URGENT = 'non_urgent'
}

export interface VitalSigns {
    id?: string;
    patientId?: string;
    temperature?: number; // Fahrenheit
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number; // bpm
    respiratoryRate?: number; // breaths per minute
    oxygenSaturation?: number; // percentage
    weight?: number; // pounds
    height?: number; // inches
    bmi?: number;
    recordedBy?: string;
    recordedAt?: string;
    notes?: string;
}

export interface TriageAssessment {
    id: string;
    patientId: string;
    appointmentId: string;
    priority: TriagePriority;
    chiefComplaint: string;
    symptoms: string[];
    painLevel: number; // 0-10 scale
    vitalSigns?: VitalSigns;
    assessmentNotes: string;
    triageNurse: string;
    assessedAt: string;
    estimatedWaitTime: number; // minutes
}

// Queue Management
export interface QueueItem {
    id: string;
    patientId: string;
    appointmentId: string;
    priority: TriagePriority;
    status: AppointmentStatus;
    checkInTime: string;
    estimatedWaitTime: number;
    currentWaitTime: number;
    assignedPractitioner?: string;
    position: number;
    estimatedAppointmentTime?: string; // ISO timestamp
    practitionerName?: string; // For quick display access
}

// Diagnostic Testing
export enum DiagnosticTestType {
    LAB = 'lab',
    IMAGING = 'imaging'
}

export enum DiagnosticTestStatus {
    ORDERED = 'ordered',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface DiagnosticTest {
    id: string;
    patientId: string;
    appointmentId: string;
    name: string;
    type: DiagnosticTestType;
    status: DiagnosticTestStatus;
    orderedBy: string;
    orderedDate: string;
    clinicalInfo?: string;
    performedBy?: string;
    performedDate?: string;
    result?: string;
    notes?: string;
    attachmentUrl?: string;
}

// Practitioner Management
export interface WorkingHours {
    monday: { start: string; end: string; isWorking: boolean };
    tuesday: { start: string; end: string; isWorking: boolean };
    wednesday: { start: string; end: string; isWorking: boolean };
    thursday: { start: string; end: string; isWorking: boolean };
    friday: { start: string; end: string; isWorking: boolean };
    saturday: { start: string; end: string; isWorking: boolean };
    sunday: { start: string; end: string; isWorking: boolean };
}

// Billing & Payment
export enum PaymentMethod {
    CASH = 'cash',
    MPESA = 'mpesa',
    CARD = 'card',
    INSURANCE = 'insurance',
    BANK_TRANSFER = 'bank_transfer'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PARTIAL = 'partial',
    WAIVED = 'waived',
    REFUNDED = 'refunded'
}

export interface BillItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    category: string;
    serviceDate: string;
}

export interface Bill {
    id: string;
    patientId: string;
    appointmentId?: string;
    items: BillItem[];
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    status: PaymentStatus;
    createdAt: string;
    dueDate?: string;
    paymentMethod?: PaymentMethod;
    paymentDate?: string;
    paymentReference?: string;
    insuranceClaim?: {
        insuranceId: string;
        claimNumber: string;
        approvalCode?: string;
        coverageAmount: number;
        patientResponsibility: number;
        status: 'pending' | 'approved' | 'rejected' | 'partial'
    };
    notes?: string;
}

export interface Practitioner {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    specialties: string[];
    licenseNumber: string;
    npiNumber: string;
    email: string;
    phone: string;
    isAvailable: boolean;
    workingHours: WorkingHours;
    currentPatients: string[];
    maxConcurrentPatients: number;
}

// Billing & Payments
export interface ServiceItem {
    id: string;
    code: string; // CPT code
    name: string;
    description: string;
    category: string;
    price: number;
    duration?: number; // minutes
    isActive: boolean;
}

export interface DiagnosisCode {
    id: string;
    code: string; // ICD-10 code
    description: string;
    category: string;
    isActive: boolean;
}

export interface InvoiceService {
    serviceId: string;
    serviceName: string;
    cptCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    insuranceCovered: number;
    patientPortion: number;
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PARTIAL = 'partial',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled'
}

export enum PaymentMethod {
    M_PESA = 'm_pesa',
    CARD = 'card',
    CASH = 'cash',
    INSURANCE = 'insurance'
}

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
    processedAt: string;
    processedBy: string;
    notes?: string;
}

export interface Invoice {
    id: string;
    patientId: string;
    appointmentId: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    services: InvoiceService[];
    subtotal: number;
    tax: number;
    total: number;
    insuranceCoverage: number;
    patientResponsibility: number;
    status: PaymentStatus;
    payments: Payment[];
    createdAt: string;
    updatedAt: string;
}

// Treatment Records
export interface TreatmentService {
    serviceId: string;
    quantity: number;
    notes?: string;
}

export interface TreatmentDiagnosis {
    codeId: string;
    isPrimary: boolean;
    notes?: string;
}

export interface Prescription {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    refills: number;
    instructions: string;
    prescribedBy: string;
    prescribedAt: string;
}

export interface TreatmentRecord {
    id: string;
    appointmentId: string;
    patientId: string;
    practitionerId: string;
    services: TreatmentService[];
    diagnoses: TreatmentDiagnosis[];
    prescriptions: Prescription[];
    treatmentNotes: string;
    followUpRequired: boolean;
    followUpDate?: string;
    createdAt: string;
}

// Insurance Claims
export interface InsuranceClaim {
    id: string;
    invoiceId: string;
    insuranceId: string;
    claimNumber: string;
    submissionDate: string;
    status: string;
    approvedAmount?: number;
    deniedAmount?: number;
    paidDate?: string;
    eobReceived: boolean;
    notes?: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
    totalPatients: number;
    patientsInQueue: number;
    averageWaitTime: number;
    dailyRevenue: number;
    pendingPayments: number;
    completedAppointments: number;
    criticalPatients: number;
    availablePractitioners: number;
}

// Form Types
export interface PatientRegistrationForm {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email?: string;
    address: Address;
    emergencyContact: EmergencyContact;
    insurance?: {
        provider: string;
        policyNumber: string;
        groupNumber?: string;
        subscriberId: string;
    };
}

export interface CheckInForm {
    patientId: string;
    chiefComplaint: string;
    symptoms: string[];
    painLevel: number;
    hasInsuranceChanged: boolean;
    hasContactInfoChanged: boolean;
    hasMedicationsChanged: boolean;
}

export interface PaymentForm {
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
    phoneNumber?: string; // For M-Pesa payments
    notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Audit & Security
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details: Record<string, unknown>;
    timestamp: string;
    ipAddress: string;
    userAgent: string;
}