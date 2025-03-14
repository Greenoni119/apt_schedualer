"use client";

import * as React from "react";
import { useState } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWeekend, addDays } from "date-fns";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function DatePicker({ date, onDateChange }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Current view month
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Calculate date range (today to 3 months in the future)
  const maxDate = addMonths(today, 3);
  
  // Define the type for available days
  type AvailableDaysType = {
    [key: string]: { available: number }
  };

  // Calculate available days based on some business rules
  const getAvailableDays = (): AvailableDaysType => {
    // Generate dynamic availability for current month and next month
    const result: AvailableDaysType = {};
    
    // Current date plus 30 days
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      // Skip weekends
      if (isWeekend(date)) continue;
      
      // Format date as YYYY-MM-DD
      const dateKey = format(date, 'yyyy-MM-dd');
      
      // Random availability between 1-10 slots
      const available = Math.floor(Math.random() * 10) + 1;
      result[dateKey] = { available };
    }
    
    return result;
  };
  
  const availableDays: AvailableDaysType = getAvailableDays();
  
  // Function to render a calendar month
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get days of week (0 = Sunday, 1 = Monday, etc.)
    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    
    // Create calendar days
    const days = dateRange.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const isToday = isSameDay(day, today);
      const isSelected = date && isSameDay(day, date);
      const isDisabled = 
        day < today || 
        isWeekend(day) || 
        day > maxDate;
      
      const slotsAvailable = availableDays[dateKey]?.available || 0;
      const hasHighAvailability = slotsAvailable >= 5;
      const hasLowAvailability = slotsAvailable > 0 && slotsAvailable < 5;
      
      return {
        date: day,
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday,
        isSelected,
        isDisabled,
        slotsAvailable,
        hasHighAvailability,
        hasLowAvailability
      };
    });
    
    // Group days by week
    const weeks: Array<typeof days> = [];
    let week: typeof days = [];
    
    // Add empty cells for days before the first of the month
    const firstDayOfMonth = monthStart.getDay();
    for (let i = 0; i < firstDayOfMonth; i++) {
      week.push({
        date: addDays(monthStart, i - firstDayOfMonth),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isDisabled: true,
        slotsAvailable: 0,
        hasHighAvailability: false,
        hasLowAvailability: false
      });
    }
    
    // Add days of the month
    days.forEach((day) => {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });
    
    // Add empty cells for days after the last day of the month
    if (week.length > 0) {
      const daysToAdd = 7 - week.length;
      const lastDay = days[days.length - 1].date;
      for (let i = 1; i <= daysToAdd; i++) {
        week.push({
          date: addDays(lastDay, i),
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          isDisabled: true,
          slotsAvailable: 0,
          hasHighAvailability: false,
          hasLowAvailability: false
        });
      }
      weeks.push(week);
    }
    
    return (
      <div className="calendar">
        <div className="calendar-header flex items-center justify-between mb-4">
          <button 
            onClick={() => setCurrentMonth(prevMonth => addMonths(prevMonth, -1))}
            disabled={isSameMonth(currentMonth, today)}
            className="calendar-nav-button px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="month-name font-medium dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button 
            onClick={() => setCurrentMonth(prevMonth => addMonths(prevMonth, 1))}
            disabled={isSameMonth(currentMonth, maxDate)}
            className="calendar-nav-button px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        
        <table className="calendar-table w-full border-collapse">
          <thead>
            <tr className="calendar-weekdays">
              {daysOfWeek.map(day => (
                <th key={day} className="text-center font-medium text-sm text-gray-600 dark:text-gray-300 py-2">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={`week-${weekIndex}`} className="calendar-week">
                {week.map((day, dayIndex) => (
                  <td key={`day-${weekIndex}-${dayIndex}`} className="calendar-day p-1 text-center">
                    <button
                      className={cn(
                        "calendar-day-button inline-flex items-center justify-center w-10 h-10 rounded-md relative focus:outline-none transition-colors",
                        !day.isCurrentMonth && "text-gray-400 dark:text-gray-500 opacity-50",
                        day.isDisabled && "text-gray-300 dark:text-gray-600 opacity-25 cursor-not-allowed",
                        day.isToday && !day.isSelected && "bg-gray-100 dark:bg-gray-700 text-blue-900 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-700",
                        day.isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                        day.hasHighAvailability && !day.isSelected && "border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 font-medium",
                        day.hasLowAvailability && !day.isSelected && "border-2 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30 font-medium",
                        !day.isDisabled && !day.isSelected && "hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-gray-200"
                      )}
                      onClick={() => {
                        if (!day.isDisabled) {
                          onDateChange(day.date);
                        }
                      }}
                      disabled={day.isDisabled}
                      aria-label={format(day.date, 'EEEE, MMMM d, yyyy')}
                      aria-selected={day.isSelected}
                      tabIndex={day.isDisabled ? -1 : 0}
                    >
                      {format(day.date, 'd')}
                      {day.slotsAvailable > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                        </span>
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium dark:text-white">Select Date</Label>
        {date && (
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {format(date, "EEEE, MMMM d, yyyy")}
          </span>
        )}
      </div>
      <div className="border-2 rounded-xl shadow-sm p-4 bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        {renderCalendar()}
      </div>
      
      {/* Legend for availability */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-sky-500"></div>
          <span>Available slots</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-blue-600"></div>
          <span>Selected date</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-gray-300 line-through"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}