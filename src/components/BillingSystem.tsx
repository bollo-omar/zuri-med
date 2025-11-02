import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    FileText, CreditCard, DollarSign, Receipt, Plus, Minus,
    Search, Filter, Download, Send, CheckCircle, XCircle,
    Clock, AlertCircle, Eye, Edit, Trash2, Calculator
} from 'lucide-react';
import {
    Invoice, Payment, Patient, ServiceItem, DiagnosisCode,
    PaymentStatus, PaymentMethod, UserRole, PaymentForm, User
} from '@/types';
import {
    BillingService, PaymentService, PatientService,
    mockServiceItems, mockDiagnosisCodes, mockInvoices
} from '@/lib/mockServices';
import { toast } from 'sonner';

interface BillingSystemProps {
    user: User;
}

interface InvoiceService {
    serviceId: string;
    serviceName: string;
    cptCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    insuranceCovered: number;
    patientPortion: number;
}

interface InvoiceFormData {
    patientId: string;
    appointmentId: string;
    services: InvoiceService[];
    notes: string;
}

const BillingSystem: React.FC<BillingSystemProps> = ({ user }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showCreateInvoice, setShowCreateInvoice] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

    useEffect(() => {
        loadBillingData();
    }, []);

    const loadBillingData = async () => {
        try {
            const [invoicesResponse, patientsResponse] = await Promise.all([
                BillingService.getInvoices(),
                PatientService.getPatients(1, 100)
            ]);

            if (invoicesResponse.success) setInvoices(invoicesResponse.data);
            if (patientsResponse.success) setPatients(patientsResponse.data.data);
        } catch (error) {
            toast.error('Failed to load billing data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.PAID: return 'bg-green-100 text-green-800 border-green-200';
            case PaymentStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case PaymentStatus.PARTIAL: return 'bg-orange-100 text-orange-800 border-orange-200';
            case PaymentStatus.OVERDUE: return 'bg-red-100 text-red-800 border-red-200';
            case PaymentStatus.CANCELLED: return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.PAID: return <CheckCircle className="w-4 h-4" />;
            case PaymentStatus.PENDING: return <Clock className="w-4 h-4" />;
            case PaymentStatus.PARTIAL: return <AlertCircle className="w-4 h-4" />;
            case PaymentStatus.OVERDUE: return <XCircle className="w-4 h-4" />;
            case PaymentStatus.CANCELLED: return <Minus className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const CreateInvoiceDialog = () => {
        const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
            patientId: '',
            appointmentId: '',
            services: [],
            notes: ''
        });
        const [selectedService, setSelectedService] = useState('');
        const [serviceQuantity, setServiceQuantity] = useState(1);

        const handleAddService = () => {
            const service = mockServiceItems.find(s => s.id === selectedService);
            if (service) {
                const newService: InvoiceService = {
                    serviceId: service.id,
                    serviceName: service.name,
                    cptCode: service.code,
                    quantity: serviceQuantity,
                    unitPrice: service.price,
                    totalPrice: service.price * serviceQuantity,
                    insuranceCovered: service.price * serviceQuantity * 0.8, // Mock 80% coverage
                    patientPortion: service.price * serviceQuantity * 0.2
                };

                setInvoiceData({
                    ...invoiceData,
                    services: [...invoiceData.services, newService]
                });
                setSelectedService('');
                setServiceQuantity(1);
            }
        };

        const handleRemoveService = (index: number) => {
            const newServices = [...invoiceData.services];
            newServices.splice(index, 1);
            setInvoiceData({ ...invoiceData, services: newServices });
        };

        const calculateTotals = () => {
            const subtotal = invoiceData.services.reduce((sum, service) => sum + service.totalPrice, 0);
            const insuranceCoverage = invoiceData.services.reduce((sum, service) => sum + service.insuranceCovered, 0);
            const patientResponsibility = invoiceData.services.reduce((sum, service) => sum + service.patientPortion, 0);

            return { subtotal, insuranceCoverage, patientResponsibility };
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            try {
                const response = await BillingService.createInvoice(
                    invoiceData.appointmentId || `appt-${Date.now()}`,
                    invoiceData.services
                );
                if (response.success) {
                    toast.success('Invoice created successfully');
                    setShowCreateInvoice(false);
                    loadBillingData();
                    // Reset form
                    setInvoiceData({ patientId: '', appointmentId: '', services: [], notes: '' });
                }
            } catch (error) {
                toast.error('Failed to create invoice');
            }
        };

        const totals = calculateTotals();

        return (
            <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Invoice</DialogTitle>
                        <DialogDescription>
                            Generate an invoice for patient services
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="patient">Patient *</Label>
                                <Select value={invoiceData.patientId} onValueChange={(value) =>
                                    setInvoiceData({...invoiceData, patientId: value})
                                }>
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
                            <div>
                                <Label htmlFor="appointment">Appointment ID</Label>
                                <Input
                                    id="appointment"
                                    placeholder="Optional appointment reference"
                                    value={invoiceData.appointmentId}
                                    onChange={(e) => setInvoiceData({...invoiceData, appointmentId: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Services</Label>
                            <div className="flex space-x-2 mb-4">
                                <Select value={selectedService} onValueChange={setSelectedService}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockServiceItems.map(service => (
                                            <SelectItem key={service.id} value={service.id}>
                                                {service.code} - {service.name} (${service.price})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    min="1"
                                    className="w-20"
                                    placeholder="Qty"
                                    value={serviceQuantity}
                                    onChange={(e) => setServiceQuantity(parseInt(e.target.value) || 1)}
                                />
                                <Button type="button" onClick={handleAddService} disabled={!selectedService}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {invoiceData.services.length > 0 && (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Service</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Qty</TableHead>
                                                <TableHead>Unit Price</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Insurance</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoiceData.services.map((service, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{service.serviceName}</TableCell>
                                                    <TableCell>{service.cptCode}</TableCell>
                                                    <TableCell>{service.quantity}</TableCell>
                                                    <TableCell>${service.unitPrice.toFixed(2)}</TableCell>
                                                    <TableCell>${service.totalPrice.toFixed(2)}</TableCell>
                                                    <TableCell>${service.insuranceCovered.toFixed(2)}</TableCell>
                                                    <TableCell>${service.patientPortion.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveService(index)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        {invoiceData.services.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Subtotal</p>
                                        <p className="text-lg font-semibold">${totals.subtotal.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Insurance Coverage</p>
                                        <p className="text-lg font-semibold text-blue-600">${totals.insuranceCoverage.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Patient Responsibility</p>
                                        <p className="text-lg font-semibold text-green-600">${totals.patientResponsibility.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Additional notes or instructions"
                                value={invoiceData.notes}
                                onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setShowCreateInvoice(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={invoiceData.services.length === 0}>
                                Create Invoice
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        );
    };

    const PaymentDialog = () => {
        const [paymentData, setPaymentData] = useState<PaymentForm>({
            invoiceId: selectedInvoice?.id || '',
            amount: selectedInvoice?.patientResponsibility || 0,
            method: PaymentMethod.CREDIT_CARD,
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardholderName: '',
            notes: ''
        });

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            try {
                const response = await PaymentService.processPayment(paymentData);
                if (response.success) {
                    toast.success('Payment processed successfully');
                    setShowPayment(false);
                    loadBillingData();
                }
            } catch (error) {
                toast.error('Failed to process payment');
            }
        };

        return (
            <Dialog open={showPayment} onOpenChange={setShowPayment}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Process Payment</DialogTitle>
                        <DialogDescription>
                            Process payment for invoice {selectedInvoice?.invoiceNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="amount">Payment Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                required
                                value={paymentData.amount}
                                onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                            />
                        </div>

                        <div>
                            <Label htmlFor="method">Payment Method *</Label>
                            <Select value={paymentData.method} onValueChange={(value) =>
                                setPaymentData({...paymentData, method: value as PaymentMethod})
                            }>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                                    <SelectItem value={PaymentMethod.DEBIT_CARD}>Debit Card</SelectItem>
                                    <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                                    <SelectItem value={PaymentMethod.CHECK}>Check</SelectItem>
                                    <SelectItem value={PaymentMethod.INSURANCE}>Insurance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(paymentData.method === PaymentMethod.CREDIT_CARD || paymentData.method === PaymentMethod.DEBIT_CARD) && (
                            <>
                                <div>
                                    <Label htmlFor="cardholderName">Cardholder Name *</Label>
                                    <Input
                                        id="cardholderName"
                                        required
                                        value={paymentData.cardholderName}
                                        onChange={(e) => setPaymentData({...paymentData, cardholderName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cardNumber">Card Number *</Label>
                                    <Input
                                        id="cardNumber"
                                        required
                                        placeholder="1234 5678 9012 3456"
                                        value={paymentData.cardNumber}
                                        onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="expiryDate">Expiry Date *</Label>
                                        <Input
                                            id="expiryDate"
                                            required
                                            placeholder="MM/YY"
                                            value={paymentData.expiryDate}
                                            onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cvv">CVV *</Label>
                                        <Input
                                            id="cvv"
                                            required
                                            placeholder="123"
                                            value={paymentData.cvv}
                                            onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Payment notes or reference"
                                value={paymentData.notes}
                                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setShowPayment(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Process Payment
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        );
    };

    const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
        const patient = patients.find(p => p.id === invoice.patientId);
        const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingBalance = invoice.patientResponsibility - totalPaid;

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                            <p className="text-sm text-gray-600">
                                {patient?.firstName} {patient?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                                Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <Badge className={getStatusColor(invoice.status)}>
                                {getStatusIcon(invoice.status)}
                                <span className="ml-1">{invoice.status}</span>
                            </Badge>
                            <p className="text-lg font-bold mt-1">${invoice.total.toFixed(2)}</p>
                        </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                            <p className="text-gray-500">Insurance Coverage</p>
                            <p className="font-medium text-blue-600">${invoice.insuranceCoverage.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Patient Responsibility</p>
                            <p className="font-medium">${invoice.patientResponsibility.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Amount Paid</p>
                            <p className="font-medium text-green-600">${totalPaid.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Remaining Balance</p>
                            <p className={`font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${remainingBalance.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(invoice)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                        </Button>
                        {remainingBalance > 0 && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowPayment(true);
                                }}
                            >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Process Payment
                            </Button>
                        )}
                        <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const filteredInvoices = invoices.filter(invoice => {
        const patient = patients.find(p => p.id === invoice.patientId);
        const matchesSearch = !searchTerm ||
            invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient && `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
                    <p className="text-gray-600">Manage patient invoices and process payments</p>
                </div>
                {user?.role !== UserRole.PATIENT && (
                    <Button onClick={() => setShowCreateInvoice(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Invoice
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Outstanding</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ${invoices.reduce((sum, inv) => {
                                    const paid = inv.payments.reduce((pSum, p) => pSum + p.amount, 0);
                                    return sum + (inv.patientResponsibility - paid);
                                }, 0).toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Paid Today</p>
                                <p className="text-2xl font-bold text-green-600">$1,250.00</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Invoices</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {invoices.filter(inv => inv.status === PaymentStatus.PENDING).length}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Insurance Claims</p>
                                <p className="text-2xl font-bold text-blue-600">12</p>
                            </div>
                            <Receipt className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by invoice number or patient name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus | 'all')}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                                <SelectItem value={PaymentStatus.PARTIAL}>Partial</SelectItem>
                                <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                                <SelectItem value={PaymentStatus.OVERDUE}>Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            More Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredInvoices.map((invoice) => (
                    <InvoiceCard key={invoice.id} invoice={invoice} />
                ))}
            </div>

            {filteredInvoices.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search criteria'
                                : 'Create your first invoice to get started'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && user?.role !== UserRole.PATIENT && (
                            <Button onClick={() => setShowCreateInvoice(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Invoice
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Dialogs */}
            <CreateInvoiceDialog />
            <PaymentDialog />
        </div>
    );
};

export default BillingSystem;