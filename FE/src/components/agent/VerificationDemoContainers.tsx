'use client';

import React from 'react';
import { Shield, CheckCircle, Clock, AlertTriangle, Upload, FileText, X, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DocumentPreview, createDocumentFromData, type DocumentType } from '@/components/ui/document-preview';
import { DocumentPreviewDemo } from './DocumentPreviewDemo';

export function VerificationDemoContainers() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        AI Agent Demo - Verification Containers
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* NPDB Container */}
        <div
          data-verification="npdb"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">NPDB Check</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            National Practitioner Data Bank verification for malpractice and disciplinary history.
          </p>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-600">Pending Verification</span>
          </div>
        </div>

        {/* OIG Container */}
        <div
          data-verification="oig"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">OIG Exclusions</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Office of Inspector General exclusions list verification.
          </p>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-600">Pending Verification</span>
          </div>
        </div>

        {/* License Container */}
        <div
          data-verification="license"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">License Verification</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            State medical license verification and status check.
          </p>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600">Verified</span>
          </div>
        </div>
      </div>

      {/* Select Demo Section */}
      <SelectDemoSection />

      {/* Input Demo Section */}
      <InputDemoSection />

      {/* File Upload Demo Section */}
      <FileUploadDemoSection />

      {/* Document Preview Demo Section */}
      <DocumentPreviewDemo />

      {/* Agent Control Panel */}
      <AgentControlPanel />
    </div>
  );
}

