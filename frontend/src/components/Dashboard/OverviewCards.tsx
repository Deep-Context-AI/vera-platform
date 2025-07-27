import React, { useState } from 'react';
import { 
  CheckCircle, Clock, AlertTriangle, XCircle, Users, Calendar, FileText, 
  ClipboardCheck, BarChart3, MessageSquare, Download, Plus, Search, Filter,
  Bell, BookOpen, Phone, Upload, Settings, Shield, Eye, ChevronDown,
  TrendingUp, Target, Award, Activity, Zap, Star, Flag, UserCheck,
  AlertCircle, Timer, FileCheck, Globe, Lock, RefreshCw, Mail
} from 'lucide-react';

export default function OverviewCards() {
  const [selectedView, setSelectedView] = useState('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data for Today's Critical Work
  const newApplicationsToday = [
    { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Cardiothoracic Surgery', submittedAt: '08:30 AM', priority: 'high' },
    { id: '2', name: 'Dr. Michael Chen', specialty: 'Neurology', submittedAt: '09:15 AM', priority: 'medium' },
    { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Emergency Medicine', submittedAt: '10:45 AM', priority: 'high' },
    { id: '4', name: 'Dr. James Wilson', specialty: 'Family Medicine', submittedAt: '11:20 AM', priority: 'low' }
  ];

  const reCredFilesDue = [
    { id: '1', name: 'Dr. Lisa Brown', daysLeft: 0, dueDate: '2024-01-16', status: 'critical' },
    { id: '2', name: 'Dr. Robert Davis', daysLeft: 2, dueDate: '2024-01-18', status: 'urgent' },
    { id: '3', name: 'Dr. Maria Garcia', daysLeft: 5, dueDate: '2024-01-21', status: 'warning' },
    { id: '4', name: 'Dr. David Miller', daysLeft: 7, dueDate: '2024-01-23', status: 'normal' }
  ];

  const overdueFiles = [
    { id: '1', name: 'Dr. Jennifer Taylor', daysOverdue: 3, originalDue: '2024-01-13', reason: 'NPDB verification timeout' },
    { id: '2', name: 'Dr. Mark Anderson', daysOverdue: 7, originalDue: '2024-01-09', reason: 'Missing DEA documentation' }
  ];

  const myNextTasks = [
    { id: '1', task: 'Review NPI verification for Dr. Johnson', urgency: 'high', complexity: 'medium', estimatedTime: '15 min' },
    { id: '2', task: 'Complete NPDB analysis for Dr. Chen', urgency: 'medium', complexity: 'high', estimatedTime: '30 min' },
    { id: '3', task: 'Verify CA medical license for Dr. Rodriguez', urgency: 'high', complexity: 'low', estimatedTime: '10 min' },
    { id: '4', task: 'Review hospital privileges for Dr. Wilson', urgency: 'low', complexity: 'medium', estimatedTime: '20 min' },
    { id: '5', task: 'Update SanctionCheck results for Dr. Brown', urgency: 'medium', complexity: 'low', estimatedTime: '5 min' }
  ];

  const flaggedForMD = [
    { id: '1', name: 'Dr. Patricia White', reason: 'Prior malpractice claim - 2019', flaggedBy: 'John Doe' },
    { id: '2', name: 'Dr. Kevin Lee', reason: 'Sanctions found in OIG search', flaggedBy: 'Jane Smith' },
    { id: '3', name: 'Dr. Amanda Clark', reason: 'Borderline license status', flaggedBy: 'Mike Johnson' }
  ];

  const awaitingProvider = [
    { id: '1', name: 'Dr. Thomas Moore', missing: 'DEA Certificate', reminders: 2, lastSent: '2 days ago' },
    { id: '2', name: 'Dr. Nicole Kim', missing: 'Board Certification', reminders: 1, lastSent: '1 day ago' },
    { id: '3', name: 'Dr. Richard Hall', missing: 'Hospital Privileges Letter', reminders: 3, lastSent: '3 days ago' }
  ];

  const recentActivity = [
    { id: '1', type: 'comment', user: 'Phil Martinez', action: 'flagged DEA verification for Dr. Chen', time: '1 hr ago', urgent: false },
    { id: '2', type: 'alert', user: 'System', action: 'NPDB API maintenance scheduled for tonight', time: '2 hrs ago', urgent: true },
    { id: '3', type: 'edit', user: 'Sarah Admin', action: 'updated SOP for license verification', time: '3 hrs ago', urgent: false },
    { id: '4', type: 'approval', user: 'Dr. Medical Director', action: 'approved credentialing for Dr. Wilson', time: '4 hrs ago', urgent: false }
  ];

  const upcomingExpirations = {
    '30Days': { count: 15, providers: ['Dr. Johnson', 'Dr. Chen', 'Dr. Rodriguez'] },
    '60Days': { count: 28, providers: ['Dr. Wilson', 'Dr. Brown', 'Dr. Davis'] },
    '90Days': { count: 42, providers: ['Dr. Garcia', 'Dr. Miller', 'Dr. Taylor'] }
  };

  const kpis = {
    avgTurnaroundTime: { current: 24, target: 48, trend: 'down', unit: 'hours' },
    verificationPassRate: { current: 98, target: 95, trend: 'up' },
    auditReadinessScore: { current: 99, target: 95, trend: 'up' }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      case 'normal': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'edit': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'approval': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header with Search & Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Credentialing Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              <span>New Application</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by provider name, NPI, file ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Files</option>
            <option value="facility">By Facility</option>
            <option value="verification">By Verification Type</option>
            <option value="reviewer">By Reviewer</option>
            <option value="risk">By Risk Level</option>
          </select>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setSelectedView('kanban')}
              className={`px-3 py-1 rounded text-sm ${selectedView === 'kanban' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setSelectedView('table')}
              className={`px-3 py-1 rounded text-sm ${selectedView === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Table
            </button>
            <button
              onClick={() => setSelectedView('calendar')}
              className={`px-3 py-1 rounded text-sm ${selectedView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {selectedView === 'calendar' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Verification Calendar View</h2>
            <div className="grid grid-cols-7 gap-4">
              {/* Calendar Header */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {/* Calendar Days */}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - 6; // Start from previous month
                const isToday = dayNum === 16;
                const hasFiles = [16, 17, 18, 20, 22, 25].includes(dayNum);
                const fileCount = hasFiles ? Math.floor(Math.random() * 8) + 2 : 0;
                
                return (
                  <div key={i} className={`min-h-[100px] p-2 border border-gray-200 rounded-lg ${
                    isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}>
                    <div className={`text-sm font-medium mb-2 ${
                      dayNum < 1 || dayNum > 31 ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {dayNum > 0 && dayNum <= 31 ? dayNum : ''}
                    </div>
                    {hasFiles && (
                      <div className="space-y-1">
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {fileCount} files due
                        </div>
                        {isToday && (
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Vera batch: 100
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {selectedView === 'table' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Verification Files - Table View</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Examiner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 20 }, (_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">Dr. Provider {i + 1}</div>
                        <div className="text-sm text-gray-500">NPI: {1000000000 + i}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          i % 3 === 0 ? 'bg-green-100 text-green-800' :
                          i % 3 === 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {i % 3 === 0 ? 'Complete' : i % 3 === 1 ? 'In Progress' : 'Review'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${70 + (i * 3)}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {['John Doe', 'Jane Smith', 'Mike Johnson'][i % 3]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {selectedView === 'kanban' && (
        <>
          {/* Top Row - Compliance & Quality Pulse KPIs */}
          <div className="grid grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Turnaround</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.avgTurnaroundTime.current} {kpis.avgTurnaroundTime.unit}</p>
                <p className="text-xs text-green-600">↓ 24hrs vs target</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Timer className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.verificationPassRate.current}%</p>
                <p className="text-xs text-green-600">↑ 3% vs target</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Audit Readiness</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.auditReadinessScore.current}%</p>
                <p className="text-xs text-green-600">↑ 4% vs target</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">License Expirations</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingExpirations['30Days'].count}</p>
                <p className="text-xs text-orange-600">Next 30 days</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.hash = '#inbox'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread Emails</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
                <p className="text-xs text-red-600">Requires attention</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg relative">
                <Mail className="w-6 h-6 text-red-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          </div>

          {/* Main Grid Layout - Updated to remove right column */}
          <div className="grid grid-cols-1 gap-6">
          {/* Main Content - Today's Critical Work */}
          <div className="space-y-6">
            {/* Critical Work Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                Today's Critical Work
              </h2>

              <div className="grid grid-cols-3 gap-6">
                {/* New Applications Today */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Plus className="w-4 h-4 text-blue-600 mr-2" />
                    New Applications - Today ({newApplicationsToday.length})
                  </h3>
                  <div className="space-y-2">
                    {newApplicationsToday.map((app) => (
                      <div key={app.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{app.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(app.priority)}`}>
                            {app.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{app.specialty}</p>
                        <p className="text-xs text-gray-500">Submitted: {app.submittedAt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Re-Cred Files Due */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="w-4 h-4 text-orange-600 mr-2" />
                    Re-Cred Due (0-7 days)
                  </h3>
                  <div className="space-y-2">
                    {reCredFilesDue.map((file) => (
                      <div key={file.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{file.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                            D-{file.daysLeft}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Due: {new Date(file.dueDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overdue / At-Risk */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                    Overdue / At-Risk
                  </h3>
                  <div className="space-y-2">
                    {overdueFiles.map((file) => (
                      <div key={file.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{file.name}</span>
                          <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                            +{file.daysOverdue}
                          </span>
                        </div>
                        <p className="text-xs text-red-700">{file.reason}</p>
                        <p className="text-xs text-gray-500">Due: {new Date(file.originalDue).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick-Action Task Queue */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <ClipboardCheck className="w-5 h-5 text-blue-600 mr-2" />
                Quick-Action Task Queue
              </h2>

              <div className="grid grid-cols-3 gap-6">
                {/* My Next 5 Tasks */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">My Next 5 Tasks</h3>
                  <div className="space-y-2">
                    {myNextTasks.map((task, index) => (
                      <div key={task.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-start space-x-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            #{index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 mb-1">{task.task}</p>
                            <div className="flex items-center space-x-2 text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                task.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                task.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {task.urgency}
                              </span>
                              <span className="text-gray-500">{task.estimatedTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flagged for Medical Director */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Flag className="w-4 h-4 text-orange-600 mr-1" />
                    Flagged for MD Review
                  </h3>
                  <div className="space-y-2">
                    {flaggedForMD.map((item) => (
                      <div key={item.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                        <p className="font-medium text-sm text-gray-900 mb-1">{item.name}</p>
                        <p className="text-xs text-orange-800 mb-1">{item.reason}</p>
                        <p className="text-xs text-gray-500">Flagged by: {item.flaggedBy}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Awaiting Provider Response */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <UserCheck className="w-4 h-4 text-purple-600 mr-1" />
                    Awaiting Provider
                  </h3>
                  <div className="space-y-2">
                    {awaitingProvider.map((item) => (
                      <div key={item.id} className="p-3 border border-purple-200 bg-purple-50 rounded-lg">
                        <p className="font-medium text-sm text-gray-900 mb-1">{item.name}</p>
                        <p className="text-xs text-purple-800 mb-1">Missing: {item.missing}</p>
                        <p className="text-xs text-gray-500">
                          {item.reminders} reminders • Last: {item.lastSent}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </>
        )}
      </div>
    </div>
  );
}