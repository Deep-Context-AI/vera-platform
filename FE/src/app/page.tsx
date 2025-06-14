import React from 'react';
import { practitioners } from '../lib/data/mockData';
import Link from 'next/link';
import { Users, FileCheck, AlertCircle, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Calculate stats
  const totalPractitioners = practitioners.length;
  const verifiedPractitioners = practitioners.filter(p => p.status === 'verified').length;
  
  // Calculate verification stats
  const allVerifications = practitioners.flatMap(p => p.verifications);
  const totalVerifications = allVerifications.length;
  const verifiedCount = allVerifications.filter(v => v.status === 'verified').length;
  const pendingCount = allVerifications.filter(v => v.status === 'pending').length;
  const expiredCount = allVerifications.filter(v => v.status === 'expired').length;
  
  const verificationPercentage = Math.round((verifiedCount / totalVerifications) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome to your verification platform overview</p>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Practitioners</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{totalPractitioners}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/practitioners" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileCheck className="h-6 w-6 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Verified Practitioners</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{verifiedPractitioners}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/practitioners?status=verified" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending Verifications</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{pendingCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/practitioners?status=pending" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Expired Credentials</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{expiredCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/practitioners?status=expired" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Verification Progress</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Overall verification progress across all practitioners.</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-blue-700 dark:text-blue-400">{verificationPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" style={{ width: `${verificationPercentage}%` }}></div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{verifiedCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{pendingCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">{expiredCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Practitioners</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {practitioners.slice(0, 3).map((practitioner) => (
            <Link 
              key={practitioner.id}
              href={`/practitioners/${practitioner.id}`} 
              className="block bg-gray-50 dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{practitioner.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{practitioner.specialty}</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        practitioner.status === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        practitioner.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {practitioner.status.charAt(0).toUpperCase() + practitioner.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;