function SelectDemoSection() {
  const [selectedValue, setSelectedValue] = React.useState<string>('');

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
        <span className="mr-2">📋</span>
        Select Component Demo
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test AI agent interaction with select dropdowns. The agent can click to open and select specific values.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Priority
          </label>
          <Select 
            value={selectedValue} 
            onValueChange={setSelectedValue}
            data-testid="priority-select"
          >
            <SelectTrigger 
              className="w-48"
              data-select-trigger="priority"
            >
              <SelectValue placeholder="Select priority level" />
            </SelectTrigger>
            <SelectContent data-select-content="priority">
              <SelectItem 
                value="high" 
                data-select-item="high"
              >
                High Priority
              </SelectItem>
              <SelectItem 
                value="medium" 
                data-select-item="medium"
              >
                Medium Priority
              </SelectItem>
              <SelectItem 
                value="low" 
                data-select-item="low"
              >
                Low Priority
              </SelectItem>
              <SelectItem 
                value="urgent" 
                data-select-item="urgent"
              >
                Urgent
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Status
          </label>
          <Select data-testid="status-select">
            <SelectTrigger 
              className="w-48"
              data-select-trigger="status"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent data-select-content="status">
              <SelectItem 
                value="pending" 
                data-select-item="pending"
              >
                Pending Review
              </SelectItem>
              <SelectItem 
                value="in-progress" 
                data-select-item="in-progress"
              >
                In Progress
              </SelectItem>
              <SelectItem 
                value="completed" 
                data-select-item="completed"
              >
                Completed
              </SelectItem>
              <SelectItem 
                value="failed" 
                data-select-item="failed"
              >
                Failed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedValue && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Selected Priority: <strong>{selectedValue}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InputDemoSection() {
  const [nameValue, setNameValue] = React.useState<string>('');
  const [emailValue, setEmailValue] = React.useState<string>('');
  const [licenseValue, setLicenseValue] = React.useState<string>('');

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
        <span className="mr-2">📝</span>
        Input Component Demo
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test AI agent interaction with input fields. The agent can focus, clear, and type text into various input types.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Practitioner Name
          </label>
          <Input
            type="text"
            placeholder="Enter full name"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            className="w-64"
            data-input-field="practitioner-name"
            data-testid="name-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="practitioner@hospital.com"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            className="w-64"
            data-input-field="email"
            data-testid="email-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            License Number
          </label>
          <Input
            type="text"
            placeholder="Enter license number"
            value={licenseValue}
            onChange={(e) => setLicenseValue(e.target.value)}
            className="w-64"
            data-input-field="license-number"
            data-testid="license-input"
          />
        </div>

        {(nameValue || emailValue || licenseValue) && (
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-700">
            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">
              Current Input Values:
            </p>
            {nameValue && (
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Name: <strong>{nameValue}</strong>
              </p>
            )}
            {emailValue && (
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Email: <strong>{emailValue}</strong>
              </p>
            )}
            {licenseValue && (
              <p className="text-sm text-purple-600 dark:text-purple-400">
                License: <strong>{licenseValue}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FileUploadDemoSection() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewDocument, setPreviewDocument] = React.useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      
      // Simulate upload processing and document parsing
      setTimeout(() => {
        setUploadedFile(file);
        setIsUploading(false);
        
        // Simulate creating a structured document from the uploaded file
        const mockDocument = createMockDocumentFromFile(file);
        setPreviewDocument(mockDocument);
      }, 1500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const handleAccept = () => {
    setIsDialogOpen(false);
    setUploadedFile(null);
    setIsUploading(false);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setUploadedFile(null);
    setIsUploading(false);
    setPreviewDocument(null);
  };

  const handlePreviewClick = () => {
    if (previewDocument) {
      setIsPreviewOpen(true);
    }
  };

  // Mock function to simulate parsing uploaded files into structured documents
  const createMockDocumentFromFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    let documentType: DocumentType = 'generic';
    let mockApiData: any = {};

    // Determine document type based on filename patterns
    if (fileName.includes('dea') || fileName.includes('drug')) {
      documentType = 'dea';
      mockApiData = {
        id: `dea_${Date.now()}`,
        deaNumber: 'BD1234567',
        practitionerName: 'Dr. Sarah Johnson',
        businessActivity: ['Practitioner', 'Researcher'],
        schedules: ['Schedule II', 'Schedule III', 'Schedule IV', 'Schedule V'],
        expirationDate: new Date('2025-12-31'),
        issueDate: new Date('2022-01-01'),
        address: {
          street: '123 Medical Center Dr',
          city: 'Healthcare City',
          state: 'CA',
          zipCode: '90210'
        },
        status: 'verified'
      };
    } else if (fileName.includes('npdb') || fileName.includes('malpractice')) {
      documentType = 'npdb';
      mockApiData = {
        id: `npdb_${Date.now()}`,
        practitionerName: 'Dr. Sarah Johnson',
        licenseNumber: 'MD123456',
        reportDate: new Date('2023-06-15'),
        reportType: 'malpractice',
        description: 'Medical malpractice settlement related to surgical procedure complications. Patient alleged improper post-operative care resulting in extended recovery time.',
        amount: 150000,
        state: 'California',
        specialty: 'General Surgery',
        status: 'verified'
      };
    } else if (fileName.includes('oig') || fileName.includes('exclusion')) {
      documentType = 'oig';
      mockApiData = {
        id: `oig_${Date.now()}`,
        practitionerName: 'Dr. Sarah Johnson',
        exclusionType: 'Conviction of a program-related crime',
        exclusionDate: new Date('2020-03-15'),
        waiverDate: new Date('2023-03-15'),
        specialty: 'Internal Medicine',
        excludingAgency: 'OIG-HHS',
        reason: 'Conviction for healthcare fraud involving false billing practices',
        status: 'verified'
      };
    } else if (fileName.includes('license') || fileName.includes('medical')) {
      documentType = 'license';
      mockApiData = {
        id: `license_${Date.now()}`,
        licenseNumber: 'MD789123',
        practitionerName: 'Dr. Sarah Johnson',
        licenseType: 'Physician and Surgeon',
        issueDate: new Date('2015-07-01'),
        expirationDate: new Date('2025-07-31'),
        state: 'California',
        specialty: 'Internal Medicine',
        restrictions: [],
        status: 'verified'
      };
    } else {
      // Generic document
      mockApiData = {
        id: `generic_${Date.now()}`,
        content: 'This is a simulated document preview. In a real implementation, this would contain the parsed content from the uploaded file.',
        metadata: {
          uploadedBy: 'Agent Demo',
          processingTime: '1.5s',
          fileType: file.type || 'unknown'
        }
      };
    }

    return createDocumentFromData(documentType, file.name, mockApiData, file.size);
  };

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
        <span className="mr-2">📁</span>
        File Upload Dialog Demo
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test AI agent interaction with file upload dialogs. The agent can open the dialog, simulate file uploads, and interact with dialog buttons.
      </p>
      
      <div className="space-y-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex items-center gap-2"
              data-upload-trigger="verification-documents"
              data-testid="upload-trigger"
            >
              <Upload className="w-4 h-4" />
              Upload Verification Documents
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md" data-slot="dialog-content">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload verification documents for processing. Accepted formats: PDF, DOC, DOCX, JPG, PNG.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {!uploadedFile && !isUploading && (
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  data-upload-zone="true"
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Drop files here or click to browse
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileInputChange}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Choose files
                  </label>
                </div>
              )}

              {isUploading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Processing upload...
                  </p>
                </div>
              )}

              {uploadedFile && !isUploading && (
                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || 'Unknown type'}
                      </p>
                      {previewDocument && (
                        <p className="text-xs text-green-500 dark:text-green-300 mt-1">
                          Parsed as {previewDocument.type.toUpperCase()} document
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {previewDocument && (
                        <button
                          onClick={handlePreviewClick}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          title="Preview document"
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setPreviewDocument(null);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancel}
                data-dialog-action="cancel"
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!uploadedFile}
                data-dialog-action="accept"
                data-testid="accept-button"
              >
                Accept
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>📋 Demo supports: PDF, DOC, DOCX, JPG, PNG files</p>
          <p>🤖 Agent will simulate file upload and click Accept automatically</p>
          <p>👁️ Click "Preview" to see structured document templates</p>
        </div>
      </div>

      {/* Document Preview Dialog */}
      <DocumentPreview
        document={previewDocument}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onDownload={(doc) => {
          console.log('Download document:', doc);
          // In a real implementation, this would trigger a download
        }}
      />
    </div>
  );
}

function AgentControlPanel() {
  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
        <span className="mr-2">🤖</span>
        AI Agent Demo Controls
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The AI agent automatically tracks verification elements and positions its cursor accurately using viewport snapshots.
      </p>
      
      <div className="flex flex-wrap gap-2">
        <AgentDemoButton
          action="demo"
          label="Start Demo"
          description="Basic mouse movement demonstration"
        />
        <AgentDemoButton
          action="verification"
          label="Verification Demo"
          description="Click through verification containers"
        />
        <ViewportSnapshotButton />
        <ElementTrackingButton />
        <VisualAlignmentTestButton />
        <MoveToElementButton elementId="npdb" label="Move to NPDB" />
        <MoveToElementButton elementId="oig" label="Move to OIG" />
        <MoveToElementButton elementId="license" label="Move to License" />
        <SelectDemoButton />
        <StatusSelectDemoButton />
        <InputDemoButton />
        <EmailInputDemoButton />
        <LicenseInputDemoButton />
        <FileUploadDemoButton />
        <CertificateUploadDemoButton />
        <CancelUploadDemoButton />
        <SmoothClickDemoButton />
        <SmoothHoverDemoButton />
        <ActionThoughtTestButton />
        <AgentStopButton />
      </div>
    </div>
  );
}

interface AgentDemoButtonProps {
  action: 'demo' | 'verification';
  label: string;
  description: string;
}

function AgentDemoButton({ action, label, description }: AgentDemoButtonProps) {
  const handleClick = () => {
    console.log(`Starting ${action} demo`);
    
    // Start the agent and add appropriate thoughts
    import('@/stores/agentStore').then(({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // Start the agent
      store.startAgent();
      
      if (action === 'verification') {
        // Add ACTION thought for verification demo
        store.addThought({
          message: 'Starting verification workflow...',
          type: 'action',
        });
        
        // Simulate a verification sequence with different thought types
        setTimeout(() => {
          store.addThought({
            message: 'Analyzing verification containers...',
            type: 'thinking',
          });
        }, 2000);
        
        setTimeout(() => {
          store.addThought({
            message: 'Clicking on NPDB verification...',
            type: 'action',
          });
        }, 4000);
        
        setTimeout(() => {
          store.addThought({
            message: 'NPDB verification completed successfully',
            type: 'result',
          });
        }, 6000);
        
      } else {
        // Basic demo
        store.addThought({
          message: 'Demonstrating cursor movement...',
          type: 'thinking',
        });
      }
    });
    
    // Also trigger the custom event for any other listeners
    window.dispatchEvent(new CustomEvent('agent-demo', { 
      detail: { action } 
    }));
  };

  return (
    <button
      onClick={handleClick}
      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      title={description}
    >
      {label}
    </button>
  );
}

function ViewportSnapshotButton() {
  const handleViewportSnapshot = () => {
    console.log('=== VIEWPORT SNAPSHOT ===');
    
    // Use the new agent store viewport tracking
    import('@/stores/agentStore').then(({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // Take a viewport snapshot
      store.snapshotViewport();
      
      // Track all verification elements
      store.trackElements([
        '[data-verification="npdb"]',
        '[data-verification="oig"]',
        '[data-verification="license"]'
      ]);
      
      console.log('Viewport snapshot complete. Check console for tracking results.');
    });
  };

  return (
    <button
      onClick={handleViewportSnapshot}
      className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
      title="Take viewport snapshot and track elements"
    >
      📸 Snapshot
    </button>
  );
}

function ElementTrackingButton() {
  const handleElementTracking = () => {
    console.log('=== ELEMENT TRACKING ===');
    
    // Use the new agent store to display tracked element info
    import('@/stores/agentStore').then(({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // First ensure we have tracked elements
      store.trackElements([
        '[data-verification="npdb"]',
        '[data-verification="oig"]',
        '[data-verification="license"]'
      ]);
      
      // Log all tracked elements
      const trackedElements = store.trackedElements;
      const availableTargets = store.availableTargets;
      
      console.log('Tracked Elements:', trackedElements);
      console.log('Available Targets:', availableTargets);
      
      // Show viewport info
      console.log('Viewport Info:', store.viewportInfo);
    });
  };

  return (
    <button
      onClick={handleElementTracking}
      className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
      title="Show tracked element information"
    >
      🎯 Track Elements
    </button>
  );
}

function VisualAlignmentTestButton() {
  const handleVisualAlignmentTest = () => {
    console.log('=== VISUAL ALIGNMENT TEST ===');
    
    // Test alignment on OIG element since that's what user is testing
    const element = document.querySelector('[data-verification="oig"]');
    if (element) {
      const rect = element.getBoundingClientRect();
      const calculatedCenter = {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
      
      console.log('OIG Element Analysis:', {
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        calculatedCenter,
        cursorTipPosition: {
          x: calculatedCenter.x - 4, // Accounting for our -4px transform
          y: calculatedCenter.y - 4,
        }
      });
      
      // Create visual markers for debugging
      const markers = [
        { id: 'center-marker', pos: calculatedCenter, color: 'red', label: 'Calculated Center' },
        { id: 'cursor-tip-marker', pos: { x: calculatedCenter.x - 4, y: calculatedCenter.y - 4 }, color: 'blue', label: 'Cursor Tip Target' },
      ];
      
      // Remove existing markers
      markers.forEach(m => {
        const existing = document.getElementById(m.id);
        if (existing) existing.remove();
      });
      
      // Add new markers
      markers.forEach(marker => {
        const markerEl = document.createElement('div');
        markerEl.id = marker.id;
        markerEl.style.position = 'fixed';
        markerEl.style.left = marker.pos.x + 'px';
        markerEl.style.top = marker.pos.y + 'px';
        markerEl.style.width = '8px';
        markerEl.style.height = '8px';
        markerEl.style.backgroundColor = marker.color;
        markerEl.style.border = '2px solid white';
        markerEl.style.borderRadius = '50%';
        markerEl.style.transform = 'translate(-50%, -50%)';
        markerEl.style.zIndex = '100002';
        markerEl.style.pointerEvents = 'none';
        markerEl.title = marker.label;
        
        document.body.appendChild(markerEl);
      });
      
      // Position the cursor at the calculated center
      import('@/stores/agentStore').then(({ useAgentStore }) => {
        const store = useAgentStore.getState();
        store.updateMousePosition(calculatedCenter);
        store.showMouse();
        
        console.log('Cursor positioned at calculated center. Red dot = element center, Blue dot = where cursor tip should be.');
      });
      
      // Remove markers after 8 seconds
      setTimeout(() => {
        markers.forEach(m => {
          const markerToRemove = document.getElementById(m.id);
          if (markerToRemove) markerToRemove.remove();
        });
      }, 8000);
    }
  };

  return (
    <button
      onClick={handleVisualAlignmentTest}
      className="px-3 py-2 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 transition-colors"
      title="Test visual alignment with markers"
    >
      🎯 Visual Test
    </button>
  );
}

function MoveToElementButton({ elementId, label }: { elementId: string; label: string }) {
  const handleMoveToElement = async () => {
    console.log(`=== MOVING TO ${label} ===`);
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: `Demonstrating movement to ${label} with viewport-aware scrolling...`,
      type: 'thinking',
    });

    // Use the new moveToElement primitive with viewport-aware scrolling
    const success = await uiPrimitives.moveToElement({
      selector: `[data-verification="${elementId}"]`,
      description: `${label} verification container`,
      moveDuration: 1200
    });

    if (success) {
      console.log(`✅ Successfully moved to ${label}`);
    } else {
      console.log(`❌ Failed to move to ${label}`);
    }
  };

  return (
    <button
      onClick={handleMoveToElement}
      className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
      title={`Move to ${label}`}
    >
      {label}
    </button>
  );
}

function SelectDemoButton() {
  const handleSelectDemo = async () => {
    console.log('=== SELECT DEMO WITH PRIMITIVES ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating select interaction with smooth movement...',
      type: 'thinking',
    });

    // Use the reusable select primitive
    const success = await uiPrimitives.selectOption({
      selectTriggerSelector: '[data-select-trigger="priority"]',
      optionSelector: '[data-select-item="high"]',
      description: 'Priority Level',
      moveDuration: 1000,
      clickDelay: 300,
      optionWaitDelay: 1200
    });

    if (success) {
      console.log('✅ Select demo completed successfully');
    } else {
      console.log('❌ Select demo failed');
    }
  };

  return (
    <button
      onClick={handleSelectDemo}
      className="px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
      title="Demo select interaction using reusable primitives with smooth movement"
    >
      📋 Select Demo
    </button>
  );
}

function StatusSelectDemoButton() {
  const handleStatusSelectDemo = async () => {
    console.log('=== STATUS SELECT DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating status select interaction...',
      type: 'thinking',
    });

    // Use the reusable select primitive on the status select
    const success = await uiPrimitives.selectOption({
      selectTriggerSelector: '[data-select-trigger="status"]',
      optionSelector: '[data-select-item="completed"]',
      description: 'Verification Status',
      moveDuration: 900,
      clickDelay: 250,
      optionWaitDelay: 1000
    });

    if (success) {
      console.log('✅ Status select demo completed successfully');
    } else {
      console.log('❌ Status select demo failed');
    }
  };

  return (
    <button
      onClick={handleStatusSelectDemo}
      className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
      title="Demo status select interaction - selects 'Completed' option"
    >
      ✅ Status Select
    </button>
  );
}

function SmoothClickDemoButton() {
  const handleSmoothClickDemo = async () => {
    console.log('=== SMOOTH CLICK DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating smooth click interaction...',
      type: 'thinking',
    });

    // Use the reusable click primitive on the NPDB container
    const success = await uiPrimitives.smoothClick({
      selector: '[data-verification="npdb"]',
      description: 'NPDB verification container',
      moveDuration: 1200,
      clickDelay: 400
    });

    if (success) {
      console.log('✅ Smooth click demo completed successfully');
    } else {
      console.log('❌ Smooth click demo failed');
    }
  };

  return (
    <button
      onClick={handleSmoothClickDemo}
      className="px-3 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors"
      title="Demo smooth click interaction with visual feedback"
    >
      🖱️ Smooth Click
    </button>
  );
}

