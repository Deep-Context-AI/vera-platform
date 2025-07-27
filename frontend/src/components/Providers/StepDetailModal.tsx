import React, { useState } from 'react';
import { X, Download, Upload, MessageSquare, User, Clock, CheckCircle, AlertTriangle, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import { Provider } from '../../types';

interface StepDetailModalProps {
  stepName: string;
  stepNumber: number;
  status: string;
  provider: Provider;
  onClose: () => void;
}

export default function StepDetailModal({ stepName, stepNumber, status, provider, onClose }: StepDetailModalProps) {
  const [activeTab, setActiveTab] = useState('document');
  const [comment, setComment] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const comments = [
    {
      id: '1',
      author: 'John Doe',
      text: 'Document appears valid, expiration date is 2025-12-31',
      timestamp: '2024-01-15 10:30 AM',
      mentions: [],
      resolved: false
    },
    {
      id: '2',
      author: 'Jane Smith',
      text: 'Please verify the license number with the state board',
      timestamp: '2024-01-15 11:45 AM',
      mentions: ['@john.doe'],
      resolved: false
    }
  ];

  const activityLog = [
    {
      id: '1',
      action: 'Document Uploaded',
      user: 'Dr. Sarah Johnson',
      timestamp: '2024-01-15 09:00 AM',
      description: 'Uploaded CA Medical License.pdf'
    },
    {
      id: '2',
      action: 'Review Started',
      user: 'John Doe',
      timestamp: '2024-01-15 10:00 AM',
      description: 'Started review of documentation'
    },
    {
      id: '3',
      action: 'Comment Added',
      user: 'John Doe',
      timestamp: '2024-01-15 10:30 AM',
      description: 'Added comment about document validity'
    }
  ];

  const handleApprove = () => {
    setIsApproving(true);
    // Simulate API call
    setTimeout(() => {
      setIsApproving(false);
      onClose();
    }, 1500);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'pending-review': return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold text-gray-900">
                Step {stepNumber}: {stepName}
              </h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              status === 'completed' ? 'bg-green-100 text-green-800' :
              status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
              status === 'pending-review' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('document')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'document'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Document
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'comments'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'activity'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {activeTab === 'document' && (
                <div className="h-full bg-gray-100 flex flex-col">
                  {/* Document Viewer Controls */}
                  <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">{stepName} Document</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setZoom(Math.max(50, zoom - 25))}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm text-gray-600 min-w-[4rem] text-center">{zoom}%</span>
                        <button
                          onClick={() => setZoom(Math.min(200, zoom + 25))}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="w-px h-4 bg-gray-300 mx-2"></div>
                        <button
                          onClick={() => setRotation((rotation + 90) % 360)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <RotateCw className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                          <Maximize2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm">
                        <Upload className="w-4 h-4" />
                        <span>Replace</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Document Viewer */}
                  <div className="flex-1 overflow-auto p-4">
                    <div className="flex justify-center">
                      <div 
                        className="bg-white shadow-lg border border-gray-300 max-w-full"
                        style={{
                          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                          transformOrigin: 'center center',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        {/* Mock PDF Document */}
                        <div className="w-[600px] h-[800px] p-8 bg-white border border-gray-200 relative">
                          <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Medical License Certificate</h2>
                            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                              <span className="text-blue-600 font-bold">STATE</span>
                            </div>
                          </div>
                          
                          <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                              <span className="font-medium">License Number:</span>
                              <span className="bg-yellow-100 px-2 py-1 rounded">A12345</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                              <span className="font-medium">Provider Name:</span>
                              <span>{provider.name}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                              <span className="font-medium">Issue Date:</span>
                              <span>January 15, 2023</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                              <span className="font-medium">Expiration Date:</span>
                              <span className="bg-green-100 px-2 py-1 rounded">December 31, 2025</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                              <span className="font-medium">Status:</span>
                              <span className="text-green-600 font-medium">Active</span>
                            </div>
                          </div>
                          
                          <div className="mt-8 p-4 bg-gray-50 rounded">
                            <h3 className="font-medium mb-2">Vera's AI Analysis:</h3>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>✓ License number format is valid</li>
                              <li>✓ Expiration date is valid (expires 2025)</li>
                              <li>✓ Provider name matches application</li>
                              <li>✓ Document appears authentic</li>
                              <li className="text-yellow-600">⚠ Manual verification of state board recommended</li>
                            </ul>
                          </div>
                          
                          <div className="absolute bottom-4 right-4 text-xs text-gray-500">
                            Page 1 of 1
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {comment.author.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                              <span className="text-xs text-gray-500">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-700">JD</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            Use @username to mention someone
                          </span>
                          <button
                            disabled={!comment.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="h-full overflow-y-auto p-6">
                  <div className="space-y-4">
                    {activityLog.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">{activity.action}</span>
                            <span className="text-xs text-gray-500">by {activity.user}</span>
                          </div>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <span className="text-xs text-gray-500">{activity.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 flex-shrink-0">
            <h3 className="font-semibold text-gray-900 mb-4">Step Information</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <p className="text-sm text-gray-900">{provider.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Examiner</label>
                <p className="text-sm text-gray-900">{provider.assignedExaminer}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <p className="text-sm text-gray-900">{new Date(provider.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-sm text-gray-900">Jan 15, 2024 at 11:45 AM</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vera Confidence</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-green-600">92%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isApproving ? 'Approving...' : 'Approve Step'}
              </button>
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                Reject Step
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Request More Info
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Reassign
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Vera's Findings</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Valid license format</li>
                <li>• Current expiration date</li>
                <li>• Name match confirmed</li>
                <li>• High confidence score</li>
              </ul>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Export to PDF
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Print Document
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Email Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}