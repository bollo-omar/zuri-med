import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, FileText, Pill, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Common medications in Kenya
const commonMedications = [
  { name: 'Paracetamol', dosage: '500mg', frequency: 'TID', duration: '5 days' },
  { name: 'Amoxicillin', dosage: '500mg', frequency: 'BID', duration: '7 days' },
  { name: 'Artemether/Lumefantrine', dosage: '80/480mg', frequency: 'BID', duration: '3 days' }
];

// Common referral facilities in Kenya
const referralFacilities = [
  'Kenyatta National Hospital',
  'Moi Teaching and Referral Hospital',
  'Aga Khan University Hospital'
];

const TreatmentPlanning = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('prescriptions');
  
  // Treatment plan state
  const [treatmentPlan, setTreatmentPlan] = useState({
    diagnosis: '',
    notes: '',
    followUpDate: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    referrals: [{ specialistType: '', facility: '', reason: '' }]
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Mock patient data
    setSelectedPatient({
      id: "KE12345678",
      firstName: "John",
      lastName: "Kamau",
      idNumber: "12345678",
      dateOfBirth: "1985-05-15",
      gender: "Male",
      phoneNumber: "+254712345678"
    });
    
    toast.success('Patient found');
  };

  const handleSaveTreatmentPlan = () => {
    toast.success('Treatment plan saved successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Treatment Planning</CardTitle>
          <CardDescription>Create treatment plans, prescriptions, and referrals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients by name or ID number..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {selectedPatient ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    ID: {selectedPatient.idNumber} | DOB: {selectedPatient.dateOfBirth} | 
                    Gender: {selectedPatient.gender} | Phone: {selectedPatient.phoneNumber}
                  </div>
                </div>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> New Treatment Plan
                </Button>
              </div>

              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="prescriptions">
                    <Pill className="mr-2 h-4 w-4" /> Prescriptions
                  </TabsTrigger>
                  <TabsTrigger value="referrals">
                    <ArrowRight className="mr-2 h-4 w-4" /> Referrals
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <FileText className="mr-2 h-4 w-4" /> Treatment History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="prescriptions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>New Prescription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="diagnosis">Diagnosis</Label>
                            <Input
                              id="diagnosis"
                              value={treatmentPlan.diagnosis}
                              onChange={(e) => setTreatmentPlan(prev => ({ ...prev, diagnosis: e.target.value }))}
                              placeholder="Primary diagnosis"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="medication">Medication</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select medication" />
                              </SelectTrigger>
                              <SelectContent>
                                {commonMedications.map(med => (
                                  <SelectItem key={med.name} value={med.name}>
                                    {med.name} {med.dosage}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="dosage">Dosage</Label>
                            <Input id="dosage" placeholder="e.g., 500mg" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OD">Once daily (OD)</SelectItem>
                                <SelectItem value="BID">Twice daily (BID)</SelectItem>
                                <SelectItem value="TID">Three times daily (TID)</SelectItem>
                                <SelectItem value="QID">Four times daily (QID)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input id="duration" placeholder="e.g., 7 days" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="followUpDate">Follow-up Date</Label>
                            <Input
                              id="followUpDate"
                              type="date"
                              value={treatmentPlan.followUpDate}
                              onChange={(e) => setTreatmentPlan(prev => ({ ...prev, followUpDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="notes">Clinical Notes</Label>
                          <Textarea
                            id="notes"
                            value={treatmentPlan.notes}
                            onChange={(e) => setTreatmentPlan(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional clinical notes"
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button onClick={handleSaveTreatmentPlan}>Save Prescription</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="referrals" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>New Referral</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="specialistType">Specialist Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select specialist" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cardiologist">Cardiologist</SelectItem>
                                <SelectItem value="neurologist">Neurologist</SelectItem>
                                <SelectItem value="orthopedic">Orthopedic Surgeon</SelectItem>
                                <SelectItem value="pediatrician">Pediatrician</SelectItem>
                                <SelectItem value="obgyn">Obstetrician/Gynecologist</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="facility">Facility</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select facility" />
                              </SelectTrigger>
                              <SelectContent>
                                {referralFacilities.map(facility => (
                                  <SelectItem key={facility} value={facility}>
                                    {facility}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="reason">Reason for Referral</Label>
                            <Textarea id="reason" placeholder="Reason for referral" rows={3} />
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button onClick={() => toast.success('Referral saved successfully')}>
                            Save Referral
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No treatment history available</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="mt-2 text-lg font-medium">No Patient Selected</h3>
              <p className="text-sm text-muted-foreground">
                Search for a patient to view and create treatment plans
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentPlanning;