import React, { useState } from 'react';
import { 
  Search, Filter, Download, Calendar, User, FileText, MessageSquare, Check, X, Clock,
  Bell, BookOpen, Phone, Upload, Settings, Shield, Eye, ChevronDown,
  TrendingUp, Target, Award, Activity, Zap, Star, Flag, UserCheck,
  AlertCircle, Timer, FileCheck, Globe, Lock, RefreshCw, Mail, Plus,
  AlertTriangle, CheckCircle, BarChart3, Users
} from 'lucide-react';

export default function InboxDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeInboxTab, setActiveInboxTab] = useState('all'); // all, emails, phone-calls, system

  // Mock inbox data
  const inboxItems = [
    // Phone Call Records
    {
      id: 'call-1',
      type: 'phone-call',
      from: 'Harvard Medical School Registrar',
      subject: 'Education Verification Call - Dr. Sarah Johnson',
      preview: 'Completed verification call for Dr. Sarah Johnson\'s medical degree. Transcript available.',
      timestamp: '2024-01-16T10:30:00Z',
      priority: 'medium',
      read: false,
      category: 'verification-calls',
      duration: '4:23',
      callType: 'outbound',
      attachments: 1 // transcript
    },
    {
      id: 'call-2',
      type: 'phone-call',
      from: 'DEA Registration Office',
      subject: 'DEA License Verification - Dr. Michael Chen',
      preview: 'Verified DEA registration BD1234567 is active through December 2025. Audio recording saved.',
      timestamp: '2024-01-16T09:15:00Z',
      priority: 'high',
      read: false,
      category: 'verification-calls',
      duration: '2:45',
      callType: 'outbound',
      attachments: 2 // transcript + audio
    },
    {
      id: 'call-3',
      type: 'phone-call',
      from: 'California Medical Board',
      subject: 'License Status Inquiry - Dr. Emily Davis',
      preview: 'Confirmed license CA-A12345 is in good standing with no disciplinary actions.',
      timestamp: '2024-01-16T08:00:00Z',
      priority: 'medium',
      read: true,
      category: 'verification-calls',
      duration: '3:12',
      callType: 'outbound',
      attachments: 1
    },
    {
      id: 'call-4',
      type: 'phone-call',
      from: 'Dr. Patricia White',
      subject: 'Credential Documentation Follow-up',
      preview: 'Provider called regarding missing DEA certificate. Advised on document submission process.',
      timestamp: '2024-01-15T16:45:00Z',
      priority: 'low',
      read: true,
      category: 'provider-calls',
      duration: '6:30',
      callType: 'inbound',
      attachments: 0
    },
    {
      id: '1',
      type: 'email',
      from: 'Dr. Sarah Johnson',
      subject: 'Missing DEA Certificate Documents',
      preview: 'I apologize for the delay. I am having trouble locating my DEA certificate. Could you please provide guidance on...',
      timestamp: '2024-01-16T09:30:00Z',
      priority: 'high',
      read: false,
      category: 'provider-communication',
      attachments: 2
    },
    {
      id: '2',
      type: 'system',
      from: 'Vera AI System',
      subject: 'Verification Alert: Dr. Michael Chen License Expiration',
      preview: 'Automated verification detected that Dr. Michael Chen\'s California medical license expires in 30 days...',
      timestamp: '2024-01-16T08:45:00Z',
      priority: 'medium',
      read: false,
      category: 'system-alerts',
      attachments: 0
    },
    {
      id: '3',
      type: 'email',
      from: 'Medical Board of California',
      subject: 'License Verification Response - Dr. Emily Davis',
      preview: 'This is to confirm that Dr. Emily Davis holds an active medical license in good standing. License Number: CA-A12345...',
      timestamp: '2024-01-16T07:15:00Z',
      priority: 'medium',
      read: true,
      category: 'verification-responses',
      attachments: 1
    },
    {
      id: '4',
      type: 'internal',
      from: 'John Doe (Examiner)',
      subject: 'Committee Review Required: Dr. Patricia White',
      preview: 'After reviewing the credentialing file for Dr. Patricia White, I believe this case requires committee review due to...',
      timestamp: '2024-01-16T06:20:00Z',
      priority: 'high',
      read: false,
      category: 'internal-communications',
      attachments: 0
    },
    {
      id: '5',
      type: 'email',
      from: 'Harvard Medical School',
      subject: 'Education Verification Request - Dr. Amanda Clark',
      preview: 'We have received your verification request for Dr. Amanda Clark. Please find attached the official transcript...',
      timestamp: '2024-01-15T16:30:00Z',
      priority: 'low',
      read: true,
      category: 'verification-responses',
      attachments: 3
    },
    {
      id: '6',
      type: 'system',
      from: 'Compliance Monitor',
      subject: 'Monthly Audit Report Available',
      preview: 'The monthly credentialing audit report for January 2024 is now available for download. This report includes...',
      timestamp: '2024-01-15T14:00:00Z',
      priority: 'low',
      read: true,
      category: 'reports',
      attachments: 1
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone-call': return <Phone className="w-4 h-4 text-green-600" />;
      case 'email': return <Mail className="w-4 h-4 text-blue-600" />;
      case 'system': return <Settings className="w-4 h-4 text-purple-600" />;
      case 'internal': return <MessageSquare className="w-4 h-4 text-green-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'provider-communication': return 'bg-blue-100 text-blue-800';
      case 'system-alerts': return 'bg-purple-100 text-purple-800';
      case 'verification-responses': return 'bg-green-100 text-green-800';
      case 'internal-communications': return 'bg-orange-100 text-orange-800';
      case 'reports': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = inboxItems.filter(item => {
    const matchesSearch = item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'unread' && !item.read) ||
                         (selectedFilter === 'priority' && item.priority === 'high');
    const matchesInboxTab = activeInboxTab === 'all' || 
                           (activeInboxTab === 'emails' && item.type === 'email') ||
                           (activeInboxTab === 'phone-calls' && item.type === 'phone-call') ||
                           (activeInboxTab === 'system' && (item.type === 'system' || item.type === 'internal'));
    
    return matchesSearch && matchesFilter && matchesInboxTab;
  });

  const unreadCount = inboxItems.filter(item => !item.read).length;
  const highPriorityCount = inboxItems.filter(item => item.priority === 'high').length;
  const emailCount = inboxItems.filter(item => item.type === 'email').length;
  const phoneCallCount = inboxItems.filter(item => item.type === 'phone-call').length;
  const systemCount = inboxItems.filter(item => item.type === 'system' || item.type === 'internal').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox Dashboard</h1>
          <p className="text-gray-600 mt-1">Centralized communication hub for credentialing operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inboxItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Emails</p>
              <p className="text-2xl font-bold text-gray-900">{emailCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Phone Calls</p>
              <p className="text-2xl font-bold text-gray-900">{phoneCallCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{highPriorityCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.hash = '#inbox'}>
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System & Internal</p>
              <p className="text-2xl font-bold text-gray-900">{systemCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inbox Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'all', label: 'All Items', count: inboxItems.length, icon: Activity },
              { id: 'emails', label: 'Email Inbox', count: emailCount, icon: Mail },
              { id: 'phone-calls', label: 'Phone Call Log', count: phoneCallCount, icon: Phone },
              { id: 'system', label: 'System & Internal', count: systemCount, icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInboxTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeInboxTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeInboxTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Messages</option>
                <option value="unread">Unread Only</option>
                <option value="priority">High Priority</option>
              </select>

              {activeInboxTab === 'phone-calls' && (
                <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Calls</option>
                  <option value="verification-calls">Verification Calls</option>
                  <option value="provider-calls">Provider Calls</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              )}

              {activeInboxTab === 'emails' && (
                <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Emails</option>
                  <option value="provider-communication">Provider Communication</option>
                  <option value="verification-responses">Verification Responses</option>
                  <option value="reports">Reports</option>
                </select>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredItems.length} of {inboxItems.length} messages
            </div>
          </div>
        </div>

        {/* Message List */}
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            {activeInboxTab === 'emails' ? <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" /> :
             activeInboxTab === 'phone-calls' ? <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" /> :
             <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
            <p className="text-gray-500">No items found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-6 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(item.priority)} ${
                  !item.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(item.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`text-sm font-medium ${!item.read ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                          {item.from}
                        </h3>
                        
                        {item.type === 'phone-call' && (
                          <>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              item.callType === 'inbound' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.callType === 'inbound' ? 'Inbound' : 'Outbound'}
                            </span>
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {item.duration}
                            </span>
                          </>
                        )}
                        
                        {item.type !== 'phone-call' && (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                            {item.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        )}
                        
                        {item.priority === 'high' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            High Priority
                          </span>
                        )}
                      </div>
                      
                      <h4 className={`text-sm mb-2 ${!item.read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                        {item.subject}
                      </h4>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.preview}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-3">
                        <span className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        {item.attachments && item.attachments > 0 && (
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {item.attachments} {item.type === 'phone-call' ? 
                                (item.attachments === 1 ? 'transcript' : 'files') :
                                (item.attachments === 1 ? 'attachment' : 'attachments')
                              }
                            </span>
                          </div>
                        )}
                        {!item.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}