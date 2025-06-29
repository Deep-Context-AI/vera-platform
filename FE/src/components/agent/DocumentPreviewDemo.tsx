'use client';

import React from 'react';
import { FileText, Eye, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createDocumentFromData, type DocumentType, type DocumentData } from '@/components/ui/document-preview';
import { DocumentPDFExport } from '@/components/ui/document-pdf-export';

export function DocumentPreviewDemo() {
  const [selectedDocument, setSelectedDocument] = React.useState<DocumentData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  // Sample documents for demonstration
  const sampleDocuments = React.useMemo(() => {
    const docs: DocumentData[] = [];

    // DEA Document
    docs.push(createDocumentFromData('dea', 'dea-registration-certificate.pdf', {
      id: 'dea_sample_001',
      deaNumber: 'BD1234567',
      practitionerName: 'Dr. Sarah Johnson',
      businessActivity: ['Practitioner', 'Researcher'],
      schedules: ['Schedule II', 'Schedule III', 'Schedule IV', 'Schedule V'],
      expirationDate: '2025-12-31',
      issueDate: '2022-01-01',
      address: {
        street: '123 Medical Center Dr',
        city: 'Healthcare City',
        state: 'CA',
        zipCode: '90210'
      },
      status: 'verified'
    }, 245760));

    // NPDB Document
    docs.push(createDocumentFromData('npdb', 'npdb-malpractice-report.pdf', {
      id: 'npdb_sample_001',
      practitionerName: 'Dr. Michael Chen',
      licenseNumber: 'MD123456',
      reportDate: '2023-06-15',
      reportType: 'malpractice',
      description: 'Medical malpractice settlement related to surgical procedure complications. Patient alleged improper post-operative care resulting in extended recovery time and additional medical expenses.',
      amount: 150000,
      state: 'California',
      specialty: 'General Surgery',
      status: 'pending'
    }, 187392));

    // OIG Document
    docs.push(createDocumentFromData('oig', 'oig-exclusion-record.pdf', {
      id: 'oig_sample_001',
      practitionerName: 'Dr. Jennifer Williams',
      exclusionType: 'Conviction of a program-related crime',
      exclusionDate: '2020-03-15',
      waiverDate: '2023-03-15',
      specialty: 'Internal Medicine',
      excludingAgency: 'OIG-HHS',
      reason: 'Conviction for healthcare fraud involving false billing practices and submission of fraudulent Medicare claims over a 2-year period.',
      status: 'failed'
    }, 156672));

    // License Document
    docs.push(createDocumentFromData('license', 'medical-license-verification.pdf', {
      id: 'license_sample_001',
      licenseNumber: 'MD789123',
      practitionerName: 'Dr. Robert Davis',
      licenseType: 'Physician and Surgeon',
      issueDate: '2015-07-01',
      expirationDate: '2025-07-31',
      state: 'California',
      specialty: 'Internal Medicine',
      restrictions: ['Must complete 20 hours of continuing education annually', 'Practice limited to outpatient settings'],
      status: 'expired'
    }, 98304));

    return docs;
  }, []);

  const handlePreview = async (document: DocumentData) => {
    setSelectedDocument(document);
    setIsGeneratingPdf(true);
    setIsPreviewOpen(true);
    
    try {
      // Ensure we're in browser environment before generating PDF
      if (typeof window === 'undefined') {
        throw new Error('PDF generation requires browser environment');
      }
      
      // Generate PDF blob for preview
      const pdfBlob = await generatePDFBlob(document);
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Failed to generate PDF preview:', error);
      // Reset states on error
      setPdfUrl(null);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generatePDFBlob = async (documentData: DocumentData): Promise<Blob> => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('PDF generation is only available in browser environment');
    }

    const jsPDF = (await import('jspdf')).default;
    
    // Create a temporary div for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '794px'; // A4 width
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.color = 'black';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    // Create PDF template HTML
    tempDiv.innerHTML = createPDFTemplateHTML(documentData);
    document.body.appendChild(tempDiv);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
        compress: true
      });

      // Add metadata
      pdf.setProperties({
        title: documentData.title,
        subject: `${documentData.type.toUpperCase()} Verification Document`,
        author: 'Vera Platform',
        keywords: `verification, ${documentData.type}, healthcare`,
        creator: 'Vera Document Management System'
      });

      return new Promise((resolve, reject) => {
        pdf.html(tempDiv, {
          callback: (doc) => {
            try {
              const pdfBlob = doc.output('blob');
              resolve(pdfBlob);
            } catch (error) {
              reject(error);
            }
          },
          margin: [15, 15, 15, 15],
          html2canvas: {
            scale: 0.75,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          }
        });
      });
    } finally {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
    }
  };

  const createPDFTemplateHTML = (document: DocumentData): string => {
    const baseStyles = `
      padding: 40px;
      background-color: white;
      color: black;
      max-width: 714px;
      margin: 0 auto;
      font-family: Arial, sans-serif;
      line-height: 1.4;
    `;

    const headerStyles = `
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    `;

    const titleStyles = `
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #1a1a1a;
    `;

    const subtitleStyles = `
      font-size: 18px;
      color: #666;
      margin: 0;
    `;

    const gridStyles = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    `;

    const fieldStyles = `
      background-color: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
      margin-bottom: 10px;
    `;

    const fieldLabelStyles = `
      font-size: 11px;
      font-weight: bold;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    `;

    const fieldValueStyles = `
      font-size: 14px;
      font-weight: bold;
      color: #1a1a1a;
    `;

    const statusBadgeStyles = `
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      background-color: ${document.status === 'verified' ? '#d4edda' : 
                         document.status === 'pending' ? '#fff3cd' :
                         document.status === 'failed' ? '#f8d7da' : '#e2e3e5'};
      color: ${document.status === 'verified' ? '#155724' : 
               document.status === 'pending' ? '#856404' :
               document.status === 'failed' ? '#721c24' : '#383d41'};
    `;

    switch (document.type) {
      case 'dea':
        const deaDoc = document as any;
        return `
          <div style="${baseStyles}">
            <div style="${headerStyles}">
              <h1 style="${titleStyles}">DRUG ENFORCEMENT ADMINISTRATION</h1>
              <p style="${subtitleStyles}">Certificate of Registration</p>
            </div>
            <div style="${gridStyles}">
              <div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">DEA Registration Number</div>
                  <div style="${fieldValueStyles}">${deaDoc.data.deaNumber}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Registrant Name</div>
                  <div style="${fieldValueStyles}">${deaDoc.data.practitionerName}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Business Activity</div>
                  <div style="${fieldValueStyles}">${deaDoc.data.businessActivity?.join(', ')}</div>
                </div>
              </div>
              <div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Issue Date</div>
                  <div style="${fieldValueStyles}">${deaDoc.data.issueDate?.toLocaleDateString()}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Expiration Date</div>
                  <div style="${fieldValueStyles}">${deaDoc.data.expirationDate?.toLocaleDateString()}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Schedules</div>
                  <div style="${fieldValueStyles}">${deaDoc.data.schedules?.join(', ')}</div>
                </div>
              </div>
            </div>
            <div style="margin-bottom: 25px;">
              <h3 style="margin-bottom: 10px;">Registered Address</h3>
              <div style="${fieldStyles}">
                <div>${deaDoc.data.address?.street}</div>
                <div>${deaDoc.data.address?.city}, ${deaDoc.data.address?.state} ${deaDoc.data.address?.zipCode}</div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <div style="${fieldLabelStyles}">Registration Status</div>
              <span style="${statusBadgeStyles}">${document.status.toUpperCase()}</span>
            </div>
          </div>
        `;

      case 'npdb':
        const npdbDoc = document as any;
        return `
          <div style="${baseStyles}">
            <div style="${headerStyles}">
              <h1 style="${titleStyles}">NATIONAL PRACTITIONER DATA BANK</h1>
              <p style="${subtitleStyles}">Practitioner Report</p>
            </div>
            <div style="${gridStyles}">
              <div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Practitioner Name</div>
                  <div style="${fieldValueStyles}">${npdbDoc.data.practitionerName}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">License Number</div>
                  <div style="${fieldValueStyles}">${npdbDoc.data.licenseNumber}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">State</div>
                  <div style="${fieldValueStyles}">${npdbDoc.data.state}</div>
                </div>
              </div>
              <div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Report Date</div>
                  <div style="${fieldValueStyles}">${npdbDoc.data.reportDate?.toLocaleDateString()}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Report Type</div>
                  <div style="${fieldValueStyles}">${npdbDoc.data.reportType}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Specialty</div>
                  <div style="${fieldValueStyles}">${npdbDoc.data.specialty}</div>
                </div>
              </div>
            </div>
            ${npdbDoc.data.amount ? `
              <div style="margin-bottom: 25px;">
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Settlement Amount</div>
                  <div style="${fieldValueStyles}">$${npdbDoc.data.amount.toLocaleString()}</div>
                </div>
              </div>
            ` : ''}
            <div style="margin-bottom: 25px;">
              <h3 style="margin-bottom: 10px;">Report Description</h3>
              <div style="${fieldStyles}">
                <div style="${fieldValueStyles}">${npdbDoc.data.description}</div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <div style="${fieldLabelStyles}">Report Status</div>
              <span style="${statusBadgeStyles}">${document.status.toUpperCase()}</span>
            </div>
          </div>
        `;

      default:
        return `
          <div style="${baseStyles}">
            <div style="${headerStyles}">
              <h1 style="${titleStyles}">${document.title}</h1>
            </div>
            <div style="${gridStyles}">
              <div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Document ID</div>
                  <div style="${fieldValueStyles}">${document.id}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">File Name</div>
                  <div style="${fieldValueStyles}">${document.fileName}</div>
                </div>
              </div>
              <div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Document Type</div>
                  <div style="${fieldValueStyles}">${document.type.toUpperCase()}</div>
                </div>
                <div style="${fieldStyles}">
                  <div style="${fieldLabelStyles}">Upload Date</div>
                  <div style="${fieldValueStyles}">${document.uploadDate.toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <div style="${fieldLabelStyles}">Document Status</div>
              <span style="${statusBadgeStyles}">${document.status.toUpperCase()}</span>
            </div>
          </div>
        `;
    }
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'dea':
        return <Shield className="w-5 h-5 text-blue-600" />;
      case 'npdb':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'oig':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'license':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDocumentColor = (type: DocumentType) => {
    switch (type) {
      case 'dea':
        return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700';
      case 'npdb':
        return 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700';
      case 'oig':
        return 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700';
      case 'license':
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700';
      default:
        return 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
        <span className="mr-2">📄</span>
        Document Template Preview Demo
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Preview how different verification documents are parsed and displayed as PDF documents. Each document type has its own specialized template and formatting.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {sampleDocuments.map((document) => (
          <div
            key={document.id}
            className={`bg-gradient-to-br ${getDocumentColor(document.type)} rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer`}
            onClick={() => handlePreview(document)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getDocumentIcon(document.type)}
                <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                  {document.title}
                </h5>
              </div>
              <Badge className="text-xs">
                {document.type.toUpperCase()}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {document.fileName}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
              </span>
              <div className="flex items-center gap-1">
                                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(document);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    View PDF
                  </Button>
                <DocumentPDFExport 
                  document={document} 
                  variant="icon" 
                  size="sm"
                  className="h-7 w-7 p-0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>🎨 Each document type uses a specialized template with appropriate styling and layout</p>
        <p>📊 Templates automatically parse structured data from API responses</p>
        <p>🔍 Click any document card to see the generated PDF preview in a dialog</p>
        <p>📄 Click the download icon to export documents as PDF files</p>
        <p>🤖 In the agent demo, uploaded files are automatically parsed and categorized</p>
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => {
        setIsPreviewOpen(open);
        if (!open && pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }
      }}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            {isGeneratingPdf ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Generating PDF preview...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border rounded"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Failed to generate PDF preview</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 