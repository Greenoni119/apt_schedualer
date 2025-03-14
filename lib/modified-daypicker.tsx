// Component with client-side interactivity

import React from 'react';
import { DayPicker, DayPickerProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const NavigationLeft = () => <ChevronLeft className="h-4 w-4" />;
const NavigationRight = () => <ChevronRight className="h-4 w-4" />;

export function ModifiedDayPicker(props: DayPickerProps) {
  const {
    className,
    classNames,
    showOutsideDays = true,
    ...rest
  } = props;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
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
        ...classNames,
      }}
      {...rest}
    />
  );
}