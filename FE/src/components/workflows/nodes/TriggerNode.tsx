'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

interface TriggerNodeData {
  label: string;
  description: string;
  records?: number;
}

interface TriggerNodeProps {
  data: TriggerNodeData;
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-blue-500 border-2 border-blue-600 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Play className="w-4 h-4 text-white" />
        <div className="text-white font-medium text-sm">{data.label}</div>
      </div>
      <div className="text-blue-100 text-xs mb-2">{data.description}</div>
      {data.records && (
        <div className="text-blue-200 text-xs font-medium">
          {data.records.toLocaleString()} records
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-300 !border-2 !border-blue-600"
      />
    </div>
  );
};

export default TriggerNode; 