'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('scheduled');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '555-1234',
    status: 'scheduled',
    appointment_type_id: '766ad826-2114-4478-bf9f-174b0bac49ae', // This is the test UUID we use
    time_slot: '10:30'
  });

  useEffect(() => {
    async function fetchTables() {
      try {
        // Get list of tables
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .not('table_name', 'ilike', 'pg_%')
          .not('table_name', 'ilike', '_prisma_%');
        
        if (error) {
          console.error('Error fetching tables:', error);
          return;
        }
        
        const tableNames = data.map(t => t.table_name);
        setTables(tableNames);
      } catch (err) {
        console.error('Error listing tables:', err);
      }
    }
    
    fetchTables();
  }, []);

  async function fetchTableData() {
    if (!selectedTable) return;
    
    setLoading(true);
    try {
      // Get table data
      const { data, error } = await supabase
        .from(selectedTable)
        .select('*')
        .limit(10);
      
      if (error) {
        console.error(`Error fetching data from ${selectedTable}:`, error);
        setTableData([]);
        setTableColumns([]);
        return;
      }
      
      setTableData(data || []);
      
      // Extract column names from the first row
      if (data && data.length > 0) {
        setTableColumns(Object.keys(data[0]));
      } else {
        // If no data, try to get columns from schema
        const { data: columnData, error: columnError } = await supabase.rpc('check_scheduled_table');
        if (columnError) {
          console.error('Error fetching columns:', columnError);
        } else {
          setTableColumns(columnData || []);
        }
      }
    } catch (err) {
      console.error('Error fetching table data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestInsert() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled')
        .insert([formData])
        .select('*');
      
      if (error) {
        console.error('Insert error:', error);
        setResult({ success: false, error: error.message });
      } else {
        setResult({ success: true, data });
        fetchTableData(); // Refresh the table data
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Database Debug</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Database Tables</h2>
        <div className="flex space-x-4 mb-4">
          <select 
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="border p-2 rounded"
          >
            {tables.map(table => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
          <button
            onClick={fetchTableData}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load Table Data'}
          </button>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Test Insert to Scheduled Table</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key} className="mb-2">
              <label className="block text-sm font-medium mb-1">{key}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                className="border p-2 rounded w-full"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleTestInsert}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Test Insert'}
        </button>
        
        {result && (
          <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-bold">{result.success ? 'Success' : 'Error'}</h3>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(result.success ? result.data : result.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {tableData.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Table Data ({selectedTable})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  {tableColumns.map(column => (
                    <th key={column} className="py-2 px-4 border-b text-left">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {tableColumns.map(column => (
                      <td key={column} className="py-2 px-4 border-b">
                        {typeof row[column] === 'object' 
                          ? JSON.stringify(row[column]) 
                          : String(row[column] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}