function SmoothHoverDemoButton() {
  const handleSmoothHoverDemo = async () => {
    console.log('=== SMOOTH HOVER DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating smooth hover interaction...',
      type: 'thinking',
    });

    // Use the reusable hover primitive on the OIG container
    const success = await uiPrimitives.smoothHover({
      selector: '[data-verification="oig"]',
      description: 'OIG verification container',
      moveDuration: 1000
    });

    if (success) {
      console.log('✅ Smooth hover demo completed successfully');
      
      // Add a follow-up thought showing the hover is complete
      store.addThought({
        message: 'Hover interaction complete - you should see hover effects',
        type: 'result',
      });
    } else {
      console.log('❌ Smooth hover demo failed');
    }
  };

  return (
    <button
      onClick={handleSmoothHoverDemo}
      className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
      title="Demo smooth hover interaction with mouse events"
    >
      👆 Smooth Hover
    </button>
  );
}

function ActionThoughtTestButton() {
  const handleActionTest = () => {
    console.log('=== TESTING ACTION THOUGHT WITH MOVING BORDER ===');
    
    import('@/stores/agentStore').then(({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // Start the agent and show mouse
      store.startAgent();
      
      // Add an ACTION thought to trigger the moving border
      store.addThought({
        message: 'Clicking verification container...',
        type: 'action',
      });
      
      // Position cursor at center of screen for demo
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      store.updateMousePosition({ x: centerX, y: centerY });
      
      console.log('ACTION thought added - you should see the moving border around the cursor!');
      
      // Clear the thought after 5 seconds
      setTimeout(() => {
        store.setCurrentThought(null);
      }, 5000);
    });
  };

  return (
    <button
      onClick={handleActionTest}
      className="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
      title="Test ACTION thought with moving border"
    >
      🔥 Action Test
    </button>
  );
}

function InputDemoButton() {
  const handleInputDemo = async () => {
    console.log('=== NAME INPUT DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating name input interaction...',
      type: 'thinking',
    });

    // Use the fillInput primitive to interact with the name input
    const success = await uiPrimitives.fillInput({
      inputSelector: '[data-input-field="practitioner-name"]',
      text: 'Dr. Sarah Johnson',
      description: 'Practitioner Name field',
      typingSpeed: 80,
      clearFirst: true
    });

    if (success) {
      console.log('✅ Name input demo completed successfully');
    } else {
      console.log('❌ Name input demo failed');
    }
  };

  return (
    <button
      onClick={handleInputDemo}
      className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
      title="Demo filling the name input field"
    >
      📝 Name Input
    </button>
  );
}

