import {
    User, Patient, Practitioner, Appointment, TriageAssessment, VitalSigns,
    ServiceItem, DiagnosisCode, Invoice, Payment, QueueItem, DashboardMetrics,
    UserRole, TriagePriority, AppointmentStatus, PaymentStatus, PaymentMethod,
    InsuranceStatus, TreatmentRecord, InsuranceClaim, Prescription
} from '../types';

// Mock Users
export const mockUsers: User[] = [
    {
        id: 'user-1',
        email: 'admin@clinic.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.ADMIN,
        phone: '(555) 123-4567',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T08:30:00Z',
        permissions: ['all']
    },
    {
        id: 'user-2',
        email: 'nurse@clinic.com',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        role: UserRole.TRIAGE_NURSE,
        phone: '(555) 234-5678',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T07:45:00Z',
        permissions: ['triage', 'patient_view', 'vitals']
    },
    {
        id: 'user-3',
        email: 'dr.smith@clinic.com',
        firstName: 'Dr. Michael',
        lastName: 'Smith',
        role: UserRole.PRACTITIONER,
        phone: '(555) 345-6789',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T08:00:00Z',
        permissions: ['treatment', 'prescribe', 'billing_codes', 'patient_full']
    },
    {
        id: 'user-4',
        email: 'billing@clinic.com',
        firstName: 'Jennifer',
        lastName: 'Chen',
        role: UserRole.BILLING_STAFF,
        phone: '(555) 456-7890',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T08:15:00Z',
        permissions: ['billing', 'payments', 'insurance', 'reports']
    },
    {
        id: 'user-5',
        email: 'reception@clinic.com',
        firstName: 'Lisa',
        lastName: 'Williams',
        role: UserRole.RECEPTIONIST,
        phone: '(555) 567-8901',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T07:30:00Z',
        permissions: ['checkin', 'scheduling', 'basic_payments']
    },
    {
        id: 'user-6',
        email: 'john.doe@email.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.PATIENT,
        phone: '(555) 678-9012',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T06:00:00Z',
        permissions: ['patient_portal']
    },
    {
        id: 'user-7',
        email: 'labtech@clinic.com',
        firstName: 'David',
        lastName: 'Kim',
        role: UserRole.LAB_TECHNICIAN,
        phone: '(555) 789-0123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T08:20:00Z',
        permissions: ['lab_tests', 'patient_view']
    },
    {
        id: 'user-8',
        email: 'radiologist@clinic.com',
        firstName: 'Dr. Emily',
        lastName: 'Anderson',
        role: UserRole.PRACTITIONER,
        specialization: 'Radiology',
        phone: '(555) 890-1234',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T08:10:00Z',
        permissions: ['imaging', 'patient_view', 'diagnostic_reports']
    },
    {
        id: 'user-9',
        email: 'pharmacist@clinic.com',
        firstName: 'Dr. Robert',
        lastName: 'Martinez',
        role: UserRole.PRACTITIONER,
        specialization: 'Pharmacy',
        phone: '(555) 901-2345',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-10-23T08:05:00Z',
        permissions: ['prescriptions', 'medication_dispense', 'patient_view']
    }
];

