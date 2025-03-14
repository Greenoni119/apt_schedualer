import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received appointment data:', data);

    // Check the structure of the scheduled table
    const { data: tableInfo, error: tableError } = await supabase
      .from('scheduled')
      .select('*')
      .limit(1);
    
    console.log('Table info:', tableInfo, 'Table error:', tableError);
    
    // Get the RPC to describe the table
    const { data: rpcInfo } = await supabase.rpc('get_table_info', { table_name: 'scheduled' });
    console.log('RPC Info:', rpcInfo);

    // Try with minimal fields first
    const { data: appointment, error } = await supabase
      .from('scheduled')
      .insert([{
        name: data.name,
        email: data.email,
        appointment_type_id: data.appointment_type_id
      }])
      .select();

    if (error) {
      console.error('Error creating appointment in Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error: any) {
    console.error('Error in appointments API route:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}