function EmailInputDemoButton() {
  const handleEmailDemo = async () => {
    console.log('=== EMAIL INPUT DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating email input interaction...',
      type: 'thinking',
    });

    // Use the fillInput primitive to interact with the email input
    const success = await uiPrimitives.fillInput({
      inputSelector: '[data-input-field="email"]',
      text: 'sarah.johnson@medicenter.com',
      description: 'Email Address field',
      typingSpeed: 60,
      clearFirst: true
    });

    if (success) {
      console.log('✅ Email input demo completed successfully');
    } else {
      console.log('❌ Email input demo failed');
    }
  };

  return (
    <button
      onClick={handleEmailDemo}
      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      title="Demo filling the email input field"
    >
      📧 Email Input
    </button>
  );
}

function LicenseInputDemoButton() {
  const handleLicenseDemo = async () => {
    console.log('=== LICENSE INPUT DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating license input interaction...',
      type: 'thinking',
    });

    // Use the fillInput primitive to interact with the license input
    const success = await uiPrimitives.fillInput({
      inputSelector: '[data-input-field="license-number"]',
      text: 'MD-2024-789456',
      description: 'License Number field',
      typingSpeed: 90,
      clearFirst: true
    });

    if (success) {
      console.log('✅ License input demo completed successfully');
    } else {
      console.log('❌ License input demo failed');
    }
  };

  return (
    <button
      onClick={handleLicenseDemo}
      className="px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
      title="Demo filling the license number input field"
    >
      🏥 License Input
    </button>
  );
}

