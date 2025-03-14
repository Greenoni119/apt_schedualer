'use client';

import React from 'react';

interface DebugInfoProps {
  data: any;
  label?: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ data, label }) => {
  return (
    <div className="my-4 p-4 border border-red-300 bg-red-50 rounded-md">
      <h3 className="font-bold text-red-800 mb-2">{label || 'Debug Info'}</h3>
      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};