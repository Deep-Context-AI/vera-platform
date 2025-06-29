'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Trash2,
  Calendar,
  Building2,
  Edit2,
  Check,
  X,
  MapPin,
  Phone
} from 'lucide-react';

export interface HospitalPrivilege {
  id: string;
  hospitalName: string;
  address?: string;
  phone?: string;
  department: string;
  issued: string; // ISO date string
  expiration: string; // ISO date string
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
}

interface HospitalPrivilegesFormProps {
  privileges: HospitalPrivilege[];
  onAddPrivilege: (privilege: Omit<HospitalPrivilege, 'id'>) => void;
  onRemovePrivilege: (privilegeId: string) => void;
  onUpdatePrivilege: (privilegeId: string, updatedPrivilege: Partial<HospitalPrivilege>) => void;
  isEditable?: boolean; // Whether privileges can be edited/removed
}

export const HospitalPrivilegesForm: React.FC<HospitalPrivilegesFormProps> = ({
  privileges,
  onAddPrivilege,
  onRemovePrivilege,
  onUpdatePrivilege,
  isEditable = true
}) => {
  const [newPrivilege, setNewPrivilege] = useState({
    hospitalName: '',
    address: '',
    phone: '',
    department: '',
    issued: '',
    expiration: '',
    status: 'Active' as const
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrivilege, setEditingPrivilege] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HospitalPrivilege>>({});

  const handleAddPrivilege = () => {
    if (newPrivilege.hospitalName && newPrivilege.department && newPrivilege.issued && newPrivilege.expiration) {
      onAddPrivilege({
        ...newPrivilege,
        address: newPrivilege.address || undefined,
        phone: newPrivilege.phone || undefined
      });
      setNewPrivilege({ 
        hospitalName: '', 
        address: '', 
        phone: '', 
        department: '', 
        issued: '', 
        expiration: '', 
        status: 'Active' 
      });
      setShowAddForm(false);
    }
  };

  const handleEditPrivilege = (privilege: HospitalPrivilege) => {
    setEditingPrivilege(privilege.id);
    setEditForm(privilege);
  };

  const handleSaveEdit = () => {
    if (editingPrivilege && editForm) {
      onUpdatePrivilege(editingPrivilege, editForm);
      setEditingPrivilege(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingPrivilege(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'Suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {isEditable ? 'Hospital Privileges' : 'Hospital Privilege Information'}
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
            Add Privilege
          </Button>
        )}
      </div>

      {/* Existing privileges list */}
      {privileges.length > 0 && (
        <div className="space-y-2">
          {privileges.map((privilege) => (
            <div
              key={privilege.id}
              className={`p-3 border rounded-lg ${
                privilege.status === 'Suspended' || isExpired(privilege.expiration)
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : privilege.status === 'Pending' || isExpiringSoon(privilege.expiration)
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}
            >
              {editingPrivilege === privilege.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hospital Name
                      </label>
                      <input
                        type="text"
                        value={editForm.hospitalName || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, hospitalName: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={editForm.department || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address (Optional)
                      </label>
                      <input
                        type="text"
                        value={editForm.address || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <Select 
                        value={editForm.status || 'Active'} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as HospitalPrivilege['status'] }))}
                      >
                        <SelectTrigger className="w-full h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
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
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      key="cancel"
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      key="save"
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
                    <Building2 className="w-4 h-4 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {privilege.hospitalName}
                        </span>
                        <Badge className={getStatusColor(privilege.status)}>
                          {privilege.status}
                        </Badge>
                        {isExpired(privilege.expiration) && (
                          <Badge key="expired" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            Expired
                          </Badge>
                        )}
                        {isExpiringSoon(privilege.expiration) && !isExpired(privilege.expiration) && (
                          <Badge key="expires-soon" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            Expires Soon
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="font-medium">Department: {privilege.department}</div>
                        {privilege.address && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {privilege.address}
                          </div>
                        )}
                        {privilege.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {privilege.phone}
                          </div>
                        )}
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Issued: {formatDate(privilege.issued)}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Expires: {formatDate(privilege.expiration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {isEditable && (
                    <div className="flex space-x-1">
                      <Button
                        key="edit"
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPrivilege(privilege)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        key="remove"
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemovePrivilege(privilege.id)}
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

      {/* Add privilege form */}
      {showAddForm && isEditable && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Add New Hospital Privilege
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                value={newPrivilege.hospitalName}
                onChange={(e) => setNewPrivilege(prev => ({ ...prev, hospitalName: e.target.value }))}
                placeholder="Enter hospital name"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={newPrivilege.department}
                onChange={(e) => setNewPrivilege(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Enter department"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address (Optional)
              </label>
              <input
                type="text"
                value={newPrivilege.address}
                onChange={(e) => setNewPrivilege(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter hospital address"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={newPrivilege.phone}
                onChange={(e) => setNewPrivilege(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select 
                value={newPrivilege.status} 
                onValueChange={(value) => setNewPrivilege(prev => ({ ...prev, status: value as HospitalPrivilege['status'] }))}
              >
                <SelectTrigger className="w-full h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={newPrivilege.issued}
                onChange={(e) => setNewPrivilege(prev => ({ ...prev, issued: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={newPrivilege.expiration}
                onChange={(e) => setNewPrivilege(prev => ({ ...prev, expiration: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              key="cancel-add"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              key="add-privilege"
              type="button"
              size="sm"
              onClick={handleAddPrivilege}
              disabled={!newPrivilege.hospitalName || !newPrivilege.department || !newPrivilege.issued || !newPrivilege.expiration}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Privilege
            </Button>
          </div>
        </div>
      )}

      {privileges.length === 0 && !showAddForm && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          {isEditable 
            ? 'No hospital privileges added yet. Click "Add Privilege" to get started.'
            : 'No hospital privilege information available.'
          }
        </div>
      )}
    </div>
  );
};

export default HospitalPrivilegesForm; 