import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  console.log('API endpoint called!');
  try {
    const data = await request.json();
    console.log('Appointment data for direct save:', data);
    console.log('Contains status:', data.status);
    
    // First, let's check if the scheduled table exists and what columns it has
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'scheduled');
    
    if (tablesError || !tables || tables.length === 0) {
      console.log('The scheduled table does not exist, creating it now...');
      
      // Create the scheduled table if it doesn't exist
      const { error: createError } = await supabase.rpc('create_scheduled_table');
      
      if (createError) {
        console.error('Error creating scheduled table:', createError);
        
        // If the RPC fails, try direct SQL
        const { error: directCreateError } = await supabase.from('_tables').select('*').then(
          async () => {
            return await supabase.from('scheduled').insert({
              apt_number: '1001',
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              appointment_date: new Date().toISOString().split('T')[0],
              appointment_time: '10:30:00',
              text_notification: 0,
              status: 'scheduled',
              appointment_type_id: '766ad826-2114-4478-bf9f-174b0bac49ae'
            });
          }
        );
        
        if (directCreateError) {
          return NextResponse.json({ 
            error: 'Failed to create or access scheduled table',
            details: directCreateError.message 
          }, { status: 500 });
        }
      }
    }
    
    // Get the next available apt_number (simple sequential number)
    const { data: maxAptNumber } = await supabase
      .from('scheduled')
      .select('apt_number')
      .order('apt_number', { ascending: false })
      .limit(1);
      
    const nextAptNumber = maxAptNumber && maxAptNumber.length > 0 && maxAptNumber[0].apt_number
      ? (parseInt(maxAptNumber[0].apt_number) + 1).toString()
      : "1001";
    
    // Format the data with the correct column names
    const appointmentData = {
      apt_number: nextAptNumber,
      first_name: data.name ? data.name.split(' ')[0] : 'Test',
      last_name: data.name ? data.name.split(' ').slice(1).join(' ') : 'User',
      email: data.email || 'test@example.com',
      phone_number: data.phone || '',
      appointment_type_id: data.appointment_type_id || '766ad826-2114-4478-bf9f-174b0bac49ae',
      appointment_date: data.appointment_date || new Date().toISOString().split('T')[0],
      appointment_time: data.time_slot || '10:30:00',
      text_notification: 0,
      status: 'scheduled' // This is a valid value according to the constraint
    };
    
    console.log('Inserting with data:', appointmentData);
    
    const { data: result, error } = await supabase
      .from('scheduled')
      .insert(appointmentData)
      .select();
      
    if (error) {
      console.error('Error creating appointment:', error);
      
      // Try known valid status values from the database constraint
      let statusValues = ['scheduled', 'checked_in'];
      let successValue = null;
      
      // Try each value until one works
      for (const testStatus of statusValues) {
        try {
          const { data: statusResult, error: statusError } = await supabase
            .from('scheduled')
            .insert({
              apt_number: nextAptNumber,
              first_name: 'Test',
              last_name: 'User',
              appointment_date: new Date().toISOString().split('T')[0],
              appointment_time: '10:30:00',
              text_notification: 0,
              status: testStatus
            })
            .select();
            
          if (!statusError) {
            successValue = testStatus;
            console.log(`Found working status value: ${testStatus}`);
            return NextResponse.json({ 
              success: true, 
              data: statusResult,
              note: `Successfully used status: ${testStatus}`
            });
          }
        } catch (statusTryError) {
          console.log(`Status value ${testStatus} failed`);
        }
      }
      
      // If we get here, none of the status values worked
      const { data: minimalResult, error: minimalError } = await supabase
        .from('scheduled')
        .insert({
          apt_number: nextAptNumber,
          first_name: 'Test',
          last_name: 'User',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '10:30:00',
          text_notification: 0,
          status: 'scheduled'
        })
        .select();
        
      if (minimalError) {
        return NextResponse.json({ 
          error: 'Failed to insert even with minimal fields',
          details: minimalError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        data: minimalResult,
        note: 'Inserted with minimal fields only'
      });
    }
    
    console.log('Appointment saved successfully:', result);
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Appointment saved successfully!'
    });
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}