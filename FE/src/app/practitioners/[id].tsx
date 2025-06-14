import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { getPractitionerById } from '@/lib/data/mockData';
import { Check, AlertTriangle, Clock } from 'lucide-react';
import VerificationItem from '@/app/practitioners/VerificationItem';
import Image from 'next/image';

const PractitionerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const practitioner = getPractitionerById(id || '');
  const [expandedVerification, setExpandedVerification] = useState<string | null>(null);

  if (!practitioner) {
    return <div className="text-center py-12">Practitioner not found</div>;
  }

  const toggleVerification = (verificationId: string) => {
    if (expandedVerification === verificationId) {
      setExpandedVerification(null);
    } else {
      setExpandedVerification(verificationId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{practitioner.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{practitioner.specialty}</p>
          </div>
          <div className="flex items-center">
            <div className="px-4 py-2 rounded-lg bg-gray-50 mr-4">
              <p className="text-sm font-medium text-gray-700">Status</p>
              <p className={`mt-1 flex items-center text-sm ${
                practitioner.status === 'verified' ? 'text-green-600' :
                practitioner.status === 'pending' ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {getStatusIcon(practitioner.status)}
                <span className="ml-1 capitalize">{practitioner.status}</span>
              </p>
            </div>
            <Image
              className="h-20 w-20 rounded-full"
              src={practitioner.image}
              alt={practitioner.name}
            />
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{practitioner.personalInfo.email}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{practitioner.personalInfo.phone}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{practitioner.personalInfo.address}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">NPI Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{practitioner.personalInfo.npi}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{practitioner.personalInfo.dob}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Verification Timeline</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Status of all verification steps</p>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5">
                <ul className="space-y-3">
                  {practitioner.verifications.map((verification) => (
                    <li key={verification.id} className={`verification-item ${verification.status}`}>
                      <div className="font-medium text-gray-900">{verification.type}</div>
                      <div className={`text-sm ${
                        verification.status === 'verified' ? 'text-green-600' :
                        verification.status === 'pending' ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                      </div>
                      {verification.verifiedDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {verification.status === 'verified' ? 'Verified on ' : 'Expired on '}
                          {verification.verifiedDate}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Verification Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Detailed information for each verification step
              </p>
            </div>
            <div className="border-t border-gray-200">
              <div className="divide-y divide-gray-200">
                {practitioner.verifications.map((verification) => (
                  <VerificationItem
                    key={verification.id}
                    verification={verification}
                    isExpanded={expandedVerification === verification.id}
                    onToggle={() => toggleVerification(verification.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PractitionerDetail;