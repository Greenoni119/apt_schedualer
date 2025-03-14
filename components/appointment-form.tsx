"use client";

import React, { useState, useEffect } from 'react';
import { AppointmentTypeSelect, getAppointmentTypeById } from './appointment-type';
import { DatePicker } from './date-picker';
import { TimeSlots } from './time-slots';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { Label } from './ui/label';
import { generateAppointmentPDF } from '@/lib/pdf/appointment-pdf';

interface AppointmentFormProps {
  onSubmit?: (appointmentData: AppointmentData) => void;
}

export interface AppointmentData {
  appointmentTypeId: string;
  date: Date | undefined;
  timeSlot: string | null;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export function AppointmentForm({ onSubmit }: AppointmentFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [appointmentTypeId, setAppointmentTypeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationNumber, setConfirmationNumber] = useState<string>('');
  
  // Store a local copy of appointment types to handle Supabase UUIDs properly
  const [localAppointmentTypes, setLocalAppointmentTypes] = useState<any[]>([]);
  
  // Load appointment types when component mounts
  useEffect(() => {
    // For debugging, save appointment types to local state when selected
    const handleAppointmentTypesLoaded = (event: any) => {
      if (event.detail && Array.isArray(event.detail)) {
        console.log("Appointment types loaded:", event.detail);
        setLocalAppointmentTypes(event.detail);
      }
    };
    
    // Listen for a custom event from the appointment type component
    window.addEventListener('appointmentTypesLoaded', handleAppointmentTypesLoaded);
    
    return () => {
      window.removeEventListener('appointmentTypesLoaded', handleAppointmentTypesLoaded);
    };
  }, []);
  
  // Effect to check for stored confirmation data when component mounts
  useEffect(() => {
    // Only run this when the component is first mounted
    try {
      const confirmationDataString = sessionStorage.getItem('appointmentConfirmation');
      if (confirmationDataString) {
        const confirmationData = JSON.parse(confirmationDataString);
        if (confirmationData.appointmentNumber) {
          console.log('Found stored confirmation number:', confirmationData.appointmentNumber);
          setConfirmationNumber(confirmationData.appointmentNumber);
        }
      }
    } catch (e) {
      console.error('Error retrieving confirmation data:', e);
    }
  }, []);

  // Find appointment type from our local copy of types
  const appointmentType = appointmentTypeId 
    ? (localAppointmentTypes.find(type => type.id === appointmentTypeId) || getAppointmentTypeById(appointmentTypeId))
    : undefined;

  const handleAppointmentTypeSelect = (typeId: string) => {
    console.log("Appointment type selected:", typeId);
    setAppointmentTypeId(typeId);
    // Ensure we have a date selected by default
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
    setCurrentStep(2);
    console.log("Moving to step 2, appointmentTypeId:", typeId);
  };

  const handleBackToTypes = () => {
    setCurrentStep(1);
  };

  const handleBackToDateTime = () => {
    setCurrentStep(2);
  };
  
  const handleContactInfoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleContinueToContactInfo = () => {
    setCurrentStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    if (appointmentTypeId && selectedDate && selectedTimeSlot && 
        contactInfo.firstName && contactInfo.lastName && 
        (contactInfo.email || contactInfo.phone)) {
      
      // Update availability in localStorage to simulate database update
      try {
        if (selectedDate && selectedTimeSlot) {
          const dateKey = selectedDate.toISOString().split('T')[0];
          const storageKey = `appointment_availability_${dateKey}`;
          
          // Get current availability
          const storedAvailability = localStorage.getItem(storageKey);
          let availability = storedAvailability ? JSON.parse(storedAvailability) : {};
          
          // Update the selected time slot availability
          if (availability[selectedTimeSlot] !== undefined) {
            // Decrease by 1, but never below 0
            availability[selectedTimeSlot] = Math.max(0, availability[selectedTimeSlot] - 1);
          } else {
            // First booking for this time slot - start with 2 remaining (from default 3)
            availability[selectedTimeSlot] = 2;
          }
          
          // Save back to localStorage
          localStorage.setItem(storageKey, JSON.stringify(availability));
          console.log(`Updated availability for ${dateKey} ${selectedTimeSlot}:`, availability[selectedTimeSlot]);
        }
      } catch (error) {
        console.error("Error updating local availability:", error);
      }
      
      const appointmentData: AppointmentData = {
        appointmentTypeId,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        contactInfo: {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          email: contactInfo.email,
          phone: contactInfo.phone
        }
      };
      
      // Here you would typically add code to send a confirmation email/text
      // For example:
      // sendConfirmationEmail(contactInfo.email, appointmentData);
      // or
      // sendConfirmationText(contactInfo.phone, appointmentData);
      
      if (onSubmit) {
        onSubmit(appointmentData);
      }
      
      setTimeout(() => {
        // Retrieve the confirmation data one more time right before showing confirmation
        try {
          const confirmationData = sessionStorage.getItem('appointmentConfirmation');
          if (confirmationData) {
            const parsedData = JSON.parse(confirmationData);
            if (parsedData.appointmentNumber) {
              console.log('Using confirmation number from API:', parsedData.appointmentNumber);
              setConfirmationNumber(parsedData.appointmentNumber);
            } else {
              console.log('No confirmation number found in stored data, showing error');
              setConfirmationNumber('ERROR: Missing appointment number');
              setError('There was an issue generating your appointment number. Please contact support.');
            }
          } else {
            console.log('No confirmation data found in sessionStorage, showing error');
            setConfirmationNumber('ERROR: Missing appointment data');
            setError('There was an issue saving your appointment. Please contact support.');
          }
        } catch (e) {
          console.error('Error handling confirmation number:', e);
          setConfirmationNumber('ERROR: System error');
          setError('There was a system error processing your appointment. Please contact support.');
        }
        
        setIsSubmitting(false);
        setSubmitted(true);
        
        // For debugging only
        console.log('Final confirmation number being displayed:', confirmationNumber);
      }, 1000); // simulate a network request with a 1 second delay
    } else {
      setError('Please fill in all required fields.');
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    // Show appointment confirmation
    // Use our local copy of appointment types first, then fall back to the default getter
    const appointmentType = localAppointmentTypes.find(type => type.id === appointmentTypeId) || getAppointmentTypeById(appointmentTypeId);
    
    // For debugging - check what confirmation number is being used in the display
    console.log('Showing confirmation screen with number:', confirmationNumber);
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-3">Appointment Confirmed!</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Your appointment has been successfully scheduled. A confirmation has been sent to 
            {contactInfo.email && ` your email (${contactInfo.email})`}
            {contactInfo.email && contactInfo.phone && ' and '}
            {contactInfo.phone && ` your phone (${contactInfo.phone})`}.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-6 text-white" style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)' }}>
            <h3 className="font-bold text-xl flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Appointment Details
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Appointment Type</h4>
                  <div className="flex items-center mt-2">
                    <div className={`p-2 rounded-md ${appointmentType?.color} mr-3`}>
                      {appointmentType?.icon}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{appointmentType?.name}</p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{appointmentType?.duration} minutes</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Date & Time</h4>
                  <p className="mt-2 font-semibold text-lg dark:text-white">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 font-bold">
                    {selectedTimeSlot && format(new Date(`2000-01-01T${selectedTimeSlot}`), 'h:mm a')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Contact Information</h4>
                  <p className="mt-2 font-semibold text-lg dark:text-white">{contactInfo.firstName} {contactInfo.lastName}</p>
                  <div className="mt-1 space-y-1">
                    {contactInfo.email && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        {contactInfo.email}
                      </div>
                    )}
                    {contactInfo.phone && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        {contactInfo.phone}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Confirmation #</h4>
                  <p className="mt-2 font-mono text-lg text-gray-800 dark:text-gray-100">
                    {confirmationNumber}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Important Information</h4>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <p>• Please arrive 10 minutes before your scheduled appointment time.</p>
                    <p>• If you need to reschedule, please do so at least 24 hours in advance.</p>
                    <p>• You will receive a reminder 24 hours before your appointment.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="border-2 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700" 
            onClick={() => {
              // Reset the form
              setAppointmentTypeId('');
              setSelectedDate(undefined);
              setSelectedTimeSlot(null);
              setContactInfo({
                firstName: '',
                lastName: '',
                email: '',
                phone: ''
              });
              setSubmitted(false);
              setCurrentStep(1);
              
              // Clear stored confirmation data to prevent reuse
              sessionStorage.removeItem('appointmentConfirmation');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Schedule Another Appointment
          </Button>
          
          <Button 
            variant="outline"
            className="border-2 border-gray-300"
            onClick={() => {
              // Get the appointment type details
              const appointmentType = localAppointmentTypes.find(type => type.id === appointmentTypeId) || 
                                     getAppointmentTypeById(appointmentTypeId);
              
              if (appointmentType && selectedDate) {
                // Format the data for the PDF
                const pdfData = {
                  appointmentNumber: confirmationNumber,
                  firstName: contactInfo.firstName,
                  lastName: contactInfo.lastName,
                  email: contactInfo.email,
                  phone: contactInfo.phone,
                  appointmentType: appointmentType.name,
                  appointmentDate: format(selectedDate, 'EEEE, MMMM d, yyyy'),
                  appointmentTime: selectedTimeSlot ? format(new Date(`2000-01-01T${selectedTimeSlot}`), 'h:mm a') : '',
                  duration: `${appointmentType.duration} minutes`
                };
                
                // Generate the PDF
                const pdfOutput = generateAppointmentPDF(pdfData);
                
                // Create a link element and trigger download
                const link = document.createElement('a');
                link.href = pdfOutput;
                link.download = `appointment-${confirmationNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                console.error('Missing appointment type or date for PDF generation');
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Details
          </Button>
        </div>
      </div>
    );
  }

  // Progress steps indicator
  const renderProgressSteps = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center w-full max-w-xs">
          {/* Step 1 */}
          <div className="relative flex flex-col items-center">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            } transition-colors duration-300`}>
              <span className="text-sm font-bold">1</span>
            </div>
            <span className="text-xs mt-2 absolute -bottom-6 whitespace-nowrap">
              Type
            </span>
          </div>
          
          {/* Line between 1-2 */}
          <div className={`flex-auto border-t-2 transition-colors duration-300 ${
            currentStep >= 2 ? 'border-blue-600' : 'border-gray-200'
          }`}></div>
          
          {/* Step 2 */}
          <div className="relative flex flex-col items-center">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            } transition-colors duration-300`}>
              <span className="text-sm font-bold">2</span>
            </div>
            <span className="text-xs mt-2 absolute -bottom-6 whitespace-nowrap">
              Date & Time
            </span>
          </div>
          
          {/* Line between 2-3 */}
          <div className={`flex-auto border-t-2 transition-colors duration-300 ${
            currentStep >= 3 ? 'border-blue-600' : 'border-gray-200'
          }`}></div>
          
          {/* Step 3 */}
          <div className="relative flex flex-col items-center">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
              currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            } transition-colors duration-300`}>
              <span className="text-sm font-bold">3</span>
            </div>
            <span className="text-xs mt-2 absolute -bottom-6 whitespace-nowrap">
              Confirmation
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-4">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      {!submitted && renderProgressSteps()}
      
      <form onSubmit={handleSubmit} className="space-y-6 mt-8">
        {currentStep === 1 && (
          <AppointmentTypeSelect 
            value={appointmentTypeId} 
            onChange={handleAppointmentTypeSelect} 
          />
        )}
        
        {currentStep === 2 && (
          <div className="space-y-8">
            {appointmentType ? (
              <div className="border-b pb-6 mb-8">
                <div className="flex items-center space-x-3 text-blue-600">
                  <div className={`p-2 rounded-lg ${appointmentType.color}`}>
                    {appointmentType.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{appointmentType.name}</h2>
                  <p className="text-gray-600">
                    {appointmentType.duration} minutes • {appointmentType.description}
                  </p>
                </div>
              </div>
            </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800">
                Error: Could not find appointment type with ID: {appointmentTypeId}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <h3 className="text-lg font-bold mb-4">Pick a Date</h3>
                <DatePicker 
                  date={selectedDate} 
                  onDateChange={(date) => {
                    console.log("Date selected:", date);
                    setSelectedDate(date);
                  }}
                />
              </div>
              
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <h3 className="text-lg font-bold mb-4">Pick a Time</h3>
                <TimeSlots 
                  selectedDate={selectedDate || new Date()}
                  selectedTimeSlot={selectedTimeSlot}
                  durationMinutes={appointmentType?.duration || 30}
                  onTimeSlotSelect={setSelectedTimeSlot}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-10 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBackToTypes}
                className="w-full sm:w-1/2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </Button>
              
              {selectedDate && selectedTimeSlot ? (
                <Button 
                  type="button" 
                  className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700"
                  onClick={handleContinueToContactInfo}
                >
                  Continue
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Button>
              ) : (
                <Button 
                  type="button" 
                  className="w-full sm:w-1/2"
                  disabled
                >
                  Select date and time to continue
                </Button>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && appointmentType && selectedDate && selectedTimeSlot && (
          <div className="space-y-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold">Complete Your Booking</h2>
              <p className="text-gray-600 mt-2">
                Almost done! Please provide your contact information to confirm your appointment
              </p>
            </div>
            
            <div className="p-6 rounded-xl mb-8 border border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 text-lg mb-3">Appointment Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className={`p-1.5 rounded-md ${appointmentType.color} mr-2 flex items-center justify-center w-7 h-7`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {appointmentType.id === '4' ? (
                          <>
                            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </>
                        ) : appointmentType.id === '1' ? (
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        ) : appointmentType.id === '2' ? (
                          <>
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </>
                        ) : (
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        )}
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Type</h4>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100">{appointmentType.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{appointmentType.duration} minutes</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-2 flex items-center justify-center w-7 h-7">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Date</h4>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format(selectedDate, 'PP')}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 mr-2 flex items-center justify-center w-7 h-7">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Time</h4>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100">{selectedTimeSlot && format(new Date(`2000-01-01T${selectedTimeSlot}`), 'h:mm a')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Duration: {appointmentType.duration} min</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-4 dark:text-white">Contact Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">First Name *</Label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={contactInfo.firstName}
                    onChange={handleContactInfoChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Last Name *</Label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={contactInfo.lastName}
                    onChange={handleContactInfoChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={handleContactInfoChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="example@email.com"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    We'll send appointment confirmation to this email
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">
                    Phone Number (Optional)
                  </Label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handleContactInfoChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="(123) 456-7890"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    For text reminders and updates (optional)
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    I agree to receive email notifications about my appointment, including confirmations, 
                    reminders, and any changes to my scheduled appointment.
                  </span>
                </label>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBackToDateTime}
                className="w-full sm:w-1/2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Schedule
              </Button>
              
              <Button 
                type="submit" 
                className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting || !contactInfo.firstName || !contactInfo.lastName || !contactInfo.email}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    Confirm Appointment
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}