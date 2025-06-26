'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle, AlertTriangle, FileText, Eye } from 'lucide-react';

interface ActionNodeData {
  label: string;
  description: string;
  actionType: 'approve' | 'flag' | 'escalate' | 'request' | 'review';
}

interface ActionNodeProps {
  data: ActionNodeData;
}

const ActionNode: React.FC<ActionNodeProps> = ({ data }) => {
  const getActionConfig = (actionType: ActionNodeData['actionType']) => {
    switch (actionType) {
      case 'approve':
        return {
          bgColor: 'bg-green-500',
          borderColor: 'border-green-600',
          icon: CheckCircle,
          textColor: 'text-green-100',
          labelBg: 'bg-green-700',
          labelText: 'text-green-100'
        };
      case 'flag':
        return {
          bgColor: 'bg-orange-500',
          borderColor: 'border-orange-600',
          icon: AlertTriangle,
          textColor: 'text-orange-100',
          labelBg: 'bg-orange-700',
          labelText: 'text-orange-100'
        };
      case 'escalate':
        return {
          bgColor: 'bg-red-500',
          borderColor: 'border-red-600',
          icon: AlertTriangle,
          textColor: 'text-red-100',
          labelBg: 'bg-red-700',
          labelText: 'text-red-100'
        };
      case 'request':
        return {
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-600',
          icon: FileText,
          textColor: 'text-blue-100',
          labelBg: 'bg-blue-700',
          labelText: 'text-blue-100'
        };
      case 'review':
        return {
          bgColor: 'bg-indigo-500',
          borderColor: 'border-indigo-600',
          icon: Eye,
          textColor: 'text-indigo-100',
          labelBg: 'bg-indigo-700',
          labelText: 'text-indigo-100'
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-600',
          icon: AlertTriangle,
          textColor: 'text-gray-100',
          labelBg: 'bg-gray-700',
          labelText: 'text-gray-100'
        };
    }
  };

  const { bgColor, borderColor, icon: Icon, textColor, labelBg, labelText } = getActionConfig(data.actionType);

  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg ${bgColor} border-2 ${borderColor} min-w-[200px]`}>
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 !bg-${bgColor} !border-2 !border-${borderColor}`}
      />
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${textColor}`} />
        <div className={`text-${labelBg} font-medium text-sm`}>{data.label}</div>
        <span className={`text-${labelText} text-xs px-2 py-1 rounded`}>{data.actionType}</span>
      </div>
      <div className={`text-${textColor} text-xs`}>{data.description}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 !bg-${bgColor} !border-2 !border-${borderColor}`}
      />
    </div>
  );
};

export default ActionNode;