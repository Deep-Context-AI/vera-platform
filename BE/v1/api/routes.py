from fastapi import APIRouter, Path, Query, Header, WebSocket, WebSocketDisconnect
from typing import Optional, Dict, Any
import asyncio
import json
import logging
import time

from v1.models.requests import (
    NPIRequest, DEAVerificationRequest, ABMSRequest, NPDBRequest,
    ComprehensiveSANCTIONRequest, LADMFRequest,
    MedicalRequest, DCARequest, MedicareRequest, EducationRequest, HospitalPrivilegesRequest,
    AuditTrailRecordRequest
)
from v1.models.responses import (
    NPIResponse, ABMSResponse, NPDBResponse,
    ComprehensiveSANCTIONResponse, LADMFResponse,
    MedicalResponse, DCAResponse, MedicareResponse, EducationResponse,
    NewDEAVerificationResponse, HospitalPrivilegesResponse,
    InboxListResponse, InboxEmailResponse, InboxStatsResponse, EmailActionResponse,
    AuditTrailResponse, AuditTrailStepResponse
)
from v1.services.external.NPI import npi_service
from v1.services.external.DEA import dea_service
from v1.services.external.ABMS import abms_service
from v1.services.external.NPDB import npdb_service
from v1.services.external.SANCTION import sanction_service
from v1.services.external.LADMF import ladmf_service
from v1.services.external.MEDICAL import medical_service
from v1.services.external.DCA import dca_service
from v1.services.external.MEDICARE import medicare_service
from v1.services.external.EDUCATION import education_service
from v1.services.external.HOSPITAL_PRIVILEGES import hospital_privileges_service
from v1.services.database import DatabaseService
from v1.services.audit_trail_service import audit_trail_service
from v1.services.voice_service import voice_service, VoiceCallRequest as VoiceRequest
from v1.services.voice.audio_utils import VoiceSessionManager, AudioChunk
from v1.services.voice.gemini_voice_service import GeminiVoiceService, GeminiVoiceConfig
from v1.services.twilio_service import twilio_service

# Create router
router = APIRouter()

# Initialize database service
db_service = DatabaseService()

# WebSocket session management
logger = logging.getLogger(__name__)
active_websocket_sessions: Dict[str, Dict[str, Any]] = {}

