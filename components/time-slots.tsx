// Component with client-side interactivity

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, addMinutes } from 'date-fns';

// Generate time slots from 9 AM to 5 PM in 30-minute intervals
const generateTimeSlots = (selectedDate: Date, durationMinutes: number = 30) => {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM

  // Create a new date object with the selected date but at midnight
  const baseDate = new Date(selectedDate);
  baseDate.setHours(0, 0, 0, 0);

  // Current date for comparison (to disable past time slots)
  const now = new Date();
  
  // Start time (9 AM)
  let currentTime = new Date(baseDate);
  currentTime.setHours(startHour, 0, 0, 0);
  
  // End time (5 PM)
  const endTime = new Date(baseDate);
  endTime.setHours(endHour, 0, 0, 0);
  
  // Generate slots until we reach the end time
  while (currentTime < endTime) {
    // Check if this slot is in the past (for today's date)
    const isPast = baseDate.getDate() === now.getDate() && 
                   baseDate.getMonth() === now.getMonth() && 
                   baseDate.getFullYear() === now.getFullYear() && 
                   currentTime < now;
    
    // Add the slot if it's not in the past
    if (!isPast) {
      const endTimeForSlot = new Date(currentTime);
      endTimeForSlot.setMinutes(endTimeForSlot.getMinutes() + durationMinutes);
      
      slots.push({
        id: format(currentTime, 'HH:mm'),
        startTime: new Date(currentTime),
        endTime: endTimeForSlot,
        display: format(currentTime, 'h:mm a'),
      });
    }
    
    // Move to the next slot (30 minutes later)
    currentTime = addMinutes(currentTime, 30);
  }
  
  return slots;
};

interface TimeSlotProps {
  selectedDate: Date | undefined;
  selectedTimeSlot: string | null;
  durationMinutes: number;
  onTimeSlotSelect: (timeSlot: string) => void;
}

export function TimeSlots({ 
  selectedDate, 
  selectedTimeSlot, 
  durationMinutes,
  onTimeSlotSelect 
}: TimeSlotProps) {
  // Don't show time slots if no date is selected
  if (!selectedDate) return null;
  
  const timeSlots = generateTimeSlots(selectedDate, durationMinutes);
  
  return (
    <div className="space-y-3">
      <Label className="text-lg font-medium">Select Time</Label>
      <div className="border rounded-lg shadow-sm p-4 bg-white">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-2">
          {timeSlots.map((slot) => (
            <Button
              key={slot.id}
              variant={selectedTimeSlot === slot.id ? "default" : "outline"}
              className={cn(
                "h-12 transition-all",
                selectedTimeSlot === slot.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:border-primary"
              )}
              onClick={() => onTimeSlotSelect(slot.id)}
            >
              {slot.display}
            </Button>
          ))}
          {timeSlots.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-3 text-center py-4">
              No available time slots for the selected date.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}