import React from 'react';
import { practitioners } from '../../lib/data/mockData';
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Practitioners</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{totalPractitioners}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
            <Link href="/practitioners" className="font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileCheck className="h-6 w-6 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Verified Practitioners</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{verifiedPractitioners}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/practitioners?status=verified" className="font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Verifications</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{pendingCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/practitioners?status=pending" className="font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expired Credentials</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{expiredCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/practitioners?status=expired" className="font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Verification Progress</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Overall verification progress across all practitioners.</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-blue-700">{verificationPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${verificationPercentage}%` }}></div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
              <p className="text-sm text-gray-500">Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{expiredCount}</p>
              <p className="text-sm text-gray-500">Expired</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Recent Practitioners</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {practitioners.slice(0, 3).map((practitioner) => (
          <Link 
            key={practitioner.id}
            href={`/practitioners/${practitioner.id}`} 
            className="block bg-white shadow overflow-hidden rounded-lg hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{practitioner.name}</h3>
                  <p className="text-sm text-gray-500">{practitioner.specialty}</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      practitioner.status === 'verified' ? 'bg-green-100 text-green-800' :
                      practitioner.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
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
  );
};

export default Dashboard;