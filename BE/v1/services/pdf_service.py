import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path
import tempfile
import os

from jinja2 import Environment, FileSystemLoader, select_autoescape

from v1.services.database import get_supabase_client
from v1.exceptions.api import ExternalServiceException

logger = logging.getLogger(__name__)

class PDFService:
    """Service for generating and managing PDF documents"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.templates_dir = Path(__file__).parent.parent / "templates" / "pdf"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )
    
    async def generate_pdf_document(
        self, 
        template_name: str, 
        data: Dict[str, Any], 
        practitioner_id: str,
        user_id: Optional[str] = None,
        filename_prefix: str = "document"
    ) -> str:
        """
        Generate a PDF document from template and upload to Supabase storage
        
        Args:
            template_name: Name of the template file (e.g., 'dea_verification.html')
            data: Data to populate the template
            practitioner_id: Practitioner ID for organizing documents
            user_id: User ID who invoked the call (included in document content)
            filename_prefix: Prefix for the generated filename
            
        Returns:
            URL to the uploaded PDF document
            
        Raises:
            ExternalServiceException: If PDF generation or upload fails
        """
        try:
            # Import WeasyPrint only when needed (in Modal container)
            from weasyprint import HTML, CSS
        except ImportError:
            raise ExternalServiceException(
                detail="WeasyPrint is not available. PDF generation is only supported in the deployed environment.",
                service_name="PDF Service"
            )
            
        try:
            logger.info(f"Generating PDF document using template: {template_name}")
            
            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            document_id = str(uuid.uuid4())[:8]
            filename = f"{filename_prefix}_{timestamp}_{document_id}.pdf"
            
            # Render HTML template
            html_content = self._render_template(template_name, data, user_id)
            
            # Generate PDF from HTML
            pdf_content = self._generate_pdf_from_html(html_content, HTML, CSS)
            
            # Upload to Supabase storage
            document_url = await self._upload_to_supabase(
                pdf_content, practitioner_id, filename
            )
            
            logger.info(f"Successfully generated and uploaded PDF: {document_url}")
            return document_url
            
        except Exception as e:
            logger.error(f"Error generating PDF document: {e}")
            raise ExternalServiceException(
                detail=f"Failed to generate PDF document: {str(e)}",
                service_name="PDF Service"
            )
    
    def _render_template(self, template_name: str, data: Dict[str, Any], user_id: Optional[str] = None) -> str:
        """
        Render Jinja2 template with provided data
        
        Args:
            template_name: Name of the template file
            data: Data to populate the template
            user_id: User ID who invoked the call (optional)
            
        Returns:
            Rendered HTML content
        """
        try:
            template = self.jinja_env.get_template(template_name)
            
            # Add common template variables
            template_data = {
                **data,
                'generated_at': datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                'document_id': str(uuid.uuid4())[:8].upper(),
                'invoked_by_user_id': user_id
            }
            
            return template.render(**template_data)
            
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {e}")
            raise
    
    def _generate_pdf_from_html(self, html_content: str, HTML, CSS) -> bytes:
        """
        Generate PDF from HTML content using WeasyPrint
        
        Args:
            html_content: HTML content to convert to PDF
            HTML: WeasyPrint HTML class
            CSS: WeasyPrint CSS class
            
        Returns:
            PDF content as bytes
        """
        try:
            # Create CSS for styling
            css_content = self._get_base_css()
            
            # Generate PDF using WeasyPrint
            html_doc = HTML(string=html_content)
            css_doc = CSS(string=css_content)
            
            # Generate PDF to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                html_doc.write_pdf(tmp_file.name, stylesheets=[css_doc])
                
                # Read the generated PDF
                with open(tmp_file.name, 'rb') as pdf_file:
                    pdf_content = pdf_file.read()
                
                # Clean up temporary file
                os.unlink(tmp_file.name)
                
            return pdf_content
            
        except Exception as e:
            logger.error(f"Error generating PDF from HTML: {e}")
            raise
    
    def _get_base_css(self) -> str:
        """
        Get base CSS styling for PDF documents
        
        Returns:
            CSS content as string
        """
        return """
        @page {
            size: A4;
            margin: 1in;
            @top-center {
                content: "Vera Platform - Practitioner Verification";
                font-size: 10pt;
                color: #666;
            }
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 10pt;
                color: #666;
            }
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2563eb;
            font-size: 24pt;
            margin: 0 0 10px 0;
        }
        
        .header .subtitle {
            color: #666;
            font-size: 12pt;
            margin: 0;
        }
        
        .info-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .info-section h2 {
            color: #1e40af;
            font-size: 14pt;
            margin: 0 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .info-item {
            margin-bottom: 10px;
        }
        
        .info-label {
            font-weight: bold;
            color: #374151;
            margin-bottom: 2px;
        }
        
        .info-value {
            color: #6b7280;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-success {
            background-color: #dcfce7;
            color: #166534;
        }
        
        .status-warning {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .status-error {
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10pt;
            color: #6b7280;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #374151;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
        """
    
    async def _upload_to_supabase(
        self, 
        pdf_content: bytes, 
        practitioner_id: str, 
        filename: str
    ) -> str:
        """
        Upload PDF content to Supabase storage
        
        Args:
            pdf_content: PDF content as bytes
            practitioner_id: Practitioner ID for organizing documents
            filename: Name of the file
            
        Returns:
            Public URL to the uploaded document
        """
        try:
            # Create file path: practitioner_id/filename
            file_path = f"{practitioner_id}/{filename}"
            
            logger.info(f"Uploading PDF to Supabase storage: {file_path}")
            
            # Upload to Supabase storage
            try:
                response = self.supabase.storage.from_("vera-documents").upload(
                    file_path, 
                    pdf_content,
                    file_options={
                        "content-type": "application/pdf",
                        "cache-control": "3600"
                    }
                )
                
                # Check if upload was successful
                # If the upload fails, the response will be None OR the response will raise its own exception
                if response is None:
                    raise Exception(f"Upload failed: No response from Supabase")
                
                logger.info(f"PDF uploaded successfully to: {response.full_path}")
                
            except Exception as upload_error:
                logger.error(f"Upload operation failed: {upload_error}")
                raise Exception(f"Failed to upload PDF: {upload_error}")
            
            # Get public URL (note: this will be a signed URL for private buckets)
            try:
                url_response: dict[str, Any] = self.supabase.storage.from_("vera-documents").create_signed_url(
                    file_path, 
                    expires_in=31536000  # 1 year expiry
                )
                
                # Check if signed URL creation was successful
                # If the signed URL creation fails, the response will be None OR the response will raise its own exception
                if url_response is None:
                    raise Exception(f"Failed to get signed URL: No response from Supabase")
                
                logger.info(f"Generated signed URL successfully")
                return url_response.get("signedURL")
                
            except Exception as url_error:
                logger.error(f"Signed URL creation failed: {url_error}")
                raise Exception(f"Failed to create signed URL: {url_error}")
            
        except Exception as e:
            logger.error(f"Error uploading PDF to Supabase: {e}")
            raise

# Create a singleton instance
pdf_service = PDFService() 