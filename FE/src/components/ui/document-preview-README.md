# Document Preview System

A comprehensive template-based document preview system for healthcare verification documents. This system allows for structured display of various document types including DEA registrations, NPDB reports, OIG exclusions, and medical licenses.

## Features

- **Template-based rendering**: Each document type has its own specialized template
- **Type-safe interfaces**: Full TypeScript support with proper typing
- **Responsive design**: Works on desktop and mobile devices
- **Dark mode support**: Automatic theme switching
- **Download functionality**: Built-in download capabilities
- **Status indicators**: Visual status badges for document verification states
- **Agent integration**: Seamless integration with AI agent file upload simulation

## Document Types Supported

### 1. DEA Registration (`dea`)

- DEA registration number
- Practitioner information
- Business activities and schedules
- Address and expiration details
- Registration status

### 2. NPDB Report (`npdb`)

- Practitioner and license information
- Report type (malpractice, disciplinary, clinical)
- Settlement amounts and descriptions
- State and specialty information

### 3. OIG Exclusion (`oig`)

- Exclusion details and dates
- Excluding agency information
- Waiver status and dates
- Reason for exclusion

### 4. Medical License (`license`)

- License number and type
- Issue and expiration dates
- State and specialty information
- License restrictions (if any)

### 5. Generic Documents (`generic`)

- Fallback template for unknown document types
- Raw data display
- Basic metadata

## Usage

### Basic Implementation

```tsx
import {
  DocumentPreview,
  createDocumentFromData,
} from "@/components/ui/document-preview";

function MyComponent() {
  const [document, setDocument] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Create a document from API data
  const handleApiResponse = (apiData) => {
    const doc = createDocumentFromData("dea", "dea-cert.pdf", apiData, 245760);
    setDocument(doc);
    setIsOpen(true);
  };

  return (
    <DocumentPreview
      document={document}
      open={isOpen}
      onOpenChange={setIsOpen}
      onDownload={(doc) => console.log("Download:", doc)}
    />
  );
}
```

### File Upload Integration

```tsx
const handleFileUpload = (file: File) => {
  // Simulate API processing
  const apiResponse = await processFile(file);

  // Determine document type based on filename or API response
  const documentType = determineDocumentType(file.name, apiResponse);

  // Create structured document
  const document = createDocumentFromData(
    documentType,
    file.name,
    apiResponse,
    file.size
  );

  // Display preview
  setPreviewDocument(document);
  setIsPreviewOpen(true);
};
```

## Creating Custom Templates

### 1. Define Document Interface

```tsx
export interface CustomDocument extends BaseDocument {
  type: "custom";
  data: {
    customField1: string;
    customField2: number;
    customDate: Date;
    // ... other fields
  };
}
```

### 2. Create Template Component

```tsx
function CustomTemplate({ document }: { document: CustomDocument }) {
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-purple-900">
          CUSTOM DOCUMENT TYPE
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoField label="Custom Field 1" value={document.data.customField1} />
        <InfoField
          label="Custom Field 2"
          value={document.data.customField2.toString()}
        />
        {/* Add more fields */}
      </div>
    </div>
  );
}
```

### 3. Register Template

```tsx
function DocumentTemplate({ document }: { document: DocumentData }) {
  switch (document.type) {
    case "dea":
      return <DEATemplate document={document as DEADocument} />;
    case "npdb":
      return <NPDBTemplate document={document as NPDBDocument} />;
    case "custom":
      return <CustomTemplate document={document as CustomDocument} />;
    default:
      return <GenericTemplate document={document} />;
  }
}
```

### 4. Update Factory Function

```tsx
export function createDocumentFromData(
  type: DocumentType,
  fileName: string,
  apiData: any,
  fileSize?: number
): DocumentData {
  // ... existing cases

  case 'custom':
    return {
      ...baseDocument,
      type: 'custom',
      title: 'Custom Document',
      data: {
        customField1: apiData.customField1 || 'Default',
        customField2: apiData.customField2 || 0,
        customDate: new Date(apiData.customDate || Date.now()),
        // ... map other fields
      }
    } as CustomDocument
}
```

## Agent Integration

The document preview system integrates seamlessly with the AI agent file upload simulation:

### File Upload Flow

1. **Agent uploads file** → File is processed and analyzed
2. **Document type detection** → Based on filename patterns or content analysis
3. **Structured data creation** → API response is parsed into typed document
4. **Template rendering** → Appropriate template is selected and rendered
5. **User interaction** → Preview, download, or further processing

### Agent Demo Integration

```tsx
// In your agent upload primitive
const success = await uiPrimitives.uploadFile({
  uploadTriggerSelector: '[data-upload-trigger="verification-documents"]',
  fileName: "dea-registration.pdf",
  fileType: "application/pdf",
  acceptButtonSelector: '[data-dialog-action="accept"]',
  description: "DEA Registration Upload",
  // ... other options
});

// After upload, the system automatically:
// 1. Detects it's a DEA document (filename contains 'dea')
// 2. Creates mock structured data
// 3. Renders DEA template with proper styling
// 4. Shows preview button for user interaction
```

## Styling and Theming

### Template Colors

Each document type has its own color scheme:

- **DEA**: Blue gradient (`from-blue-50 to-indigo-50`)
- **NPDB**: Orange/Red gradient (`from-orange-50 to-red-50`)
- **OIG**: Red/Pink gradient (`from-red-50 to-pink-50`)
- **License**: Green gradient (`from-green-50 to-emerald-50`)
- **Generic**: Gray gradient (`from-gray-50 to-slate-50`)

### Custom Styling

```tsx
// Override template colors
const customColors = {
  'custom': 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
};

// Apply to template
<div className={`space-y-6 p-6 bg-gradient-to-br ${customColors.custom} rounded-lg`}>
```

## API Integration

### Real-world Implementation

```tsx
// Replace mock functions with real API calls
const processUploadedFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/documents/process", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  return {
    documentType: result.type,
    structuredData: result.data,
    confidence: result.confidence,
  };
};

// Use in upload handler
const handleFileUpload = async (files: FileList) => {
  const file = files[0];
  const processed = await processUploadedFile(file);

  const document = createDocumentFromData(
    processed.documentType,
    file.name,
    processed.structuredData,
    file.size
  );

  setPreviewDocument(document);
};
```

### Backend Requirements

Your backend should return structured data in the expected format:

```json
{
  "type": "dea",
  "confidence": 0.95,
  "data": {
    "deaNumber": "BD1234567",
    "practitionerName": "Dr. Sarah Johnson",
    "businessActivity": ["Practitioner", "Researcher"],
    "schedules": ["Schedule II", "Schedule III"],
    "expirationDate": "2025-12-31T00:00:00Z",
    "issueDate": "2022-01-01T00:00:00Z",
    "address": {
      "street": "123 Medical Center Dr",
      "city": "Healthcare City",
      "state": "CA",
      "zipCode": "90210"
    },
    "status": "active"
  }
}
```

## Best Practices

1. **Type Safety**: Always use TypeScript interfaces for document types
2. **Error Handling**: Include fallback templates for unknown document types
3. **Performance**: Use React.memo for template components if rendering many documents
4. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
5. **Responsive Design**: Test templates on various screen sizes
6. **Dark Mode**: Include dark mode variants for all styling

## Troubleshooting

### Common Issues

1. **Template not rendering**: Check if document type is registered in DocumentTemplate switch
2. **Missing data**: Verify createDocumentFromData handles all required fields
3. **Styling issues**: Ensure Tailwind classes are available and not purged
4. **Type errors**: Check that document interfaces match actual data structure

### Debug Mode

Enable debug logging to troubleshoot issues:

```tsx
const DEBUG = process.env.NODE_ENV === "development";

if (DEBUG) {
  console.log("Document data:", document);
  console.log("Template type:", document.type);
}
```

## Future Enhancements

- **PDF Generation**: Export templates as PDF documents
- **Print Optimization**: CSS print styles for physical documents
- **Batch Processing**: Handle multiple documents simultaneously
- **Advanced Search**: Search within document content
- **Version History**: Track document changes over time
- **Digital Signatures**: Integrate with e-signature providers
- **OCR Integration**: Extract text from scanned documents
- **Machine Learning**: Improve document type detection accuracy
