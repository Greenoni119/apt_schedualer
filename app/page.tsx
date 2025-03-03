"use client";

import React from 'react';
import { AppointmentForm, AppointmentData } from '@/components/appointment-form';

export default function Home() {
  const handleAppointmentSubmit = (appointmentData: AppointmentData) => {
    // In a real app, you would save this data to a database
    console.log('Appointment scheduled:', appointmentData);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
      <div className="w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">Appointment Scheduler</h1>
          <p className="text-gray-500 text-lg">
            Select your appointment type, choose a date, and pick an available time slot.
          </p>
        </div>
        
        <div className="bg-gradient-to-b from-gray-50 to-white p-8 rounded-xl shadow-lg border">
          <AppointmentForm onSubmit={handleAppointmentSubmit} />
        </div>
      </div>
    </main>
  );
}