class TwilioWebSocketHandler:
    """Handles WebSocket connections from Twilio media streams"""
    
    def __init__(self, websocket: WebSocket, session_id: str):
        self.websocket = websocket
        self.session_id = session_id
        self.call_sid: Optional[str] = None
        self.stream_sid: Optional[str] = None
        self.session_manager: Optional[VoiceSessionManager] = None
        self.gemini_service: Optional[GeminiVoiceService] = None
        self.is_active = False
        
    async def handle_connection(self):
        """Handle the WebSocket connection lifecycle"""
        try:
            await self.websocket.accept()
            logger.info(f"WebSocket connection accepted for session: {self.session_id}")
            
            # Initialize services
            await self._initialize_services()
            
            # Store session in global registry
            active_websocket_sessions[self.session_id] = {
                "handler": self,
                "start_time": time.time(),
                "status": "connected"
            }
            
            # Handle messages
            await self._message_loop()
            
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session: {self.session_id}")
        except Exception as e:
            logger.error(f"Error in WebSocket handler: {e}")
        finally:
            await self._cleanup()
    
    async def _initialize_services(self):
        """Initialize Gemini and session management services"""
        try:
            # Get call context from TwilioService
            call_context = twilio_service.get_call_context(self.session_id)
            
            # Use call context or default values
            if call_context:
                voice_name = call_context.get("voice_name", "Puck")
                system_instruction = call_context.get("system_instruction") or self._get_default_system_instruction(call_context.get("purpose", "test"))
                self.call_purpose = call_context.get("purpose", "test")
                self.phone_number = call_context.get("phone_number", "unknown")
            else:
                voice_name = "Puck"
                system_instruction = self._get_default_system_instruction("test")
                self.call_purpose = "test"
                self.phone_number = "unknown"
                logger.warning(f"No call context found for session: {self.session_id}")
            
            # Initialize Gemini service with dynamic configuration
            config = GeminiVoiceConfig(
                model_name="gemini-2.0-flash-live-001",
                voice_name=voice_name,
                system_instruction=system_instruction
            )
            
            self.gemini_service = GeminiVoiceService(config)
            await self.gemini_service.initialize()
            
            # Set up callbacks
            self.gemini_service.set_callbacks(
                on_audio_received=self._on_gemini_audio_received,
                on_turn_complete=self._on_gemini_turn_complete,
                on_interrupted=self._on_gemini_interrupted,
                on_error=self._on_gemini_error
            )
            
            logger.info(f"Services initialized for session: {self.session_id}, purpose: {self.call_purpose}")
            
        except Exception as e:
            logger.error(f"Failed to initialize services: {e}")
            raise
    
    async def _message_loop(self):
        """Main message processing loop"""
        while True:
            try:
                # Receive message from Twilio
                message = await self.websocket.receive_text()
                await self._handle_twilio_message(message)
                
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
                break
            except Exception as e:
                logger.error(f"Error in message loop: {e}")
                break
    
    async def _handle_twilio_message(self, message: str):
        """Handle incoming message from Twilio WebSocket"""
        try:
            data = json.loads(message)
            event_type = data.get("event")
            
            # logger.info(f"Received Twilio event: {event_type}")
            
            if event_type == "connected":
                logger.info("Twilio WebSocket connected")
                
            elif event_type == "start":
                # Extract call information
                start_data = data.get("start", {})
                self.call_sid = start_data.get("callSid")
                self.stream_sid = start_data.get("streamSid")  # This is what we need for audio!
                
                logger.info(f"Twilio media stream started for call: {self.call_sid}, stream: {self.stream_sid}")
                
                # Initialize session manager
                if self.call_sid:
                    self.session_manager = VoiceSessionManager(
                        self.session_id,
                        self.call_sid,
                        self.phone_number
                    )
                    
                    # Start Gemini session
                    await self.gemini_service.start_session(self.session_manager)
                    
                    # Send initial greeting
                    await self.gemini_service.send_initial_greeting()
                    
                    self.is_active = True
                
            elif event_type == "media":
                # Process incoming audio
                if self.session_manager and self.is_active:
                    media_data = data.get("media", {})
                    payload = media_data.get("payload")
                    
                    if payload:
                        timestamp = time.time()
                        audio_chunk = await self.session_manager.process_twilio_audio(payload, timestamp)
                        
                        # Send to Gemini
                        await self.gemini_service.send_audio_chunk(audio_chunk)
                        
            elif event_type == "stop":
                logger.info("Twilio media stream stopped")
                self.is_active = False
                
                if self.gemini_service:
                    await self.gemini_service.end_session()
                
        except Exception as e:
            logger.error(f"Error handling Twilio message: {e}")
    
    async def _on_gemini_audio_received(self, audio_chunk: AudioChunk):
        """Handle audio received from Gemini"""
        try:
            if not self.is_active or not self.stream_sid:
                return
                
            # Send audio back to Twilio
            media_message = {
                "event": "media",
                "streamSid": self.stream_sid,  # Use stream_sid, not call_sid!
                "media": {
                    "payload": audio_chunk.to_base64()
                }
            }
            
            await self.websocket.send_text(json.dumps(media_message))
            logger.info(f"Sent audio to Twilio: {len(audio_chunk.data)} bytes, format: {audio_chunk.format}")
            
        except Exception as e:
            logger.error(f"Error sending audio to Twilio: {e}")
    
    async def _on_gemini_turn_complete(self):
        """Handle Gemini turn completion"""
        logger.info("Gemini turn completed")
        
        # For test calls, end after first response
        if self.call_purpose == "test":
            logger.info("Test call completed, ending call")
            self.is_active = False
            
            # Send a mark message to indicate completion
            if self.stream_sid:
                mark_message = {
                    "event": "mark",
                    "streamSid": self.stream_sid,
                    "mark": {
                        "name": "call_completed"
                    }
                }
                await self.websocket.send_text(json.dumps(mark_message))
    
    async def _on_gemini_interrupted(self):
        """Handle Gemini interruption"""
        logger.info("Gemini was interrupted")
        if self.session_manager:
            await self.session_manager.clear_buffers()
    
    async def _on_gemini_error(self, error: Exception):
        """Handle Gemini error"""
        logger.error(f"Gemini error: {error}")
        self.is_active = False
    
    def _get_default_system_instruction(self, purpose: str) -> str:
        """Get default system instruction based on call purpose"""
        instructions = {
            "test": "You are a test voice assistant. Simply say 'Hi, this is a test call from Vera Platform. Have a great day!' and then end the call.",
            "education_verification": """You are a professional voice assistant for education verification calls. 
            Speak clearly and concisely. Keep responses brief and to the point. 
            You are calling to verify education credentials. Be polite and professional.""",
            "hospital_privileges": """You are a professional voice assistant for hospital privileges verification calls.
            Speak clearly and concisely. Keep responses brief and to the point.
            You are calling to verify hospital privileges and credentials. Be polite and professional."""
        }
        
        return instructions.get(purpose, instructions["test"])
    
    async def _cleanup(self):
        """Clean up resources"""
        try:
            if self.gemini_service:
                await self.gemini_service.end_session()
            
            # Remove from active sessions
            if self.session_id in active_websocket_sessions:
                del active_websocket_sessions[self.session_id]
            
            logger.info(f"WebSocket cleanup completed for session: {self.session_id}")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

