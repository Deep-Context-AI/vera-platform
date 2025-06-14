import React from 'react';
import { Settings, Shield, Users, Bell, HelpCircle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your platform configuration and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-gray-50 dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">General Settings</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Basic platform configuration</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platform Name</label>
                <input 
                  type="text" 
                  value="Vera Platform" 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Zone</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option>UTC-8 (Pacific Time)</option>
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+0 (GMT)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Security</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Authentication and access control</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Session Timeout</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Auto-logout after inactivity</p>
                </div>
                <select className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center">
              <Bell className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Configure alert preferences</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</span>
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Verification Alerts</span>
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">System Updates</span>
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">User Management</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Manage team access and roles</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No team members</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by inviting team members.</p>
              <div className="mt-6">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                  Invite Users
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 