// Mock Patients
export const mockPatients: Patient[] = [
    {
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1985-03-15',
        gender: 'Male',
        phone: '(555) 678-9012',
        email: 'john.doe@email.com',
        address: {
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701'
        },
        emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '(555) 678-9013'
        },
        medicalHistory: {
            allergies: ['Penicillin', 'Shellfish'],
            medications: [
                {
                    id: 'med-1',
                    name: 'Lisinopril',
                    dosage: '10mg',
                    frequency: 'Once daily',
                    prescribedBy: 'Dr. Smith',
                    startDate: '2024-01-15',
                    isActive: true
                }
            ],
            conditions: ['Hypertension', 'Type 2 Diabetes'],
            surgeries: [
                {
                    id: 'surg-1',
                    procedure: 'Appendectomy',
                    date: '2010-05-20',
                    surgeon: 'Dr. Johnson',
                    hospital: 'Springfield General',
                    notes: 'Routine procedure, no complications'
                }
            ],
            familyHistory: ['Heart Disease (Father)', 'Diabetes (Mother)'],
            socialHistory: {
                smoking: false,
                alcohol: true,
                drugs: false,
                notes: 'Occasional social drinking'
            }
        },
        insurance: [
            {
                id: 'ins-1',
                provider: 'Blue Cross Blue Shield',
                policyNumber: 'BCBS123456789',
                groupNumber: 'GRP001',
                subscriberId: 'SUB123456',
                subscriberName: 'John Doe',
                relationship: 'Self',
                isPrimary: true,
                status: InsuranceStatus.ACTIVE,
                effectiveDate: '2024-01-01',
                copay: 25,
                deductible: 1500,
                coinsurance: 20,
                balance: 50000.00 // Available insurance coverage
            }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-10-23T08:30:00Z'
    },
    {
        id: 'patient-2',
        firstName: 'Emily',
        lastName: 'Johnson',
        dateOfBirth: '1992-07-22',
        gender: 'Female',
        phone: '(555) 789-0123',
        email: 'emily.johnson@email.com',
        address: {
            street: '456 Oak Ave',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62702'
        },
        emergencyContact: {
            name: 'Robert Johnson',
            relationship: 'Father',
            phone: '(555) 789-0124'
        },
        medicalHistory: {
            allergies: ['Latex'],
            medications: [],
            conditions: ['Asthma'],
            surgeries: [],
            familyHistory: ['Asthma (Mother)'],
            socialHistory: {
                smoking: false,
                alcohol: false,
                drugs: false
            }
        },
        insurance: [
            {
                id: 'ins-2',
                provider: 'Aetna',
                policyNumber: 'AET987654321',
                subscriberId: 'SUB987654',
                subscriberName: 'Emily Johnson',
                relationship: 'Self',
                isPrimary: true,
                status: InsuranceStatus.ACTIVE,
                effectiveDate: '2024-01-01',
                copay: 30,
                deductible: 2000,
                coinsurance: 25,
                balance: 25000.00 // Available insurance coverage
            }
        ],
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-10-23T07:15:00Z'
    },
    {
        id: 'patient-3',
        firstName: 'Robert',
        lastName: 'Wilson',
        dateOfBirth: '1978-11-08',
        gender: 'Male',
        phone: '(555) 890-1234',
        email: 'robert.wilson@email.com',
        address: {
            street: '789 Pine St',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62703'
        },
        emergencyContact: {
            name: 'Susan Wilson',
            relationship: 'Spouse',
            phone: '(555) 890-1235'
        },
        medicalHistory: {
            allergies: [],
            medications: [
                {
                    id: 'med-2',
                    name: 'Metformin',
                    dosage: '500mg',
                    frequency: 'Twice daily',
                    prescribedBy: 'Dr. Smith',
                    startDate: '2023-06-01',
                    isActive: true
                }
            ],
            conditions: ['Type 2 Diabetes', 'High Cholesterol'],
            surgeries: [],
            familyHistory: ['Diabetes (Father)', 'Heart Disease (Mother)'],
            socialHistory: {
                smoking: true,
                alcohol: true,
                drugs: false,
                notes: 'Trying to quit smoking'
            }
        },
        insurance: [
            {
                id: 'ins-3',
                provider: 'Cigna',
                policyNumber: 'CIG456789123',
                subscriberId: 'SUB456789',
                subscriberName: 'Robert Wilson',
                relationship: 'Self',
                isPrimary: true,
                status: InsuranceStatus.ACTIVE,
                effectiveDate: '2024-01-01',
                copay: 20,
                deductible: 1000,
                coinsurance: 15,
                balance: 0.00 // Zero balance - patient pays all
            }
        ],
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-10-23T06:45:00Z'
    }
];

// Mock Practitioners
export const mockPractitioners: Practitioner[] = [
    {
        id: 'prac-1',
        firstName: 'Dr. Michael',
        lastName: 'Smith',
        title: 'MD',
        specialties: ['Internal Medicine', 'Family Practice'],
        licenseNumber: 'IL123456',
        npiNumber: '1234567890',
        email: 'dr.smith@clinic.com',
        phone: '(555) 345-6789',
        isAvailable: true,
        workingHours: {
            monday: { start: '08:00', end: '17:00', isWorking: true },
            tuesday: { start: '08:00', end: '17:00', isWorking: true },
            wednesday: { start: '08:00', end: '17:00', isWorking: true },
            thursday: { start: '08:00', end: '17:00', isWorking: true },
            friday: { start: '08:00', end: '15:00', isWorking: true },
            saturday: { start: '09:00', end: '13:00', isWorking: false },
            sunday: { start: '09:00', end: '13:00', isWorking: false }
        },
        currentPatients: ['patient-1', 'patient-3'],
        maxConcurrentPatients: 4
    },
    {
        id: 'prac-2',
        firstName: 'Dr. Sarah',
        lastName: 'Davis',
        title: 'MD',
        specialties: ['Emergency Medicine', 'Urgent Care'],
        licenseNumber: 'IL789012',
        npiNumber: '0987654321',
        email: 'dr.davis@clinic.com',
        phone: '(555) 456-7890',
        isAvailable: true,
        workingHours: {
            monday: { start: '12:00', end: '22:00', isWorking: true },
            tuesday: { start: '12:00', end: '22:00', isWorking: true },
            wednesday: { start: '12:00', end: '22:00', isWorking: true },
            thursday: { start: '12:00', end: '22:00', isWorking: false },
            friday: { start: '12:00', end: '22:00', isWorking: true },
            saturday: { start: '08:00', end: '18:00', isWorking: true },
            sunday: { start: '08:00', end: '18:00', isWorking: true }
        },
        currentPatients: ['patient-2'],
        maxConcurrentPatients: 3
    }
];

