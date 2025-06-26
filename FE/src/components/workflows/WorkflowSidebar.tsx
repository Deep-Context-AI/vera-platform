'use client';

import React from 'react';
import { Clock, CheckCircle, AlertCircle, XCircle, Play } from 'lucide-react';
import { WorkflowType, WorkflowData } from '@/lib/data/mockWorkflowData';
import { cn } from '@/lib/utils';

interface WorkflowSidebarProps {
  selectedWorkflow: WorkflowType;
  onWorkflowChange: (workflow: WorkflowType) => void;
  workflowData: Record<WorkflowType, WorkflowData>;
}

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  selectedWorkflow,
  onWorkflowChange,
  workflowData
}) => {
  const getStatusIcon = (status: WorkflowData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: WorkflowData['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'active':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Verification Workflows
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a credentialing check to visualize its workflow
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(workflowData).map(([key, workflow]) => {
          const workflowKey = key as WorkflowType;
          const isSelected = selectedWorkflow === workflowKey;
          
          return (
            <button
              key={workflowKey}
              onClick={() => onWorkflowChange(workflowKey)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all duration-200",
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(workflow.status)}
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {workflow.title}
                  </span>
                </div>
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded border capitalize",
                  getStatusColor(workflow.status)
                )}>
                  {workflow.status}
                </span>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {workflow.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{workflow.totalRuns.toLocaleString()} runs</span>
                {workflow.lastRun && (
                  <span>
                    Last: {new Date(workflow.lastRun).toLocaleDateString()}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          Workflow Statistics
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Workflows:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {Object.keys(workflowData).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Active:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {Object.values(workflowData).filter(w => w.status === 'active').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {Object.values(workflowData).filter(w => w.status === 'completed').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowSidebar; 