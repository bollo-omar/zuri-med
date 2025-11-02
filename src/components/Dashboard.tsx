import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Users, Clock, DollarSign, AlertTriangle,
    TrendingUp, Calendar, Heart, Activity,
    CheckCircle, XCircle, User as UserIcon
} from 'lucide-react';
import { User, UserRole, DashboardMetrics, QueueItem, Appointment } from '@/types';
import { DashboardService, QueueService, AppointmentService } from '@/lib/mockServices';

interface DashboardProps {
    user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [metricsResponse, queueResponse, appointmentsResponse] = await Promise.all([
                DashboardService.getMetrics(),
                QueueService.getQueue(),
                AppointmentService.getAppointments(new Date().toISOString().split('T')[0])
            ]);

            if (metricsResponse.success && metricsResponse.data) {
                setMetrics(metricsResponse.data);
            }
            if (queueResponse.success && queueResponse.data) {
                setQueue(queueResponse.data);
            }
            if (appointmentsResponse.success && appointmentsResponse.data) {
                setAppointments(appointmentsResponse.data);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'semi_urgent': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'non_urgent': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'checked_in': return 'bg-green-100 text-green-800';
            case 'in_triage': return 'bg-yellow-100 text-yellow-800';
            case 'waiting': return 'bg-orange-100 text-orange-800';
            case 'in_treatment': return 'bg-purple-100 text-purple-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const renderAdminDashboard = () => (
        <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalPatients || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Active patient records
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patients in Queue</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.patientsInQueue || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Avg wait: {metrics?.averageWaitTime || 0} min
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics?.dailyRevenue?.toFixed(2) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">
                            Today's earnings
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Patients</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{metrics?.criticalPatients || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Require immediate attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Queue and Appointments */}
            <Tabs defaultValue="queue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="queue">Current Queue</TabsTrigger>
                    <TabsTrigger value="appointments">Today's Appointments</TabsTrigger>
                </TabsList>

                <TabsContent value="queue">
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Queue</CardTitle>
                            <CardDescription>
                                Real-time view of patients waiting for care
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {queue.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No patients in queue</p>
                            ) : (
                                <div className="space-y-4">
                                    {queue.slice(0, 10).map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-blue-600">#{item.position}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Patient ID: {item.patientId}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Checked in: {new Date(item.checkInTime).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge className={getPriorityColor(item.priority)}>
                                                    {item.priority.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-sm text-gray-500">
                          {item.currentWaitTime}m wait
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appointments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Appointments</CardTitle>
                            <CardDescription>
                                Scheduled appointments for {new Date().toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {appointments.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No appointments scheduled</p>
                            ) : (
                                <div className="space-y-4">
                                    {appointments.slice(0, 10).map((appointment) => (
                                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <Calendar className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="font-medium">{appointment.scheduledTime}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Patient: {appointment.patientId}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={getStatusColor(appointment.status)}>
                                                {appointment.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );

    const renderPractitionerDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            My Appointments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{appointments.length}</div>
                        <p className="text-sm text-gray-500">Scheduled today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="w-5 h-5 mr-2" />
                            Next Patient
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {queue.length > 0 ? (
                            <div>
                                <div className="text-lg font-semibold">Patient #{queue[0].position}</div>
                                <p className="text-sm text-gray-500">
                                    Priority: {queue[0].priority.replace('_', ' ')}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No patients waiting</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Activity className="w-5 h-5 mr-2" />
                            Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Available</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Patient Queue</CardTitle>
                    <CardDescription>Patients waiting for your attention</CardDescription>
                </CardHeader>
                <CardContent>
                    {queue.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No patients in queue</p>
                    ) : (
                        <div className="space-y-4">
                            {queue.slice(0, 5).map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-blue-600">#{item.position}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">Patient ID: {item.patientId}</p>
                                            <p className="text-sm text-gray-500">
                                                Wait time: {item.currentWaitTime} minutes
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge className={getPriorityColor(item.priority)}>
                                            {item.priority.replace('_', ' ')}
                                        </Badge>
                                        <Button size="sm">See Patient</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderPatientDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <UserIcon className="w-5 h-5 mr-2" />
                            My Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Phone:</strong> {user.phone}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Next Appointment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {appointments.length > 0 ? (
                            <div>
                                <p className="font-semibold">{appointments[0].scheduledDate}</p>
                                <p className="text-sm text-gray-500">{appointments[0].scheduledTime}</p>
                                <Badge className={getStatusColor(appointments[0].status)}>
                                    {appointments[0].status.replace('_', ' ')}
                                </Badge>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No upcoming appointments</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="font-medium">Appointment Completed</p>
                                <p className="text-sm text-gray-500">Last visit on {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="font-medium">Appointment Scheduled</p>
                                <p className="text-sm text-gray-500">Next visit scheduled</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderDefaultDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Heart className="w-5 h-5 mr-2 text-red-500" />
                            Welcome
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Welcome to MediFlow, {user.firstName}!</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Your role: {user.role.replace('_', ' ')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Activity className="w-5 h-5 mr-2" />
                            System Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm">All systems operational</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Quick Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">Patients in queue: {queue.length}</p>
                        <p className="text-sm">Today's appointments: {appointments.length}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">
                        Welcome back, {user.firstName}! Here's what's happening today.
                    </p>
                </div>
                <Button onClick={loadDashboardData} variant="outline">
                    <Activity className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {user.role === UserRole.ADMIN && renderAdminDashboard()}
            {user.role === UserRole.PRACTITIONER && renderPractitionerDashboard()}
            {user.role === UserRole.PATIENT && renderPatientDashboard()}
            {![UserRole.ADMIN, UserRole.PRACTITIONER, UserRole.PATIENT].includes(user.role) && renderDefaultDashboard()}
        </div>
    );
};

export default Dashboard;