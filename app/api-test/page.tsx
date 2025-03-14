'use client';

import { useState } from 'react';

export default function ApiTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    // Use the exact column names from the error message
    apt_number: '9999',
    first_name: 'API',
    last_name: 'Test',
    email: 'apitest@example.com',
    phone_number: '555-1234',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:30:00',
    text_notification: 0,
    status: 'scheduled',
    appointment_type_id: '766ad826-2114-4478-bf9f-174b0bac49ae'
  });

  async function handleTestApi() {
    setLoading(true);
    try {
      const response = await fetch('/api/appointments/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      setResult({
        success: true,
        data
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  }
  
  function updateFormData(key: string, value: any) {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Endpoint Test</h1>
      
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Appointment Data</h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key} className="mb-4">
              <label className="block text-sm font-medium mb-1">{key}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => updateFormData(key, e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleTestApi}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Testing...' : 'Test API Endpoint'}
          </button>
        </div>
      </div>
      
      {result && (
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <h3 className="font-bold text-lg mb-2">
            {result.success ? 'Success' : 'Error'}
          </h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}