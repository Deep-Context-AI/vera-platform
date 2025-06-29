'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Edit2,
  Check,
  X,
  FileText
} from 'lucide-react';

export interface IncidentClaim {
  id: string;
  incidentType: string;
  details: string;
  date: string; // ISO date string
}

interface IncidentsClaimsFormProps {
  incidents: IncidentClaim[];
  onAddIncident: (incident: Omit<IncidentClaim, 'id'>) => void;
  onRemoveIncident: (incidentId: string) => void;
  onUpdateIncident: (incidentId: string, updatedIncident: Partial<IncidentClaim>) => void;
  isEditable?: boolean; // Whether incidents can be edited/removed
}

export const IncidentsClaimsForm: React.FC<IncidentsClaimsFormProps> = ({
  incidents,
  onAddIncident,
  onRemoveIncident,
  onUpdateIncident,
  isEditable = true
}) => {
  const [newIncident, setNewIncident] = useState({
    incidentType: 'Malpractice Claim',
    details: '',
    date: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<IncidentClaim>>({});

  const incidentTypes = [
    'Malpractice Claim',
    'Patient Complaint',
    'Disciplinary Action',
    'License Suspension',
    'Criminal Charge',
    'Civil Lawsuit',
    'Hospital Incident',
    'Peer Review',
    'Insurance Claim',
    'Other'
  ];

  const handleAddIncident = () => {
    if (newIncident.incidentType && newIncident.details && newIncident.date) {
      onAddIncident(newIncident);
      setNewIncident({ incidentType: 'Malpractice Claim', details: '', date: '' });
      setShowAddForm(false);
    }
  };

  const handleEditIncident = (incident: IncidentClaim) => {
    setEditingIncident(incident.id);
    setEditForm(incident);
  };

  const handleSaveEdit = () => {
    if (editingIncident && editForm) {
      onUpdateIncident(editingIncident, editForm);
      setEditingIncident(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingIncident(null);
    setEditForm({});
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'Malpractice Claim':
      case 'Criminal Charge':
      case 'License Suspension':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'Disciplinary Action':
      case 'Civil Lawsuit':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'Patient Complaint':
      case 'Hospital Incident':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'Peer Review':
      case 'Insurance Claim':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getSeverityLevel = (type: string) => {
    const highSeverity = ['Malpractice Claim', 'Criminal Charge', 'License Suspension'];
    const mediumSeverity = ['Disciplinary Action', 'Civil Lawsuit'];
    
    if (highSeverity.includes(type)) return 'high';
    if (mediumSeverity.includes(type)) return 'medium';
    return 'low';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {isEditable ? 'Incidents & Claims' : 'Incident & Claims Information'}
        </label>
        {isEditable && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Incident
          </Button>
        )}
      </div>

      {/* Existing incidents list */}
      {incidents.length > 0 && (
        <div className="space-y-2">
          {incidents.map((incident) => {
            const severity = getSeverityLevel(incident.incidentType);
            return (
              <div
                key={incident.id}
                className={`p-3 border rounded-lg ${
                  severity === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : severity === 'medium'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                {editingIncident === incident.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Incident Type
                        </label>
                        <Select 
                          value={editForm.incidentType || 'Malpractice Claim'} 
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, incidentType: value }))}
                        >
                          <SelectTrigger className="w-full h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {incidentTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={editForm.date || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Details
                        </label>
                        <textarea
                          value={editForm.details || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, details: e.target.value }))}
                          rows={3}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-vertical"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveEdit}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <AlertTriangle className={`w-4 h-4 mt-1 ${
                        severity === 'high' ? 'text-red-600' : 
                        severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getIncidentTypeColor(incident.incidentType)}>
                            {incident.incidentType}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(incident.date)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          <div className="flex items-start space-x-1">
                            <FileText className="w-3 h-3 mt-0.5 text-gray-500" />
                            <div className="flex-1">
                              <p className="whitespace-pre-wrap break-words">
                                {incident.details}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isEditable && (
                      <div className="flex space-x-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditIncident(incident)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveIncident(incident.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add incident form */}
      {showAddForm && isEditable && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Add New Incident or Claim
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Incident Type
                </label>
                <Select 
                  value={newIncident.incidentType} 
                  onValueChange={(value) => setNewIncident(prev => ({ ...prev, incidentType: value }))}
                >
                  <SelectTrigger className="w-full h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newIncident.date}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Details
              </label>
              <textarea
                value={newIncident.details}
                onChange={(e) => setNewIncident(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Provide detailed information about the incident or claim..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-vertical"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddIncident}
              disabled={!newIncident.incidentType || !newIncident.details || !newIncident.date}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Incident
            </Button>
          </div>
        </div>
      )}

      {incidents.length === 0 && !showAddForm && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          {isEditable 
            ? 'No incidents or claims reported. Click "Add Incident" to get started.'
            : 'No incident or claims information available.'
          }
        </div>
      )}
    </div>
  );
};

export default IncidentsClaimsForm; 