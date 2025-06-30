'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Trash2,
  Calendar,
  Hash,
  Edit2,
  Check,
  X
} from 'lucide-react';

export interface License {
  id: string;
  number: string;
  state: string;
  issued: string; // ISO date string
  expiration: string; // ISO date string
  status?: string; // License status (active, expired, suspended, etc.)
}

interface LicenseFormProps {
  licenses: License[];
  onAddLicense: (license: Omit<License, 'id'>) => void;
  onRemoveLicense: (licenseId: string) => void;
  onUpdateLicense: (licenseId: string, updatedLicense: Partial<License>) => void;
  isEditable?: boolean; // Whether licenses can be edited/removed
}

export const LicenseForm: React.FC<LicenseFormProps> = ({
  licenses,
  onAddLicense,
  onRemoveLicense,
  onUpdateLicense,
  isEditable = true
}) => {
  const [newLicense, setNewLicense] = useState({
    number: '',
    state: 'CA',
    issued: '',
    expiration: '',
    status: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<License>>({});

  const handleAddLicense = () => {
    if (newLicense.number && newLicense.issued && newLicense.expiration) {
      onAddLicense(newLicense);
      setNewLicense({ number: '', state: 'CA', issued: '', expiration: '', status: '' });
      setShowAddForm(false);
    }
  };

  const handleEditLicense = (license: License) => {
    setEditingLicense(license.id);
    setEditForm(license);
  };

  const handleSaveEdit = () => {
    if (editingLicense && editForm) {
      onUpdateLicense(editingLicense, editForm);
      setEditingLicense(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingLicense(null);
    setEditForm({});
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expDate < sixMonthsFromNow && expDate > new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {isEditable ? 'Verified Licenses' : 'License Information'}
        </label>
        {isEditable && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            data-agent-action="open-add-license-form"
            className="text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add License
          </Button>
        )}
      </div>

      {/* Existing licenses list */}
      {licenses.length > 0 && (
        <div className="space-y-2">
          {licenses.map((license) => (
            <div
              key={license.id}
              className={`p-3 border rounded-lg ${
                isExpired(license.expiration) 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : isExpiringSoon(license.expiration)
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}
            >
              {editingLicense === license.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={editForm.number || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, number: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State
                      </label>
                      <Select 
                        value={editForm.state || 'CA'} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, state: value }))}
                      >
                        <SelectTrigger className="w-full h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                          <SelectItem value="IL">Illinois</SelectItem>
                          <SelectItem value="PA">Pennsylvania</SelectItem>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="GA">Georgia</SelectItem>
                          <SelectItem value="NC">North Carolina</SelectItem>
                          <SelectItem value="MI">Michigan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        value={editForm.issued || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, issued: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        value={editForm.expiration || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, expiration: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <input
                        type="text"
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                        placeholder="e.g., Active, Expired, Suspended"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {license.number}
                        </span>
                        <Badge variant="secondary">{license.state}</Badge>
                        {isExpired(license.expiration) && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            Expired
                          </Badge>
                        )}
                        {isExpiringSoon(license.expiration) && !isExpired(license.expiration) && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            Expires Soon
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Issued: {formatDate(license.issued)}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Expires: {formatDate(license.expiration)}
                        </span>
                        {license.status && (
                          <span className="flex items-center">
                            Status: {license.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isEditable && (
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLicense(license)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveLicense(license.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add license form */}
      {showAddForm && isEditable && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Add New License
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                License Number
              </label>
              <input
                type="text"
                value={newLicense.number}
                onChange={(e) => setNewLicense(prev => ({ ...prev, number: e.target.value }))}
                placeholder="Enter license number"
                data-agent-field="license-number"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <Select 
                value={newLicense.state} 
                onValueChange={(value) => setNewLicense(prev => ({ ...prev, state: value }))}
                data-agent-field="license-state"
              >
                <SelectTrigger className="w-full h-10 text-sm" data-agent-trigger="license-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA" data-agent-option="CA">California</SelectItem>
                  <SelectItem value="NY" data-agent-option="NY">New York</SelectItem>
                  <SelectItem value="TX" data-agent-option="TX">Texas</SelectItem>
                  <SelectItem value="FL" data-agent-option="FL">Florida</SelectItem>
                  <SelectItem value="IL" data-agent-option="IL">Illinois</SelectItem>
                  <SelectItem value="PA" data-agent-option="PA">Pennsylvania</SelectItem>
                  <SelectItem value="OH" data-agent-option="OH">Ohio</SelectItem>
                  <SelectItem value="GA" data-agent-option="GA">Georgia</SelectItem>
                  <SelectItem value="NC" data-agent-option="NC">North Carolina</SelectItem>
                  <SelectItem value="MI" data-agent-option="MI">Michigan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={newLicense.issued}
                onChange={(e) => setNewLicense(prev => ({ ...prev, issued: e.target.value }))}
                data-agent-field="license-issue-date"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={newLicense.expiration}
                onChange={(e) => setNewLicense(prev => ({ ...prev, expiration: e.target.value }))}
                data-agent-field="license-expiration-date"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <input
                type="text"
                value={newLicense.status}
                onChange={(e) => setNewLicense(prev => ({ ...prev, status: e.target.value }))}
                placeholder="e.g., Active, Expired, Suspended"
                data-agent-field="license-status"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
              onClick={handleAddLicense}
              disabled={!newLicense.number || !newLicense.issued || !newLicense.expiration}
              data-agent-action="submit-add-license"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add License
            </Button>
          </div>
        </div>
      )}

      {licenses.length === 0 && !showAddForm && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          {isEditable 
            ? 'No licenses added yet. Click "Add License" to get started.'
            : 'No license information available.'
          }
        </div>
      )}
    </div>
  );
};

export default LicenseForm; 