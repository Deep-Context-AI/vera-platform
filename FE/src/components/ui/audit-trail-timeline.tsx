import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  Calendar,
  Activity,
  FileText,
  Shield,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AuditTrailEntry } from '@/lib/audit';

interface AuditTrailTimelineProps {
  steps: AuditTrailEntry[];
  loading?: boolean;
  className?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-600" />;
    case 'in_progress':
      return <Clock className="w-5 h-5 text-blue-600" />;
    case 'requires_review':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-gray-600" />;
    default:
      return <Activity className="w-5 h-5 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'requires_review':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

const getStepTypeIcon = (stepType: string) => {
  switch (stepType) {
    case 'manual_review':
      return <User className="w-4 h-4" />;
    case 'document_verification':
      return <FileText className="w-4 h-4" />;
    case 'database_check':
      return <Shield className="w-4 h-4" />;
    case 'external_api':
      return <Zap className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

const formatDuration = (ms?: number) => {
  if (!ms) return null;
  
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

const formatStepName = (stepName: string) => {
  return stepName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export const AuditTrailTimeline: React.FC<AuditTrailTimelineProps> = ({
  steps,
  loading = false,
  className = ''
}) => {
  // Sort steps by timestamp (newest first)
  const sortedSteps = [...steps].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Audit Trail</h3>
        <p className="text-gray-500 dark:text-gray-400">
          No verification steps have been recorded for this application yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedSteps.map((step, index) => {
        const isLast = index === sortedSteps.length - 1;
        const duration = step.data?.processing_duration_ms;
        const hasError = step.status === 'failed' && (step.data?.error_message || step.data?.error_code);
        
        return (
          <div key={`${step.step_key}-${step.timestamp}`} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            )}
            
            {/* Timeline item */}
            <div className="flex items-start space-x-4">
              {/* Status icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center">
                {getStatusIcon(step.status)}
              </div>
              
              {/* Content */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStepTypeIcon(step.data?.step_type || 'manual_review')}
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatStepName(step.data?.step_name || step.step_key)}
                      </h3>
                      <Badge className={getStatusColor(step.status)}>
                        {step.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {(step.notes || step.data?.notes) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {step.notes || step.data?.notes}
                      </p>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(step.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Left column */}
                  <div className="space-y-2">
                    {(step.changed_by || step.data?.processed_by) && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Changed by:</span>
                        <span className="text-gray-900 dark:text-gray-100">{step.changed_by || step.data?.processed_by}</span>
                      </div>
                    )}
                    
                    {step.data?.processing_method && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Method:</span>
                        <span className="text-gray-900 dark:text-gray-100 capitalize">
                          {step.data.processing_method.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    
                    {duration && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                        <span className="text-gray-900 dark:text-gray-100">{formatDuration(duration)}</span>
                      </div>
                    )}

                    {step.previous_status && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Previous status:</span>
                        <span className="text-gray-900 dark:text-gray-100 capitalize">{step.previous_status.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Right column */}
                  <div className="space-y-2">
                    {step.data?.verification_result && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Result:</span>
                        <Badge className={
                          step.data.verification_result === 'verified' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : step.data.verification_result === 'not_verified'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                        }>
                          {step.data.verification_result.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                    
                    {step.data?.confidence_score !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                        <span className="text-gray-900 dark:text-gray-100">{step.data.confidence_score}%</span>
                      </div>
                    )}
                    
                    {step.data?.external_service && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Service:</span>
                        <span className="text-gray-900 dark:text-gray-100">{step.data.external_service}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Risk flags */}
                {step.data?.risk_flags && step.data.risk_flags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Risk Flags:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {step.data.risk_flags.map((flag, i) => (
                        <Badge key={i} className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Error details */}
                {hasError && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900 dark:text-red-100">Error Details:</span>
                    </div>
                    {step.data?.error_code && (
                      <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                        Code: {step.data.error_code}
                      </p>
                    )}
                    {step.data?.error_message && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {step.data.error_message}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Additional data display for dynamic structure */}
                {step.data && Object.keys(step.data).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Additional Data:</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                      {JSON.stringify(step.data, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditTrailTimeline; 