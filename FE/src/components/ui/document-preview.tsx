"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Calendar, User, Shield, AlertTriangle, CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { DocumentPDFExport } from "./document-pdf-export"

// Document types supported by the preview system
export type DocumentType = 'dea' | 'npdb' | 'oig' | 'license' | 'certificate' | 'insurance' | 'generic'

// Base document interface
export interface BaseDocument {
  id: string
  type: DocumentType
  title: string
  fileName: string
  fileSize?: number
  uploadDate: Date
  status: 'verified' | 'pending' | 'failed' | 'expired'
  data: Record<string, any>
}

// Template-specific document interfaces
export interface DEADocument extends BaseDocument {
  type: 'dea'
  data: {
    deaNumber: string
    practitionerName: string
    businessActivity: string[]
    schedules: string[]
    expirationDate: Date
    issueDate: Date
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
    status: 'active' | 'expired' | 'suspended'
  }
}

export interface NPDBDocument extends BaseDocument {
  type: 'npdb'
  data: {
    practitionerName: string
    licenseNumber: string
    reportDate: Date
    reportType: 'malpractice' | 'disciplinary' | 'clinical'
    description: string
    amount?: number
    state: string
    specialty: string
    status: 'active' | 'resolved' | 'pending'
  }
}

export interface OIGDocument extends BaseDocument {
  type: 'oig'
  data: {
    practitionerName: string
    exclusionType: string
    exclusionDate: Date
    waiverDate?: Date
    specialty: string
    excludingAgency: string
    reason: string
    status: 'excluded' | 'reinstated' | 'waived'
  }
}

export interface LicenseDocument extends BaseDocument {
  type: 'license'
  data: {
    licenseNumber: string
    practitionerName: string
    licenseType: string
    issueDate: Date
    expirationDate: Date
    state: string
    specialty: string
    restrictions?: string[]
    status: 'active' | 'expired' | 'suspended' | 'revoked'
  }
}

export type DocumentData = DEADocument | NPDBDocument | OIGDocument | LicenseDocument | BaseDocument

interface DocumentPreviewProps {
  document: DocumentData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload?: (document: DocumentData) => void
}

export function DocumentPreview({ document, open, onOpenChange, onDownload }: DocumentPreviewProps) {
  if (!document) return null

  const handleDownload = () => {
    if (onDownload && document) {
      onDownload(document)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {document.title}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {document.fileName} • {document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DocumentStatusBadge status={document.status} />
              <DocumentPDFExport 
                document={document} 
                variant="button" 
                size="sm" 
              />
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <DocumentTemplate document={document} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DocumentStatusBadge({ status }: { status: BaseDocument['status'] }) {
  const statusConfig = {
    verified: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Calendar },
    failed: { color: 'bg-red-100 text-red-800 border-red-200', icon: X },
    expired: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle }
  } as const

  // Fallback to pending if status is not recognized
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon

  return (
    <Badge className={cn("flex items-center gap-1 capitalize", config.color)}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  )
}

function DocumentTemplate({ document }: { document: DocumentData }) {
  switch (document.type) {
    case 'dea':
      return <DEATemplate document={document as DEADocument} />
    case 'npdb':
      return <NPDBTemplate document={document as NPDBDocument} />
    case 'oig':
      return <OIGTemplate document={document as OIGDocument} />
    case 'license':
      return <LicenseTemplate document={document as LicenseDocument} />
    default:
      return <GenericTemplate document={document} />
  }
}

function DEATemplate({ document }: { document: DEADocument }) {
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          DRUG ENFORCEMENT ADMINISTRATION
        </h2>
        <p className="text-lg text-blue-700 dark:text-blue-300 mt-1">
          Certificate of Registration
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoField label="DEA Registration Number" value={document.data.deaNumber} highlight />
          <InfoField label="Registrant Name" value={document.data.practitionerName} />
          <InfoField 
            label="Business Activity" 
            value={document.data.businessActivity.join(', ')} 
          />
          <InfoField 
            label="Controlled Substance Schedules" 
            value={document.data.schedules.join(', ')} 
          />
        </div>

        <div className="space-y-4">
          <InfoField 
            label="Issue Date" 
            value={document.data.issueDate.toLocaleDateString()} 
          />
          <InfoField 
            label="Expiration Date" 
            value={document.data.expirationDate.toLocaleDateString()} 
          />
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Registered Address
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{document.data.address.street}</p>
              <p>{document.data.address.city}, {document.data.address.state} {document.data.address.zipCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Registration Status</h4>
        <Badge className={cn(
          "text-sm px-3 py-1",
          document.data.status === 'active' ? 'bg-green-100 text-green-800' :
          document.data.status === 'expired' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        )}>
          {document.data.status.toUpperCase()}
        </Badge>
      </div>
    </div>
  )
}

function NPDBTemplate({ document }: { document: NPDBDocument }) {
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-100">
          NATIONAL PRACTITIONER DATA BANK
        </h2>
        <p className="text-lg text-orange-700 dark:text-orange-300 mt-1">
          Practitioner Report
        </p>
      </div>

      {/* Alert Banner */}
      <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <span className="font-semibold text-orange-800 dark:text-orange-200">
            {document.data.reportType.toUpperCase()} REPORT
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoField label="Practitioner Name" value={document.data.practitionerName} highlight />
          <InfoField label="License Number" value={document.data.licenseNumber} />
          <InfoField label="State" value={document.data.state} />
          <InfoField label="Specialty" value={document.data.specialty} />
        </div>

        <div className="space-y-4">
          <InfoField 
            label="Report Date" 
            value={document.data.reportDate.toLocaleDateString()} 
          />
          <InfoField label="Report Type" value={document.data.reportType} />
          {document.data.amount && (
            <InfoField 
              label="Amount" 
              value={`$${document.data.amount.toLocaleString()}`} 
            />
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Report Description
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {document.data.description}
        </p>
      </div>
    </div>
  )
}

function OIGTemplate({ document }: { document: OIGDocument }) {
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-red-900 dark:text-red-100">
          OFFICE OF INSPECTOR GENERAL
        </h2>
        <p className="text-lg text-red-700 dark:text-red-300 mt-1">
          List of Excluded Individuals/Entities
        </p>
      </div>

      {/* Alert Banner */}
      <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600" />
          <span className="font-semibold text-red-800 dark:text-red-200">
            EXCLUSION RECORD
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoField label="Individual Name" value={document.data.practitionerName} highlight />
          <InfoField label="Specialty" value={document.data.specialty} />
          <InfoField label="Exclusion Type" value={document.data.exclusionType} />
          <InfoField label="Excluding Agency" value={document.data.excludingAgency} />
        </div>

        <div className="space-y-4">
          <InfoField 
            label="Exclusion Date" 
            value={document.data.exclusionDate.toLocaleDateString()} 
          />
          {document.data.waiverDate && (
            <InfoField 
              label="Waiver Date" 
              value={document.data.waiverDate.toLocaleDateString()} 
            />
          )}
          <InfoField label="Current Status" value={document.data.status} />
        </div>
      </div>

      {/* Reason */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Reason for Exclusion
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {document.data.reason}
        </p>
      </div>
    </div>
  )
}

function LicenseTemplate({ document }: { document: LicenseDocument }) {
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
          MEDICAL LICENSE VERIFICATION
        </h2>
        <p className="text-lg text-green-700 dark:text-green-300 mt-1">
          State Medical Board Certification
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoField label="License Number" value={document.data.licenseNumber} highlight />
          <InfoField label="Licensee Name" value={document.data.practitionerName} />
          <InfoField label="License Type" value={document.data.licenseType} />
          <InfoField label="State" value={document.data.state} />
        </div>

        <div className="space-y-4">
          <InfoField label="Specialty" value={document.data.specialty} />
          <InfoField 
            label="Issue Date" 
            value={document.data.issueDate.toLocaleDateString()} 
          />
          <InfoField 
            label="Expiration Date" 
            value={document.data.expirationDate.toLocaleDateString()} 
          />
        </div>
      </div>

      {/* Restrictions */}
      {document.data.restrictions && document.data.restrictions.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            License Restrictions
          </h4>
          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
            {document.data.restrictions.map((restriction, index) => (
              <li key={index}>{restriction}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Status */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">License Status</h4>
        <Badge className={cn(
          "text-sm px-3 py-1",
          document.data.status === 'active' ? 'bg-green-100 text-green-800' :
          document.data.status === 'expired' ? 'bg-red-100 text-red-800' :
          document.data.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        )}>
          {document.data.status.toUpperCase()}
        </Badge>
      </div>
    </div>
  )
}

function GenericTemplate({ document }: { document: BaseDocument }) {
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          DOCUMENT PREVIEW
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mt-1">
          {document.title}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoField label="Document ID" value={document.id} />
          <InfoField label="File Name" value={document.fileName} />
          <InfoField label="Document Type" value={document.type} />
        </div>

        <div className="space-y-4">
          <InfoField 
            label="Upload Date" 
            value={document.uploadDate.toLocaleDateString()} 
          />
          {document.fileSize && (
            <InfoField 
              label="File Size" 
              value={`${(document.fileSize / 1024).toFixed(1)} KB`} 
            />
          )}
        </div>
      </div>

      {/* Raw Data */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Document Data
        </h4>
        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
          {JSON.stringify(document.data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function InfoField({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string
  value: string
  highlight?: boolean 
}) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 p-3 rounded-lg border",
      highlight && "ring-2 ring-blue-200 dark:ring-blue-800"
    )}>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </dd>
    </div>
  )
}

// Document factory function to create documents from API responses
export function createDocumentFromData(
  type: DocumentType,
  fileName: string,
  apiData: any,
  fileSize?: number
): DocumentData {
  const baseDocument: BaseDocument = {
    id: apiData.id || `doc_${Date.now()}`,
    type,
    title: `${type.toUpperCase()} Document`,
    fileName,
    fileSize,
    uploadDate: new Date(),
    status: (['verified', 'pending', 'failed', 'expired'].includes(apiData.status)) 
      ? apiData.status 
      : 'pending',
    data: apiData
  }

  switch (type) {
    case 'dea':
      return {
        ...baseDocument,
        type: 'dea',
        title: 'DEA Registration Certificate',
        data: {
          deaNumber: apiData.deaNumber || 'Unknown',
          practitionerName: apiData.practitionerName || 'Unknown',
          businessActivity: apiData.businessActivity || [],
          schedules: apiData.schedules || [],
          expirationDate: new Date(apiData.expirationDate || Date.now()),
          issueDate: new Date(apiData.issueDate || Date.now()),
          address: apiData.address || {},
          status: apiData.status || 'active'
        }
      } as DEADocument

    case 'npdb':
      return {
        ...baseDocument,
        type: 'npdb',
        title: 'NPDB Report',
        data: {
          practitionerName: apiData.practitionerName || 'Unknown',
          licenseNumber: apiData.licenseNumber || 'Unknown',
          reportDate: new Date(apiData.reportDate || Date.now()),
          reportType: apiData.reportType || 'malpractice',
          description: apiData.description || 'No description available',
          amount: apiData.amount,
          state: apiData.state || 'Unknown',
          specialty: apiData.specialty || 'Unknown',
          status: apiData.status || 'active'
        }
      } as NPDBDocument

    case 'oig':
      return {
        ...baseDocument,
        type: 'oig',
        title: 'OIG Exclusion Record',
        data: {
          practitionerName: apiData.practitionerName || 'Unknown',
          exclusionType: apiData.exclusionType || 'Unknown',
          exclusionDate: new Date(apiData.exclusionDate || Date.now()),
          waiverDate: apiData.waiverDate ? new Date(apiData.waiverDate) : undefined,
          specialty: apiData.specialty || 'Unknown',
          excludingAgency: apiData.excludingAgency || 'Unknown',
          reason: apiData.reason || 'No reason provided',
          status: apiData.status || 'excluded'
        }
      } as OIGDocument

    case 'license':
      return {
        ...baseDocument,
        type: 'license',
        title: 'Medical License',
        data: {
          licenseNumber: apiData.licenseNumber || 'Unknown',
          practitionerName: apiData.practitionerName || 'Unknown',
          licenseType: apiData.licenseType || 'Unknown',
          issueDate: new Date(apiData.issueDate || Date.now()),
          expirationDate: new Date(apiData.expirationDate || Date.now()),
          state: apiData.state || 'Unknown',
          specialty: apiData.specialty || 'Unknown',
          restrictions: apiData.restrictions || [],
          status: apiData.status || 'active'
        }
      } as LicenseDocument

    default:
      return baseDocument
  }
} 