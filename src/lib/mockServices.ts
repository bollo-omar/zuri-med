import {
    User, Patient, Appointment, TriageAssessment, VitalSigns, Invoice, Payment,
    QueueItem, DashboardMetrics, TreatmentRecord, InsuranceClaim, Prescription,
    UserRole, TriagePriority, AppointmentStatus, PaymentStatus, PaymentMethod,
    ApiResponse, PaginatedResponse, PatientRegistrationForm, CheckInForm, PaymentForm
} from '../types';

import {
    mockUsers, mockPatients, mockAppointments, mockTriageAssessments,
    mockVitalSigns, mockInvoices, mockQueue, mockDashboardMetrics,
    mockTreatmentRecords, mockInsuranceClaims, mockPrescriptions,
    mockServiceItems, mockDiagnosisCodes, mockPractitioners
} from './mockData';

// Export mock data for components to use
export { mockServiceItems, mockDiagnosisCodes, mockInvoices };

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Local storage keys
const STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    PATIENTS: 'patients',
    APPOINTMENTS: 'appointments',
    QUEUE: 'queue',
    INVOICES: 'invoices',
    TRIAGE_ASSESSMENTS: 'triageAssessments',
    VITAL_SIGNS: 'vitalSigns',
    TREATMENT_RECORDS: 'treatmentRecords',
    AUDIT_LOG: 'auditLog'
};

// Initialize localStorage with mock data
export const initializeMockData = () => {
    if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(mockPatients));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(mockAppointments));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUEUE)) {
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(mockQueue));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(mockInvoices));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRIAGE_ASSESSMENTS)) {
        localStorage.setItem(STORAGE_KEYS.TRIAGE_ASSESSMENTS, JSON.stringify(mockTriageAssessments));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VITAL_SIGNS)) {
        localStorage.setItem(STORAGE_KEYS.VITAL_SIGNS, JSON.stringify(mockVitalSigns));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TREATMENT_RECORDS)) {
        localStorage.setItem(STORAGE_KEYS.TREATMENT_RECORDS, JSON.stringify(mockTreatmentRecords));
    }
};

// Audit logging
const logAudit = (action: string, resource: string, resourceId: string, details: Record<string, unknown> = {}) => {
    const currentUser = getCurrentUser();
    const auditEntry = {
        id: `audit-${Date.now()}`,
        userId: currentUser?.id || 'system',
        action,
        resource,
        resourceId,
        details,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent
    };

    const existingLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOG) || '[]');
    existingLogs.push(auditEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(existingLogs));
};

// Authentication Service
export class AuthService {
    static async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
        await delay();

        const user = mockUsers.find(u => u.email === email);
        if (!user || password !== 'password123') {
            return {
                success: false,
                error: 'Invalid email or password'
            };
        }

        const token = `mock-jwt-token-${user.id}-${Date.now()}`;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ user, token }));

        logAudit('LOGIN', 'user', user.id);

        return {
            success: true,
            data: { user, token }
        };
    }

    static async logout(): Promise<ApiResponse<void>> {
        await delay(200);

        const currentUser = getCurrentUser();
        if (currentUser) {
            logAudit('LOGOUT', 'user', currentUser.id);
        }

        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

        return { success: true };
    }

    static getCurrentUser(): User | null {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (!stored) return null;

        try {
            const { user } = JSON.parse(stored);
            return user;
        } catch {
            return null;
        }
    }

    static async validateToken(token: string): Promise<boolean> {
        await delay(100);
        return token.startsWith('mock-jwt-token-');
    }
}

// Patient Service
export class PatientService {
    static async getPatients(page = 1, pageSize = 10, search = ''): Promise<ApiResponse<PaginatedResponse<Patient>>> {
        await delay();

        const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
        let filteredPatients = patients;

        if (search) {
            const searchLower = search.toLowerCase();
            filteredPatients = patients.filter((p: Patient) =>
                p.firstName.toLowerCase().includes(searchLower) ||
                p.lastName.toLowerCase().includes(searchLower) ||
                p.email?.toLowerCase().includes(searchLower) ||
                p.phone.includes(search)
            );
        }

        const total = filteredPatients.length;
        const startIndex = (page - 1) * pageSize;
        const paginatedPatients = filteredPatients.slice(startIndex, startIndex + pageSize);

        return {
            success: true,
            data: {
                data: paginatedPatients,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }

    static async getPatientById(id: string): Promise<ApiResponse<Patient>> {
        await delay();

        const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
        const patient = patients.find((p: Patient) => p.id === id);

        if (!patient) {
            return {
                success: false,
                error: 'Patient not found'
            };
        }

        logAudit('VIEW', 'patient', id);

        return {
            success: true,
            data: patient
        };
    }

    static async createPatient(patientData: PatientRegistrationForm): Promise<ApiResponse<Patient>> {
        await delay();

        const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
        const newPatient: Patient = {
            id: `patient-${Date.now()}`,
            ...patientData,
            medicalHistory: {
                allergies: [],
                medications: [],
                conditions: [],
                surgeries: [],
                familyHistory: [],
                socialHistory: {
                    smoking: false,
                    alcohol: false,
                    drugs: false
                }
            },
            insurance: patientData.insurance ? [{
                id: `ins-${Date.now()}`,
                provider: patientData.insurance.provider,
                policyNumber: patientData.insurance.policyNumber,
                groupNumber: patientData.insurance.groupNumber,
                subscriberId: patientData.insurance.subscriberId,
                subscriberName: `${patientData.firstName} ${patientData.lastName}`,
                relationship: 'Self',
                isPrimary: true,
                status: 'active' as const,
                effectiveDate: new Date().toISOString().split('T')[0]
            }] : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        patients.push(newPatient);
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

        logAudit('CREATE', 'patient', newPatient.id, patientData);

        return {
            success: true,
            data: newPatient
        };
    }

    static async updatePatient(id: string, updates: Partial<Patient>): Promise<ApiResponse<Patient>> {
        await delay();

        const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
        const patientIndex = patients.findIndex((p: Patient) => p.id === id);

        if (patientIndex === -1) {
            return {
                success: false,
                error: 'Patient not found'
            };
        }

        patients[patientIndex] = {
            ...patients[patientIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

        logAudit('UPDATE', 'patient', id, updates);

        return {
            success: true,
            data: patients[patientIndex]
        };
    }
}

// Appointment Service
export class AppointmentService {
    static async getAppointments(date?: string): Promise<ApiResponse<Appointment[]>> {
        await delay();

        const appointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');
        let filteredAppointments = appointments;

        if (date) {
            filteredAppointments = appointments.filter((a: Appointment) => a.scheduledDate === date);
        }

        return {
            success: true,
            data: filteredAppointments
        };
    }

    static async checkInPatient(appointmentId: string, checkInData: CheckInForm): Promise<ApiResponse<Appointment>> {
        await delay();

        const appointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');
        const appointmentIndex = appointments.findIndex((a: Appointment) => a.id === appointmentId);

        if (appointmentIndex === -1) {
            return {
                success: false,
                error: 'Appointment not found'
            };
        }

        appointments[appointmentIndex] = {
            ...appointments[appointmentIndex],
            status: AppointmentStatus.CHECKED_IN,
            checkInTime: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));

        // Add to queue
        await QueueService.addToQueue(appointmentId, TriagePriority.NON_URGENT);

        logAudit('CHECK_IN', 'appointment', appointmentId, checkInData);

        return {
            success: true,
            data: appointments[appointmentIndex]
        };
    }
}

// Triage Service
export class TriageService {
    static async createAssessment(assessment: Omit<TriageAssessment, 'id' | 'assessedAt'>): Promise<ApiResponse<TriageAssessment>> {
        await delay();

        const assessments = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIAGE_ASSESSMENTS) || '[]');
        const newAssessment: TriageAssessment = {
            ...assessment,
            id: `triage-${Date.now()}`,
            assessedAt: new Date().toISOString()
        };

        assessments.push(newAssessment);
        localStorage.setItem(STORAGE_KEYS.TRIAGE_ASSESSMENTS, JSON.stringify(assessments));

        // Update queue priority
        await QueueService.updateQueuePriority(assessment.appointmentId, assessment.priority);

        logAudit('CREATE', 'triage_assessment', newAssessment.id, assessment);

        return {
            success: true,
            data: newAssessment
        };
    }

    static async getAssessmentByAppointment(appointmentId: string): Promise<ApiResponse<TriageAssessment>> {
        await delay();

        const assessments = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIAGE_ASSESSMENTS) || '[]');
        const assessment = assessments.find((a: TriageAssessment) => a.appointmentId === appointmentId);

        if (!assessment) {
            return {
                success: false,
                error: 'Triage assessment not found'
            };
        }

        return {
            success: true,
            data: assessment
        };
    }
}

// Queue Service
export class QueueService {
    static async getQueue(): Promise<ApiResponse<QueueItem[]>> {
        await delay();

        const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');

        // Update wait times
        const updatedQueue = queue.map((item: QueueItem, index: number) => ({
            ...item,
            position: index + 1,
            currentWaitTime: Math.floor((Date.now() - new Date(item.checkInTime).getTime()) / 60000)
        }));

        return {
            success: true,
            data: updatedQueue
        };
    }

