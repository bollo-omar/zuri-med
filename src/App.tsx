import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import TriageSystem from './components/TriageSystem.tsx';
import BillingSystem from './components/BillingSystem';
import AppointmentScheduling from './components/AppointmentScheduling';
import DiagnosticTesting from './components/DiagnosticTesting';
import Documentation from './components/Documentation';
import FollowUpScheduling from './components/FollowUpScheduling';
import SpecialistConsultation from './components/SpecialistConsultation';
import TreatmentPlanning from './components/TreatmentPlanning';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthService, initializeMockData } from './lib/mockServices';
import { User, UserRole } from './types';

const queryClient = new QueryClient();

// Initialize mock data when app starts
initializeMockData();

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing authentication on app start
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setToken('mock-token'); // In a real app, you'd get this from localStorage too
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData: User, authToken: string) => {
        setUser(userData);
        setToken(authToken);
    };

    const handleLogout = () => {
        setUser(null);
        setToken(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                    {!user ? (
                        <Login onLogin={handleLogin} />
                    ) : (
                        <Layout user={user} onLogout={handleLogout}>
                            <Routes>
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<Dashboard user={user} />} />
                                
                                {/* Patient Management - All staff roles + patients can view */}
                                <Route path="/patients" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.PRACTITIONER, UserRole.TRIAGE_NURSE, UserRole.BILLING_STAFF, UserRole.RECEPTIONIST, UserRole.PATIENT]}>
                                        <PatientManagement user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Check-in - Receptionist and Admin */}
                                <Route path="/check-in" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.RECEPTIONIST]}>
                                        <PatientManagement user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Triage System - Triage Nurses and Admin */}
                                <Route path="/triage" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.TRIAGE_NURSE]}>
                                        <TriageSystem user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Queue Management - Admin, Triage, Receptionist */}
                                <Route path="/queue" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.TRIAGE_NURSE, UserRole.RECEPTIONIST, UserRole.PRACTITIONER]}>
                                        <TriageSystem user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Practitioner Portal */}
                                <Route path="/practitioner" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.PRACTITIONER]}>
                                        <Dashboard user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Appointment Scheduling - Admin, Practitioner, Receptionist, Patient */}
                                <Route path="/appointments" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.PRACTITIONER, UserRole.RECEPTIONIST, UserRole.PATIENT]}>
                                        <AppointmentScheduling user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Specialist Consultation - Admin, Practitioner */}
                                <Route path="/specialist-consultation" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.PRACTITIONER]}>
                                        <SpecialistConsultation user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Diagnostic Testing - Admin, Practitioner, Lab Technician */}
                                <Route path="/diagnostic-testing" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.PRACTITIONER, UserRole.LAB_TECHNICIAN]}>
                                        <DiagnosticTesting user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Documentation - Admin, Practitioner */}
                                <Route path="/documentation" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.PRACTITIONER]}>
                                        <Documentation user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Follow-Up Scheduling - Admin, Practitioner, Receptionist */}
                                <Route path="/follow-up-scheduling" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.PRACTITIONER, UserRole.RECEPTIONIST]}>
                                        <FollowUpScheduling />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Treatment Planning - Admin, Practitioner */}
                                <Route path="/treatment-planning" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.PRACTITIONER]}>
                                        <TreatmentPlanning />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Billing System - Admin and Billing Staff */}
                                <Route path="/billing" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.BILLING_STAFF]}>
                                        <BillingSystem user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Payments - Admin, Billing Staff, Receptionist */}
                                <Route path="/payments" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.BILLING_STAFF, UserRole.RECEPTIONIST]}>
                                        <BillingSystem user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Financial Reports - Admin and Billing Staff */}
                                <Route path="/financial-reports" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.BILLING_STAFF]}>
                                        <BillingSystem user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Patient Portal - Patients only */}
                                <Route path="/patient-portal" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.PATIENT]}>
                                        <Dashboard user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Patient Bills - Patients only */}
                                <Route path="/patient-bills" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.PATIENT]}>
                                        <BillingSystem user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Settings - Admin only */}
                                <Route path="/settings" element={
                                    <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
                                        <Dashboard user={user} />
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </Layout>
                    )}
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    );
};

export default App;