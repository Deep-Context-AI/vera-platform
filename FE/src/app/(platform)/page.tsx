'use client';

import React from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ProvidersTable from '@/components/dashboard/ProvidersTable';
import { staticProviders } from '@/lib/data/staticProviders';

const Dashboard: React.FC = () => {

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Healthcare Provider Verification Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and manage provider credentialing and verification processes in real-time
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Processing Power</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">Vera AI</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <DashboardStats />
      
      {/* Providers Table */}
      <ProvidersTable providers={staticProviders} />
    </div>
  );
};

export default Dashboard;