'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function testConnection() {
    setLoading(true);
    try {
      // Simple test to check if Supabase connection works
      const response = await fetch('https://xkzxpsltnhgudhmhujge.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrenhwc2x0bmhndWRobWh1amdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NzUwNTksImV4cCI6MjA1NzA1MTA1OX0.waYa9j-MhsDU2syOCx2HQHr-wSszsSH2t-9fBbAwbRQ');
      const data = await response.json();
      
      setResult({
        type: 'connection',
        success: true,
        data
      });
    } catch (error: any) {
      setResult({
        type: 'connection',
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  async function testTablesQuery() {
    setLoading(true);
    try {
      // Try listing tables - this is a safer approach
      const { data, error } = await supabase
        .from('scheduled')
        .select('*')
        .limit(1);
      
      if (error) {
        // If there's an error, try creating a test table
        setResult({
          type: 'tables',
          success: false,
          error: error.message,
          recommendation: "'scheduled' table may not exist in your database"
        });
      } else {
        setResult({
          type: 'tables',
          success: true,
          data,
          message: "Successfully queried the 'scheduled' table"
        });
      }
    } catch (error: any) {
      setResult({
        type: 'tables',
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  async function createTestTable() {
    setLoading(true);
    try {
      // Generate a simple apt number
      const aptNumber = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Try to create a test appointment with valid status
      const { data, error } = await supabase.from('scheduled').insert({
        apt_number: aptNumber,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone_number: '555-1234',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:30:00',
        text_notification: 0,
        appointment_type_id: '766ad826-2114-4478-bf9f-174b0bac49ae',
        status: 'scheduled' // Use known valid status value
      }).select();
      
      if (error) {
        // Show the full error details for debugging
        setResult({
          type: 'create',
          success: false,
          error: JSON.stringify(error, null, 2)
        });
      } else {
        setResult({
          type: 'create',
          success: true,
          message: "Successfully created a test appointment",
          data
        });
      }
    } catch (error: any) {
      setResult({
        type: 'create',
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  async function createMockTable() {
    setLoading(true);
    try {
      // Create a simpler test table
      const { error } = await supabase
        .from('mock_entries')
        .insert({
          title: 'Test Entry',
          content: 'This is a test'
        });
      
      if (error) {
        setResult({
          type: 'mock',
          success: false,
          error: error.message
        });
      } else {
        setResult({
          type: 'mock',
          success: true,
          message: "Successfully created a mock entry"
        });
      }
    } catch (error: any) {
      setResult({
        type: 'mock',
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Supabase Connection</h2>
        <div className="flex space-x-4">
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={testTablesQuery}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Tables Query'}
          </button>
          
          <button
            onClick={createTestTable}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Test Appointment'}
          </button>
          
          <button
            onClick={createMockTable}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Mock Entry'}
          </button>
        </div>
      </div>
      
      {result && (
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <h3 className="font-bold text-lg mb-2">
            {result.success ? 'Success' : 'Error'}: {result.type}
          </h3>
          
          {result.message && (
            <p className="mb-3">{result.message}</p>
          )}
          
          {result.recommendation && (
            <p className="mb-3 font-semibold">{result.recommendation}</p>
          )}
          
          {result.error && (
            <div className="mb-3">
              <p className="font-semibold">Error:</p>
              <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm mt-1">
                {result.error}
              </pre>
            </div>
          )}
          
          {result.data && (
            <div>
              <p className="font-semibold">Data:</p>
              <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm mt-1">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-lg mb-2">Supabase Troubleshooting Guide</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Verify your Supabase credentials in <code>.env.local</code> file</li>
          <li>Check if your project URL and API key are correct</li>
          <li>Make sure you have created the required tables in Supabase:</li>
          <ul className="list-disc pl-5 mt-2 mb-2">
            <li><code>scheduled</code> - For appointment bookings</li>
            <li><code>appointment_types</code> - For defining appointment types</li>
          </ul>
          <li>Check if Row Level Security (RLS) policies are allowing inserts</li>
          <li>If all else fails, you may need to create the tables manually in Supabase using the SQL editor</li>
        </ol>
      </div>
    </div>
  );
}