import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, User, Phone, Mail, Calendar, FileText, 
  CheckCircle, Clock, Download, Eye, Play, Loader,
  Building, Search, Plus, MoreVertical, Activity, X
} from 'lucide-react';
import { Worker, Viewer, DocumentLoadEvent } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { 
  highlightPlugin, 
  HighlightArea, 
  RenderHighlightsProps,
  MessageIcon 
} from '@react-pdf-viewer/highlight';


// Import required CSS
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import { useProviderStore } from '../../stores/providerStore';
import { getStepDetails, runVerificationStepSync } from '../../lib/providerApi';
import { StepDetailsResponse, SyncVerificationResponse } from '../../lib/types';

interface ProviderDetailDemoProps {
  onBack: () => void;
}

// AI Highlight interface - what the backend should provide
interface AIHighlight {
  id: string;
  quote: string;           // The text that was highlighted by AI
  analysis: string;        // AI analysis/reasoning for this highlight
  pageIndex?: number;      // Optional: if backend knows the page
}

// Frontend highlight state - combines AI data with calculated positions
interface ProcessedHighlight extends AIHighlight {
  highlightAreas: HighlightArea[];  // Calculated by frontend
  found: boolean;                   // Whether we found the text in PDF
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
);

// Loading skeleton for provider card
const ProviderSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 animate-pulse">
    <div className="flex items-start space-x-6">
      <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
      <div className="flex-1 grid grid-cols-4 gap-6">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function ProviderDetailDemo({ onBack }: ProviderDetailDemoProps) {
  // Hardcoded application ID as requested
  const applicationId = 19907;
  
  // Helper function to get highlight color - now using a default yellow color
  const getHighlightColor = () => {
    return { background: '#fde047', opacity: 0.3 }; // yellow
  };

  // Render highlights function
  const renderHighlights = (props: RenderHighlightsProps) => (
    <div>
      {processedHighlights.map((highlight) => (
        <div key={highlight.id}>
          {highlight.highlightAreas
            .filter((area) => area.pageIndex === props.pageIndex)
            .map((area, idx) => (
              <div
                key={`${highlight.id}-${idx}`}
                style={{
                  ...props.getCssProperties(area, props.rotation),
                  ...getHighlightColor(),
                  cursor: 'pointer',
                  border: selectedHighlight?.id === highlight.id ? '2px solid #fde047' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.6';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = getHighlightColor().opacity.toString();
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onClick={() => {
                  setSelectedHighlight(highlight);
                  // Open the sidebar to AI Highlights tab (index 3: thumbnails, bookmarks, attachments, AI highlights)
                  activateTab(3);
                  // Jump to highlight area if found
                  if (highlight.found && highlight.highlightAreas.length > 0) {
                    jumpToHighlightArea(highlight.highlightAreas[0]);
                  }
                }}
                title={`${highlight.quote} - ${highlight.analysis}`}
              />
            ))}
        </div>
      ))}
    </div>
  );

  // Create plugin instances inside the component  
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      ...defaultTabs,
      {
        content: (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold">AI Analysis Highlights</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {highlightsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-gray-500 text-sm mt-2">Analyzing document...</p>
                  </div>
                </div>
              ) : processedHighlights.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageIcon />
                  </div>
                  <p className="text-sm">No AI highlights available</p>
                  <p className="text-xs mt-1">Highlights will appear here when AI analysis is available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processedHighlights.map((highlight) => (
                    <div 
                      key={highlight.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedHighlight?.id === highlight.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedHighlight(highlight);
                        if (highlight.found && highlight.highlightAreas.length > 0) {
                          jumpToHighlightArea(highlight.highlightAreas[0]);
                        }
                      }}
                    >
                      {!highlight.found && (
                        <div className="mb-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            not found
                          </span>
                        </div>
                      )}
                      <blockquote className="text-sm font-medium text-gray-900 mb-2">
                        "{highlight.quote}"
                      </blockquote>
                      <p className="text-sm text-gray-600">{highlight.analysis}</p>
                      {highlight.found && highlight.highlightAreas.length > 0 && (
                        <p className="text-xs text-blue-600 mt-2">
                          Found {highlight.highlightAreas.length} occurrence{highlight.highlightAreas.length > 1 ? 's' : ''}
                        </p>
                      )}
                      
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ),
        icon: <MessageIcon />,
        title: 'AI Highlights'
      }
    ]
  });
  
  const highlightPluginInstance = highlightPlugin({
    renderHighlights
  });

  // Function to jump to a highlight area
  const { jumpToHighlightArea } = highlightPluginInstance;
  
  // Function to activate sidebar tab
  const { activateTab } = defaultLayoutPluginInstance;
  
  // Zustand store
  const {
    profileData,
    stepsData,
    documentsData,
    activityData,
    profileLoading,
    stepsLoading,
    documentsLoading,
    activityLoading,
    profileError,
    stepsError,
    documentsError,
    activityError,
    fetchProviderProfile,
    fetchVerificationSteps,
    fetchDocuments,
    fetchActivity,
    clearData
  } = useProviderStore();

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'verification' | 'history'>('overview');
  const [documentsView, setDocumentsView] = useState<'all' | 'provider-uploaded' | 'vera-pulled' | 'generated'>('all');
  const [searchDocuments, setSearchDocuments] = useState('');
  
  // Verification steps state
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>(null);
  const [stepDetails, setStepDetails] = useState<StepDetailsResponse | null>(null);
  const [stepDetailsLoading, setStepDetailsLoading] = useState(false);
  const [stepDetailsError, setStepDetailsError] = useState<string | null>(null);
  
  // Sync verification state
  const [runningSteps, setRunningSteps] = useState<Set<string>>(new Set());
  const [stepResults, setStepResults] = useState<Record<string, SyncVerificationResponse>>({});

  // Document viewer state (zoom and rotation handled by defaultLayoutPlugin)
  const [rightPanelTab, setRightPanelTab] = useState<'comments' | 'activity'>('comments');
  const [comment, setComment] = useState('');
  
  // AI Highlights state
  const [processedHighlights, setProcessedHighlights] = useState<ProcessedHighlight[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<ProcessedHighlight | null>(null);
  const [pdfDocument, setPdfDocument] = useState<{numPages: number; getPage: (pageNumber: number) => Promise<unknown>} | null>(null);
  const [highlightsLoading, setHighlightsLoading] = useState(false);

  // Helper function to get document URL from multiple possible locations
  const getDocumentUrl = (stepDetails: StepDetailsResponse | null): string | null => {
    if (!stepDetails?.execution_details) return null;
    
    const execDetails = stepDetails.execution_details;
    
    // Try multiple possible locations for the document URL
    // Order matters - check from most specific to most general
    return (
      execDetails.document_url ||
      execDetails.metadata?.document_url ||
      execDetails.response_data?.npdb_response?.document_url ||
      execDetails.response_data?.dea_response?.document_url ||
      execDetails.response_data?.npi_response?.document_url ||
      execDetails.response_data?.dca_response?.document_url ||
      execDetails.response_data?.abms_response?.document_url ||
      execDetails.response_data?.medicare_response?.document_url ||
      execDetails.response_data?.education_response?.document_url ||
      execDetails.response_data?.sanction_response?.document_url ||
      execDetails.response_data?.medical_response?.document_url ||
      execDetails.response_data?.hospital_response?.document_url ||
      execDetails.response_data?.ladmf_response?.document_url ||
      execDetails.response_data?.document_url ||
      null
    );
  };

  // Function to generate search variations for better matching
  const generateSearchVariations = useCallback((searchText: string): string[] => {
    const variations = [searchText]; // Always include original
    
    // Handle common formatting patterns
    if (searchText.includes('_')) {
      // Convert underscore to space: "action_date" -> "action date"
      variations.push(searchText.replace(/_/g, ' '));
      
      // Convert to title case: "action_date" -> "Action Date"
      const titleCase = searchText.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      variations.push(titleCase);
      
      // Add colon variations: "Action Date:" 
      variations.push(titleCase + ':');
    }
    
    // Handle date patterns like "action_date: 2021" 
    const colonMatch = searchText.match(/^(.+?):\s*(.+)$/);
    if (colonMatch) {
      const [, key, value] = colonMatch;
      // Try just the key part formatted properly
      const keyTitleCase = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      variations.push(keyTitleCase);
      variations.push(keyTitleCase + ':');
      
      // Try just the value part
      variations.push(value);
      
      // Try partial date matches if it looks like a date
      if (/^\d{4}$/.test(value)) {
        variations.push(value + '-'); // Start of date like "2021-"
      }
    }
    
    console.log(`Search variations for "${searchText}":`, variations);
    return variations;
  }, []);

  // Function to search for text in PDF and calculate highlight areas
  const findTextInPDF = useCallback(async (searchText: string): Promise<HighlightArea[]> => {
    if (!pdfDocument) return [];

    const highlightAreas: HighlightArea[] = [];
    const searchVariations = generateSearchVariations(searchText);

    try {
      // Search through all pages
      for (let pageIndex = 0; pageIndex < pdfDocument.numPages; pageIndex++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const page = await pdfDocument.getPage(pageIndex + 1) as any;
        const viewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent();

        // Search through text items
        let currentText = '';
        const textItems: Array<{str: string; transform: number[]; width: number; height: number}> = [];
        
        textContent.items.forEach((item: unknown) => {
          if (item && typeof item === 'object' && 'str' in item) {
            currentText += item.str + ' ';
            textItems.push(item as {str: string; transform: number[]; width: number; height: number});
          }
        });

        const currentTextLower = currentText.toLowerCase();
        
        // Try each search variation
        for (const variation of searchVariations) {
          const searchLower = variation.toLowerCase();
          let searchIndex = currentTextLower.indexOf(searchLower);

          while (searchIndex !== -1) {
            // Calculate character position in the text
            let charCount = 0;
            let startItem = -1;
            let endItem = -1;

            // Find which text items contain our search text
            for (let i = 0; i < textItems.length; i++) {
              const itemLength = textItems[i].str.length + 1; // +1 for space
              
              if (charCount <= searchIndex && charCount + itemLength > searchIndex) {
                startItem = i;
              }
              if (charCount <= searchIndex + variation.length && charCount + itemLength > searchIndex + variation.length) {
                endItem = i;
                break;
              }
              charCount += itemLength;
            }

            // Create highlight area if we found the text
            if (startItem !== -1 && endItem !== -1) {
              const startItemData = textItems[startItem];
              const endItemData = textItems[endItem] || startItemData;

              // Calculate bounding box
              const left = Math.min(startItemData.transform[4], endItemData.transform[4]);
              const right = Math.max(
                startItemData.transform[4] + startItemData.width,
                endItemData.transform[4] + endItemData.width
              );
              const bottom = Math.min(startItemData.transform[5], endItemData.transform[5]);
              const top = Math.max(
                startItemData.transform[5] + startItemData.height,
                endItemData.transform[5] + endItemData.height
              );

              // Convert to percentages
              const highlightArea: HighlightArea = {
                pageIndex,
                left: (left / viewport.width) * 100,
                top: ((viewport.height - top) / viewport.height) * 100,
                width: ((right - left) / viewport.width) * 100,
                height: ((top - bottom) / viewport.height) * 100
              };

              highlightAreas.push(highlightArea);
              console.log(`Found match for "${variation}" at position:`, highlightArea);
            }

            // Find next occurrence
            searchIndex = currentTextLower.indexOf(searchLower, searchIndex + 1);
          }
          
          // If we found matches with this variation, stop trying others
          if (highlightAreas.length > 0) {
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error searching text in PDF:', error);
    }

    return highlightAreas;
  }, [pdfDocument, generateSearchVariations]);

  // Handle PDF document load
  const handleDocumentLoad = (e: DocumentLoadEvent) => {
    setPdfDocument(e.doc);
  };

  // Helper function to extract highlights from step details
  const extractHighlightsFromStepDetails = useCallback((stepDetails: StepDetailsResponse): AIHighlight[] => {
    const highlights: AIHighlight[] = [];
    
    try {
      const execDetails = stepDetails.execution_details;
      
      if (!execDetails) {
        console.log('No execution details found');
        return highlights;
      }
      
      // Try to find highlights in various response data locations
      const possiblePaths = [
        // Direct response paths for different verification types
        execDetails.response_data?.npdb_response?.llm_analysis?.highlights,
        execDetails.response_data?.dea_response?.llm_analysis?.highlights,
        execDetails.response_data?.npi_response?.llm_analysis?.highlights,
        execDetails.response_data?.dca_response?.llm_analysis?.highlights,
        execDetails.response_data?.abms_response?.llm_analysis?.highlights,
        execDetails.response_data?.medicare_response?.llm_analysis?.highlights,
        execDetails.response_data?.education_response?.llm_analysis?.highlights,
        execDetails.response_data?.sanction_response?.llm_analysis?.highlights,
        execDetails.response_data?.medical_response?.llm_analysis?.highlights,
        execDetails.response_data?.hospital_response?.llm_analysis?.highlights,
        execDetails.response_data?.ladmf_response?.llm_analysis?.highlights,
        
        // Generic paths
        execDetails.response_data?.llm_analysis?.highlights,
        execDetails.metadata?.llm_analysis?.highlights,
        
        // Also check if llm_analysis is at the root level (with any cast for flexibility)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (execDetails as any).llm_analysis?.highlights
      ];
      
      for (let i = 0; i < possiblePaths.length; i++) {
        const path = possiblePaths[i];
        if (Array.isArray(path)) {
          console.log(`Found highlights at path index ${i}:`, path);
          highlights.push(...path);
          break; // Use the first valid highlights array found
        }
      }
      
      console.log(`Extracted ${highlights.length} highlights from step details`);
    } catch (error) {
      console.error('Error extracting highlights from step details:', error);
    }
    
    return highlights;
  }, []);

  // Process AI highlights when PDF document loads
  useEffect(() => {
    const processHighlights = async () => {
      if (!pdfDocument || !stepDetails || !getDocumentUrl(stepDetails)) return;

      setHighlightsLoading(true);
      console.log('Starting to process AI highlights...');

      try {
        // Extract highlights from real API response
        const apiHighlights = extractHighlightsFromStepDetails(stepDetails);
        
        console.log('Step details structure:', stepDetails);
        console.log('Extracted API highlights:', apiHighlights);
        
        if (apiHighlights.length === 0) {
          console.log('No highlights found in API response');
          setProcessedHighlights([]);
          return;
        }

        // Search for actual text positions in the PDF
        const processed: ProcessedHighlight[] = [];
        
        for (const highlight of apiHighlights) {
          console.log(`Searching for text: "${highlight.quote}"`);
          const highlightAreas = await findTextInPDF(highlight.quote);
          console.log(`Found ${highlightAreas.length} highlight areas for "${highlight.quote}"`);
          
          processed.push({
            ...highlight,
            highlightAreas,
            found: highlightAreas.length > 0
          });
        }
        
        setProcessedHighlights(processed);
        console.log('AI highlights processing completed:', processed);
      } catch (error) {
        console.error('Error processing highlights:', error);
      } finally {
        setHighlightsLoading(false);
      }
    };

    processHighlights();
  }, [pdfDocument, stepDetails, findTextInPDF, extractHighlightsFromStepDetails, generateSearchVariations]);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProviderProfile(applicationId);
    return () => clearData(); // Cleanup on unmount
  }, [applicationId, fetchProviderProfile, clearData]);

  // Fetch additional data based on active tab
  useEffect(() => {
    if (activeTab === 'verification' && !stepsData && !stepsLoading) {
      fetchVerificationSteps(applicationId);
    }
    if (activeTab === 'documents' && !documentsData && !documentsLoading) {
      fetchDocuments(applicationId);
    }
    if (activeTab === 'history' && !activityData && !activityLoading) {
      fetchActivity(applicationId);
    }
  }, [activeTab, applicationId, stepsData, documentsData, activityData, stepsLoading, documentsLoading, activityLoading, fetchVerificationSteps, fetchDocuments, fetchActivity]);

  // Helper function to check if a step has been processed
  const isStepProcessed = (stepKey: string) => {
    const step = stepsData?.steps.find(s => s.step_key === stepKey);
    // A step is processed if it's not pending - includes completed, approved, flagged, etc.
    return step?.status !== 'pending';
  };

  // Handler for running verification synchronously
  const handleRunVerification = async (stepKey: string) => {
    if (runningSteps.has(stepKey)) return;

    setRunningSteps(prev => new Set(prev).add(stepKey));
    
    try {
      const result = await runVerificationStepSync({
        application_id: applicationId,
        step_key: stepKey
      });
      
      setStepResults(prev => ({
        ...prev,
        [stepKey]: result
      }));
      
      // Refresh the verification steps to show updated status
      fetchVerificationSteps(applicationId);
      
      // Auto-select the step to show results
      setSelectedStepKey(stepKey);
      
    } catch (error) {
      console.error('Failed to run verification:', error);
      setStepDetailsError(`Failed to run verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRunningSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepKey);
        return newSet;
      });
    }
  };

  // Transform API data for UI display
  const provider = profileData ? {
    name: profileData.provider.name,
    specialty: 'Medical Professional',
    npi: profileData.provider.npi || 'N/A',
    email: 'contact@hospital.com', // Not available in API
    phone: '(555) 123-4567', // Not available in API
    assignedExaminer: 'Annie', // Not available in API
    dueDate: profileData.application.created_at,
    status: profileData.application.status,
    createdAt: profileData.application.created_at,
    completedSteps: profileData.verification_progress.completed_steps,
    totalSteps: profileData.verification_progress.total_steps
  } : null;

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'flagged': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDocumentIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf': return '📄';
      case 'json': return '📊';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📎';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'provider-uploaded': return 'bg-blue-50 border-blue-200';
      case 'vera-pulled': return 'bg-purple-50 border-purple-200';
      case 'generated': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'provider-uploaded': return { text: 'Provider Upload', color: 'bg-blue-100 text-blue-800' };
      case 'vera-pulled': return { text: 'Vera Pulled', color: 'bg-purple-100 text-purple-800' };
      case 'generated': return { text: 'AI Generated', color: 'bg-green-100 text-green-800' };
      default: return { text: 'Other', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Filter documents based on view and search
  const filteredDocuments = documentsData?.documents.filter(doc => {
    const matchesView = documentsView === 'all' || doc.category === documentsView;
    const matchesSearch = doc.name.toLowerCase().includes(searchDocuments.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchDocuments.toLowerCase());
    return matchesView && matchesSearch;
  }) || [];

  const progressPercentage = provider ? (provider.completedSteps / provider.totalSteps) * 100 : 0;

  // Show loading skeleton while profile is loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
          </div>
          <ProviderSkeleton />
        </div>
      </div>
    );
  }

  // Show error state
  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">Error loading provider data: {profileError}</p>
            <button 
              onClick={() => fetchProviderProfile(applicationId)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No provider data found for application ID {applicationId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
          <div className="text-sm text-gray-500">Application ID: {applicationId}</div>
        </div>

        {/* Provider Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            
            <div className="flex-1 grid grid-cols-4 gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{provider.name}</h2>
                <p className="text-lg text-gray-600">{provider.specialty}</p>
                <p className="text-sm text-gray-500">NPI: {provider.npi}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{provider.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{provider.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">General Hospital</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Examiner: {provider.assignedExaminer}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Due: {new Date(provider.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{documentsData?.documents.length || 0} Documents</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium rounded-full px-2 py-1 ${getStatusColor(provider.status)}`}>
                    {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Verification Progress</h3>
              <span className="text-sm text-gray-600">{provider.completedSteps}/{provider.totalSteps} Complete ({Math.round(progressPercentage)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'verification', label: 'Verification Steps', icon: CheckCircle },
                { id: 'history', label: 'Activity History', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'documents' | 'verification' | 'history')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Provider Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Full Name:</span>
                      <span className="text-sm text-gray-900">{provider.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">NPI Number:</span>
                      <span className="text-sm text-gray-900">{provider.npi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Medical School:</span>
                      <span className="text-sm text-gray-900">{profileData?.provider.education?.medical_school || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Application Date:</span>
                      <span className="text-sm text-gray-900">{new Date(provider.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Credentialing Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Assigned Examiner:</span>
                      <span className="text-sm text-gray-900">{provider.assignedExaminer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Due Date:</span>
                      <span className="text-sm text-gray-900">{new Date(provider.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Document Management</h3>
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      <Plus className="w-4 h-4" />
                      <span>Add Document</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                      <span>Download All</span>
                    </button>
                  </div>
                </div>

                {/* Document Filters */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchDocuments}
                      onChange={(e) => setSearchDocuments(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                  
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setDocumentsView('all')}
                      className={`px-3 py-2 text-sm ${documentsView === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      All ({documentsData?.documents.length || 0})
                    </button>
                    <button
                      onClick={() => setDocumentsView('provider-uploaded')}
                      className={`px-3 py-2 text-sm ${documentsView === 'provider-uploaded' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Provider ({documentsData?.documents.filter(d => d.category === 'provider-uploaded').length || 0})
                    </button>
                    <button
                      onClick={() => setDocumentsView('vera-pulled')}
                      className={`px-3 py-2 text-sm ${documentsView === 'vera-pulled' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Vera ({documentsData?.documents.filter(d => d.category === 'vera-pulled').length || 0})
                    </button>
                    <button
                      onClick={() => setDocumentsView('generated')}
                      className={`px-3 py-2 text-sm ${documentsView === 'generated' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Generated ({documentsData?.documents.filter(d => d.category === 'generated').length || 0})
                    </button>
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentsLoading ? (
                    <div className="col-span-full flex justify-center">
                      <LoadingSpinner />
                    </div>
                  ) : documentsError ? (
                    <div className="col-span-full text-center text-red-600">{documentsError}</div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500">No documents found matching your criteria.</div>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const categoryBadge = getCategoryBadge(doc.category);
                      return (
                        <div key={doc.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getCategoryColor(doc.category)}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getDocumentIcon(doc.format)}</span>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{doc.name}</h4>
                                <p className="text-xs text-gray-500">{doc.type}</p>
                              </div>
                            </div>
                            <button className="p-1 rounded hover:bg-white/50">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>

                          <div className="space-y-2 mb-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryBadge.color}`}>
                              {categoryBadge.text}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Generated: {new Date(doc.generated_at).toLocaleDateString()}</div>
                            <div>Size: {doc.size_estimate}</div>
                            <div>Step: {doc.step_key}</div>
                          </div>

                          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                            <button className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Verification Steps</h3>
                
                {stepsLoading ? (
                  <div className="flex justify-center">
                    <LoadingSpinner />
                  </div>
                ) : stepsError ? (
                  <div className="text-center text-red-600">{stepsError}</div>
                ) : stepsData?.steps.length === 0 ? (
                  <div className="text-center text-gray-500">No verification steps found.</div>
                ) : (
                  <div className="space-y-6">
                    {/* Horizontal Timeline */}
                    <div className="relative">
                      <div className="overflow-x-auto pb-4">
                        <div className="flex space-x-8 min-w-max px-4">
                          {stepsData?.steps.map((step, index) => {
                            const isSelected = selectedStepKey === step.step_key;
                            const isCompleted = step.status !== 'pending' && step.status !== 'in_progress';
                            const isPending = step.status === 'pending';
                            const isInProgress = step.status === 'in_progress';
                            const isRunning = runningSteps.has(step.step_key);
                            const hasBeenProcessed = isStepProcessed(step.step_key);
                            
                            return (
                              <div key={step.step_key} className="flex flex-col items-center relative">
                                {/* Connection Line */}
                                {index < stepsData.steps.length - 1 && (
                                  <div className="absolute top-6 left-full w-8 h-0.5 bg-gray-200 z-0">
                                    <div className={`h-full transition-all duration-500 ${
                                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                    }`} style={{ width: '100%' }}></div>
                                  </div>
                                )}
                                
                                {/* Step Circle */}
                                <button
                                  onClick={async () => {
                                    if (isRunning) return;
                                    
                                    if (selectedStepKey === step.step_key) {
                                      setSelectedStepKey(null);
                                      setStepDetails(null);
                                    } else {
                                      setSelectedStepKey(step.step_key);
                                      
                                      // Only fetch details if step has been processed
                                      if (hasBeenProcessed) {
                                        setStepDetailsLoading(true);
                                        setStepDetailsError(null);
                                        try {
                                          const details = await getStepDetails(applicationId, step.step_key);
                                          setStepDetails(details);
                                        } catch (error) {
                                          console.error('Failed to fetch step details:', error);
                                          setStepDetailsError('Failed to load step details');
                                        } finally {
                                          setStepDetailsLoading(false);
                                        }
                                      }
                                    }
                                  }}
                                  disabled={isRunning}
                                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 ${
                                    isRunning ? 'bg-blue-500 animate-pulse' :
                                    isCompleted ? 'bg-green-500 hover:bg-green-600' :
                                    isInProgress ? 'bg-blue-500 hover:bg-blue-600' :
                                    isPending ? 'bg-gray-300 hover:bg-gray-400' :
                                    'bg-gray-300 hover:bg-gray-400'
                                  } ${isSelected ? 'ring-4 ring-blue-200 scale-110' : 'hover:scale-105'} ${
                                    isRunning ? 'cursor-not-allowed' : 'cursor-pointer'
                                  }`}
                                >
                                  {isRunning ? (
                                    <Loader className="w-6 h-6 text-white animate-spin" />
                                  ) : (
                                    <CheckCircle className={`w-6 h-6 ${
                                      isCompleted ? 'text-white' :
                                      isInProgress ? 'text-white' :
                                      'text-gray-600'
                                    }`} />
                                  )}
                                </button>
                                
                                {/* Step Label */}
                                <div className="mt-2 text-center max-w-24">
                                  <div className="text-xs font-medium text-gray-900 leading-tight">{step.step_name}</div>
                                  <div className={`text-xs mt-1 ${
                                    isRunning ? 'text-blue-600' :
                                    isCompleted ? 'text-green-600' :
                                    isInProgress ? 'text-blue-600' :
                                    'text-gray-500'
                                  }`}>
                                    {isRunning ? 'Running...' : step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                                  </div>
                                  {step.decided_by && (
                                    <div className="text-xs text-gray-400 mt-1">by {step.decided_by}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Step Details */}
                    {selectedStepKey && (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {stepDetailsLoading ? (
                          <div className="p-8 text-center">
                            <LoadingSpinner />
                            <p className="text-gray-600 mt-2">Loading step details...</p>
                          </div>
                        ) : stepDetailsError ? (
                          <div className="p-8 text-center text-red-600">
                            <p>{stepDetailsError}</p>
                            <button 
                              onClick={async () => {
                                setStepDetailsLoading(true);
                                setStepDetailsError(null);
                                try {
                                  const details = await getStepDetails(applicationId, selectedStepKey);
                                  setStepDetails(details);
                                } catch {
                                  setStepDetailsError('Failed to load step details');
                                } finally {
                                  setStepDetailsLoading(false);
                                }
                              }}
                              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Retry
                            </button>
                          </div>
                        ) : !isStepProcessed(selectedStepKey) ? (
                          // Show action button for unprocessed steps
                          <div className="p-8 text-center">
                            <div className="mb-4">
                              <h4 className="text-lg font-medium text-gray-900 mb-2">
                                {stepsData?.steps.find(s => s.step_key === selectedStepKey)?.step_name}
                              </h4>
                              <p className="text-gray-600">This verification step hasn't been run yet.</p>
                            </div>
                            
                            <button
                              onClick={() => handleRunVerification(selectedStepKey)}
                              disabled={runningSteps.has(selectedStepKey)}
                              className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                runningSteps.has(selectedStepKey)
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {runningSteps.has(selectedStepKey) ? (
                                <>
                                  <Loader className="w-5 h-5 animate-spin" />
                                  <span>Running Verification...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-5 h-5" />
                                  <span>Run Verification</span>
                                </>
                              )}
                            </button>
                            
                            {stepResults[selectedStepKey] && (
                              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
                                <h5 className="font-medium text-green-900 mb-2">Verification Completed!</h5>
                                <div className="text-sm text-green-800">
                                  <p><strong>Status:</strong> {stepResults[selectedStepKey].status}</p>
                                  {Object.entries(stepResults[selectedStepKey].verification_results).map(([key, result]) => (
                                    <div key={key} className="mt-2">
                                      <p><strong>Decision:</strong> {result.decision}</p>
                                      {result.reasoning && (
                                        <p><strong>Reasoning:</strong> {result.reasoning}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Two-panel layout for processed steps
                          <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div>
                                  <h2 className="text-lg font-semibold text-gray-900">
                                    {stepDetails?.step_name || stepsData?.steps.find(s => s.step_key === selectedStepKey)?.step_name}
                                  </h2>
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    stepDetails?.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    stepDetails?.status === 'flagged' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {stepDetails?.status || 'Completed'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedStepKey(null);
                                  setStepDetails(null);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Main Content Area - Two Panel Layout */}
                            <div className="flex h-[600px]">
                              {/* Document Viewer - Left Panel */}
                              <div className="flex-1 min-h-full">
                                <div className="h-full bg-gray-100 flex flex-col">
                                  {/* Document Viewer Controls */}
                                  <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <span className="text-sm font-medium text-gray-700">
                                        {stepDetails?.step_name || 'Verification'} Document
                                      </span>

                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {getDocumentUrl(stepDetails) ? (
                                        <a
                                          href={getDocumentUrl(stepDetails)!}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                                        >
                                          <Download className="w-3 h-3" />
                                          <span>Download</span>
                                        </a>
                                      ) : (
                                        <span className="text-xs text-gray-500">No document available</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Document Viewer */}
                                  <div className="flex-1 overflow-auto p-4">
                                    {getDocumentUrl(stepDetails) ? (
                                      // Real PDF Viewer
                                      <div className="flex justify-center h-full">
                                        <div className="bg-white shadow-lg border border-gray-300 w-full max-w-4xl h-full">
                                          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                                            <Viewer 
                                              fileUrl={getDocumentUrl(stepDetails)!} 
                                              plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                                              onDocumentLoad={handleDocumentLoad}
                                            />
                                          </Worker>
                                        </div>
                                      </div>
                                    ) : (
                                      // No Document State
                                      <div className="flex justify-center h-full">
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <FileText className="w-12 h-12 text-gray-400" />
                                          </div>
                                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Available</h3>
                                          <p className="text-gray-600 max-w-md">
                                            No documents have been generated or uploaded for this verification step yet.
                                          </p>
                                          {stepDetails?.step_name && (
                                            <p className="text-sm text-gray-500 mt-2">
                                              Step: {stepDetails.step_name}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right Panel for Comments/Activity */}
                              <div className="w-96 border-l border-gray-200 bg-gray-50">
                                {/* Tab Navigation for Right Panel */}
                                <div className="flex border-b border-gray-200 bg-white">
                                  <button
                                    onClick={() => setRightPanelTab('comments')}
                                    className={`flex-1 px-3 py-3 text-sm font-medium ${
                                      rightPanelTab === 'comments'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                  >
                                    Comments
                                  </button>
                                  <button
                                    onClick={() => setRightPanelTab('activity')}
                                    className={`flex-1 px-3 py-3 text-sm font-medium ${
                                      rightPanelTab === 'activity'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                  >
                                    Activity
                                  </button>
                                </div>

                                {/* Tab Content */}
                                {rightPanelTab === 'comments' && (
                                  <div className="h-full flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                      {/* Vera's Analysis Comment */}
                                      <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                          <span className="text-xs font-medium text-purple-700">V</span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                            <h4 className="font-medium text-blue-900 mb-2">Vera's Analysis:</h4>
                                            {stepDetails?.result?.reasoning ? (
                                              <p className="text-sm text-blue-800">{stepDetails.result.reasoning}</p>
                                            ) : (
                                              <p className="text-sm text-blue-800">
                                                Verification completed successfully. All required criteria have been met 
                                                and the information has been validated against authoritative sources.
                                              </p>
                                            )}
                                            {stepDetails?.result?.decision && (
                                              <p className="text-sm text-blue-800 mt-2">
                                                <strong>Decision:</strong> {stepDetails.result.decision}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Execution Details as Comments */}
                                      {stepDetails?.execution_details && (
                                        <div className="flex items-start space-x-3">
                                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-700">S</span>
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-medium text-sm text-gray-900">System</span>
                                              <span className="text-xs text-gray-500">
                                                {new Date(stepDetails.execution_details.created_at).toLocaleString()}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                              Verification executed via {stepDetails.execution_details.invocation_type} by {stepDetails.execution_details.created_by}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Comment Input */}
                                    <div className="border-t border-gray-200 p-4">
                                      <div className="flex space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <span className="text-xs font-medium text-blue-700">U</span>
                                        </div>
                                        <div className="flex-1">
                                          <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows={2}
                                          />
                                          <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500">
                                              Use @username to mention someone
                                            </span>
                                            <button
                                              disabled={!comment.trim()}
                                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            >
                                              Post
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {rightPanelTab === 'activity' && (
                                  <div className="h-full overflow-y-auto p-4">
                                    <div className="space-y-4">
                                      {stepDetails?.activity_log && stepDetails.activity_log.length > 0 ? (
                                        stepDetails.activity_log.map((activity) => (
                                          <div key={activity.id} className="flex items-start space-x-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-medium text-sm text-gray-900">{activity.action}</span>
                                                <span className="text-xs text-gray-500">by {activity.actor_name || 'System'}</span>
                                              </div>
                                              {activity.notes && (
                                                <p className="text-sm text-gray-600">{activity.notes}</p>
                                              )}
                                              <span className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</span>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-center text-gray-500 text-sm">No activity recorded</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                              <div className="flex items-center justify-center space-x-4">
                                <button
                                  onClick={() => {
                                    setSelectedStepKey(null);
                                    setStepDetails(null);
                                  }}
                                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Activity History</h3>
                
                {activityLoading ? (
                  <div className="flex justify-center">
                    <LoadingSpinner />
                  </div>
                ) : activityError ? (
                  <div className="text-center text-red-600">{activityError}</div>
                ) : activityData?.activities.length === 0 ? (
                  <div className="text-center text-gray-500">No activity history found.</div>
                ) : (
                  <div className="space-y-4">
                                             {activityData?.activities.map((activity) => (
                           <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                            <span className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {activity.notes && (
                              <span className="text-xs text-gray-600">{activity.notes}</span>
                            )}
                            <span className="text-xs text-gray-500">
                              by {activity.actor?.name || 'System'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
} 