import React, { useState } from 'react';
import { Search, Filter, Download, Calendar, User, FileText, MessageSquare, Check, X, Clock } from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  user: string;
  userRole: string;
  timestamp: string;
  providerId?: string;
  providerName?: string;
  stepName?: string;
  type: 'document' | 'comment' | 'approval' | 'rejection' | 'assignment' | 'upload';
  changes?: Record<string, any>;
}

export default function ActivityLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  const activityEntries: ActivityLogEntry[] = [
    {
      id: '1',
      action: 'Step Approved',
      description: 'Approved NPI Verification for Dr. Sarah Johnson',
      user: 'John Doe',
      userRole: 'Senior Examiner',
      timestamp: '2024-01-15T14:30:00Z',
      providerId: '1',
      providerName: 'Dr. Sarah Johnson',
      stepName: 'NPI',
      type: 'approval'
    },
    {
      id: '2',
      action: 'Comment Added',
      description: 'Added comment on DEA License verification',
      user: 'Jane Smith',
      userRole: 'Examiner',
      timestamp: '2024-01-15T13:45:00Z',
      providerId: '2',
      providerName: 'Dr. Michael Chen',
      stepName: 'DEA License',
      type: 'comment'
    },
    {
      id: '3',
      action: 'Document Uploaded',
      description: 'CA Medical License document uploaded',
      user: 'Dr. Emily Davis',
      userRole: 'Provider',
      timestamp: '2024-01-15T12:20:00Z',
      providerId: '3',
      providerName: 'Dr. Emily Davis',
      stepName: 'CA License',
      type: 'upload'
    },
    {
      id: '4',
      action: 'Provider Assigned',
      description: 'Assigned Dr. Robert Wilson to Mike Johnson for verification',
      user: 'Sarah Manager',
      userRole: 'Manager',
      timestamp: '2024-01-15T11:15:00Z',
      providerId: '4',
      providerName: 'Dr. Robert Wilson',
      type: 'assignment'
    },
    {
      id: '5',
      action: 'Step Rejected',
      description: 'Rejected NPDB check due to incomplete documentation',
      user: 'John Doe',
      userRole: 'Senior Examiner',
      timestamp: '2024-01-15T10:30:00Z',
      providerId: '5',
      providerName: 'Dr. Lisa Brown',
      stepName: 'NPDB',
      type: 'rejection'
    }
  ];

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'approval': return <Check className="w-4 h-4 text-green-600" />;
      case 'rejection': return <X className="w-4 h-4 text-red-600" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'upload': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'assignment': return <User className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'approval': return 'bg-green-100 border-green-200';
      case 'rejection': return 'bg-red-100 border-red-200';
      case 'comment': return 'bg-blue-100 border-blue-200';
      case 'upload': return 'bg-purple-100 border-purple-200';
      case 'assignment': return 'bg-yellow-100 border-yellow-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const filteredEntries = activityEntries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.providerName && entry.providerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || entry.type === filterType;
    const matchesUser = filterUser === 'all' || entry.user === filterUser;
    return matchesSearch && matchesType && matchesUser;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Log</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="approval">Approvals</option>
              <option value="rejection">Rejections</option>
              <option value="comment">Comments</option>
              <option value="upload">Uploads</option>
              <option value="assignment">Assignments</option>
            </select>

            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="John Doe">John Doe</option>
              <option value="Jane Smith">Jane Smith</option>
              <option value="Mike Johnson">Mike Johnson</option>
              <option value="Sarah Manager">Sarah Manager</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={`border rounded-lg p-4 ${getActionColor(entry.type)}`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(entry.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-gray-900">{entry.action}</h3>
                      {entry.stepName && (
                        <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                          {entry.stepName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{entry.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{entry.user} ({entry.userRole})</span>
                    </span>
                    {entry.providerName && (
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>{entry.providerName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No activities found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}