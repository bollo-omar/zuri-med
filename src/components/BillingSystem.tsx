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
    PaymentStatus, PaymentMethod, UserRole, PaymentForm, User,
    InsuranceStatus
} from '@/types';
import {
    BillingService, PaymentService, PatientService,
    mockServiceItems, mockDiagnosisCodes, mockInvoices
} from '@/lib/mockServices';
import { formatCurrency } from '@/lib/utils';
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
    const [showEditInvoice, setShowEditInvoice] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
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

            let invoicesData = invoicesResponse.success ? invoicesResponse.data : [];
            
            // Filter invoices based on user role
            if (user.role === UserRole.PATIENT) {
                // Find patient record by email match
                const patientRecord = patientsResponse.success 
                    ? patientsResponse.data.data.find(p => p.email?.toLowerCase() === user.email.toLowerCase())
                    : null;
                
                if (patientRecord) {
                    // Patients can only see their own invoices
                    invoicesData = invoicesData.filter(inv => inv.patientId === patientRecord.id);
                } else {
                    // No patient record found, show no invoices
                    invoicesData = [];
                }
            }
            
            setInvoices(invoicesData);
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

        // Helper function to calculate insurance coverage based on patient's balance
        const calculateInsuranceCoverage = (services: InvoiceService[]): InvoiceService[] => {
            if (!invoiceData.patientId || services.length === 0) {
                return services.map(s => ({
                    ...s,
                    insuranceCovered: 0,
                    patientPortion: s.totalPrice
                }));
            }

            const patient = patients.find(p => p.id === invoiceData.patientId);
            if (!patient) {
                return services.map(s => ({
                    ...s,
                    insuranceCovered: 0,
                    patientPortion: s.totalPrice
                }));
            }

            // Get primary insurance
            const primaryInsurance = patient.insurance?.find(ins => ins.isPrimary && ins.status === InsuranceStatus.ACTIVE);
            const insuranceBalance = primaryInsurance?.balance ?? 0;

            const total = services.reduce((sum, service) => sum + service.totalPrice, 0);
            
            // Calculate insurance coverage
            let insuranceCoverage = 0;
            if (insuranceBalance > 0) {
                insuranceCoverage = Math.min(insuranceBalance, total);
            }

            // Distribute insurance coverage proportionally across services
            return services.map(service => {
                let serviceInsuranceCovered = 0;
                let servicePatientPortion = service.totalPrice;

                if (insuranceBalance > 0 && total > 0) {
                    const serviceProportion = service.totalPrice / total;
                    serviceInsuranceCovered = Math.min(insuranceCoverage * serviceProportion, service.totalPrice);
                    servicePatientPortion = service.totalPrice - serviceInsuranceCovered;
                }

                return {
                    ...service,
                    insuranceCovered: serviceInsuranceCovered,
                    patientPortion: servicePatientPortion
                };
            });
        };

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
                    insuranceCovered: 0, // Will be recalculated
                    patientPortion: service.price * serviceQuantity
                };

                const updatedServices = [...invoiceData.services, newService];
                const recalculatedServices = calculateInsuranceCoverage(updatedServices);

                setInvoiceData({
                    ...invoiceData,
                    services: recalculatedServices
                });
                setSelectedService('');
                setServiceQuantity(1);
            }
        };

        const handleRemoveService = (index: number) => {
            const newServices = [...invoiceData.services];
            newServices.splice(index, 1);
            const recalculatedServices = calculateInsuranceCoverage(newServices);
            setInvoiceData({ ...invoiceData, services: recalculatedServices });
        };

        // Recalculate insurance when patient changes
        useEffect(() => {
            if (invoiceData.patientId && invoiceData.services.length > 0) {
                const recalculatedServices = calculateInsuranceCoverage(invoiceData.services);
                setInvoiceData({ ...invoiceData, services: recalculatedServices });
            }
        }, [invoiceData.patientId]);

        const calculateTotals = () => {
            const subtotal = invoiceData.services.reduce((sum, service) => sum + service.totalPrice, 0);
            const insuranceCoverage = invoiceData.services.reduce((sum, service) => sum + service.insuranceCovered, 0);
            const patientResponsibility = invoiceData.services.reduce((sum, service) => sum + service.patientPortion, 0);

            return { subtotal, insuranceCoverage, patientResponsibility };
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            try {
                if (!invoiceData.patientId) {
                    toast.error('Please select a patient');
                    return;
                }
                if (invoiceData.services.length === 0) {
                    toast.error('Please add at least one service');
                    return;
                }
                const response = await BillingService.createInvoice(
                    invoiceData.services,
                    invoiceData.patientId,
                    invoiceData.appointmentId || undefined
                );
                if (response.success) {
                    toast.success('Invoice created successfully');
                    setShowCreateInvoice(false);
                    loadBillingData();
                    // Reset form
                    setInvoiceData({ patientId: '', appointmentId: '', services: [], notes: '' });
                } else {
                    toast.error(response.error || 'Failed to create invoice');
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
                                                {service.code} - {service.name} ({formatCurrency(service.price)})
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
                                                    <TableCell>{formatCurrency(service.unitPrice)}</TableCell>
                                                    <TableCell>{formatCurrency(service.totalPrice)}</TableCell>
                                                    <TableCell>{formatCurrency(service.insuranceCovered)}</TableCell>
                                                    <TableCell>{formatCurrency(service.patientPortion)}</TableCell>
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
                                        <p className="text-lg font-semibold">{formatCurrency(totals.subtotal)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Insurance Coverage</p>
                                        <p className="text-lg font-semibold text-blue-600">{formatCurrency(totals.insuranceCoverage)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Patient Responsibility</p>
                                        <p className="text-lg font-semibold text-green-600">{formatCurrency(totals.patientResponsibility)}</p>
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
            method: PaymentMethod.M_PESA,
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardholderName: '',
            phoneNumber: '',
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
                            <p className="text-sm text-gray-500 mt-1">{formatCurrency(paymentData.amount || 0)}</p>
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
                                    <SelectItem value={PaymentMethod.M_PESA}>M-Pesa</SelectItem>
                                    <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
                                    <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                                    <SelectItem value={PaymentMethod.INSURANCE}>Insurance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentData.method === PaymentMethod.M_PESA && (
                            <div>
                                <Label htmlFor="phoneNumber">Phone Number *</Label>
                                <Input
                                    id="phoneNumber"
                                    required
                                    placeholder="254700000000"
                                    value={paymentData.phoneNumber}
                                    onChange={(e) => setPaymentData({...paymentData, phoneNumber: e.target.value})}
                                />
                                <p className="text-sm text-gray-500 mt-1">Enter your M-Pesa registered phone number</p>
                            </div>
                        )}

                        {paymentData.method === PaymentMethod.CARD && (
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

    const InvoiceDetailsDialog = () => {
        if (!selectedInvoice) return null;

        const patient = patients.find(p => p.id === selectedInvoice.patientId);
        const totalPaid = selectedInvoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingBalance = selectedInvoice.patientResponsibility - totalPaid;

        return (
            <Dialog open={!!selectedInvoice} onOpenChange={(open) => {
                if (!open) setSelectedInvoice(null);
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Invoice Details - {selectedInvoice.invoiceNumber}</DialogTitle>
                        <DialogDescription>
                            Complete invoice information and payment history
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Invoice Header */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Invoice Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Invoice Number:</span>
                                        <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Status:</span>
                                        <Badge className={getStatusColor(selectedInvoice.status)}>
                                            {getStatusIcon(selectedInvoice.status)}
                                            <span className="ml-1">{selectedInvoice.status}</span>
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Issue Date:</span>
                                        <span>{new Date(selectedInvoice.issueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Due Date:</span>
                                        <span>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    {selectedInvoice.appointmentId && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Appointment ID:</span>
                                            <span className="font-mono text-xs">{selectedInvoice.appointmentId}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Patient Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Patient:</span>
                                        <span className="font-medium">
                                            {patient ? `${patient.firstName} ${patient.lastName}` : 'Loading...'}
                                        </span>
                                    </div>
                                    {patient && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Phone:</span>
                                                <span>{patient.phone}</span>
                                            </div>
                                            {patient.email && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Email:</span>
                                                    <span className="text-xs">{patient.email}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Services */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Services</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service</TableHead>
                                            <TableHead>CPT Code</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Unit Price</TableHead>
                                            <TableHead>Total Price</TableHead>
                                            <TableHead>Insurance</TableHead>
                                            <TableHead>Patient Portion</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedInvoice.services.map((service, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{service.serviceName}</TableCell>
                                                <TableCell>{service.cptCode}</TableCell>
                                                <TableCell>{service.quantity}</TableCell>
                                                <TableCell>{formatCurrency(service.unitPrice)}</TableCell>
                                                <TableCell>{formatCurrency(service.totalPrice)}</TableCell>
                                                <TableCell className="text-blue-600">{formatCurrency(service.insuranceCovered)}</TableCell>
                                                <TableCell className="text-green-600">{formatCurrency(service.patientPortion)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Financial Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax:</span>
                                        <span className="font-medium">{formatCurrency(selectedInvoice.tax)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total:</span>
                                        <span className="font-semibold text-lg">{formatCurrency(selectedInvoice.total)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-blue-600">Insurance Coverage:</span>
                                        <span className="font-medium text-blue-600">{formatCurrency(selectedInvoice.insuranceCoverage)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Patient Responsibility:</span>
                                        <span className="font-medium">{formatCurrency(selectedInvoice.patientResponsibility)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-green-600">Amount Paid:</span>
                                        <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                                            Remaining Balance:
                                        </span>
                                        <span className={`font-semibold text-lg ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(remainingBalance)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment History */}
                        {selectedInvoice.payments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Payment History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>Transaction ID</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedInvoice.payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        {new Date(payment.processedAt).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-green-600">
                                                        {formatCurrency(payment.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{payment.method}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {payment.transactionId}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {payment.notes || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Footer */}
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                                Close
                            </Button>
                            {remainingBalance > 0 && (
                                <Button onClick={() => {
                                    setShowPayment(true);
                                }}>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Process Payment
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    const EditInvoiceDialog = () => {
        const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
            patientId: editingInvoice?.patientId || '',
            appointmentId: editingInvoice?.appointmentId || '',
            services: editingInvoice?.services || [],
            notes: ''
        });
        const [selectedService, setSelectedService] = useState('');
        const [serviceQuantity, setServiceQuantity] = useState(1);

        // Update form when editingInvoice changes
        useEffect(() => {
            if (editingInvoice) {
                setInvoiceData({
                    patientId: editingInvoice.patientId,
                    appointmentId: editingInvoice.appointmentId || '',
                    services: editingInvoice.services || [],
                    notes: ''
                });
            }
        }, [editingInvoice]);

        // Helper function to calculate insurance coverage based on patient's balance
        const calculateInsuranceCoverage = (services: InvoiceService[]): InvoiceService[] => {
            if (!invoiceData.patientId || services.length === 0) {
                return services.map(s => ({
                    ...s,
                    insuranceCovered: 0,
                    patientPortion: s.totalPrice
                }));
            }

            const patient = patients.find(p => p.id === invoiceData.patientId);
            if (!patient) {
                return services.map(s => ({
                    ...s,
                    insuranceCovered: 0,
                    patientPortion: s.totalPrice
                }));
            }

            // Get primary insurance
            const primaryInsurance = patient.insurance?.find(ins => ins.isPrimary && ins.status === InsuranceStatus.ACTIVE);
            const insuranceBalance = primaryInsurance?.balance ?? 0;

            const total = services.reduce((sum, service) => sum + service.totalPrice, 0);
            
            // Calculate insurance coverage
            let insuranceCoverage = 0;
            if (insuranceBalance > 0) {
                insuranceCoverage = Math.min(insuranceBalance, total);
            }

            // Distribute insurance coverage proportionally across services
            return services.map(service => {
                let serviceInsuranceCovered = 0;
                let servicePatientPortion = service.totalPrice;

                if (insuranceBalance > 0 && total > 0) {
                    const serviceProportion = service.totalPrice / total;
                    serviceInsuranceCovered = Math.min(insuranceCoverage * serviceProportion, service.totalPrice);
                    servicePatientPortion = service.totalPrice - serviceInsuranceCovered;
                }

                return {
                    ...service,
                    insuranceCovered: serviceInsuranceCovered,
                    patientPortion: servicePatientPortion
                };
            });
        };

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
                    insuranceCovered: 0, // Will be recalculated
                    patientPortion: service.price * serviceQuantity
                };

                const updatedServices = [...invoiceData.services, newService];
                const recalculatedServices = calculateInsuranceCoverage(updatedServices);

                setInvoiceData({
                    ...invoiceData,
                    services: recalculatedServices
                });
                setSelectedService('');
                setServiceQuantity(1);
            }
        };

        const handleRemoveService = (index: number) => {
            const newServices = [...invoiceData.services];
            newServices.splice(index, 1);
            const recalculatedServices = calculateInsuranceCoverage(newServices);
            setInvoiceData({ ...invoiceData, services: recalculatedServices });
        };

        const handleUpdateService = (index: number, field: string, value: string | number) => {
            const newServices = [...invoiceData.services];
            newServices[index] = { ...newServices[index], [field]: value };
            
            // Recalculate totalPrice if quantity or unitPrice changes
            if (field === 'quantity' || field === 'unitPrice') {
                newServices[index].totalPrice = newServices[index].unitPrice * newServices[index].quantity;
            }
            
            // Recalculate insurance coverage for all services
            const recalculatedServices = calculateInsuranceCoverage(newServices);
            setInvoiceData({ ...invoiceData, services: recalculatedServices });
        };

        const calculateTotals = () => {
            const subtotal = invoiceData.services.reduce((sum, service) => sum + service.totalPrice, 0);
            const insuranceCoverage = invoiceData.services.reduce((sum, service) => sum + service.insuranceCovered, 0);
            const patientResponsibility = invoiceData.services.reduce((sum, service) => sum + service.patientPortion, 0);

            return { subtotal, insuranceCoverage, patientResponsibility };
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!editingInvoice) return;
            
            try {
                if (invoiceData.services.length === 0) {
                    toast.error('Please add at least one service');
                    return;
                }
                const response = await BillingService.updateInvoice(editingInvoice.id, {
                    services: invoiceData.services,
                    issueDate: editingInvoice.issueDate,
                    dueDate: editingInvoice.dueDate
                });
                if (response.success) {
                    toast.success('Invoice updated successfully');
                    setShowEditInvoice(false);
                    setEditingInvoice(null);
                    loadBillingData();
                } else {
                    toast.error(response.error || 'Failed to update invoice');
                }
            } catch (error) {
                toast.error('Failed to update invoice');
            }
        };

        const totals = calculateTotals();

        return (
            <Dialog open={showEditInvoice} onOpenChange={(open) => {
                setShowEditInvoice(open);
                if (!open) {
                    setEditingInvoice(null);
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Invoice {editingInvoice?.invoiceNumber}</DialogTitle>
                        <DialogDescription>
                            Update invoice services and details
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Patient</Label>
                                <Input
                                    value={(() => {
                                        const patient = patients.find(p => p.id === invoiceData.patientId);
                                        return patient ? `${patient.firstName} ${patient.lastName}` : 'Loading...';
                                    })()}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label>Appointment ID</Label>
                                <Input
                                    value={invoiceData.appointmentId || 'N/A'}
                                    disabled
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
                                                {service.code} - {service.name} ({formatCurrency(service.price)})
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
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            className="w-16"
                                                            value={service.quantity}
                                                            onChange={(e) => handleUpdateService(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-24"
                                                            value={service.unitPrice}
                                                            onChange={(e) => handleUpdateService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(service.totalPrice)}</TableCell>
                                                    <TableCell>{formatCurrency(service.insuranceCovered)}</TableCell>
                                                    <TableCell>{formatCurrency(service.patientPortion)}</TableCell>
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
                                        <p className="text-lg font-semibold">{formatCurrency(totals.subtotal)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Insurance Coverage</p>
                                        <p className="text-lg font-semibold text-blue-600">{formatCurrency(totals.insuranceCoverage)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Patient Responsibility</p>
                                        <p className="text-lg font-semibold text-green-600">{formatCurrency(totals.patientResponsibility)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => {
                                setShowEditInvoice(false);
                                setEditingInvoice(null);
                            }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={invoiceData.services.length === 0}>
                                Update Invoice
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
                            <p className="text-lg font-bold mt-1">{formatCurrency(invoice.total)}</p>
                        </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                            <p className="text-gray-500">Insurance Coverage</p>
                            <p className="font-medium text-blue-600">{formatCurrency(invoice.insuranceCoverage)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Patient Responsibility</p>
                            <p className="font-medium">{formatCurrency(invoice.patientResponsibility)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Amount Paid</p>
                            <p className="font-medium text-green-600">{formatCurrency(totalPaid)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Remaining Balance</p>
                            <p className={`font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(remainingBalance)}
                            </p>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(invoice)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                        </Button>
                        {user?.role !== UserRole.PATIENT && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setEditingInvoice(invoice);
                                    setShowEditInvoice(true);
                                }}
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                            </Button>
                        )}
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        {user.role === UserRole.PATIENT ? 'My Bills & Invoices' : 'Billing & Invoices'}
                    </h1>
                    <p className="text-gray-600">
                        {user.role === UserRole.PATIENT 
                            ? 'View and manage your invoices and payments' 
                            : 'Manage patient invoices and process payments'}
                    </p>
                </div>
                {(user.role === UserRole.ADMIN || user.role === UserRole.BILLING_STAFF) && (
                    <Button onClick={() => setShowCreateInvoice(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Invoice
                    </Button>
                )}
            </div>

            {/* Summary Cards - Different metrics for patients vs staff */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {user.role === UserRole.PATIENT ? (
                    <>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Outstanding</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {formatCurrency(invoices.reduce((sum, inv) => {
                                                const paid = inv.payments.reduce((pSum, p) => pSum + p.amount, 0);
                                                return sum + (inv.patientResponsibility - paid);
                                            }, 0))}
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
                                        <p className="text-sm text-gray-600">Total Paid</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(invoices.reduce((sum, inv) => 
                                                sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0), 0))}
                                        </p>
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
                                        <p className="text-sm text-gray-600">Total Invoices</p>
                                        <p className="text-2xl font-bold text-blue-600">{invoices.length}</p>
                                    </div>
                                    <Receipt className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Outstanding</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {formatCurrency(invoices.reduce((sum, inv) => {
                                                const paid = inv.payments.reduce((pSum, p) => pSum + p.amount, 0);
                                                return sum + (inv.patientResponsibility - paid);
                                            }, 0))}
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
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(162500)}</p>
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
                    </>
                )}
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
                        {!searchTerm && statusFilter === 'all' && (user.role === UserRole.ADMIN || user.role === UserRole.BILLING_STAFF) && (
                            <Button onClick={() => setShowCreateInvoice(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Invoice
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Dialogs */}
            <InvoiceDetailsDialog />
            <CreateInvoiceDialog />
            <EditInvoiceDialog />
            <PaymentDialog />
        </div>
    );
};

export default BillingSystem;