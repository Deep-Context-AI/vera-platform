import React, { useState } from 'react';
import { Verification, ActivityLogEntry } from '@/lib/data/mockData';
import { Check, Clock, AlertTriangle, ChevronDown, ChevronUp, Phone, Mail, FileText, Download } from 'lucide-react';

interface VerificationItemProps {
  verification: Verification;
  isExpanded: boolean;
  onToggle: () => void;
}

const ActivityLogItem: React.FC<{ activity: ActivityLogEntry }> = ({ activity }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getIcon = () => {
    switch (activity.type) {
      case 'call':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="border-l-2 border-gray-200 pl-4 py-2">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
            <span className="text-xs text-gray-500">{activity.date}</span>
          </div>
          <p className={`text-xs ${
            activity.status === 'completed' ? 'text-green-600' :
            activity.status === 'pending' ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
          </p>
          {activity.details && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
              {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </button>
          )}
          {showDetails && activity.details && (
            <div className="mt-2 text-sm">
              {activity.details.transcript && (
                <div className="bg-gray-50 p-3 rounded-md mb-2">
                  <p className="font-medium text-xs text-gray-700 mb-1">Call Transcript</p>
                  <pre className="text-xs whitespace-pre-wrap">{activity.details.transcript}</pre>
                </div>
              )}
              {activity.details.emailContent && (
                <div className="bg-gray-50 p-3 rounded-md mb-2">
                  <p className="font-medium text-xs text-gray-700 mb-1">Email Content</p>
                  <p className="text-xs">{activity.details.emailContent}</p>
                  {activity.details.attachments && activity.details.attachments.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-xs text-gray-700">Attachments:</p>
                      <ul className="list-disc list-inside text-xs text-blue-600">
                        {activity.details.attachments.map((attachment, index) => (
                          <li key={index}>{attachment}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {activity.details.response && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium text-xs text-gray-700 mb-1">Response</p>
                  <p className="text-xs">{activity.details.response}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VerificationItem: React.FC<VerificationItemProps> = ({ 
  verification,
  isExpanded,
  onToggle 
}) => {
  const getStatusIcon = () => {
    switch (verification.status) {
      case 'verified':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const isEducationVerification = verification.type === 'Board Certification / Education';

  return (
    <div className="border-b border-gray-200 last:border-0">
      <div 
        className="px-4 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center">
          {getStatusIcon()}
          <span className="ml-3 text-sm font-medium text-gray-900">{verification.type}</span>
        </div>
        <div className="flex items-center">
          <div className={`text-sm ${
            verification.status === 'verified' ? 'text-green-600' :
            verification.status === 'pending' ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
          </div>
          <ChevronDown className={`h-5 w-5 ml-2 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-600 mb-2">{verification.description}</p>
            {verification.results && (
              <div className="mb-2">
                <span className="font-medium">Results:</span> {verification.results}
              </div>
            )}
            {verification.verifiedDate && (
              <div className="mb-2">
                <span className="font-medium">Verified:</span> {verification.verifiedDate}
              </div>
            )}
            {verification.expirationDate && (
              <div className="mb-2">
                <span className="font-medium">Expires:</span> {verification.expirationDate}
              </div>
            )}
            {verification.documentUrl && (
              <a 
                href={verification.documentUrl} 
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Download Verification Document
              </a>
            )}
            
            {isEducationVerification && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Activity Log</h4>
                {verification.activityLog && verification.activityLog.length > 0 ? (
                  <div className="space-y-2">
                    {verification.activityLog.map((activity) => (
                      <ActivityLogItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No activity log available</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationItem;