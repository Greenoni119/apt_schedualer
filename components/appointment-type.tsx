"use client";

import React, { useEffect, useState } from 'react';
import { getAppointmentTypes } from '@/lib/api';
import { AppointmentType as SupabaseAppointmentType } from '@/lib/supabase';

export type AppointmentType = {
  id: string;
  name: string;
  duration: number;
  description: string;
  icon: React.ReactNode;
  color: string;
};

// Icon components for appointment types
const icons = {
  'message-square': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  'clock': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  'star': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  'alert-circle': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
};

// Default appointment types in case API fails
const defaultAppointmentTypes: AppointmentType[] = [
  {
    id: '1',
    name: 'Consultation',
    duration: 30,
    description: 'A brief 30-minute initial consultation to discuss your needs',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400',
  },
  {
    id: '2',
    name: 'Standard Session',
    duration: 60,
    description: 'A comprehensive 1-hour session for most standard needs',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
    color: 'bg-green-500/10 text-green-600 dark:bg-green-500/30 dark:text-green-400',
  },
  {
    id: '3',
    name: 'Extended Session',
    duration: 90,
    description: 'An in-depth 90-minute session for complex matters requiring extra time',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
    color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/30 dark:text-purple-400',
  },
  {
    id: '4',
    name: 'Emergency',
    duration: 45,
    description: 'A priority 45-minute session for urgent matters requiring immediate attention',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    ),
    color: 'bg-red-500/10 text-red-600 dark:bg-red-500/30 dark:text-red-400',
  },
];

interface AppointmentTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const AppointmentTypeSelect: React.FC<AppointmentTypeSelectProps> = ({
  value,
  onChange,
}) => {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(defaultAppointmentTypes);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointmentTypes() {
      try {
        // Start with a short timeout to ensure we don't wait too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        // Try to fetch from API with abort signal
        const types = await getAppointmentTypes();
        clearTimeout(timeoutId);
        
        if (types && types.length > 0) {
          // Map Supabase types to component types with icons
          const mappedTypes = types.map((type: SupabaseAppointmentType) => ({
            id: type.id,
            name: type.name,
            duration: type.duration,
            description: type.description,
            // @ts-ignore - We know these icon names exist in our icons object
            icon: icons[type.icon] || icons['message-square'],
            color: type.color,
          }));
          setAppointmentTypes(mappedTypes);
        } else {
          // If no types returned, keep using default types
          console.log('No types returned, using defaults');
        }
        
        // Dispatch event with the fetched types for use elsewhere
        const typesToUse = types && types.length > 0 
          ? types.map((type: SupabaseAppointmentType) => ({
              id: type.id,
              name: type.name,
              duration: type.duration,
              description: type.description,
              // @ts-ignore - We know these icon names exist in our icons object
              icon: icons[type.icon] || icons['message-square'],
              color: type.color,
            }))
          : defaultAppointmentTypes;
            
        // Dispatch a custom event with the appointment types
        window.dispatchEvent(new CustomEvent('appointmentTypesLoaded', {
          detail: typesToUse
        }));
        
      } catch (err) {
        // Just use default types without showing error
        console.log('Using default appointment types');
        
        // Dispatch default types
        window.dispatchEvent(new CustomEvent('appointmentTypesLoaded', {
          detail: defaultAppointmentTypes
        }));
      } finally {
        // Always set loading to false to show the UI
        setLoading(false);
      }
    }

    // Set a short timeout before showing content to avoid flash
    const timer = setTimeout(() => {
      fetchAppointmentTypes();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-3 dark:text-white">Choose Appointment Type</h2>
        <p className="text-gray-600 dark:text-gray-300">Select the type of appointment you'd like to schedule</p>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-40 w-full space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading appointment types...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md-grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
        {appointmentTypes.map((type) => (
          <div
            key={type.id}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
              value === type.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
            }`}
            onClick={() => onChange(type.id)}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${type.color}`}>
                {type.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl dark:text-white">{type.name}</h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span className="font-medium">{type.duration} minutes</span>
                </div>
                <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
                  {type.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export const getAppointmentTypeById = (id: string, types: AppointmentType[] = defaultAppointmentTypes): AppointmentType | undefined => {
  return types.find((type) => type.id === id);
};

// Export default appointment types for fallback
export default defaultAppointmentTypes;