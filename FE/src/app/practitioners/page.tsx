import React, { useState } from 'react';
import Link from 'next/link';
import { practitioners, Practitioner } from '@/lib/data/mockData';
import { Check, Clock, AlertTriangle, Search } from 'lucide-react';
import Image from 'next/image';

const KanbanColumn: React.FC<{
  title: string;
  practitioners: Practitioner[];
  icon: React.ReactNode;
  colorClass: string;
}> = ({ title, practitioners, icon, colorClass }) => (
  <div className="flex flex-col bg-gray-50 rounded-lg p-4 min-h-[calc(100vh-16rem)]">
    <div className="flex items-center mb-4">
      {icon}
      <h3 className={`ml-2 font-semibold ${colorClass}`}>{title} ({practitioners.length})</h3>
    </div>
    <div className="space-y-3">
      {practitioners.map((practitioner) => (
        <Link
          key={practitioner.id}
          href={`/practitioners/${practitioner.id}`}
          className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{practitioner.name}</p>
                <p className="text-xs text-gray-500">{practitioner.specialty}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                Started: {new Date(practitioner.startDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {practitioner.verifications.filter(v => v.status === 'verified').length} 
                {' of '} 
                {practitioner.verifications.length} verifications
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

const PractitionersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPractitioners = practitioners
    .filter(practitioner => 
      practitioner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      practitioner.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const verifiedPractitioners = filteredPractitioners.filter(p => p.status === 'verified');
  const pendingPractitioners = filteredPractitioners.filter(p => p.status === 'pending');
  const expiredPractitioners = filteredPractitioners.filter(p => p.status === 'expired');

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Practitioners</h1>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Practitioner
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        <div className="p-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search practitioners"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <KanbanColumn
            title="Verified"
            practitioners={verifiedPractitioners}
            icon={<Check className="h-5 w-5 text-green-500" />}
            colorClass="text-green-700"
          />
          <KanbanColumn
            title="Pending"
            practitioners={pendingPractitioners}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            colorClass="text-amber-700"
          />
          <KanbanColumn
            title="Expired"
            practitioners={expiredPractitioners}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            colorClass="text-red-700"
          />
        </div>
      </div>
    </div>
  );
};

export default PractitionersList;