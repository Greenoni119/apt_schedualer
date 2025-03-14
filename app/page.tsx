"use client";

import React from 'react';
import { AppointmentForm, AppointmentData } from '@/components/appointment-form';

export default function Home() {
  const handleAppointmentSubmit = async (appointmentData: AppointmentData) => {
    console.log('Appointment scheduled:', appointmentData);
    
    try {
      // Store the appointment information to pass to the confirmation screen
      let confirmationData = {
        appointmentNumber: '',
        firstName: appointmentData.contactInfo.firstName,
        lastName: appointmentData.contactInfo.lastName,
        email: appointmentData.contactInfo.email,
        phone: appointmentData.contactInfo.phone || '',
        appointmentTypeId: appointmentData.appointmentTypeId,
        timeSlot: appointmentData.timeSlot || '',
        date: appointmentData.date
      };
      
      // Try the simplified endpoint
      try {
        // We will let the API generate the appointment number
        console.log('Sending appointment data:', {
            first_name: appointmentData.contactInfo.firstName,
            last_name: appointmentData.contactInfo.lastName,
            email: appointmentData.contactInfo.email,
            phone_number: appointmentData.contactInfo.phone || '',
            appointment_type_id: appointmentData.appointmentTypeId,
            appointment_time: appointmentData.timeSlot,
            appointment_date: appointmentData.date ? new Date(appointmentData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            text_notification: 0,
            status: 'scheduled'
      });
      
      // Try the direct API endpoint which is simpler
      const response = await fetch('/api/appointments/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Use exact column names for the scheduled table
            // Don't send apt_number - let the API generate it consistently
            first_name: appointmentData.contactInfo.firstName,
            last_name: appointmentData.contactInfo.lastName,
            email: appointmentData.contactInfo.email,
            phone_number: appointmentData.contactInfo.phone || '',
            appointment_type_id: appointmentData.appointmentTypeId,
            appointment_time: appointmentData.timeSlot,
            appointment_date: appointmentData.date ? new Date(appointmentData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            text_notification: 0,
            status: 'scheduled' // Adding the known valid status
          })
        });
        
        const result = await response.json();
        console.log('Save attempt result:', result);
        
        // Log success or failure prominently
        if (result.success) {
          console.log('%c APPOINTMENT SAVED SUCCESSFULLY! ', 'background: green; color: white; font-size: 20px');
          
          // Clear any existing confirmation data first
          sessionStorage.removeItem('appointmentConfirmation');
          
          // Get the appointment number from the result and store it for the confirmation screen
          if (result.data && result.data[0] && result.data[0].apt_number) {
            // CRITICAL: Extract and store the exact confirmation number from the API response
            const apiConfirmationNumber = result.data[0].apt_number;
            confirmationData.appointmentNumber = apiConfirmationNumber;
            console.log('CONFIRMATION NUMBER FROM API:', apiConfirmationNumber);
            
            // Store the confirmation data in sessionStorage so the form component can access it
            sessionStorage.setItem('appointmentConfirmation', JSON.stringify(confirmationData));
            
            // Log the stored data to verify it's correct
            const storedData = JSON.parse(sessionStorage.getItem('appointmentConfirmation') || '{}');
            console.log('VERIFICATION - Stored confirmation data:', storedData);
            
            // Wait a moment to ensure the data is stored before the form component tries to read it
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          console.error('%c APPOINTMENT SAVE FAILED! ', 'background: red; color: white; font-size: 20px', result.error || result.details || 'Unknown error');
        }
      } catch (saveError) {
        // Just log the error but don't block the UI flow
        console.error('Error saving to database:', saveError);
      }
      
      return true; // Return true so the UI can continue to the confirmation screen
    } catch (error) {
      console.error('Error processing appointment:', error);
      return null;
    }
  };

  return (
    <main className="min-h-screen">
      {/* Header with hero section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-20 right-0 w-72 h-72 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply blur-3xl opacity-70" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-200 dark:bg-indigo-900 rounded-full mix-blend-multiply blur-3xl opacity-70" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply blur-3xl opacity-40" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Navigation */}
        <nav className="relative z-10 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <div className="h-10 w-10 rounded-md flex items-center justify-center bg-blue-600 text-white mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">AppointEase</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 text-sm font-medium">Home</a>
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 text-sm font-medium">Features</a>
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 text-sm font-medium">Support</a>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Hero section */}
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10 pt-14 lg:pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span className="text-sm font-medium">Simple • Fast • Reliable</span>
              </div>
            
              <h1 className="text-5xl font-bold mb-6 leading-tight bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #4f46e5)' }}>
                Schedule Appointments <br />With Ease
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Book your preferred time slot in just a few clicks. Select your appointment type, 
                choose an available date, and confirm your booking — all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#booking-section" className="text-white transition-colors duration-150 rounded-lg px-4 py-2 font-medium shadow-sm bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-center">
                  <span>Book Appointment</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
                <button className="transition-colors duration-150 rounded-lg px-4 py-2 font-medium border-2 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 inline-flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                  </svg>
                  <span>How it works</span>
                </button>
              </div>
              
              <div className="mt-12 flex items-center space-x-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <span className="block text-sm text-gray-600 dark:text-gray-400">Trusted by 10,000+ users</span>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                    <span className="text-xs text-gray-600 ml-1">4.9/5</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl transform rotate-3 scale-105 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-lg">
                <div className="absolute right-8 top-8 bg-green-100 dark:bg-green-900/40 rounded-full px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400 mr-1"></span>
                    Appointments Available
                </div>
                <div className="flex flex-col items-center justify-center pt-5">
                  <img 
                    src="/darkmode.png" 
                    alt="Cali Seal "
                    width={400} 
                    height={400}
                    
                  />
                  <p className="text-center text-lg font-medium text-gray-700 dark:text-gray-300 p-5">
                    Schedule appointments easily with our intuitive interface
                  </p>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Available on all devices
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking section */}
      <div id="booking-section" className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/3">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-8">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Why Choose Our Service</h2>
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">No registration required</span>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">Easy rescheduling options</span>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">Email and SMS reminders</span>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">Secure and private booking</span>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="ml-3 text-gray-600 dark:text-gray-300">24/7 online availability</span>
                  </li>
                </ul>
              </div>
              
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: 'white' }}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-xl text-white">Need help?</h3>
                    <p className="text-white">We're here for you</p>
                  </div>
                </div>
                <p className="mb-4" style={{ color: 'white' }}>Having trouble with scheduling? Our support team is ready to assist you.</p>
                <button className="w-full bg-white text-indigo-600 font-medium rounded-lg py-2 hover:bg-blue-50 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/3">
            <div className="form-container">
              <div className="p-8">
                <AppointmentForm onSubmit={handleAppointmentSubmit} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="page-container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">Streamlined Appointment Booking</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Our platform offers a seamless experience from selection to confirmation, 
              with attention to detail at every step of the process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card card-hover p-6">
              <div className="bg-blue-100 dark:bg-blue-900/50 rounded-xl w-14 h-14 flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Flexible Scheduling</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Choose from a variety of appointment types and time slots that fit your schedule.</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Multiple appointment types
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Availability indicators
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Time-zone aware
                </li>
              </ul>
            </div>
            
            <div className="card card-hover p-6">
              <div className="bg-green-100 dark:bg-green-900/50 rounded-xl w-14 h-14 flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Instant Confirmation</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Receive immediate confirmation and details about your appointment.</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Email confirmation
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Downloadable details
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Calendar integration
                </li>
              </ul>
            </div>
            
            <div className="card card-hover p-6">
              <div className="bg-purple-100 dark:bg-purple-900/50 rounded-xl w-14 h-14 flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">Smart Reminders</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Get timely notifications so you never miss your scheduled appointment.</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24-hour reminder
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  SMS notifications
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Custom reminder settings
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="page-container py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 dark:text-white">What Our Users Say</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Don't just take our word for it — see what our users have to say about their booking experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Johnson",
              role: "Marketing Director",
              comment: "This scheduling tool saved me so much time. I no longer need to go back and forth with emails to set up meetings.",
              rating: 5
            },
            {
              name: "David Chen",
              role: "Small Business Owner",
              comment: "The interface is intuitive and my clients love how easy it is to book appointments with my business.",
              rating: 5
            },
            {
              name: "Emma Wilson",
              role: "Freelance Designer",
              comment: "I've tried several scheduling apps and this is by far the best. The reminders feature ensures I never miss a client meeting.",
              rating: 4
            }
          ].map((testimonial, idx) => (
            <div key={idx} className="card card-hover p-6">
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className={`w-5 h-5 ${star <= testimonial.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">"{testimonial.comment}"</p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold dark:text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="btn-outline inline-flex items-center justify-center dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-300">
            <span>View all testimonials</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="page-container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Find answers to common questions about our appointment scheduling service.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            {[
              {
                question: "How far in advance can I book an appointment?",
                answer: "You can book appointments up to 3 months in advance. This helps ensure availability while maintaining reasonable scheduling windows."
              },
              {
                question: "Can I reschedule or cancel my appointment?",
                answer: "Yes, you can reschedule or cancel your appointment by clicking the link in your confirmation email or by contacting our support team."
              },
              {
                question: "Will I receive a reminder before my appointment?",
                answer: "Yes, we send email reminders 24 hours before your scheduled appointment. If you provided a phone number, you'll also receive an SMS reminder."
              },
              {
                question: "What happens if I miss my appointment?",
                answer: "If you miss your appointment, you'll need to schedule a new one. We recommend contacting us as soon as possible if you know you can't make it."
              },
              {
                question: "Is my information secure?",
                answer: "Yes, we take data privacy and security seriously. All your information is encrypted and stored securely. We never share your data with third parties without your consent."
              }
            ].map((faq, idx) => (
              <div key={idx} className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                <h3 className="text-xl font-medium mb-3 dark:text-white">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA and Footer */}
      <div className="relative">
        <div className="absolute inset-0 h-1/2 bg-gray-50 dark:bg-gray-900"></div>
        <div className="relative page-container">
          <div className="rounded-2xl p-10 text-center text-white shadow-soft" style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)' }}>
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
              Experience the easiest way to schedule appointments. Book your first appointment now!
            </p>
            <a href="#booking-section" className="inline-block bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium px-6 py-3 rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
              Book Your Appointment
            </a>
          </div>
          
          <footer className="pt-20 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              <div>
                <div className="flex items-center mb-4">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-blue-600 text-white mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">AppointEase</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Simple and powerful appointment scheduling to save you time and delight your clients.</p>
                <div className="flex space-x-3">
                  {['twitter', 'facebook', 'instagram', 'linkedin'].map(social => (
                    <a key={social} href="#" className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                      <span className="sr-only">{social}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 dark:text-white">Product</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Testimonials</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">FAQs</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 dark:text-white">Resources</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">API Documentation</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Status</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 dark:text-white">Company</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Legal</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} AppointEase. All rights reserved.</p>
              <div className="flex space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
