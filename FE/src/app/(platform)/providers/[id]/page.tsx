'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, 
  FileText, 
  Shield, 
  AlertTriangle, 
  ChevronDown,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { ApplicationsAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ProviderDetailClient, VerificationTabContent } from '@/components/providers/ProviderDetailClient';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { 
  Practitioner, 
  ApplicationWithDetails, 
  Attestation, 
  AttestationResponse 
} from '@/types/applications';
import { getApplicationStatusColor, getApplicationStatusIcon, getDueDateColor } from '@/lib/utils';
import SSNDisplay from '@/components/ui/ssn-display';
import Link from 'next/link';

const PractitionerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const providerId = parseInt(id || '0', 10);

  // State
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [providerData, setProviderData] = useState<any>(null);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [attestationsLoading, setAttestationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAttestationsDialog, setShowAttestationsDialog] = useState(false);
  const [expandedAttestationSections, setExpandedAttestationSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch practitioner and applications data
  const fetchData = useCallback(async () => {
    if (!providerId) return;

    setLoading(true);
    setError(null);

    try {
      // First try to get provider details from the view, then get applications
      const [providerDetailsResult, applicationsResult] = await Promise.all([
        ApplicationsAPI.getProviderDetails(providerId),
        ApplicationsAPI.getApplicationsByPractitioner(providerId)
      ]);

      if (providerDetailsResult.error && applicationsResult.error) {
        setError('Failed to fetch provider data');
        return;
      }

      // If we have provider details from the view, construct practitioner object
      if (providerDetailsResult.data) {
        const fetchedProviderData = providerDetailsResult.data;
        setProviderData(fetchedProviderData);
        const constructedPractitioner: Practitioner = {
          id: fetchedProviderData.provider_id || providerId,
          first_name: fetchedProviderData.practitioner_first_name || '',
          last_name: fetchedProviderData.practitioner_last_name || null,
          middle_name: fetchedProviderData.practitioner_middle_name || null,
          suffix: fetchedProviderData.practitioner_suffix || null,
          education: fetchedProviderData.practitioner_education || null,
          other_names: fetchedProviderData.practitioner_other_names || null,
          home_address: fetchedProviderData.practitioner_home_address || null,
          mailing_address: fetchedProviderData.practitioner_mailing_address || null,
          ssn: fetchedProviderData.practitioner_ssn || null,
          demographics: fetchedProviderData.practitioner_demographics || null,
          languages: fetchedProviderData.practitioner_languages || null,
          created_at: fetchedProviderData.created_at || null,
          updated_at: null
        };
        setPractitioner(constructedPractitioner);
      } else if (applicationsResult.data && applicationsResult.data.length > 0) {
        // Fallback: try to get practitioner data from the first application
        const firstApp = applicationsResult.data[0];
        if (firstApp.practitioner) {
          setPractitioner(firstApp.practitioner as Practitioner);
        }
      } else {
        // Last resort: try to fetch practitioner directly
        const practitionerResult = await ApplicationsAPI.getPractitioner(providerId);
        if (practitionerResult.data) {
          setPractitioner(practitionerResult.data);
        } else {
          setError('Provider not found');
          return;
        }
      }

      setApplications(applicationsResult.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // Fetch attestations when dialog is opened
  const fetchAttestations = useCallback(async () => {
    if (attestations.length > 0) return;

    setAttestationsLoading(true);
    
    try {
      // Use the providerId from URL since that's the practitioner_id in the attestations table
      console.log('Fetching attestations for practitioner ID:', providerId);
      const { data, error } = await ApplicationsAPI.getAttestationsByPractitioner(providerId);
      
      if (error) {
        console.error('Failed to fetch attestations:', error);
        return;
      }

      if (data && data.length > 0) {
        setAttestations(data);
        console.log('Found attestations:', data.length);
      } else {
        console.log('No attestations found for practitioner ID:', providerId);
      }
    } catch (err) {
      console.error('Error fetching attestations:', err);
    } finally {
      setAttestationsLoading(false);
    }
  }, [attestations.length, providerId]);

  // Load initial data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle attestations dialog
  const handleShowAttestations = () => {
    setShowAttestationsDialog(true);
    fetchAttestations();
  };

  // Toggle attestation sections
  const toggleAttestationSection = (section: string) => {
    const newExpanded = new Set(expandedAttestationSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedAttestationSections(newExpanded);
  };

  // Helper functions
  const formatName = (practitioner: Practitioner) => {
    const parts = [
      practitioner.first_name,
      practitioner.middle_name,
      practitioner.last_name,
      practitioner.suffix
    ].filter(Boolean);
    return parts.join(' ');
  };

  const formatAttestationKey = (key: string) => {
    // List of terms that should be capitalized
    const capitalizeTerms = [
      'npdb',
      'npi',
      'dea',
      'cms',
      'oig',
      'fda',
      'cdc',
      'hhs',
      'medicare',
      'medicaid',
      'hipaa',
      'emtala',
      'stark',
      'fbi',
      'doj'
    ];
    
    let formatted = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Or/g, 'or')
      .replace(/And/g, 'and')
      .replace(/To/g, 'to')
      .replace(/For/g, 'for')
      .replace(/By/g, 'by')
      .replace(/From/g, 'from');
    
    // Apply custom capitalization rules
    capitalizeTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      formatted = formatted.replace(regex, term.toUpperCase());
    });
    
    return formatted;
  };

  // Helper function to determine attestation status and color
  const getAttestationStatus = (value: AttestationResponse) => {
    const explanationRequired = value.explanation_required_on === 'true' || value.explanation_required_on === 'false';
    const responseMatchesRequirement = value.explanation_required_on === (value.response ? 'true' : 'false');
    const hasExplanation = value.explanation && value.explanation.trim().length > 0;
    
    if (!explanationRequired) {
      // No explanation required - green
      return {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        isRequired: false,
        hasResponse: false
      };
    }
    
    if (responseMatchesRequirement && hasExplanation) {
      // Explanation required and provided - red
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        isRequired: true,
        hasResponse: true
      };
    }
    
    // Default case - gray for unclear states
    return {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      isRequired: explanationRequired,
      hasResponse: hasExplanation
    };
  };

  // Group attestations by category
  const groupAttestations = (attestation: Attestation) => {
    const groups: Record<string, Array<{ key: string; value: AttestationResponse }>> = {
      'License & Certification': [],
      'Hospital Privileges': [],
      'Malpractice Liability': [],
      'Criminal Background': [],
      'Medicare & Medicaid': [],
      'Substance Use': [],
      'Physical & Mental Health': [],
      'Board Certification & Education': [],
      'Billing & Practice History': [],
      'Ethical Conduct': [],
      'Affirmation & Authorization': []
    };

    Object.entries(attestation).forEach(([key, value]) => {
      if (key === 'id' || key === 'practitioner_id' || key === 'created_at' || key === 'updated_at' || !value) {
        return;
      }

      if (key.startsWith('license_certification_')) {
        groups['License & Certification'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('hospital_privileges_')) {
        groups['Hospital Privileges'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('malpractice_liability_')) {
        groups['Malpractice Liability'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('criminal_background_')) {
        groups['Criminal Background'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('medicare_medicaid_')) {
        groups['Medicare & Medicaid'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('substance_use_')) {
        groups['Substance Use'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('physical_mental_health_')) {
        groups['Physical & Mental Health'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('board_certification_education_')) {
        groups['Board Certification & Education'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('billing_practice_history_')) {
        groups['Billing & Practice History'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('ethical_conduct_')) {
        groups['Ethical Conduct'].push({ key, value: value as AttestationResponse });
      } else if (key.startsWith('affirmation_authorization_')) {
        groups['Affirmation & Authorization'].push({ key, value: value as AttestationResponse });
      }
    });

    return groups;
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error handling
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Provider</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!practitioner) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Provider Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400">The provider with ID {id} could not be found.</p>
      </div>
    );
  }

  return (
    <ProviderDetailClient providerId={id || '0'}>
      <div>
        {/* Updated header structure to match UI screenshot */}
        <div className="bg-white dark:bg-gray-800 rounded-lg px-6">
        
        {/* Main header content */}
        <div className="px-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
          {/* Left-side Return to Providers */}
          <div className="border-r border-gray-200 dark:border-gray-700 p-4">
            <Link href="/providers" className="text-gray-600 hover:text-gray-900">
            <div className="flex flex-row items-center"> 
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Providers
            </div>
            </Link>
          </div>

            {/* Left side - Provider info with avatar */}
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              {/* Provider details */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatName(practitioner)}
                </h1>
                
                  {applications.length > 0 && (
                    <Badge className={`${getApplicationStatusColor(applications[0].status || '')}`}>
                      {(() => {
                        const IconComponent = getApplicationStatusIcon(applications[0].status || '');
                        return <IconComponent className="w-4 h-4" />;
                      })()}
                      <span>{applications[0].status?.replace('_', ' ') || 'Rejected'}</span>
                    </Badge>
                  )}</div>

                <p className="text-gray-600 dark:text-gray-400">
                  {(() => {
                    if (practitioner.education) {
                      if (typeof practitioner.education === 'object' && practitioner.education.degree) {
                        return practitioner.education.degree;
                      }
                      if (typeof practitioner.education === 'string') {
                        return practitioner.education;
                      }
                    }
                    return 'Healthcare Professional';
                  })()}
                </p>
                {/* Provider Metadata (NPI, ID, DEA, License) */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    NPI: <span className="font-medium text-gray-900 dark:text-gray-100">
                      {applications.find(app => app.npi_number)?.npi_number || '2*13528884'}
                    </span>
                  </span>
                  <span>
                    ID: <span className="font-medium text-gray-900 dark:text-gray-100">
                      {String(practitioner.id).padStart(4, '0')}
                    </span>
                  </span>
                  <span>
                    DEA: <span className="font-medium text-gray-900 dark:text-gray-100">
                      {providerData?.dea_number || applications.find(app => app.dea_number)?.dea_number || 'Not provided'}
                    </span>
                  </span>
                  <span>
                    CA License: <span className="font-medium text-gray-900 dark:text-gray-100">
                      {providerData?.license_number || applications.find(app => app.license_number)?.license_number || 'Not provided'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs container */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-blue-600 rounded-none py-4 px-6"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="verifications"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-blue-600 rounded-none py-4 px-6"
              >
                Verifications
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-blue-600 rounded-none py-4 px-6"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="audit-trail"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-blue-600 rounded-none py-4 px-6"
              >
                Audit Trail
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main content area with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-5">
        <TabsContent value="overview">
          {/* Main content area (flex-row) */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left panel - Demographics section */}
            <div className="lg:w-80 lg:flex-shrink-0 flex flex-col gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Demographics</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* SSN */}
                  <SSNDisplay 
                    ssn={practitioner.ssn || '***-**-4706'} 
                    showLabel={true}
                    labelText="SSN"
                  />
                  
                  {/* Gender */}
                  {practitioner.demographics && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Gender</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          const demo = typeof practitioner.demographics === 'string' 
                            ? practitioner.demographics 
                            : (practitioner.demographics as any)?.gender || 'Male';
                          return demo;
                        })()}
                      </span>
                    </div>
                  )}
                  
                  {/* Date of Birth */}
                  {practitioner.demographics && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          const demo = practitioner.demographics as any;
                          return demo?.date_of_birth || '1981-06-03';
                        })()}
                      </span>
                    </div>
                  )}
                  
                  {/* Field of License */}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Field of License</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {(() => {
                        if (practitioner.education) {
                          if (typeof practitioner.education === 'object' && practitioner.education.degree) {
                            return practitioner.education.degree;
                          }
                          if (typeof practitioner.education === 'string') {
                            return practitioner.education;
                          }
                        }
                        return 'Not specified';
                      })()}
                    </span>
                  </div>
                  
                  {/* Appointment Type */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Appointment Type</span>
                    <Badge className={`${getApplicationStatusColor(providerData?.application_type || '')}`}>
                      {providerData?.application_type || 'Not specified'}
                    </Badge>
                  </div>
                  
                  {/* Due Date */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Due Date</span>
                    <Badge className={`${getDueDateColor(providerData?.due_date)}`}>
                      {providerData?.due_date ? new Date(providerData.due_date).toLocaleDateString() : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Information</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Home Address */}
                  {practitioner.home_address && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Home Address</span>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          if (typeof practitioner.home_address === 'string') {
                            return practitioner.home_address;
                          }
                          if (typeof practitioner.home_address === 'object') {
                            const addr = practitioner.home_address as any;
                            const parts = [];
                            
                            if (addr.street || addr.address_line_1) parts.push(addr.street || addr.address_line_1);
                            if (addr.address_line_2) parts.push(addr.address_line_2);
                            
                            const cityStateZip = [];
                            if (addr.city) cityStateZip.push(addr.city);
                            if (addr.state) cityStateZip.push(addr.state);
                            if (addr.zip_code || addr.postal_code) cityStateZip.push(addr.zip_code || addr.postal_code);
                            
                            if (cityStateZip.length > 0) parts.push(cityStateZip.join(', '));
                            if (addr.country && addr.country !== 'US' && addr.country !== 'USA') parts.push(addr.country);
                            
                            return parts.length > 0 ? parts.join('\n') : JSON.stringify(practitioner.home_address);
                          }
                          return 'No address available';
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Mailing Address */}
                  {practitioner.mailing_address && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Mailing Address</span>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          if (typeof practitioner.mailing_address === 'string') {
                            return practitioner.mailing_address;
                          }
                          if (typeof practitioner.mailing_address === 'object') {
                            const addr = practitioner.mailing_address as any;
                            const parts = [];
                            
                            if (addr.street || addr.address_line_1) parts.push(addr.street || addr.address_line_1);
                            if (addr.address_line_2) parts.push(addr.address_line_2);
                            
                            const cityStateZip = [];
                            if (addr.city) cityStateZip.push(addr.city);
                            if (addr.state) cityStateZip.push(addr.state);
                            if (addr.zip_code || addr.postal_code) cityStateZip.push(addr.zip_code || addr.postal_code);
                            
                            if (cityStateZip.length > 0) parts.push(cityStateZip.join(', '));
                            if (addr.country && addr.country !== 'US' && addr.country !== 'USA') parts.push(addr.country);
                            
                            return parts.length > 0 ? parts.join('\n') : JSON.stringify(practitioner.mailing_address);
                          }
                          return 'No mailing address available';
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Other Names */}
                  {practitioner.other_names && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Other Names</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{practitioner.other_names}</span>
                    </div>
                  )}

                  {/* Created/Updated dates */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Created</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {practitioner.created_at ? new Date(practitioner.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-500 dark:text-gray-400">Updated</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {practitioner.updated_at ? new Date(practitioner.updated_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Education</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {practitioner.education && typeof practitioner.education === 'object' ? (
                    <>
                      {/* Degree */}
                      {practitioner.education.degree && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Degree</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {practitioner.education.degree}
                          </span>
                        </div>
                      )}
                      
                      {/* Medical School */}
                      {practitioner.education.medical_school && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Medical School</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {practitioner.education.medical_school}
                          </span>
                        </div>
                      )}
                      
                      {/* Graduation Year */}
                      {practitioner.education.graduation_year && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Graduation Year</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {practitioner.education.graduation_year}
                          </span>
                        </div>
                      )}
                    </>
                  ) : practitioner.education && typeof practitioner.education === 'string' ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Education</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {practitioner.education}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No education information available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right panel - Practice Locations */}
            <div className="flex-1 space-y-6">

                             {/* Practice Locations & Hospital Privileges */}
               <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                 <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                   <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Practice Locations & Hospital Privileges</h2>
                 </div>
                 
                 <div className="p-6">
                   <div className="text-center py-8">
                     <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                     <p className="text-gray-500 dark:text-gray-400">
                       Will appear here as verification steps are completed
                     </p>
                   </div>
                 </div>
               </div>

                             {/* License & Registration Overview */}
               <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                 <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                   <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">License & Registration Overview</h2>
                 </div>
                 
                 <div className="p-6">
                   <div className="text-center py-8">
                     <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                     <p className="text-gray-500 dark:text-gray-400">
                       Will appear here as verification steps are completed
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="verifications" className="mt-0" data-tab="verifications">
          <VerificationTabContent />
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Attestations</h3>
              <p className="text-gray-500 dark:text-gray-400">Provider attestation details.</p>
              <button
                onClick={handleShowAttestations}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                View Attestations
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Documents</h3>
              <p className="text-gray-500 dark:text-gray-400">Document management will be available here.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit-trail" className="mt-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Audit Trail</h3>
              <p className="text-gray-500 dark:text-gray-400">Audit trail information will be displayed here.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Attestations Dialog */}
      <Dialog open={showAttestationsDialog} onOpenChange={setShowAttestationsDialog}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Provider Attestations</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                {attestationsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                        <Skeleton className="h-5 w-48 mb-3" />
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="flex justify-between">
                              <Skeleton className="h-4 w-64" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : attestations.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No attestations found for this provider.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {attestations.map((attestation) => {
                      const groupedAttestations = groupAttestations(attestation);
                      
                      return (
                        <div key={attestation.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              Attestation #{attestation.id}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Created {attestation.created_at ? new Date(attestation.created_at).toLocaleDateString() : 'Unknown date'}
                            </p>
                          </div>
                          
                          <div className="p-4">
                            {Object.entries(groupedAttestations).map(([category, items]) => {
                              if (items.length === 0) return null;
                              
                              const isExpanded = expandedAttestationSections.has(`${attestation.id}-${category}`);
                              
                              const responsesCount = items.filter(({ value }) => {
                                const status = getAttestationStatus(value);
                                return status.hasResponse;
                              }).length;
                              
                              return (
                                <div key={category} className="mb-4">
                                  <button
                                    onClick={() => toggleAttestationSection(`${attestation.id}-${category}`)}
                                    className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{category}</span>
                                    <div className="flex items-center space-x-2">
                                      {responsesCount > 0 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                          {responsesCount} responses
                                        </span>
                                      )}
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </div>
                                  </button>
                                  
                                  {isExpanded && (
                                    <div className="mt-2 space-y-2">
                                      {items.map(({ key, value }) => (
                                        <div key={key} className="flex items-start justify-between p-3 bg-white dark:bg-gray-800">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                              {formatAttestationKey(key.replace(/^[^_]+_[^_]+_/, ''))}
                                            </p>
                                            {value.explanation && (
                                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {value.explanation}
                                              </p>
                                            )}
                                          </div>
                                          <div className="ml-4 flex items-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getAttestationStatus(value).color}`}>
                                              {value.response ? 'Yes' : 'No'}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                                 )}
               </div>
             </DialogContent>
         </Dialog>
      </div>
    </ProviderDetailClient>
  );
};

export default PractitionerDetail;