    static async addToQueue(appointmentId: string, priority: TriagePriority): Promise<ApiResponse<QueueItem>> {
        await delay();

        const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');
        const appointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');

        const appointment = appointments.find((a: Appointment) => a.id === appointmentId);
        if (!appointment) {
            return {
                success: false,
                error: 'Appointment not found'
            };
        }

        const queueItem: QueueItem = {
            id: `queue-${Date.now()}`,
            patientId: appointment.patientId,
            appointmentId,
            priority,
            status: appointment.status,
            checkInTime: appointment.checkInTime || new Date().toISOString(),
            estimatedWaitTime: this.calculateEstimatedWaitTime(priority),
            currentWaitTime: 0,
            position: queue.length + 1
        };

        queue.push(queueItem);
        this.sortQueueByPriority(queue);
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));

        logAudit('ADD_TO_QUEUE', 'queue', queueItem.id, { appointmentId, priority });

        return {
            success: true,
            data: queueItem
        };
    }

    static async updateQueuePriority(appointmentId: string, priority: TriagePriority): Promise<ApiResponse<QueueItem>> {
        await delay();

        const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');
        const queueIndex = queue.findIndex((item: QueueItem) => item.appointmentId === appointmentId);

        if (queueIndex === -1) {
            return {
                success: false,
                error: 'Queue item not found'
            };
        }

        queue[queueIndex] = {
            ...queue[queueIndex],
            priority,
            estimatedWaitTime: this.calculateEstimatedWaitTime(priority)
        };

        this.sortQueueByPriority(queue);
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));

        logAudit('UPDATE_PRIORITY', 'queue', queue[queueIndex].id, { priority });

        return {
            success: true,
            data: queue[queueIndex]
        };
    }

    static async removeFromQueue(appointmentId: string): Promise<ApiResponse<void>> {
        await delay();

        const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');
        const filteredQueue = queue.filter((item: QueueItem) => item.appointmentId !== appointmentId);

        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(filteredQueue));

        logAudit('REMOVE_FROM_QUEUE', 'queue', appointmentId);

        return { success: true };
    }

    private static calculateEstimatedWaitTime(priority: TriagePriority): number {
        const baseTimes = {
            [TriagePriority.CRITICAL]: 5,
            [TriagePriority.URGENT]: 15,
            [TriagePriority.SEMI_URGENT]: 30,
            [TriagePriority.NON_URGENT]: 45
        };
        return baseTimes[priority];
    }

    private static sortQueueByPriority(queue: QueueItem[]): void {
        const priorityOrder = {
            [TriagePriority.CRITICAL]: 0,
            [TriagePriority.URGENT]: 1,
            [TriagePriority.SEMI_URGENT]: 2,
            [TriagePriority.NON_URGENT]: 3
        };

        queue.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // If same priority, sort by check-in time
            return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
        });

        // Update positions
        queue.forEach((item, index) => {
            item.position = index + 1;
        });
    }
}

