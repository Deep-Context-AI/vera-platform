'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

interface DecisionNodeData {
  label: string;
  description: string;
}

interface DecisionNodeProps {
  data: DecisionNodeData;
}

const DecisionNode: React.FC<DecisionNodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-yellow-500 border-2 border-yellow-600 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-yellow-300 !border-2 !border-yellow-600"
      />
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-white" />
        <div className="text-white font-medium text-sm">{data.label}</div>
        <span className="bg-yellow-700 text-yellow-100 text-xs px-2 py-1 rounded">
          Conditions
        </span>
      </div>
      <div className="text-yellow-100 text-xs">{data.description}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-yellow-300 !border-2 !border-yellow-600"
      />
    </div>
  );
};

export default DecisionNode; 