'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, 
  FileText, 
  Shield, 
  AlertTriangle, 
  MapPin,
  Mail,
  GraduationCap,
  Languages,
  ChevronDown,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { ApplicationsAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import type { 
  Practitioner, 
  ApplicationWithDetails, 
  Attestation, 
  AttestationResponse 
} from '@/types/applications';
import { Button } from '@/components/ui/button';
import { getApplicationStatusColor, getApplicationStatusIcon } from '@/lib/utils';
import Link from 'next/link';

const PractitionerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const providerId = parseInt(id || '0', 10);

  // State
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [attestationsLoading, setAttestationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAttestationsDialog, setShowAttestationsDialog] = useState(false);
  const [expandedAttestationSections, setExpandedAttestationSections] = useState<Set<string>>(new Set());

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
        const providerData = providerDetailsResult.data;
        const constructedPractitioner: Practitioner = {
          id: providerData.provider_id || providerId,
          first_name: providerData.practitioner_first_name || '',
          last_name: providerData.practitioner_last_name || null,
          middle_name: providerData.practitioner_middle_name || null,
          suffix: providerData.practitioner_suffix || null,
          education: providerData.practitioner_education || null,
          other_names: providerData.practitioner_other_names || null,
          home_address: providerData.practitioner_home_address || null,
          mailing_address: providerData.practitioner_mailing_address || null,
          ssn: providerData.practitioner_ssn || null,
          demographics: providerData.practitioner_demographics || null,
          languages: providerData.practitioner_languages || null,
          created_at: providerData.created_at || null,
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

  // Helper functions to parse JSON fields
  const parseDemographics = (demographics: any) => {
    if (!demographics) return null;
    if (typeof demographics === 'string') return demographics;
    
    const demo = demographics as any;
    const items = [];
    
    if (demo.gender) items.push(`Gender: ${demo.gender}`);
    if (demo.date_of_birth) items.push(`Date of Birth: ${demo.date_of_birth}`);
    if (demo.race) items.push(`Race: ${demo.race}`);
    if (demo.ethnicity) items.push(`Ethnicity: ${demo.ethnicity}`);
    if (demo.nationality) items.push(`Nationality: ${demo.nationality}`);
    if (demo.marital_status) items.push(`Marital Status: ${demo.marital_status}`);
    
    return items.length > 0 ? items : null;
  };

  const parseLanguages = (languages: any) => {
    if (!languages) return null;
    if (typeof languages === 'string') return [languages];
    
    if (Array.isArray(languages)) {
      return languages.map(lang => typeof lang === 'string' ? lang : lang.language || lang.name || JSON.stringify(lang));
    }
    
    if (typeof languages === 'object') {
      const lang = languages as any;
      if (lang.primary) return [lang.primary];
      if (lang.languages && Array.isArray(lang.languages)) return lang.languages;
      if (lang.language) return [lang.language];
      return [JSON.stringify(languages)];
    }
    
    return null;
  };

  const parseEducation = (education: any) => {
    if (!education) return null;
    if (typeof education === 'string') return education;
    
    if (Array.isArray(education)) {
      return education.map(edu => {
        if (typeof edu === 'string') return edu;
        const eduObj = edu as any;
        const parts = [];
        if (eduObj.degree) parts.push(eduObj.degree);
        if (eduObj.institution) parts.push(`from ${eduObj.institution}`);
        if (eduObj.graduation_year) parts.push(`(${eduObj.graduation_year})`);
        return parts.length > 0 ? parts.join(' ') : JSON.stringify(edu);
      });
    }
    
    if (typeof education === 'object') {
      const edu = education as any;
      const parts = [];
      if (edu.degree) parts.push(edu.degree);
      if (edu.institution) parts.push(`from ${edu.institution}`);
      if (edu.graduation_year) parts.push(`(${edu.graduation_year})`);
      if (edu.medical_school) parts.push(edu.medical_school);
      if (edu.residency) parts.push(`Residency: ${edu.residency}`);
      if (edu.fellowship) parts.push(`Fellowship: ${edu.fellowship}`);
      return parts.length > 0 ? parts.join(', ') : JSON.stringify(education);
    }
    
    return null;
  };

  const parseAddress = (address: any) => {
    if (!address) return null;
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      const addr = address as any;
      const parts = [];
      
      if (addr.street || addr.address_line_1) parts.push(addr.street || addr.address_line_1);
      if (addr.address_line_2) parts.push(addr.address_line_2);
      
      const cityStateZip = [];
      if (addr.city) cityStateZip.push(addr.city);
      if (addr.state) cityStateZip.push(addr.state);
      if (addr.zip_code || addr.postal_code) cityStateZip.push(addr.zip_code || addr.postal_code);
      
      if (cityStateZip.length > 0) parts.push(cityStateZip.join(', '));
      if (addr.country && addr.country !== 'US' && addr.country !== 'USA') parts.push(addr.country);
      
      return parts.length > 0 ? parts.join('\n') : JSON.stringify(address);
    }
    
    return null;
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
    <div className="space-y-6">
      <Link href="/providers">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Providers
        </Button>
      </Link>
      {/* Provider Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Provider Name & Status */}
            <div className="flex items-center space-x-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatName(practitioner)}
              </h1>
              {applications.length > 0 && (
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getApplicationStatusColor(applications[0].status || '')}`}>
                  {(() => {
                    const IconComponent = getApplicationStatusIcon(applications[0].status || '');
                    return <IconComponent className="w-4 h-4" />;
                  })()}
                  <span>{applications[0].status?.replace('_', ' ') || 'Unknown'}</span>
                </span>
              )}
            </div>
            
            {/* Provider ID, Sub header */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Provider ID</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{practitioner.id}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Latest Application</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {applications.length > 0 
                    ? new Date(applications[0].created_at).toLocaleDateString()
                    : 'None'
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">NPI Number</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {applications.find(app => app.npi_number)?.npi_number || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Attestations view & Avatar */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShowAttestations}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Attestations
            </button>
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Practitioner Details Sidebar */}
        <div className="lg:w-80 lg:flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Practitioner Details</span>
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</p>
                <p className="text-gray-900 dark:text-gray-100">{formatName(practitioner)}</p>
              </div>

              {practitioner.other_names && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Other Names</p>
                  <p className="text-gray-900 dark:text-gray-100">{practitioner.other_names}</p>
                </div>
              )}

              {practitioner.languages && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                    <Languages className="w-4 h-4" />
                    <span>Languages</span>
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(() => {
                      const parsedLangs = parseLanguages(practitioner.languages);
                      if (parsedLangs && Array.isArray(parsedLangs)) {
                        return (
                          <div className="flex flex-wrap gap-2">
                            {parsedLangs.map((lang, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs">
                                {lang}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      return parsedLangs || 'No language information available';
                    })()}
                  </div>
                </div>
              )}

              {practitioner.education && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>Education</span>
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(() => {
                      const parsedEdu = parseEducation(practitioner.education);
                      if (parsedEdu && Array.isArray(parsedEdu)) {
                        return (
                          <div className="space-y-2">
                            {parsedEdu.map((edu, index) => (
                              <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                                {edu}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">{parsedEdu || 'No education information available'}</div>;
                    })()}
                  </div>
                </div>
              )}

              {practitioner.home_address && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Home Address</span>
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(() => {
                      const parsedAddr = parseAddress(practitioner.home_address);
                      return (
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded whitespace-pre-line">
                          {parsedAddr || 'No home address available'}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {practitioner.mailing_address && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>Mailing Address</span>
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(() => {
                      const parsedAddr = parseAddress(practitioner.mailing_address);
                      return (
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded whitespace-pre-line">
                          {parsedAddr || 'No mailing address available'}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {practitioner.demographics && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="demographics">
                    <AccordionTrigger className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Demographics
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {(() => {
                          const parsedDemo = parseDemographics(practitioner.demographics);
                          if (parsedDemo && Array.isArray(parsedDemo)) {
                            return (
                              <div className="space-y-1">
                                {parsedDemo.map((item, index) => (
                                  <div key={index}>{item}</div>
                                ))}
                              </div>
                            );
                          }
                          return parsedDemo || 'No demographic information available';
                        })()}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

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
        </div>

        {/* Applications Section */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Applications</span>
              </h2>
            </div>
            
            <div className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No applications found for this provider.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            Application #{application.id}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Created {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border ${getApplicationStatusColor(application.status || '')}`}>
                          {(() => {
                            const IconComponent = getApplicationStatusIcon(application.status || '');
                            return <IconComponent className="w-4 h-4" />;
                          })()}
                          <span>{application.status?.replace('_', ' ') || 'Unknown'}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">NPI Number</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {application.npi_number || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">License Number</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {application.license_number || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">DEA Number</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {application.dea_number || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      {application.work_history && application.work_history.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work History</p>
                          <div className="space-y-2">
                            {application.work_history.slice(0, 2).map((work, index) => (
                              <div key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                <p className="font-medium">{work.position} at {work.organization}</p>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {work.start_date} - {work.end_date || 'Present'}
                                </p>
                              </div>
                            ))}
                            {application.work_history.length > 2 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                +{application.work_history.length - 2} more positions
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {application.malpractice_insurance && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Malpractice Insurance</p>
                          <div className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <p><span className="font-medium">Carrier:</span> {application.malpractice_insurance.carrier}</p>
                            <p><span className="font-medium">Policy:</span> {application.malpractice_insurance.policy_number}</p>
                            <p><span className="font-medium">Coverage:</span> {application.malpractice_insurance.coverage_start} - {application.malpractice_insurance.coverage_end}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


      </div>

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
  );
};

export default PractitionerDetail;