// Mock Service Items
// Prices converted from USD to KES (1 USD = 130 KES)
export const mockServiceItems: ServiceItem[] = [
    {
        id: 'service-1',
        code: '99213',
        name: 'Office Visit - Established Patient',
        description: 'Established patient office visit, moderate complexity',
        category: 'Office Visits',
        price: 19500.00,
        duration: 30,
        isActive: true
    },
    {
        id: 'service-2',
        code: '99214',
        name: 'Office Visit - Detailed',
        description: 'Established patient office visit, detailed examination',
        category: 'Office Visits',
        price: 26000.00,
        duration: 45,
        isActive: true
    },
    {
        id: 'service-3',
        code: '80053',
        name: 'Comprehensive Metabolic Panel',
        description: 'Blood chemistry panel with 14 tests',
        category: 'Laboratory',
        price: 9750.00,
        isActive: true
    },
    {
        id: 'service-4',
        code: '93000',
        name: 'Electrocardiogram',
        description: '12-lead ECG with interpretation',
        category: 'Diagnostic',
        price: 16250.00,
        duration: 15,
        isActive: true
    },
    {
        id: 'service-5',
        code: '90471',
        name: 'Immunization Administration',
        description: 'Administration of vaccine/toxoid',
        category: 'Immunizations',
        price: 3250.00,
        duration: 10,
        isActive: true
    }
];

// Mock Diagnosis Codes
export const mockDiagnosisCodes: DiagnosisCode[] = [
    {
        id: 'diag-1',
        code: 'I10',
        description: 'Essential hypertension',
        category: 'Cardiovascular',
        isActive: true
    },
    {
        id: 'diag-2',
        code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
        category: 'Endocrine',
        isActive: true
    },
    {
        id: 'diag-3',
        code: 'J45.9',
        description: 'Asthma, unspecified',
        category: 'Respiratory',
        isActive: true
    },
    {
        id: 'diag-4',
        code: 'Z00.00',
        description: 'Encounter for general adult medical examination without abnormal findings',
        category: 'Preventive',
        isActive: true
    }
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
    {
        id: 'appt-1',
        patientId: 'patient-1',
        practitionerId: 'prac-1',
        scheduledDate: '2024-10-23',
        scheduledTime: '09:00',
        duration: 30,
        appointmentType: 'Follow-up',
        status: AppointmentStatus.IN_TREATMENT,
        checkInTime: '2024-10-23T08:45:00Z',
        triageTime: '2024-10-23T08:50:00Z',
        treatmentStartTime: '2024-10-23T09:15:00Z',
        notes: 'Diabetes follow-up',
        createdAt: '2024-10-20T00:00:00Z',
        updatedAt: '2024-10-23T09:15:00Z'
    },
    {
        id: 'appt-2',
        patientId: 'patient-2',
        practitionerId: 'prac-2',
        scheduledDate: '2024-10-23',
        scheduledTime: '10:30',
        duration: 45,
        appointmentType: 'Urgent Care',
        status: AppointmentStatus.WAITING,
        checkInTime: '2024-10-23T10:15:00Z',
        triageTime: '2024-10-23T10:20:00Z',
        createdAt: '2024-10-23T09:00:00Z',
        updatedAt: '2024-10-23T10:20:00Z'
    },
    {
        id: 'appt-3',
        patientId: 'patient-3',
        practitionerId: 'prac-1',
        scheduledDate: '2024-10-23',
        scheduledTime: '11:00',
        duration: 30,
        appointmentType: 'Annual Physical',
        status: AppointmentStatus.CHECKED_IN,
        checkInTime: '2024-10-23T10:45:00Z',
        createdAt: '2024-10-21T00:00:00Z',
        updatedAt: '2024-10-23T10:45:00Z'
    }
];

// Mock Vital Signs
export const mockVitalSigns: VitalSigns[] = [
    {
        id: 'vitals-1',
        patientId: 'patient-1',
        temperature: 98.6,
        bloodPressureSystolic: 140,
        bloodPressureDiastolic: 90,
        heartRate: 78,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 180,
        height: 70,
        bmi: 25.8,
        recordedBy: 'user-2',
        recordedAt: '2024-10-23T08:50:00Z',
        notes: 'BP slightly elevated'
    },
    {
        id: 'vitals-2',
        patientId: 'patient-2',
        temperature: 99.2,
        bloodPressureSystolic: 110,
        bloodPressureDiastolic: 70,
        heartRate: 95,
        respiratoryRate: 20,
        oxygenSaturation: 96,
        weight: 135,
        height: 65,
        bmi: 22.5,
        recordedBy: 'user-2',
        recordedAt: '2024-10-23T10:20:00Z',
        notes: 'Slightly elevated temp and HR'
    }
];

// Mock Triage Assessments
export const mockTriageAssessments: TriageAssessment[] = [
    {
        id: 'triage-1',
        patientId: 'patient-1',
        appointmentId: 'appt-1',
        priority: TriagePriority.SEMI_URGENT,
        chiefComplaint: 'Follow-up for diabetes management',
        symptoms: ['Increased thirst', 'Frequent urination'],
        painLevel: 2,
        vitalSigns: mockVitalSigns[0],
        assessmentNotes: 'Stable diabetic patient for routine follow-up',
        triageNurse: 'user-2',
        assessedAt: '2024-10-23T08:50:00Z',
        estimatedWaitTime: 25
    },
    {
        id: 'triage-2',
        patientId: 'patient-2',
        appointmentId: 'appt-2',
        priority: TriagePriority.URGENT,
        chiefComplaint: 'Difficulty breathing',
        symptoms: ['Shortness of breath', 'Wheezing', 'Chest tightness'],
        painLevel: 6,
        vitalSigns: mockVitalSigns[1],
        assessmentNotes: 'Possible asthma exacerbation, needs prompt attention',
        triageNurse: 'user-2',
        assessedAt: '2024-10-23T10:20:00Z',
        estimatedWaitTime: 15
    }
];

// Mock Queue
export const mockQueue: QueueItem[] = [
    {
        id: 'queue-1',
        patientId: 'patient-2',
        appointmentId: 'appt-2',
        priority: TriagePriority.URGENT,
        status: AppointmentStatus.WAITING,
        checkInTime: '2024-10-23T10:15:00Z',
        estimatedWaitTime: 15,
        currentWaitTime: 25,
        assignedPractitioner: 'prac-2',
        position: 1
    },
    {
        id: 'queue-2',
        patientId: 'patient-3',
        appointmentId: 'appt-3',
        priority: TriagePriority.NON_URGENT,
        status: AppointmentStatus.CHECKED_IN,
        checkInTime: '2024-10-23T10:45:00Z',
        estimatedWaitTime: 30,
        currentWaitTime: 5,
        position: 2
    }
];

// Mock Invoices
// Amounts converted from USD to KES (1 USD = 130 KES)
export const mockInvoices: Invoice[] = [
    {
        id: 'inv-1',
        patientId: 'patient-1',
        appointmentId: 'appt-1',
        invoiceNumber: 'INV-2024-001',
        issueDate: '2024-10-23',
        dueDate: '2024-11-23',
        services: [
            {
                serviceId: 'service-1',
                serviceName: 'Office Visit - Established Patient',
                cptCode: '99213',
                quantity: 1,
                unitPrice: 19500.00,
                totalPrice: 19500.00,
                insuranceCovered: 15600.00,
                patientPortion: 3900.00
            },
            {
                serviceId: 'service-3',
                serviceName: 'Comprehensive Metabolic Panel',
                cptCode: '80053',
                quantity: 1,
                unitPrice: 9750.00,
                totalPrice: 9750.00,
                insuranceCovered: 7800.00,
                patientPortion: 1950.00
            }
        ],
        subtotal: 29250.00,
        tax: 0.00,
        total: 29250.00,
        insuranceCoverage: 23400.00,
        patientResponsibility: 5850.00,
        status: PaymentStatus.PAID,
        payments: [
            {
                id: 'pay-1',
                invoiceId: 'inv-1',
                amount: 5850.00,
                method: PaymentMethod.M_PESA,
                transactionId: 'TXN123456789',
                processedAt: '2024-10-23T11:30:00Z',
                processedBy: 'user-4',
                notes: 'Patient copay and deductible - M-Pesa payment'
            }
        ],
        createdAt: '2024-10-23T11:00:00Z',
        updatedAt: '2024-10-23T11:30:00Z'
    }
];