function FileUploadDemoButton() {
  const handleFileUploadDemo = async () => {
    console.log('=== FILE UPLOAD DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating file upload dialog interaction...',
      type: 'thinking',
    });

    // Use the uploadFile primitive to handle the complete flow
    const success = await uiPrimitives.uploadFile({
      uploadTriggerSelector: '[data-upload-trigger="verification-documents"]',
      fileName: 'medical-license.pdf',
      fileType: 'application/pdf',
      acceptButtonSelector: '[data-dialog-action="accept"]',
      description: 'Verification Documents Upload',
      moveDuration: 900,
      clickDelay: 300,
      uploadDelay: 2500,
      dialogWaitDelay: 1200
    });

    if (success) {
      console.log('✅ File upload demo completed successfully');
    } else {
      console.log('❌ File upload demo failed');
    }
  };

  return (
    <button
      onClick={handleFileUploadDemo}
      className="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
      title="Demo complete file upload dialog flow"
    >
      📁 Upload Demo
    </button>
  );
}

function CertificateUploadDemoButton() {
  const handleCertificateUploadDemo = async () => {
    console.log('=== CERTIFICATE UPLOAD DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating certificate upload with image file...',
      type: 'thinking',
    });

    // Use the uploadFile primitive with a different file type
    const success = await uiPrimitives.uploadFile({
      uploadTriggerSelector: '[data-upload-trigger="verification-documents"]',
      fileName: 'board-certification.jpg',
      fileType: 'image/jpeg',
      acceptButtonSelector: '[data-dialog-action="accept"]',
      description: 'Board Certification Upload',
      moveDuration: 800,
      clickDelay: 250,
      uploadDelay: 3000, // Slightly longer for image processing
      dialogWaitDelay: 1000
    });

    if (success) {
      console.log('✅ Certificate upload demo completed successfully');
    } else {
      console.log('❌ Certificate upload demo failed');
    }
  };

  return (
    <button
      onClick={handleCertificateUploadDemo}
      className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
      title="Demo certificate image upload"
    >
      🏆 Certificate Upload
    </button>
  );
}