# NPI Endpoints
@router.post(
    "/npi/search",
    response_model=NPIResponse,
    tags=["NPI"],
    summary="Search NPI by criteria (POST)",
    description="Search for National Provider Identifier using detailed search criteria via POST request. Optionally generate PDF document."
)
async def search_npi_post(
    request: NPIRequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> NPIResponse:
    """Search for NPI using detailed criteria via POST"""
    return await npi_service.lookup_npi(request, generate_pdf=generate_pdf, user_id=user_id)

# DEA Endpoints
@router.post(
    "/dea/verify",
    response_model=NewDEAVerificationResponse,
    tags=["DEA"],
    summary="DEA verification",
    description="Verify DEA practitioner with first name, last name, and DEA number (required), other fields optional. Optionally generate PDF document."
)
async def verify_dea_practitioner(
    request: DEAVerificationRequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> NewDEAVerificationResponse:
    """Verify DEA practitioner - requires first_name, last_name, and dea_number, other fields optional"""
    return await dea_service.verify_dea_practitioner(request, generate_pdf=generate_pdf, user_id=user_id)

# ABMS Endpoints
@router.post(
    "/abms/certification",
    response_model=ABMSResponse,
    tags=["ABMS"],
    summary="Lookup board certification",
    description="Retrieve board certification information by physician details. Optionally generate PDF document."
)
async def get_board_certification(
    request: ABMSRequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> ABMSResponse:
    """Lookup board certification information"""
    return await abms_service.lookup_board_certification(request, generate_pdf=generate_pdf, user_id=user_id)

# NPDB Endpoints
@router.post(
    "/npdb/verify",
    response_model=NPDBResponse,
    tags=["NPDB"],
    summary="Verify practitioner in NPDB",
    description="Perform comprehensive NPDB verification with detailed practitioner information. Optionally generate PDF document."
)
async def verify_npdb_practitioner(
    request: NPDBRequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> NPDBResponse:
    """Verify practitioner in NPDB with comprehensive information"""
    return await npdb_service.verify_practitioner(request, generate_pdf=generate_pdf, user_id=user_id)

# Sanctions Endpoints
@router.post(
    "/sanctioncheck",
    response_model=ComprehensiveSANCTIONResponse,
    tags=["Sanctions"],
    summary="Comprehensive sanctions check",
    description="Perform comprehensive sanctions check across multiple sources including OIG LEIE, SAM.gov, State Medicaid, and Medical Boards. Optionally generate PDF document."
)
async def comprehensive_sanctions_check(
    request: ComprehensiveSANCTIONRequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> ComprehensiveSANCTIONResponse:
    """Perform comprehensive sanctions check with detailed practitioner information"""
    return await sanction_service.comprehensive_sanctions_check(request, generate_pdf=generate_pdf, user_id=user_id)

# LADMF Endpoints
@router.post(
    "/ladmf/verify",
    response_model=LADMFResponse,
    tags=["LADMF"],
    summary="Verify death record in LADMF",
    description="Verify if an individual is deceased using the Limited Access Death Master File (SSA LADMF). Optionally generate PDF document."
)
async def verify_death_record(
    request: LADMFRequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> LADMFResponse:
    """Verify death record in LADMF with individual's information"""
    return await ladmf_service.verify_death_record(request, generate_pdf=generate_pdf, user_id=user_id)

# MEDICAL Endpoints
@router.post(
    "/medical/verify",
    response_model=MedicalResponse,
    tags=["Medical"],
    summary="Medi-Cal Managed Care + ORP verification",
    description="Perform combined verification against Medi-Cal Managed Care and ORP (Other Recognized Provider) networks. Optionally generate PDF document."
)
async def verify_medical_provider(
    request: MedicalRequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> MedicalResponse:
    """Verify provider in both Medi-Cal Managed Care and ORP systems"""
    return await medical_service.verify_provider(request, generate_pdf=generate_pdf, user_id=user_id)

# DCA Endpoints
@router.post(
    "/dca/verify",
    response_model=DCAResponse,
    tags=["DCA"],
    summary="DCA CA license verification",
    description="Verify California license through Department of Consumer Affairs (DCA). Optionally generate PDF document."
)
async def verify_dca_license(
    request: DCARequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> DCAResponse:
    """Verify CA license through DCA with provider information"""
    return await dca_service.verify_license(request, generate_pdf=generate_pdf, user_id=user_id)

# MEDICARE Endpoints
@router.post(
    "/medicare/verify",
    response_model=MedicareResponse,
    tags=["Medicare"],
    summary="Medicare enrollment verification",
    description="Verify if a provider is enrolled in Medicare and eligible to bill or order/refer. Optionally generate PDF document."
)
async def verify_medicare_provider(
    request: MedicareRequest,
    generate_pdf: bool = Query(False, description="Generate PDF document for verification results"),
    user_id: Optional[str] = Header(None, alias="X-User-ID", description="User ID for PDF generation (required if generate_pdf=true)")
) -> MedicareResponse:
    """Verify provider Medicare enrollment status across FFS and O&R datasets"""
    return await medicare_service.verify_provider(request, generate_pdf=generate_pdf, user_id=user_id)

# EDUCATION Endpoints
@router.post(
    "/education/verify",
    response_model=EducationResponse,
    tags=["Education"],
    summary="Education verification with transcript generation and audio conversion",
    description="Verify education credentials and generate transcript with audio conversion using AI services"
)
async def verify_education(request: EducationRequest) -> EducationResponse:
    """Initiate education verification process with transcript generation and audio conversion"""
    return await education_service.verify_education(request)

@router.get(
    "/education/result/{function_call_id}",
    tags=["Education"],
    summary="Get education verification result",
    description="Retrieve the result of an education verification job using the function call ID"
)
async def get_education_result(
    function_call_id: str = Path(..., description="Modal function call ID returned from the verify endpoint")
):
    """Get the result of an education verification job"""
    return await education_service.get_verification_result(function_call_id)

@router.get(
    "/education/audio/{storage_path:path}",
    tags=["Education"],
    summary="Download education verification audio file",
    description="Download the generated audio file using the storage path from the verification result"
)
async def download_education_audio(
    storage_path: str = Path(..., description="Storage path from the verification result (e.g., 2025-01-15/fc-123/audio.mp3)")
):
    """Download the generated audio file"""
    return await education_service.download_audio_file(storage_path)

# Hospital Privileges Endpoints
@router.post(
    "/hospital-privileges/verify",
    response_model=HospitalPrivilegesResponse,
    tags=["Hospital Privileges"],
    summary="Hospital privileges verification with transcript generation and audio conversion",
    description="Verify hospital privileges and generate transcript with audio conversion using AI services"
)
async def verify_hospital_privileges(request: HospitalPrivilegesRequest) -> HospitalPrivilegesResponse:
    """Initiate hospital privileges verification process with transcript generation and audio conversion"""
    return await hospital_privileges_service.verify_hospital_privileges(request)

@router.get(
    "/hospital-privileges/result/{function_call_id}",
    tags=["Hospital Privileges"],
    summary="Get hospital privileges verification result",
    description="Retrieve the result of a hospital privileges verification job using the function call ID"
)
async def get_hospital_privileges_result(
    function_call_id: str = Path(..., description="Modal function call ID returned from the verify endpoint")
):
    """Get the result of a hospital privileges verification job"""
    return await hospital_privileges_service.get_verification_result(function_call_id)

@router.get(
    "/hospital-privileges/audio/{storage_path:path}",
    tags=["Hospital Privileges"],
    summary="Download hospital privileges verification audio file",
    description="Download the generated audio file using the storage path from the verification result"
)
async def download_hospital_privileges_audio(
    storage_path: str = Path(..., description="Storage path from the verification result (e.g., 2025-01-15/fc-123/audio.mp3)")
):
    """Download the generated audio file"""
    return await hospital_privileges_service.download_audio_file(storage_path)

# Inbox Email Endpoints
@router.get(
    "/inbox/emails",
    response_model=InboxListResponse,
    tags=["Inbox"],
    summary="Get inbox emails",
    description="Retrieve paginated list of inbox emails with optional filtering and search"
)
async def get_inbox_emails(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of emails per page"),
    status: str = Query(None, description="Filter by email status (unread, read, archived, flagged, spam)"),
    verification_type: str = Query(None, description="Filter by verification type (education, hospital_privileges, etc.)"),
    practitioner_id: int = Query(None, description="Filter by practitioner ID"),
    search: str = Query(None, description="Search in subject, sender name, or email body")
) -> InboxListResponse:
    """Get paginated list of inbox emails with optional filtering"""
    return await db_service.get_inbox_emails(
        page=page,
        page_size=page_size,
        status=status,
        verification_type=verification_type,
        practitioner_id=practitioner_id,
        search_query=search
    )

@router.get(
    "/inbox/emails/{email_id}",
    response_model=InboxEmailResponse,
    tags=["Inbox"],
    summary="Get specific email",
    description="Retrieve a specific email by its ID"
)
async def get_inbox_email(
    email_id: int = Path(..., description="Email ID")
) -> InboxEmailResponse:
    """Get a specific email by ID"""
    return await db_service.get_inbox_email_by_id(email_id)

@router.post(
    "/inbox/emails/{email_id}/read",
    response_model=EmailActionResponse,
    tags=["Inbox"],
    summary="Mark email as read",
    description="Mark a specific email as read"
)
async def mark_email_as_read(
    email_id: int = Path(..., description="Email ID")
) -> EmailActionResponse:
    """Mark an email as read"""
    return await db_service.mark_email_as_read(email_id)

@router.post(
    "/inbox/emails/{email_id}/status/{new_status}",
    response_model=EmailActionResponse,
    tags=["Inbox"],
    summary="Update email status",
    description="Update the status of a specific email"
)
async def update_email_status(
    email_id: int = Path(..., description="Email ID"),
    new_status: str = Path(..., description="New status (unread, read, archived, flagged, spam)")
) -> EmailActionResponse:
    """Update email status"""
    return await db_service.update_email_status(email_id, new_status)

@router.delete(
    "/inbox/emails/{email_id}",
    response_model=EmailActionResponse,
    tags=["Inbox"],
    summary="Delete email",
    description="Delete a specific email"
)
async def delete_email(
    email_id: int = Path(..., description="Email ID")
) -> EmailActionResponse:
    """Delete an email"""
    return await db_service.delete_email(email_id)

@router.get(
    "/inbox/stats",
    response_model=InboxStatsResponse,
    tags=["Inbox"],
    summary="Get inbox statistics",
    description="Get comprehensive inbox statistics including counts by status, verification type, and recent activity"
)
async def get_inbox_stats() -> InboxStatsResponse:
    """Get inbox statistics"""
    return await db_service.get_inbox_stats()

# Audit Trail Endpoints
@router.post(
    "/audit-trail/record",
    response_model=AuditTrailStepResponse,
    tags=["Audit Trail"],
    summary="Record an audit trail change",
    description="Record a state change in the audit trail for an application verification step"
)
async def record_audit_trail_change(request: AuditTrailRecordRequest) -> AuditTrailStepResponse:
    """Record a new audit trail change"""
    from v1.models.database import AuditTrailStatus
    
    entry = await audit_trail_service.record_change(
        application_id=request.application_id,
        step_key=request.step_key,
        status=AuditTrailStatus(request.status),
        data=request.data,
        changed_by=request.changed_by,
        notes=request.notes
    )
    
    # Convert to response model
    from v1.models.responses import AuditTrailEntryResponse
    entry_response = AuditTrailEntryResponse(
        application_id=entry.application_id,
        step_key=entry.step_key,
        status=entry.status.value if hasattr(entry.status, 'value') else entry.status,
        data=entry.data,
        notes=entry.notes,
        changed_by=entry.changed_by,
        timestamp=entry.timestamp,
        previous_status=entry.previous_status.value if entry.previous_status and hasattr(entry.previous_status, 'value') else entry.previous_status,
        previous_data=entry.previous_data
    )
    
    return AuditTrailStepResponse(
        status="success",
        message="Audit trail change recorded successfully",
        entry=entry_response
    )

@router.get(
    "/audit-trail/{application_id}",
    response_model=AuditTrailResponse,
    tags=["Audit Trail"],
    summary="Get application audit trail",
    description="Get the complete audit trail for an application"
)
async def get_application_audit_trail(
    application_id: int = Path(..., description="Application ID"),
    step_key: str = Query(None, description="Filter by step key"),
    limit: int = Query(None, description="Limit number of entries returned")
) -> AuditTrailResponse:
    """Get the complete audit trail for an application"""
    from v1.models.responses import AuditTrailEntryResponse
    
    entries = await audit_trail_service.get_application_audit_trail(
        application_id=application_id,
        step_key=step_key,
        limit=limit
    )
    
    # Convert to response models
    entry_responses = []
    for entry in entries:
        entry_response = AuditTrailEntryResponse(
            application_id=entry.application_id,
            step_key=entry.step_key,
            status=entry.status.value if hasattr(entry.status, 'value') else entry.status,
            data=entry.data,
            notes=entry.notes,
            changed_by=entry.changed_by,
            timestamp=entry.timestamp,
            previous_status=entry.previous_status.value if entry.previous_status and hasattr(entry.previous_status, 'value') else entry.previous_status,
            previous_data=entry.previous_data
        )
        entry_responses.append(entry_response)
    
    # Calculate summary statistics
    unique_steps = len(set(entry.step_key for entry in entries))
    latest_activity = max((entry.timestamp for entry in entries), default=None)
    
    return AuditTrailResponse(
        status="success",
        message=f"Retrieved {len(entries)} audit trail entries",
        application_id=application_id,
        entries=entry_responses,
        total_entries=len(entries),
        unique_steps=unique_steps,
        latest_activity=latest_activity
    )

@router.get(
    "/audit-trail/{application_id}/step/{step_key}",
    response_model=AuditTrailResponse,
    tags=["Audit Trail"],
    summary="Get step history",
    description="Get the complete history of changes for a specific verification step"
)
async def get_step_history(
    application_id: int = Path(..., description="Application ID"),
    step_key: str = Path(..., description="Step key")
) -> AuditTrailResponse:
    """Get the complete history of changes for a specific step"""
    from v1.models.responses import AuditTrailEntryResponse
    
    entries = await audit_trail_service.get_step_history(application_id, step_key)
    
    # Convert to response models
    entry_responses = []
    for entry in entries:
        entry_response = AuditTrailEntryResponse(
            application_id=entry.application_id,
            step_key=entry.step_key,
            status=entry.status.value if hasattr(entry.status, 'value') else entry.status,
            data=entry.data,
            notes=entry.notes,
            changed_by=entry.changed_by,
            timestamp=entry.timestamp,
            previous_status=entry.previous_status.value if entry.previous_status and hasattr(entry.previous_status, 'value') else entry.previous_status,
            previous_data=entry.previous_data
        )
        entry_responses.append(entry_response)
    
    latest_activity = max((entry.timestamp for entry in entries), default=None)
    
    return AuditTrailResponse(
        status="success",
        message=f"Retrieved {len(entries)} changes for step {step_key}",
        application_id=application_id,
        entries=entry_responses,
        total_entries=len(entries),
        unique_steps=1,
        latest_activity=latest_activity
    )

@router.get(
    "/audit-trail/{application_id}/step/{step_key}/latest",
    response_model=AuditTrailStepResponse,
    tags=["Audit Trail"],
    summary="Get latest step status",
    description="Get the latest status and details of a specific verification step"
)
async def get_latest_step_status(
    application_id: int = Path(..., description="Application ID"),
    step_key: str = Path(..., description="Step key")
) -> AuditTrailStepResponse:
    """Get the latest status of a specific step"""
    from v1.models.responses import AuditTrailEntryResponse
    
    entry = await audit_trail_service.get_latest_step_status(application_id, step_key)
    
    if not entry:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"No audit trail entries found for step {step_key} in application {application_id}"
        )
    
    # Convert to response model
    entry_response = AuditTrailEntryResponse(
        application_id=entry.application_id,
        step_key=entry.step_key,
        status=entry.status.value if hasattr(entry.status, 'value') else entry.status,
        data=entry.data,
        notes=entry.notes,
        changed_by=entry.changed_by,
        timestamp=entry.timestamp,
        previous_status=entry.previous_status.value if entry.previous_status and hasattr(entry.previous_status, 'value') else entry.previous_status,
        previous_data=entry.previous_data
    )
    
    return AuditTrailStepResponse(
        status="success",
        message=f"Latest status for step {step_key} retrieved successfully",
        entry=entry_response
    )

@router.get("/voice/test/{phone_number}")
async def test_voice_call(phone_number: str):
    """Test endpoint to make a simple voice call that says 'Hi'"""
    try:
        result = await voice_service.make_test_call(phone_number)
        return {
            "success": True,
            "call_sid": result.call_sid,
            "session_id": result.session_id,
            "status": result.status,
            "duration_seconds": result.duration_seconds,
            "total_turns": result.total_turns,
            "call_details": result.call_details
        }
    except Exception as e:
        from fastapi import HTTPException
        from logging import getLogger
        logger = getLogger(__name__)
        logger.error(f"Test voice call failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/call")
async def make_voice_call(request: VoiceRequest):
    """Make an outbound voice call with custom parameters"""
    try:
        result = await voice_service.make_voice_call(request)
        return {
            "success": True,
            "call_sid": result.call_sid,
            "session_id": result.session_id,
            "status": result.status,
            "duration_seconds": result.duration_seconds,
            "total_turns": result.total_turns,
            "call_details": result.call_details
        }
    except Exception as e:
        from fastapi import HTTPException
        from logging import getLogger
        logger = getLogger(__name__)
        logger.error(f"Voice call failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/education-verification")
async def make_education_verification_call(
    phone_number: str,
    student_name: str,
    institution: str,
    degree_type: str,
    graduation_year: int
):
    """Make an education verification call"""
    try:
        result = await voice_service.make_education_verification_call(
            phone_number=phone_number,
            student_name=student_name,
            institution=institution,
            degree_type=degree_type,
            graduation_year=graduation_year
        )
        return {
            "success": True,
            "call_sid": result.call_sid,
            "session_id": result.session_id,
            "status": result.status,
            "duration_seconds": result.duration_seconds,
            "total_turns": result.total_turns,
            "call_details": result.call_details
        }
    except Exception as e:
        from fastapi import HTTPException
        from logging import getLogger
        logger = getLogger(__name__)
        logger.error(f"Education verification call failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for Twilio media streams
@router.websocket("/media-stream/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for Twilio media streams"""
    logger.info(f"New WebSocket connection for session: {session_id}")
    
    handler = TwilioWebSocketHandler(websocket, session_id)
    await handler.handle_connection()

# WebSocket utility endpoints
@router.get("/websocket/health")
async def websocket_health_check():
    """Health check endpoint for WebSocket functionality"""
    return {
        "status": "healthy",
        "active_sessions": len(active_websocket_sessions),
        "timestamp": time.time()
    }

@router.get("/websocket/sessions")
async def get_active_websocket_sessions():
    """Get information about active WebSocket sessions"""
    session_info = {}
    for session_id, session_data in active_websocket_sessions.items():
        session_info[session_id] = {
            "start_time": session_data["start_time"],
            "status": session_data["status"],
            "duration": time.time() - session_data["start_time"]
        }
    return {"active_sessions": session_info}
