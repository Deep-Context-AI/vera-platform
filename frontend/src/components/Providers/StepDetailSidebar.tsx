import React, { useState } from 'react';
import { X, Download, Upload, User, Clock, CheckCircle, AlertTriangle, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import { Provider } from '../../types';

interface StepDetailSidebarProps {
  stepName: string;
  stepNumber: number;
  status: string;
  provider: Provider;
  onClose: () => void;
  onStatusChange: (status: string, reason?: string) => void;
}

export default function StepDetailSidebar({ 
  stepName, 
  stepNumber, 
  status, 
  provider, 
  onClose, 
  onStatusChange 
}: StepDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState('document');
  const [comment, setComment] = useState('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [finalNotes, setFinalNotes] = useState('');

  const isApplicationReview = stepName === 'Application Review';
  const isFinalDecision = stepName === 'Final Decision';

  const comments = [
    // Document annotations show up as comments
    {
      id: 'annotation-1',
      author: 'John Doe',
      text: 'License number highlighted - format appears valid (A12345)',
      timestamp: '2024-01-15 10:15 AM',
      resolved: false,
      isAnnotation: true,
      documentLocation: 'License Number field'
    },
    {
      id: 'annotation-2', 
      author: 'John Doe',
      text: 'Expiration date marked - expires Dec 31, 2025, still valid',
      timestamp: '2024-01-15 10:18 AM',
      resolved: false,
      isAnnotation: true,
      documentLocation: 'Expiration Date field'
    },
    {
      id: '1',
      author: 'John Doe',
      text: 'Overall document appears authentic and valid. All required fields are present.',
      timestamp: '2024-01-15 10:30 AM',
      resolved: false,
      isAnnotation: false
    },
    {
      id: '2',
      author: 'Jane Smith',
      text: 'Please verify the license number with the state board',
      timestamp: '2024-01-15 11:45 AM',
      resolved: false,
      isAnnotation: false
    }
  ];

  const activityLog = [
    {
      id: '1',
      action: 'Document Uploaded',
      user: 'Vera AI',
      timestamp: '2024-01-15 09:00 AM',
      description: `Vera automatically pulled ${stepName} documentation`
    },
    {
      id: '2',
      action: 'Analysis Complete',
      user: 'Vera AI',
      timestamp: '2024-01-15 09:05 AM',
      description: 'AI verification analysis completed with 92% confidence'
    }
  ];

  const getStatusIcon = () => {
    switch (status) {
      case 'reviewed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'escalated': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleMarkAsReviewed = () => {
    onStatusChange('reviewed');
  };

  const handleEscalate = () => {
    onStatusChange('escalated');
  };

  return (
    <div className="w-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Step {stepNumber}: {stepName}
            </h2>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              status === 'reviewed' ? 'bg-green-100 text-green-800' :
              status === 'escalated' ? 'bg-orange-100 text-orange-800' :
              status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {status === 'reviewed' ? 'Reviewed' :
               status === 'escalated' ? 'Escalated to Committee' :
               status === 'pending' ? 'Pending Review' :
               'Pending Review'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex h-full">
        {/* Document Viewer - Takes up most of the space */}
        <div className="flex-1 min-h-[600px]">
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
                <button className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs">
                  <Download className="w-3 h-3" />
                  <span>Download</span>
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
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-gray-900 mb-2">{stepName} Certificate</h2>
                      <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">STATE</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">License Number:</span>
                        <span className="bg-yellow-100 px-1 py-0.5 rounded">A12345</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">Provider Name:</span>
                        <span>{provider.name}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">Issue Date:</span>
                        <span>January 15, 2023</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">Expiration Date:</span>
                        <span className="bg-green-100 px-1 py-0.5 rounded">December 31, 2025</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">Status:</span>
                        <span className="text-green-600 font-medium">Active</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-3 bg-gray-50 rounded text-xs">
                      <h3 className="font-medium mb-2">Vera's AI Analysis:</h3>
                      <ul className="space-y-1 text-gray-700">
                        <li>✓ License number format is valid</li>
                        <li>✓ Expiration date is valid (expires 2025)</li>
                        <li>✓ Provider name matches application</li>
                        <li>✓ Document appears authentic</li>
                        <li className="text-yellow-600">⚠ Manual verification recommended</li>
                      </ul>
                    </div>
                    
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      Page 1 of 1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel for Comments/Activity */}
        <div className="w-96 border-l border-gray-200 bg-gray-50">
          {/* Tab Navigation for Right Panel */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'comments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'activity'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Activity
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'comments' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {comment.author.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      {comment.id === '1' && (
                        <div>
                          <div className="space-y-3">
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <h4 className="font-medium text-blue-900 mb-2">Vera's Top Level Results (TLR):</h4>
                              <p className="text-xs text-blue-800 mb-2">
                                Vera conducted comprehensive cross-reference analysis across 12 primary source databases, achieving 94% confidence in document authenticity. 
                                The AI identified 15 validation points including OCR text extraction, metadata verification, and digital signature authentication. 
                                Pattern recognition algorithms detected consistent formatting with {Math.floor(Math.random() * 500) + 1000} similar valid licenses in our training dataset.
                              </p>
                              <p className="text-xs text-blue-800">
                                <strong>Vera's Decision:</strong> APPROVED with manual review flag. The system detected minor discrepancies in document timestamp 
                                metadata (common with scanned documents) but all critical data points validated successfully against state board records. 
                                Risk assessment: LOW. Recommended action: Proceed with standard verification workflow.
                              </p>
                            </div>
                            
                            <ul className="space-y-1 text-gray-700">
                              <li>✓ License number format validated against CA DMV regex patterns</li>
                              <li>✓ Expiration date cross-verified with state board API (expires 12/31/2025)</li>
                              <li>✓ Provider name fuzzy-matched with 98.7% accuracy</li>
                              <li>✓ Document OCR confidence: 96.3% - all text clearly readable</li>
                              <li>✓ Digital watermark detected and validated</li>
                              <li className="text-blue-600">ℹ Vera auto-queried CA Medical Board API - license status: ACTIVE</li>
                              <li className="text-yellow-600">⚠ Manual verification recommended for audit trail compliance</li>
                            </ul>
                          </div>
                        </div>
                      )}
                      {comment.id !== '1' && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                            <span className={`text-xs font-medium ${comment.isAnnotation ? 'text-yellow-700' : 'text-gray-700'}`}>
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className={`text-sm ${comment.isAnnotation ? 'text-yellow-800' : 'text-gray-700'}`}>{comment.text}</p>
                        </div>
                      )}
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
                      rows={2}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        Use @username to mention someone
                      </span>
                      <button
                        disabled={!comment.trim()}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="h-full overflow-y-auto p-4">
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

      {/* Action Buttons */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-center space-x-4">
          {isApplicationReview ? (
            <button
              onClick={handleMarkAsReviewed}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Application Reviewed - Proceed to Verification
            </button>
          ) : isFinalDecision ? (
            <button
              onClick={handleMarkAsReviewed}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Submit to Committee for Review
            </button>
          ) : (
            <>
              <button
                onClick={handleMarkAsReviewed}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Mark as Reviewed
              </button>
              <button
                onClick={handleEscalate}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                Flag for Committee Review
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}