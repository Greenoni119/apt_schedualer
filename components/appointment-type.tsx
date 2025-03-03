// Component with client-side interactivity

import React from 'react';
import { Label } from '@/components/ui/label';

export type AppointmentType = {
  id: string;
  name: string;
  duration: number;
  description: string;
};

const appointmentTypes: AppointmentType[] = [
  {
    id: '1',
    name: 'Consultation',
    duration: 30,
    description: 'A brief 30-minute consultation meeting',
  },
  {
    id: '2',
    name: 'Standard Session',
    duration: 60,
    description: 'A standard 1-hour session',
  },
  {
    id: '3',
    name: 'Extended Session',
    duration: 90,
    description: 'An extended 90-minute in-depth session',
  },
  {
    id: '4',
    name: 'Emergency',
    duration: 45,
    description: 'A 45-minute emergency session',
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
  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-3">Choose Appointment Type</h2>
        <p className="text-gray-600">Select the type of appointment you'd like to schedule</p>
      </div>
      
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto gap-6">
        {appointmentTypes.map((type) => (
          <div
            key={type.id}
            className={`p-6 rounded-xl w-full max-w-md border-4 border-white shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              value === type.id ? 'ring-4 ring-primary bg-primary/5' : 'hover:bg-gray-50'
            }`}
            onClick={() => onChange(type.id)}
          >
            <h3 className="font-bold text-xl text-center">{type.name}</h3>
            <div className="flex justify-center text-sm text-gray-500 mt-2">
              <span className="font-medium">{type.duration} minutes</span>
            </div>
            <p className="text-sm text-gray-600 mt-3 text-center">{type.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const getAppointmentTypeById = (id: string): AppointmentType | undefined => {
  return appointmentTypes.find((type) => type.id === id);
};

export default appointmentTypes;