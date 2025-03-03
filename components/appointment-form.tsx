"use client";

import React, { useState } from 'react';
import { AppointmentTypeSelect, getAppointmentTypeById } from './appointment-type';
import { DatePicker } from './date-picker';
import { TimeSlots } from './time-slots';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { Label } from './ui/label';

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

  const appointmentType = appointmentTypeId 
    ? getAppointmentTypeById(appointmentTypeId) 
    : undefined;

  const handleAppointmentTypeSelect = (typeId: string) => {
    setAppointmentTypeId(typeId);
    setCurrentStep(2);
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
    
    if (appointmentTypeId && selectedDate && selectedTimeSlot && 
        contactInfo.firstName && contactInfo.lastName && 
        (contactInfo.email || contactInfo.phone)) {
      
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
      
      setSubmitted(true);
    }
  };

  if (submitted) {
    // Show appointment confirmation
    const appointmentType = getAppointmentTypeById(appointmentTypeId);
    const appointmentTime = selectedTimeSlot || '';
    
    return (
      <div className="max-w-md mx-auto p-6 bg-white border rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Appointment Confirmed</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Appointment Type</h3>
            <p>{appointmentType?.name}</p>
          </div>
          <div>
            <h3 className="font-medium">Date & Time</h3>
            <p>
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at{' '}
              {selectedTimeSlot && format(new Date(`2000-01-01T${selectedTimeSlot}`), 'h:mm a')}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Duration</h3>
            <p>{appointmentType?.duration} minutes</p>
          </div>
          <div>
            <h3 className="font-medium">Contact Information</h3>
            <p>{contactInfo.firstName} {contactInfo.lastName}</p>
            {contactInfo.email && <p>Email: {contactInfo.email}</p>}
            {contactInfo.phone && <p>Phone: {contactInfo.phone}</p>}
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
            <p className="text-sm">
              A confirmation has been sent to {contactInfo.email || contactInfo.phone}.
              Please check your {contactInfo.email ? 'email' : 'phone'} for details.
            </p>
          </div>
          <Button 
            className="w-full mt-4" 
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
            }}
          >
            Schedule Another Appointment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {currentStep === 1 && (
        <AppointmentTypeSelect 
          value={appointmentTypeId} 
          onChange={handleAppointmentTypeSelect} 
        />
      )}
      
      {currentStep === 2 && appointmentType && (
        <div className="space-y-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Select Date & Time</h2>
            <p className="text-gray-600 mt-2">
              Scheduling a {appointmentType.name} ({appointmentType.duration} minutes)
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            <DatePicker 
              date={selectedDate} 
              onDateChange={setSelectedDate} 
            />
            
            <TimeSlots 
              selectedDate={selectedDate || new Date()}
              selectedTimeSlot={selectedTimeSlot}
              durationMinutes={appointmentType.duration}
              onTimeSlotSelect={setSelectedTimeSlot}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBackToTypes}
              className="w-full sm:w-1/2"
            >
              Back to Appointment Types
            </Button>
            
            {selectedDate && selectedTimeSlot && (
              <Button 
                type="button" 
                className="w-full sm:w-1/2"
                onClick={handleContinueToContactInfo}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      )}

      {currentStep === 3 && appointmentType && selectedDate && selectedTimeSlot && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Your Information</h2>
            <p className="text-gray-600 mt-2">
              Please provide your contact details to complete your booking
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-900">Appointment Summary</h3>
            <p className="text-sm text-blue-800 mt-1">
              {appointmentType.name} ({appointmentType.duration} min) on {' '}
              {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {' '}
              {format(new Date(`2000-01-01T${selectedTimeSlot}`), 'h:mm a')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={contactInfo.firstName}
                onChange={handleContactInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={contactInfo.lastName}
                onChange={handleContactInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                name="email"
                type="email"
                value={contactInfo.email}
                onChange={handleContactInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500">
                {!contactInfo.phone && "Either email or phone required"}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={handleContactInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500">
                {!contactInfo.email && "Either email or phone required"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBackToDateTime}
              className="w-full sm:w-1/2"
            >
              Back
            </Button>
            
            <Button 
              type="submit" 
              className="w-full sm:w-1/2"
              disabled={!contactInfo.firstName || !contactInfo.lastName || 
                      (!contactInfo.email && !contactInfo.phone)}
            >
              Confirm Appointment
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}