// Mock Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
    totalPatients: 156,
    patientsInQueue: 2,
    averageWaitTime: 22,
    dailyRevenue: 3450.00,
    pendingPayments: 1250.00,
    completedAppointments: 8,
    criticalPatients: 0,
    availablePractitioners: 2
};

// Mock Prescriptions
export const mockPrescriptions: Prescription[] = [
    {
        id: 'rx-1',
        medicationName: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '90 days',
        quantity: 180,
        refills: 5,
        instructions: 'Take with food to reduce stomach upset',
        prescribedBy: 'prac-1',
        prescribedAt: '2024-10-23T09:30:00Z'
    },
    {
        id: 'rx-2',
        medicationName: 'Albuterol Inhaler',
        dosage: '90mcg',
        frequency: 'As needed',
        duration: '30 days',
        quantity: 1,
        refills: 2,
        instructions: 'Use for shortness of breath or wheezing',
        prescribedBy: 'prac-2',
        prescribedAt: '2024-10-23T10:45:00Z'
    }
];

// Mock Treatment Records
export const mockTreatmentRecords: TreatmentRecord[] = [
    {
        id: 'treatment-1',
        appointmentId: 'appt-1',
        patientId: 'patient-1',
        practitionerId: 'prac-1',
        services: [
            { serviceId: 'service-1', quantity: 1, notes: 'Routine follow-up' },
            { serviceId: 'service-3', quantity: 1, notes: 'Monitor glucose levels' }
        ],
        diagnoses: [
            { codeId: 'diag-2', isPrimary: true, notes: 'Well controlled' },
            { codeId: 'diag-1', isPrimary: false, notes: 'Stable on medication' }
        ],
        prescriptions: [mockPrescriptions[0]],
        treatmentNotes: 'Patient doing well on current medication regimen. Continue current treatment plan.',
        followUpRequired: true,
        followUpDate: '2024-12-23',
        createdAt: '2024-10-23T09:30:00Z'
    }
];

// Mock Insurance Claims
export const mockInsuranceClaims: InsuranceClaim[] = [
    {
        id: 'claim-1',
        invoiceId: 'inv-1',
        insuranceId: 'ins-1',
        claimNumber: 'CLM-2024-001',
        submissionDate: '2024-10-23',
        status: 'approved',
        approvedAmount: 23400.00, // Converted from USD 180.00 to KES (1 USD = 130 KES)
        paidDate: '2024-10-25',
        eobReceived: true,
        notes: 'Claim processed successfully'
    }
];

// Helper functions for mock data
export const getCurrentUser = (): User | null => {
    const userId = localStorage.getItem('currentUserId');
    return userId ? mockUsers.find(user => user.id === userId) || null : null;
};

export const getPatientById = (id: string): Patient | undefined => {
    return mockPatients.find(patient => patient.id === id);
};

export const getPractitionerById = (id: string): Practitioner | undefined => {
    return mockPractitioners.find(practitioner => practitioner.id === id);
};

export const getAppointmentsByPatient = (patientId: string): Appointment[] => {
    return mockAppointments.filter(appointment => appointment.patientId === patientId);
};

export const getInvoicesByPatient = (patientId: string): Invoice[] => {
    return mockInvoices.filter(invoice => invoice.patientId === patientId);
};

export const getTodaysAppointments = (): Appointment[] => {
    const today = new Date().toISOString().split('T')[0];
    return mockAppointments.filter(appointment => appointment.scheduledDate === today);
};

export const getQueueByPriority = (): QueueItem[] => {
    const priorityOrder = {
        [TriagePriority.CRITICAL]: 0,
        [TriagePriority.URGENT]: 1,
        [TriagePriority.SEMI_URGENT]: 2,
        [TriagePriority.NON_URGENT]: 3
    };

    return [...mockQueue].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};