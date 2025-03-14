/**
 * API Endpoint to create appointments in the Supabase database
 * 
 * This endpoint accepts appointment data and saves it to the 'scheduled' table.
 * It provides proper validation, error handling, and a unique appointment number.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Parse the request data
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'appointment_date', 'appointment_time'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Generate a unique appointment number in format APT-XXXXXX
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const formattedAptNumber = `APT-${randomNum}`;
    
    // Format the appointment data for insertion
    const appointmentData = {
      apt_number: formattedAptNumber,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_number: data.phone_number || '',
      appointment_type_id: data.appointment_type_id || '766ad826-2114-4478-bf9f-174b0bac49ae',
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      text_notification: data.text_notification !== undefined ? data.text_notification : 0,
      status: 'scheduled'
    };
    
    // Insert the appointment into the database
    const { data: result, error } = await supabase
      .from('scheduled')
      .insert(appointmentData)
      .select();
    
    if (error) {
      // Handle database errors
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Database error occurred while saving appointment'
      }, { status: 500 });
    }
    
    // For now, let's just log the intent to update availability
    // and skip the actual API call until we set up the time_slots table
    console.log('Would update availability for:', {
      date: appointmentData.appointment_date,
      time: appointmentData.appointment_time
    });
    
    // Return success with the created appointment data
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Appointment scheduled successfully'
    });
  } catch (error: any) {
    // Handle unexpected errors
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred',
      details: 'An unexpected error occurred while processing your request'
    }, { status: 500 });
  }
}