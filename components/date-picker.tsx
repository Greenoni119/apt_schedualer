// Component with client-side interactivity

import * as React from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CalendarNavLeftIcon, CalendarNavRightIcon } from "@/lib/calendar-navigation";
import { buttonVariants } from "@/components/ui/button";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function DatePicker({ date, onDateChange }: DatePickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-lg font-medium">Select Date</Label>
      <div className="border rounded-lg shadow-sm p-3 bg-white">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={(date) => {
            // Disable dates in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Disable weekends (0 is Sunday, 6 is Saturday in JavaScript)
            const day = date.getDay();
            const isWeekend = day === 0 || day === 6;
            
            return date < today || isWeekend;
          }}
          showOutsideDays={true}
          className={cn("p-3 mx-auto")}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
            ),
            day_range_end: "day-range-end",
            day_selected: "bg-primary text-white hover:bg-blue-600 focus:bg-primary focus:text-white",
            day_today: "bg-gray-100 text-gray-900",
            day_outside: "day-outside text-gray-500 opacity-50",
            day_disabled: "text-gray-400 opacity-50",
            day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
            day_hidden: "invisible",
          }}
              initialFocus
        />
      </div>
      {date && (
        <p className="text-center text-sm font-medium text-primary">
          Selected: {format(date, "EEEE, MMMM d, yyyy")}
        </p>
      )}
    </div>
  );
}