"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, addMinutes, isSameDay } from 'date-fns';

// TimeSlot type definition
interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  display: string;
  available: number; // Number of available slots
  status: 'available' | 'limited' | 'busy' | 'past';
}


// Generate realistic time slots with availability
const generateTimeSlots = (selectedDate: Date, durationMinutes: number = 30): TimeSlot[] => {
  const slots: TimeSlot[] = [];
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
  
  // Generate fake availability data - in a real app this would come from a database
  const generateAvailability = (hour: number, minute: number): number => {
    // Make mid-morning and mid-afternoon busier
    if ((hour === 10 || hour === 11 || hour === 14 || hour === 15) && minute === 0) {
      return Math.floor(Math.random() * 2); // 0-1 slots (busy)
    } else if (hour === 12) {
      return Math.floor(Math.random() * 3) + 3; // 3-5 slots (lunch hour - more available)
    } else {
      return Math.floor(Math.random() * 4) + 1; // 1-4 slots (normal availability)
    }
  };
  
  // Generate slots until we reach the end time
  while (currentTime < endTime) {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    // Check if this slot is in the past (for today's date)
    const isPast = isSameDay(baseDate, now) && currentTime < now;
    
    const available = generateAvailability(hour, minute);
    
    // Determine slot status
    let status: 'available' | 'limited' | 'busy' | 'past' = 'available';
    if (isPast) {
      status = 'past';
    } else if (available === 0) {
      status = 'busy';
    } else if (available <= 2) {
      status = 'limited';
    }
    
    // Add the slot (we'll show past/busy slots but disable them)
    const endTimeForSlot = new Date(currentTime);
    endTimeForSlot.setMinutes(endTimeForSlot.getMinutes() + durationMinutes);
    
    slots.push({
      id: format(currentTime, 'HH:mm'),
      startTime: new Date(currentTime),
      endTime: endTimeForSlot,
      display: format(currentTime, 'h:mm a'),
      available,
      status
    });
    
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
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [filterOption, setFilterOption] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Load time slots when date changes
  useEffect(() => {
    console.log("TimeSlots useEffect - selectedDate:", selectedDate);
    console.log("TimeSlots useEffect - durationMinutes:", durationMinutes);
    
    // Always generate time slots, using current date as fallback
    const date = selectedDate || new Date();
    console.log("Using date for time slots:", date);
    const slots = generateTimeSlots(date, durationMinutes || 30);
    console.log("Generated time slots:", slots.length);
    setTimeSlots(slots);
  }, [selectedDate, durationMinutes]);
  
  // Still render time slots UI even if no date is selected
  // if (!selectedDate) return null;

  // Filter time slots based on selected period
  const filterSlotsByPeriod = (slots: TimeSlot[], period: string): TimeSlot[] => {
    if (period === 'all') return slots;
    
    return slots.filter(slot => {
      const hour = slot.startTime.getHours();
      if (period === 'morning') return hour < 12;
      if (period === 'afternoon') return hour >= 12 && hour < 17;
      return true;
    });
  };

  // Filter time slots based on availability
  const filterSlotsByAvailability = (slots: TimeSlot[], option: string): TimeSlot[] => {
    if (option === 'all') return slots;
    
    return slots.filter(slot => {
      if (option === 'available') return slot.status === 'available' || slot.status === 'limited';
      return true;
    });
  };

  // Apply filters
  const filteredSlots = filterSlotsByAvailability(
    filterSlotsByPeriod(timeSlots, selectedPeriod),
    filterOption
  );

  // Get status indicator color
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'limited': return 'bg-amber-500';
      case 'busy': return 'bg-red-500';
      case 'past': return 'bg-gray-400';
      default: return 'bg-blue-500';
    }
  };

  // Get button classes based on status
  const getButtonClasses = (slot: TimeSlot, isSelected: boolean) => {
    if (isSelected) return "bg-blue-600 text-white hover:bg-blue-700";
    
    switch (slot.status) {
      case 'available': 
        return "bg-green-50 text-green-800 hover:bg-green-100";
      case 'limited': 
        return "bg-amber-50 text-amber-800 hover:bg-amber-100";
      case 'busy': 
        return "bg-red-50 text-red-800 opacity-60 cursor-not-allowed";
      case 'past': 
        return "bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed";
      default: 
        return "hover:bg-blue-50";
    }
  };
  
  return (
    <div className="space-y-4">
      
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium dark:text-white">Select Time</Label>
        <div className="flex space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`text-xs px-2 py-1 h-8 ${selectedPeriod === 'all' ? 'border-2 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-400' : ''}`}
            onClick={() => setSelectedPeriod('all')}
          >
            All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`text-xs px-2 py-1 h-8 ${selectedPeriod === 'morning' ? 'border-2 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-400' : ''}`}
            onClick={() => setSelectedPeriod('morning')}
          >
            Morning
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`text-xs px-2 py-1 h-8 ${selectedPeriod === 'afternoon' ? 'border-2 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-400' : ''}`}
            onClick={() => setSelectedPeriod('afternoon')}
          >
            Afternoon
          </Button>
        </div>
      </div>
      
      <div className="border-2 rounded-xl shadow-sm overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700">
          <p className="text-sm font-medium dark:text-gray-300">
            {filteredSlots.filter(s => s.status !== 'busy' && s.status !== 'past').length} available time slots
          </p>
          <div className="flex items-center space-x-2">
            <label htmlFor="filter" className="text-sm dark:text-gray-300">Show:</label>
            <select 
              id="filter"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded p-1"
            >
              <option value="all">All slots</option>
              <option value="available">Available only</option>
            </select>
          </div>
        </div>
        
        <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredSlots.map((slot) => {
              const isSelected = selectedTimeSlot === slot.id;
              const isDisabled = slot.status === 'busy' || slot.status === 'past';
              
              return (
                <button
                  key={slot.id}
                  disabled={isDisabled}
                  className={cn(
                    "flex flex-col items-center justify-center h-24 px-6 py-3 rounded-lg transition-all",
                    getButtonClasses(slot, isSelected)
                  )}
                  onClick={() => !isDisabled && onTimeSlotSelect(slot.id)}
                >
                  <span className="font-bold">{slot.display}</span>
                  <div className="flex items-center mt-2 text-xs">
                  <span className={`h-2 w-2 rounded-full mr-1 ${getStatusIndicator(slot.status)}`}></span>
                    {slot.status === 'available' && <span>{slot.available} slot{slot.available > 1 && 's'}</span>}
                    {slot.status === 'limited' && <span>{slot.available} slot{slot.available > 1 && 's'}</span>}
                    {slot.status === 'busy' && <span>Fully booked</span>}
                    {slot.status === 'past' && <span>Unavailable</span>}
                  </div>
                </button>
              );
            })}
            
            {filteredSlots.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No available time slots match your filters</p>
                <Button 
                  type="button" 
                  variant="link" 
                  className="mt-2 text-blue-600 dark:text-blue-400"
                  onClick={() => {
                    setSelectedPeriod('all');
                    setFilterOption('all');
                  }}
                >
                  Reset filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Legend for availability */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
          <span>Limited availability</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <span>Fully booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-gray-400"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}