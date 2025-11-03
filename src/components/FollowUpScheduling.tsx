import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { CalendarIcon, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

const FollowUpScheduling = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [date, setDate] = useState<Date>();
  
  const [followUp, setFollowUp] = useState({
    type: 'In-person',
    reason: '',
    specialist: '',
    notes: '',
    reminderMethod: 'SMS'
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

  const handleScheduleFollowUp = () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    
    if (!followUp.reason) {
      toast.error('Please enter a reason for follow-up');
      return;
    }
    
    toast.success('Follow-up appointment scheduled successfully');
    
    // Reset form only after successful submission
    setDate(undefined);
    setFollowUp({
      type: 'In-person',
      reason: '',
      specialist: '',
      notes: '',
      reminderMethod: 'SMS'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Scheduling</CardTitle>
          <CardDescription>Schedule and manage follow-up appointments</CardDescription>
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
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Schedule Follow-Up</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : <span>Select date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="type">Appointment Type</Label>
                        <Select
                          value={followUp.type}
                          onValueChange={(value) => setFollowUp(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="In-person">In-person</SelectItem>
                            <SelectItem value="Telemedicine">Telemedicine</SelectItem>
                            <SelectItem value="Phone">Phone consultation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="specialist">Specialist</Label>
                        <Select
                          value={followUp.specialist}
                          onValueChange={(value) => setFollowUp(prev => ({ ...prev, specialist: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select specialist" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dr. Kamau">Dr. Kamau (General Practitioner)</SelectItem>
                            <SelectItem value="Dr. Omondi">Dr. Omondi (Cardiologist)</SelectItem>
                            <SelectItem value="Dr. Wanjiku">Dr. Wanjiku (Pediatrician)</SelectItem>
                            <SelectItem value="Dr. Otieno">Dr. Otieno (Orthopedic)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reminderMethod">Reminder Method</Label>
                        <Select
                          value={followUp.reminderMethod}
                          onValueChange={(value) => setFollowUp(prev => ({ ...prev, reminderMethod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reminder method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SMS">SMS</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Phone">Phone call</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Follow-Up</Label>
                      <Input
                        id="reason"
                        value={followUp.reason}
                        onChange={(e) => setFollowUp(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="e.g., Review test results, Check medication effectiveness"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={followUp.notes}
                        onChange={(e) => setFollowUp(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional instructions for the patient"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleScheduleFollowUp}>
                        <Plus className="mr-2 h-4 w-4" /> Schedule Follow-Up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Follow-Ups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No upcoming follow-up appointments</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="mt-2 text-lg font-medium">No Patient Selected</h3>
              <p className="text-sm text-muted-foreground">
                Search for a patient to schedule follow-up appointments
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUpScheduling;