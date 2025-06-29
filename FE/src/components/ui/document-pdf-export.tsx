"use client"

import * as React from "react"
import jsPDF from 'jspdf'
import { Button } from "@/components/ui/button"
import { Download, FileText, Loader2 } from "lucide-react"
import { DocumentTemplate } from "./document-preview"
import type { DocumentData } from "./document-preview"

interface DocumentPDFExportProps {
  document: DocumentData
  variant?: "button" | "icon"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function DocumentPDFExport({ 
  document, 
  variant = "button", 
  size = "md",
  className 
}: DocumentPDFExportProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const templateRef = React.useRef<HTMLDivElement>(null)

  const generatePDF = async () => {
    if (!templateRef.current || isGenerating) return

    setIsGenerating(true)

    try {
      // Create PDF with appropriate settings for document templates
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
        compress: true
      })

      // Add document metadata
      pdf.setProperties({
        title: document.title,
        subject: `${document.type.toUpperCase()} Verification Document`,
        author: 'Vera Platform',
        keywords: `verification, ${document.type}, healthcare, ${document.fileName}`,
        creator: 'Vera Document Management System',
        producer: 'Vera Platform PDF Generator'
      })

      // Configure HTML to PDF conversion
      await pdf.html(templateRef.current, {
        callback: async (doc) => {
          // Generate filename based on document data
          const timestamp = new Date().toISOString().split('T')[0]
          const filename = `${document.type}-${document.id}-${timestamp}.pdf`
          
          // Save the PDF
          doc.save(filename)
        },
        margin: [15, 15, 15, 15], // top, right, bottom, left
        html2canvas: {
          scale: 0.75, // Reduce scale for better text rendering
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          removeContainer: true
        },
        jsPDF: {
          unit: 'px',
          format: 'a4',
          orientation: 'portrait'
        }
      })

    } catch (error) {
      console.error('PDF generation failed:', error)
      // You could add toast notification here
    } finally {
      setIsGenerating(false)
    }
  }

  const buttonContent = () => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {variant === "button" && "Generating..."}
        </>
      )
    }

    return (
      <>
        <Download className="w-4 h-4" />
        {variant === "button" && "Export PDF"}
      </>
    )
  }

  const buttonSize = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm", 
    lg: "h-10 px-6 text-base"
  }

  return (
    <>
      <Button
        onClick={generatePDF}
        disabled={isGenerating}
        variant="outline"
        size={size}
        className={`flex items-center gap-2 ${buttonSize[size]} ${className}`}
        title="Export document as PDF"
      >
        {buttonContent()}
      </Button>

      {/* Hidden template for PDF generation */}
      <div 
        ref={templateRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '794px', // A4 width in pixels at 96 DPI
          backgroundColor: 'white',
          color: 'black',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.4'
        }}
      >
        <PDFDocumentTemplate document={document} />
      </div>
    </>
  )
}

