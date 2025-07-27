import React from 'react';
import { Clock, CheckCircle, AlertTriangle, XCircle, Plus } from 'lucide-react';

interface PipelineCard {
  id: string;
  provider: string;
  step: string;
  dueDate: string;
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
  status: 'not-started' | 'in-progress' | 'pending-review' | 'completed' | 'rejected';
}

export default function PipelineView() {
  const columns = [
    { 
      id: 'not-started', 
      title: 'Not Started', 
      icon: Plus, 
      color: 'bg-gray-100',
      cards: [
        { id: '1', provider: 'Dr. Sarah Johnson', step: 'NPI Verification', dueDate: '2024-01-20', assignedTo: 'John Doe', priority: 'high', status: 'not-started' },
        { id: '2', provider: 'Dr. Michael Chen', step: 'DEA License', dueDate: '2024-01-22', assignedTo: 'Jane Smith', priority: 'medium', status: 'not-started' },
      ]
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      icon: Clock, 
      color: 'bg-blue-100',
      cards: [
        { id: '3', provider: 'Dr. Emily Davis', step: 'NPDB Check', dueDate: '2024-01-18', assignedTo: 'John Doe', priority: 'high', status: 'in-progress' },
        { id: '4', provider: 'Dr. Robert Wilson', step: 'CA License', dueDate: '2024-01-21', assignedTo: 'Mike Johnson', priority: 'low', status: 'in-progress' },
        { id: '5', provider: 'Dr. Lisa Brown', step: 'ABMS', dueDate: '2024-01-25', assignedTo: 'Jane Smith', priority: 'medium', status: 'in-progress' },
      ]
    },
    { 
      id: 'pending-review', 
      title: 'Pending Review', 
      icon: AlertTriangle, 
      color: 'bg-yellow-100',
      cards: [
        { id: '6', provider: 'Dr. David Miller', step: 'SanctionCheck', dueDate: '2024-01-19', assignedTo: 'John Doe', priority: 'high', status: 'pending-review' },
        { id: '7', provider: 'Dr. Jessica Taylor', step: 'LADMF', dueDate: '2024-01-23', assignedTo: 'Mike Johnson', priority: 'medium', status: 'pending-review' },
      ]
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      icon: CheckCircle, 
      color: 'bg-green-100',
      cards: [
        { id: '8', provider: 'Dr. Mark Anderson', step: 'Medical Enrollment', dueDate: '2024-01-17', assignedTo: 'Jane Smith', priority: 'low', status: 'completed' },
        { id: '9', provider: 'Dr. Amanda White', step: 'Medicare Enrollment', dueDate: '2024-01-16', assignedTo: 'John Doe', priority: 'medium', status: 'completed' },
        { id: '10', provider: 'Dr. Kevin Lee', step: 'Hospital Privileges', dueDate: '2024-01-15', assignedTo: 'Mike Johnson', priority: 'high', status: 'completed' },
      ]
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Verification Pipeline</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          New Verification
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            <div className={`${column.color} p-3 rounded-lg`}>
              <div className="flex items-center space-x-2">
                <column.icon className="w-5 h-5 text-gray-700" />
                <h4 className="font-medium text-gray-900">{column.title}</h4>
                <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                  {column.cards.length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[400px]">
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  className={`bg-white border-l-4 rounded-lg p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(card.priority)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-gray-900 text-sm">{card.provider}</h5>
                    {isOverdue(card.dueDate) && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{card.step}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Due: {new Date(card.dueDate).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        card.priority === 'high' ? 'bg-red-100 text-red-800' :
                        card.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {card.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Assigned to: {card.assignedTo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}