// Billing Service
export class BillingService {
    static async createInvoice(appointmentId: string, services: Array<{ serviceId: string; quantity: number; unitPrice: number; totalPrice: number; serviceName: string; cptCode: string; insuranceCovered: number; patientPortion: number }>): Promise<ApiResponse<Invoice>> {
        await delay();

        const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
        const appointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');

        const appointment = appointments.find((a: Appointment) => a.id === appointmentId);
        if (!appointment) {
            return {
                success: false,
                error: 'Appointment not found'
            };
        }

        const subtotal = services.reduce((sum, service) => sum + service.totalPrice, 0);
        const tax = 0; // No tax for medical services
        const total = subtotal + tax;

        // Mock insurance calculation (80% coverage)
        const insuranceCoverage = total * 0.8;
        const patientResponsibility = total - insuranceCoverage;

        const newInvoice: Invoice = {
            id: `inv-${Date.now()}`,
            patientId: appointment.patientId,
            appointmentId,
            invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            services,
            subtotal,
            tax,
            total,
            insuranceCoverage,
            patientResponsibility,
            status: PaymentStatus.PENDING,
            payments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        invoices.push(newInvoice);
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

        logAudit('CREATE', 'invoice', newInvoice.id, { appointmentId, services });

        return {
            success: true,
            data: newInvoice
        };
    }

    static async getInvoices(patientId?: string): Promise<ApiResponse<Invoice[]>> {
        await delay();

        const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
        let filteredInvoices = invoices;

        if (patientId) {
            filteredInvoices = invoices.filter((inv: Invoice) => inv.patientId === patientId);
        }

        return {
            success: true,
            data: filteredInvoices
        };
    }
}

// Payment Service
export class PaymentService {
    static async processPayment(paymentData: PaymentForm): Promise<ApiResponse<Payment>> {
        await delay(1000); // Simulate payment processing time

        // Mock payment processing - always succeeds for demo
        const payment: Payment = {
            id: `pay-${Date.now()}`,
            invoiceId: paymentData.invoiceId,
            amount: paymentData.amount,
            method: paymentData.method,
            transactionId: `TXN-${Date.now()}`,
            processedAt: new Date().toISOString(),
            processedBy: getCurrentUser()?.id || 'system',
            notes: 'Payment processed successfully'
        };

        // Update invoice
        const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
        const invoiceIndex = invoices.findIndex((inv: Invoice) => inv.id === paymentData.invoiceId);

        if (invoiceIndex !== -1) {
            invoices[invoiceIndex].payments.push(payment);

            const totalPaid = invoices[invoiceIndex].payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
            const remaining = invoices[invoiceIndex].patientResponsibility - totalPaid;

            if (remaining <= 0) {
                invoices[invoiceIndex].status = PaymentStatus.PAID;
            } else if (totalPaid > 0) {
                invoices[invoiceIndex].status = PaymentStatus.PARTIAL;
            }

            invoices[invoiceIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        }

        logAudit('PROCESS_PAYMENT', 'payment', payment.id, paymentData);

        return {
            success: true,
            data: payment
        };
    }

    static async verifyInsurance(patientId: string, insuranceId: string): Promise<ApiResponse<{
        isActive: boolean;
        coveragePercentage: number;
        copay: number;
        deductible: number;
        deductibleMet: number;
        effectiveDate: string;
        expirationDate: string;
        benefits: Record<string, { covered: boolean; copay?: number; coinsurance?: number }>;
    }>> {
        await delay(2000); // Simulate insurance verification time

        // Mock insurance verification - always returns active coverage
        const verificationResult = {
            isActive: true,
            coveragePercentage: 80,
            copay: 25,
            deductible: 1500,
            deductibleMet: 750,
            effectiveDate: '2024-01-01',
            expirationDate: '2024-12-31',
            benefits: {
                officeVisits: { covered: true, copay: 25 },
                diagnosticTests: { covered: true, coinsurance: 20 },
                prescriptions: { covered: true, copay: 10 }
            }
        };

        logAudit('VERIFY_INSURANCE', 'insurance', insuranceId, { patientId });

        return {
            success: true,
            data: verificationResult
        };
    }
}

// Dashboard Service
export class DashboardService {
    static async getMetrics(): Promise<ApiResponse<DashboardMetrics>> {
        await delay();

        const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');
        const appointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');
        const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');

        const today = new Date().toISOString().split('T')[0];
        const todaysAppointments = appointments.filter((a: Appointment) => a.scheduledDate === today);
        const completedToday = todaysAppointments.filter((a: Appointment) => a.status === AppointmentStatus.COMPLETED);
        const criticalPatients = queue.filter((q: QueueItem) => q.priority === TriagePriority.CRITICAL);

        const dailyRevenue = invoices
            .filter((inv: Invoice) => inv.issueDate === today)
            .reduce((sum: number, inv: Invoice) => sum + inv.total, 0);

        const pendingPayments = invoices
            .filter((inv: Invoice) => inv.status === PaymentStatus.PENDING || inv.status === PaymentStatus.PARTIAL)
            .reduce((sum: number, inv: Invoice) => sum + (inv.patientResponsibility - inv.payments.reduce((pSum: number, p: Payment) => pSum + p.amount, 0)), 0);

        const averageWaitTime = queue.length > 0
            ? queue.reduce((sum: number, q: QueueItem) => sum + q.currentWaitTime, 0) / queue.length
            : 0;

        const metrics: DashboardMetrics = {
            totalPatients: JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]').length,
            patientsInQueue: queue.length,
            averageWaitTime: Math.round(averageWaitTime),
            dailyRevenue,
            pendingPayments,
            completedAppointments: completedToday.length,
            criticalPatients: criticalPatients.length,
            availablePractitioners: mockPractitioners.filter(p => p.isAvailable).length
        };

        return {
            success: true,
            data: metrics
        };
    }
}

// Helper function to get current user
function getCurrentUser(): User | null {
    return AuthService.getCurrentUser();
}

// Real-time updates simulation
export class RealtimeService {
    private static listeners: { [key: string]: Array<(data: unknown) => void> } = {};

    static subscribe(event: string, callback: (data: unknown) => void) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    static unsubscribe(event: string, callback: (data: unknown) => void) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    static emit(event: string, data: unknown) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Simulate periodic updates
    static startSimulation() {
        setInterval(() => {
            this.emit('queue_updated', {});
            this.emit('metrics_updated', {});
        }, 30000); // Update every 30 seconds
    }
}

// Initialize mock data on module load
initializeMockData();