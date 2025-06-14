import React from 'react';
import { FileCheck, Clock, Shield, AlertTriangle } from 'lucide-react';

const VerificationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Verification Center</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage and review practitioner credentials</p>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending Reviews</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">24</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Verified Today</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">12</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Flagged Items</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">3</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileCheck className="h-6 w-6 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Processed</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">156</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Recent Verification Activity</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Latest credential verification requests and updates.</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by reviewing pending verifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage; 