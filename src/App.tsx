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
import { AuthService, initializeMockData } from './lib/mockServices';
import { User } from './types';

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
                                <Route path="/patients" element={<PatientManagement user={user} />} />
                                <Route path="/check-in" element={<PatientManagement user={user} />} />
                                <Route path="/triage" element={<TriageSystem user={user} />} />
                                <Route path="/queue" element={<TriageSystem user={user} />} />
                                <Route path="/practitioner" element={<Dashboard user={user} />} />
                                <Route path="/appointments" element={<Dashboard user={user} />} />
                                <Route path="/billing" element={<BillingSystem user={user} />} />
                                <Route path="/payments" element={<BillingSystem user={user} />} />
                                <Route path="/financial-reports" element={<BillingSystem user={user} />} />
                                <Route path="/patient-portal" element={<Dashboard user={user} />} />
                                <Route path="/patient-bills" element={<BillingSystem user={user} />} />
                                <Route path="/settings" element={<Dashboard user={user} />} />
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