// Specialized PDF template component optimized for PDF generation
function PDFDocumentTemplate({ document }: { document: DocumentData }) {
  // Add PDF-specific styling that works better with jsPDF
  const pdfStyles = {
    container: {
      padding: '40px',
      backgroundColor: 'white',
      color: 'black',
      maxWidth: '714px', // A4 width minus margins
      margin: '0 auto'
    },
    header: {
      textAlign: 'center' as const,
      borderBottom: '2px solid #333',
      paddingBottom: '20px',
      marginBottom: '30px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '0 0 10px 0',
      color: '#1a1a1a'
    },
    subtitle: {
      fontSize: '18px',
      color: '#666',
      margin: '0'
    },
    section: {
      marginBottom: '25px',
      pageBreakInside: 'avoid' as const
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px'
    },
    field: {
      backgroundColor: '#f8f9fa',
      padding: '12px',
      borderRadius: '4px',
      border: '1px solid #e9ecef',
      marginBottom: '10px'
    },
    fieldLabel: {
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#666',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '4px'
    },
    fieldValue: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#1a1a1a'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      backgroundColor: document.status === 'verified' ? '#d4edda' : 
                      document.status === 'pending' ? '#fff3cd' :
                      document.status === 'failed' ? '#f8d7da' : '#e2e3e5',
      color: document.status === 'verified' ? '#155724' : 
             document.status === 'pending' ? '#856404' :
             document.status === 'failed' ? '#721c24' : '#383d41'
    }
  }

  // Render based on document type with PDF-optimized layout
  switch (document.type) {
    case 'dea':
      const deaDoc = document as any
      return (
        <div style={pdfStyles.container}>
          <div style={pdfStyles.header}>
            <h1 style={pdfStyles.title}>DRUG ENFORCEMENT ADMINISTRATION</h1>
            <p style={pdfStyles.subtitle}>Certificate of Registration</p>
          </div>

          <div style={pdfStyles.grid}>
            <div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>DEA Registration Number</div>
                <div style={pdfStyles.fieldValue}>{deaDoc.data.deaNumber}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Registrant Name</div>
                <div style={pdfStyles.fieldValue}>{deaDoc.data.practitionerName}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Business Activity</div>
                <div style={pdfStyles.fieldValue}>{deaDoc.data.businessActivity?.join(', ')}</div>
              </div>
            </div>
            <div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Issue Date</div>
                <div style={pdfStyles.fieldValue}>{deaDoc.data.issueDate?.toLocaleDateString()}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Expiration Date</div>
                <div style={pdfStyles.fieldValue}>{deaDoc.data.expirationDate?.toLocaleDateString()}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Schedules</div>
                <div style={pdfStyles.fieldValue}>{deaDoc.data.schedules?.join(', ')}</div>
              </div>
            </div>
          </div>

          <div style={pdfStyles.section}>
            <h3 style={{ marginBottom: '10px' }}>Registered Address</h3>
            <div style={pdfStyles.field}>
              <div>{deaDoc.data.address?.street}</div>
              <div>{deaDoc.data.address?.city}, {deaDoc.data.address?.state} {deaDoc.data.address?.zipCode}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <div style={pdfStyles.fieldLabel}>Registration Status</div>
            <span style={pdfStyles.statusBadge}>{document.status.toUpperCase()}</span>
          </div>
        </div>
      )

    case 'npdb':
      const npdbDoc = document as any
      return (
        <div style={pdfStyles.container}>
          <div style={pdfStyles.header}>
            <h1 style={pdfStyles.title}>NATIONAL PRACTITIONER DATA BANK</h1>
            <p style={pdfStyles.subtitle}>Practitioner Report</p>
          </div>

          <div style={pdfStyles.grid}>
            <div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Practitioner Name</div>
                <div style={pdfStyles.fieldValue}>{npdbDoc.data.practitionerName}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>License Number</div>
                <div style={pdfStyles.fieldValue}>{npdbDoc.data.licenseNumber}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>State</div>
                <div style={pdfStyles.fieldValue}>{npdbDoc.data.state}</div>
              </div>
            </div>
            <div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Report Date</div>
                <div style={pdfStyles.fieldValue}>{npdbDoc.data.reportDate?.toLocaleDateString()}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Report Type</div>
                <div style={pdfStyles.fieldValue}>{npdbDoc.data.reportType}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Specialty</div>
                <div style={pdfStyles.fieldValue}>{npdbDoc.data.specialty}</div>
              </div>
            </div>
          </div>

          {npdbDoc.data.amount && (
            <div style={pdfStyles.section}>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Settlement Amount</div>
                <div style={pdfStyles.fieldValue}>${npdbDoc.data.amount.toLocaleString()}</div>
              </div>
            </div>
          )}

          <div style={pdfStyles.section}>
            <h3 style={{ marginBottom: '10px' }}>Report Description</h3>
            <div style={pdfStyles.field}>
              <div style={pdfStyles.fieldValue}>{npdbDoc.data.description}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <div style={pdfStyles.fieldLabel}>Report Status</div>
            <span style={pdfStyles.statusBadge}>{document.status.toUpperCase()}</span>
          </div>
        </div>
      )

    // Add other document types (OIG, License) with similar PDF-optimized layouts
    default:
      return (
        <div style={pdfStyles.container}>
          <div style={pdfStyles.header}>
            <h1 style={pdfStyles.title}>{document.title}</h1>
          </div>
          
          <div style={pdfStyles.grid}>
            <div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Document ID</div>
                <div style={pdfStyles.fieldValue}>{document.id}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>File Name</div>
                <div style={pdfStyles.fieldValue}>{document.fileName}</div>
              </div>
            </div>
            <div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Document Type</div>
                <div style={pdfStyles.fieldValue}>{document.type.toUpperCase()}</div>
              </div>
              <div style={pdfStyles.field}>
                <div style={pdfStyles.fieldLabel}>Upload Date</div>
                <div style={pdfStyles.fieldValue}>{document.uploadDate.toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <div style={pdfStyles.fieldLabel}>Document Status</div>
            <span style={pdfStyles.statusBadge}>{document.status.toUpperCase()}</span>
          </div>
        </div>
      )
  }
} 