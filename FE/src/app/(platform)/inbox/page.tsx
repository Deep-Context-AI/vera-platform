'use client';

import React, { useState } from 'react';
import { 
  Mail, 
  Search, 
  Archive, 
  Reply, 
  Forward, 
  Download,
  Paperclip,
  Send,
  User,
  Building,
  Calendar
} from 'lucide-react';
import { EmailMessage } from '@/types/platform';
import { staticInboxEmails } from '@/lib/data/staticInboxData';

const InboxPage: React.FC = () => {
  const [emails] = useState<EmailMessage[]>(staticInboxEmails);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [replyText, setReplyText] = useState('');

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || email.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || email.priority === filterPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const unreadCount = emails.filter(email => !email.isRead).length;
  const urgentCount = emails.filter(email => email.priority === 'urgent').length;
  const responseRequiredCount = emails.filter(email => email.responseRequired && !email.isRead).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
      case 'medium':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (email: EmailMessage) => {
    if (email.type === 'outbound') {
      return <Send className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    } else {
      return <Mail className="w-4 h-4 text-green-500 dark:text-green-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleReply = () => {
    if (selectedEmail && replyText.trim()) {
      // Mock sending reply
      console.log('Sending reply:', replyText);
      setReplyText('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Vera Inbox</h1>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Compose
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{unreadCount}</div>
              <div className="text-xs text-red-600 dark:text-red-400">Unread</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{urgentCount}</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Urgent</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{responseRequiredCount}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Need Response</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="education_verification">Education Verification</option>
              <option value="license_verification">License Verification</option>
              <option value="privileges_verification">Privileges Verification</option>
              <option value="insurance_verification">Insurance Verification</option>
              <option value="npdb_verification">NPDB Verification</option>
              <option value="reference_verification">Reference Verification</option>
              <option value="board_certification">Board Certification</option>
              <option value="employment_verification">Employment Verification</option>
              <option value="dea_verification">DEA Verification</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedEmail?.id === email.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              } ${!email.isRead ? 'bg-blue-25 dark:bg-blue-900/10' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(email)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm truncate ${!email.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-white`}>
                      {email.type === 'outbound' ? `To: ${email.to.split('@')[0]}` : `From: ${email.from.split('@')[0]}`}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(email.timestamp)}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-1 ${!email.isRead ? 'font-medium' : ''} text-gray-700 dark:text-gray-300 truncate`}>
                    {email.subject}
                  </p>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {email.body.substring(0, 80)}...
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(email.priority)}`}>
                        {email.priority.toUpperCase()}
                      </span>
                      
                      {email.responseRequired && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Response Required
                        </span>
                      )}
                      
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    
                    {!email.isRead && (
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedEmail.subject}
                  </h2>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>
                        {selectedEmail.type === 'outbound' ? 
                          `To: ${selectedEmail.to}` : 
                          `From: ${selectedEmail.from}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                    </div>
                    
                    {selectedEmail.providerName && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>{selectedEmail.providerName}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedEmail.priority)}`}>
                      {selectedEmail.priority.toUpperCase()}
                    </span>
                    
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {selectedEmail.category.replace('_', ' ').toUpperCase()}
                    </span>
                    
                    {selectedEmail.isVerificationResponse && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Verification Response
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <Reply className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <Forward className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 overflow-y-auto">
              <div className="max-w-4xl">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedEmail.body}
                  </pre>
                </div>
                
                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{attachment}</span>
                          </div>
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reply Section */}
            {selectedEmail.responseRequired && (
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Reply</h4>
                <div className="space-y-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setReplyText('')}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleReply}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select an Email</h3>
              <p className="text-gray-600 dark:text-gray-400">Choose an email from the list to view its contents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage; 