import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge.tsx';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Heart, Users, UserCheck, Stethoscope, Calendar,
    CreditCard, DollarSign, BarChart3, Settings,
    LogOut, Menu, Bell, User as UserIcon
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { useLocation, Link } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    user: User;
    onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const getNavigationItems = () => {
        const baseItems = [
            { icon: BarChart3, label: 'Dashboard', path: '/dashboard', roles: [UserRole.ADMIN, UserRole.PRACTITIONER, UserRole.TRIAGE_NURSE, UserRole.BILLING_STAFF, UserRole.RECEPTIONIST, UserRole.PATIENT] }
        ];

        const roleBasedItems = {
            [UserRole.ADMIN]: [
                { icon: Users, label: 'Patient Management', path: '/patients' },
                { icon: UserCheck, label: 'Check-in', path: '/check-in' },
                { icon: Stethoscope, label: 'Triage System', path: '/triage' },
                { icon: Calendar, label: 'Queue Management', path: '/queue' },
                { icon: CreditCard, label: 'Billing System', path: '/billing' },
                { icon: DollarSign, label: 'Payments', path: '/payments' },
                { icon: BarChart3, label: 'Financial Reports', path: '/financial-reports' },
                { icon: Settings, label: 'Settings', path: '/settings' }
            ],
            [UserRole.PRACTITIONER]: [
                { icon: Stethoscope, label: 'Patient Care', path: '/practitioner' },
                { icon: Calendar, label: 'Appointments', path: '/appointments' },
                { icon: Users, label: 'Patient Records', path: '/patients' }
            ],
            [UserRole.TRIAGE_NURSE]: [
                { icon: Stethoscope, label: 'Triage System', path: '/triage' },
                { icon: Calendar, label: 'Queue Management', path: '/queue' },
                { icon: Users, label: 'Patient Records', path: '/patients' }
            ],
            [UserRole.BILLING_STAFF]: [
                { icon: CreditCard, label: 'Billing System', path: '/billing' },
                { icon: DollarSign, label: 'Payments', path: '/payments' },
                { icon: BarChart3, label: 'Financial Reports', path: '/financial-reports' },
                { icon: Users, label: 'Patient Records', path: '/patients' }
            ],
            [UserRole.RECEPTIONIST]: [
                { icon: UserCheck, label: 'Patient Check-in', path: '/check-in' },
                { icon: Users, label: 'Patient Management', path: '/patients' },
                { icon: Calendar, label: 'Queue Status', path: '/queue' }
            ],
            [UserRole.PATIENT]: [
                { icon: UserIcon, label: 'Patient Portal', path: '/patient-portal' },
                { icon: CreditCard, label: 'My Bills', path: '/patient-bills' },
                { icon: Calendar, label: 'Appointments', path: '/appointments' }
            ]
        };

        return [...baseItems, ...(roleBasedItems[user.role] || [])];
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

    const navigationItems = getNavigationItems();

    const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
        <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-6'}`}>
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">MediFlow</h1>
                    <p className="text-xs text-gray-500">Clinic Management</p>
                </div>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                </div>
                <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                    {user.role.replace('_', ' ').toUpperCase()}
                </Badge>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navigationItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => mobile && setSidebarOpen(false)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <Separator className="my-4" />

            {/* Logout */}
            <Button
                variant="ghost"
                onClick={onLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
                <Sidebar />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="p-0 w-64">
                    <Sidebar mobile />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {/* Mobile Menu Button */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="lg:hidden"
                                        onClick={() => setSidebarOpen(true)}
                                    >
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                </SheetTrigger>
                            </Sheet>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {navigationItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Welcome back, {user.firstName}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm">
                                <Bell className="w-4 h-4" />
                            </Button>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user.role.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;