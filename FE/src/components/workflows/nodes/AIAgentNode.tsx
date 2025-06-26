'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot } from 'lucide-react';

interface AIAgentNodeData {
  label: string;
  description: string;
  agent?: string;
}

interface AIAgentNodeProps {
  data: AIAgentNodeData;
}

const AIAgentNode: React.FC<AIAgentNodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-purple-500 border-2 border-purple-600 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-300 !border-2 !border-purple-600"
      />
      <div className="flex items-center gap-2 mb-2">
        <Bot className="w-4 h-4 text-white" />
        <div className="text-white font-medium text-sm">{data.label}</div>
        <span className="bg-purple-700 text-purple-100 text-xs px-2 py-1 rounded">
          Agent
        </span>
      </div>
      <div className="text-purple-100 text-xs mb-2">{data.description}</div>
      {data.agent && (
        <div className="text-purple-200 text-xs font-medium">
          {data.agent}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-300 !border-2 !border-purple-600"
      />
    </div>
  );
};

export default AIAgentNode; 