function CancelUploadDemoButton() {
  const handleCancelUploadDemo = async () => {
    console.log('=== CANCEL UPLOAD DEMO ===');
    
    // Import the UI primitives
    const { uiPrimitives } = await import('@/lib/agent/UIInteractionPrimitives');
    const { useAgentStore } = await import('@/stores/agentStore');
    
    const store = useAgentStore.getState();
    
    // Start the agent
    store.startAgent();
    
    // Add initial thinking thought
    store.addThought({
      message: 'Demonstrating dialog cancellation...',
      type: 'thinking',
    });

    // First open the dialog
    const openSuccess = await uiPrimitives.smoothClick({
      selector: '[data-upload-trigger="verification-documents"]',
      description: 'Upload dialog trigger',
      moveDuration: 800,
      clickDelay: 200
    });

    if (!openSuccess) {
      console.log('❌ Failed to open dialog');
      return;
    }

    // Wait for dialog to appear
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Then cancel it
    const cancelSuccess = await uiPrimitives.cancelDialog({
      cancelButtonSelector: '[data-dialog-action="cancel"]',
      description: 'Upload dialog',
      moveDuration: 600,
      clickDelay: 200
    });

    if (cancelSuccess) {
      console.log('✅ Cancel upload demo completed successfully');
    } else {
      console.log('❌ Cancel upload demo failed');
    }
  };

  return (
    <button
      onClick={handleCancelUploadDemo}
      className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
      title="Demo canceling upload dialog"
    >
      ❌ Cancel Upload
    </button>
  );
}

function AgentStopButton() {
  const handleStop = () => {
    window.dispatchEvent(new CustomEvent('agent-stop'));
  };

  return (
    <button
      onClick={handleStop}
      className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
      title="Stop agent demonstration"
    >
      Stop Agent
    </button>
  );
} 