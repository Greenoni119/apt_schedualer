/**
 * API Endpoint to handle time slot availability and bookings
 * 
 * This endpoint:
 * 1. GET: Retrieves the current available slots for a specific date
 * 2. POST: Updates available slots when an appointment is booked
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Table name for time slot availability
const TIMESLOTS_TABLE = 'time_slots';

// Default number of slots per time period
const DEFAULT_SLOTS = 3;

export async function GET(request: NextRequest) {
  try {
    // Get date from query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Date parameter is required' 
      }, { status: 400 });
    }
    
    // Query the database for time slots on this date
    const { data, error } = await supabase
      .from(TIMESLOTS_TABLE)
      .select('*')
      .eq('date', date);
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Database error occurred while fetching time slots'
      }, { status: 500 });
    }
    
    // Return the time slots
    return NextResponse.json({ 
      success: true, 
      data: data || []
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred',
      details: 'An unexpected error occurred while processing your request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { date, time, decrease = true } = data;
    
    if (!date || !time) {
      return NextResponse.json({ 
        success: false, 
        error: 'Date and time are required' 
      }, { status: 400 });
    }
    
    // First check if the time slot exists for this date
    const { data: existingSlot, error: fetchError } = await supabase
      .from(TIMESLOTS_TABLE)
      .select('*')
      .eq('date', date)
      .eq('time', time)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking time slot:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: fetchError.message,
        details: 'Database error occurred while checking time slot'
      }, { status: 500 });
    }
    
    let result;
    
    // If the time slot exists, update its availability
    if (existingSlot) {
      const newAvailability = decrease 
        ? Math.max(0, existingSlot.available - 1) 
        : Math.min(DEFAULT_SLOTS, existingSlot.available + 1);
      
      const { data: updatedSlot, error: updateError } = await supabase
        .from(TIMESLOTS_TABLE)
        .update({ available: newAvailability })
        .eq('id', existingSlot.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating time slot:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: updateError.message,
          details: 'Database error occurred while updating time slot'
        }, { status: 500 });
      }
      
      result = updatedSlot;
    } 
    // If the time slot doesn't exist, create it
    else {
      const availability = decrease ? DEFAULT_SLOTS - 1 : DEFAULT_SLOTS;
      
      const { data: newSlot, error: insertError } = await supabase
        .from(TIMESLOTS_TABLE)
        .insert({
          date,
          time,
          available: availability
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating time slot:', insertError);
        return NextResponse.json({ 
          success: false, 
          error: insertError.message,
          details: 'Database error occurred while creating time slot'
        }, { status: 500 });
      }
      
      result = newSlot;
    }
    
    // Return the updated/created time slot
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: decrease ? 'Time slot availability decreased' : 'Time slot availability increased'
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred',
      details: 'An unexpected error occurred while processing your request'
    }, { status: 500 });
  }
}