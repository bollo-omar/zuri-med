import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge.tsx';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Lock, User, Shield, AlertCircle } from 'lucide-react';
import { AuthService } from '@/lib/mockServices';
import { UserRole, User as UserType } from '@/types';
import { toast } from 'sonner';

interface LoginProps {
    onLogin: (user: UserType, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await AuthService.login(email, password);
            if (response.success && response.data) {
                toast.success('Login successful');
                onLogin(response.data.user, response.data.token);
            } else {
                setError(response.error || 'Login failed');
            }
        } catch (error) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (role: UserRole) => {
        const demoAccounts = {
            [UserRole.ADMIN]: 'admin@clinic.com',
            [UserRole.PRACTITIONER]: 'dr.smith@clinic.com',
            [UserRole.TRIAGE_NURSE]: 'nurse@clinic.com',
            [UserRole.BILLING_STAFF]: 'billing@clinic.com',
            [UserRole.RECEPTIONIST]: 'reception@clinic.com',
            [UserRole.PATIENT]: 'john.doe@email.com'
        };

        setEmail(demoAccounts[role]);
        setPassword('password123');

        // Auto-submit after setting credentials
        setTimeout(() => {
            const form = document.querySelector('form');
            if (form) {
                form.requestSubmit();
            }
        }, 100);
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
            case UserRole.PRACTITIONER: return 'bg-blue-100 text-blue-800 border-blue-200';
            case UserRole.TRIAGE_NURSE: return 'bg-red-100 text-red-800 border-red-200';
            case UserRole.BILLING_STAFF: return 'bg-green-100 text-green-800 border-green-200';
            case UserRole.RECEPTIONIST: return 'bg-orange-100 text-orange-800 border-orange-200';
            case UserRole.PATIENT: return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRoleDescription = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return 'Full system access and management';
            case UserRole.PRACTITIONER: return 'Patient care and treatment management';
            case UserRole.TRIAGE_NURSE: return 'Patient assessment and triage';
            case UserRole.BILLING_STAFF: return 'Billing and payment processing';
            case UserRole.RECEPTIONIST: return 'Patient check-in and scheduling';
            case UserRole.PATIENT: return 'Personal health records and appointments';
            default: return 'Standard user access';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Login Form */}
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Heart className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">MediFlow</h1>
                                <p className="text-sm text-gray-500">Clinic Management System</p>
                            </div>
                        </div>
                        <CardTitle className="text-xl">Welcome Back</CardTitle>
                        <CardDescription>
                            Sign in to access your clinic management dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Lock className="w-4 h-4" />
                                        <span>Sign In</span>
                                    </div>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">Demo Access</span>
                                </div>
                            </div>

                            <p className="text-xs text-center text-gray-600 mt-2 mb-3">
                                Use demo accounts to explore different user roles
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDemoLogin(UserRole.ADMIN)}
                                    disabled={loading}
                                >
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDemoLogin(UserRole.PRACTITIONER)}
                                    disabled={loading}
                                >
                                    <User className="w-3 h-3 mr-1" />
                                    Doctor
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDemoLogin(UserRole.TRIAGE_NURSE)}
                                    disabled={loading}
                                >
                                    <Heart className="w-3 h-3 mr-1" />
                                    Nurse
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDemoLogin(UserRole.PATIENT)}
                                    disabled={loading}
                                >
                                    <User className="w-3 h-3 mr-1" />
                                    Patient
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500">
                                Default password for all demo accounts: <code className="bg-gray-100 px-1 rounded">password123</code>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Demo Accounts Info */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-blue-600" />
                            Demo User Roles
                        </CardTitle>
                        <CardDescription>
                            Explore different perspectives of the clinic management system
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.values(UserRole).map((role) => (
                            <div
                                key={role}
                                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleDemoLogin(role)}
                            >
                                <Badge className={getRoleColor(role)}>
                                    {role.replace('_', ' ')}
                                </Badge>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {role === UserRole.ADMIN && 'System Administrator'}
                                        {role === UserRole.PRACTITIONER && 'Medical Practitioner'}
                                        {role === UserRole.TRIAGE_NURSE && 'Triage Nurse'}
                                        {role === UserRole.BILLING_STAFF && 'Billing Specialist'}
                                        {role === UserRole.RECEPTIONIST && 'Front Desk Receptionist'}
                                        {role === UserRole.PATIENT && 'Patient Portal'}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {getRoleDescription(role)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">System Features</h4>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>• Patient registration and management</li>
                                <li>• Triage system with priority assessment</li>
                                <li>• Real-time patient queue management</li>
                                <li>• Billing and payment processing</li>
                                <li>• Insurance verification and claims</li>
                                <li>• Role-based access control</li>
                                <li>• HIPAA-compliant data handling</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;