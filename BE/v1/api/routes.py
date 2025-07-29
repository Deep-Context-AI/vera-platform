from fastapi import APIRouter, Path, Query, Header, WebSocket, WebSocketDisconnect
from typing import Optional, Dict, Any
import asyncio
import json
import logging
import time
from dataclasses import dataclass

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
db_service = DatabaseService()
from v1.services.audit_trail_service import audit_trail_service
from v1.services.voice_service import voice_service, VoiceCallRequest as VoiceRequest
from v1.services.voice.audio_utils import VoiceSessionManager, AudioChunk
from v1.services.voice.gemini_voice_service import GeminiVoiceService
from v1.services.twilio_service import twilio_service

# Create router
router = APIRouter()

# Track active WebSocket sessions
active_websocket_sessions: Dict[str, "TwilioWebSocketHandler"] = {}

logger = logging.getLogger(__name__)


@dataclass
class SessionManager:
    """Simple session manager for Gemini voice service"""
    session_id: str
    call_sid: str
    phone_number: str = "unknown"
    call_purpose: str = "test"


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
        self.message_count = 0  # Track total messages received
        self.phone_number = "unknown"
        self.call_purpose = "test"
        
        # Combined audio recording for full conversation
        self.combined_audio_recording = {
            "incoming_chunks": [],  # Raw Twilio audio (μ-law, 8kHz)
            "outgoing_chunks": [],  # Gemini audio sent to Twilio (μ-law, 8kHz)
            "recording_enabled": True
        }

    async def handle_connection(self):
        """Handle the WebSocket connection lifecycle"""
        try:
            # Accept the connection
            await self.websocket.accept()
            logger.info(f"WebSocket connection accepted for session: {self.session_id}")
            
            # Add to active sessions
            active_websocket_sessions[self.session_id] = self
            
            # Start message processing
            await self._message_loop()
            
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session: {self.session_id}")
        except Exception as e:
            logger.error(f"Error in WebSocket handler: {e}")
        finally:
            # Clean up
            await self._cleanup()

    async def _initialize_services(self):
        """Initialize voice services"""
        try:
            # Retrieve call context from twilio_service
            call_context = twilio_service.get_call_context(self.session_id)
            
            if call_context:
                # Update instance variables with context from the API call
                self.phone_number = call_context.get("phone_number", "unknown")
                self.call_purpose = call_context.get("purpose", "test")
                system_instruction = call_context.get("system_instruction")
                voice_name = call_context.get("voice_name", "Kore")
                simulate_initial = call_context.get("simulate_initial", False)
                
                logger.info(f"Retrieved call context for session {self.session_id}: purpose={self.call_purpose}, phone={self.phone_number}, simulate_initial={simulate_initial}")
            else:
                # Fallback to defaults if no context found
                system_instruction = None
                voice_name = "Kore"
                simulate_initial = False
                logger.warning(f"No call context found for session {self.session_id}, using defaults")
            
            # Initialize Gemini voice service with custom configuration
            from v1.services.voice.gemini_voice_service import GeminiVoiceConfig
            
            gemini_config = GeminiVoiceConfig(
                voice_name=voice_name,
                system_instruction=system_instruction,
                simulate_initial=simulate_initial
            )
            
            self.gemini_service = GeminiVoiceService(config=gemini_config)
            if not await self.gemini_service.initialize():
                raise Exception("Failed to initialize Gemini service")
            
            # Set up callbacks
            self.gemini_service.set_callbacks(
                on_audio_received=self._on_gemini_audio_received,
                on_turn_complete=self._on_gemini_turn_complete,
                on_error=self._on_gemini_error
            )
            
            # Initialize voice session manager
            self.session_manager = VoiceSessionManager(
                session_id=self.session_id,
                call_sid=self.call_sid,
                phone_number=self.phone_number
            )
            
            # Create simple session manager for Gemini service
            simple_session_manager = SessionManager(
                session_id=self.session_id,
                call_sid=self.call_sid,
                phone_number=self.phone_number,
                call_purpose=self.call_purpose
            )
            
            # Start Gemini session
            if not await self.gemini_service.start_session(simple_session_manager):
                raise Exception("Failed to start Gemini session")
            
            logger.info(f"Services initialized for session: {self.session_id}, purpose: {self.call_purpose}")
            
        except Exception as e:
            logger.error(f"Failed to initialize services: {e}")
            raise

    async def _message_loop(self):
        """Main message processing loop"""
        try:
            while True:
                # Receive message from Twilio
                message = await self.websocket.receive_text()
                self.message_count += 1
                
                try:
                    data = json.loads(message)
                    await self._handle_twilio_message(data)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON message: {e}")
                    logger.error(f"Raw message: {message}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected after {self.message_count} messages")
        except Exception as e:
            logger.error(f"Error in message loop after {self.message_count} messages: {e}")
    
    async def _handle_twilio_message(self, data: Dict[str, Any]):
        """Handle incoming messages from Twilio WebSocket"""
        try:
            event_type = data.get("event")
            
            # Only log non-media events and important media events
            if event_type != "media":
                logger.info(f"📞 Twilio event: {event_type}")
            
            if event_type == "connected":
                logger.info("Twilio WebSocket connected")
                
            elif event_type == "start":
                # Extract call information
                start_data = data.get("start", {})
                self.call_sid = start_data.get("callSid")
                self.stream_sid = start_data.get("streamSid")  # This is what we need for audio!
                
                logger.info(f"🎬 Twilio media stream started for call: {self.call_sid}, stream: {self.stream_sid}")
                
                # Initialize services now that we have call information
                await self._initialize_services()
                
                # Mark session as active
                self.is_active = True
                logger.info(f"✅ Session fully initialized: is_active={self.is_active}")
                
            elif event_type == "media":
                # Handle media events using the simplified method
                await self._handle_media_event(data)
                        
            elif event_type == "stop":
                logger.info("🛑 Twilio media stream stopped")
                self.is_active = False
                
                # End the Gemini session
                if self.gemini_service:
                    await self.gemini_service.end_session()
                    
            else:
                logger.debug(f"Unhandled Twilio event type: {event_type}")
                
        except Exception as e:
            logger.error(f"Error handling Twilio message: {e}")
            logger.error(f"Message data: {data}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

    async def _on_gemini_audio_received(self, audio_chunk: AudioChunk):
        """Handle audio received from Gemini"""
        try:
            # Record outgoing audio for combined recording
            if self.combined_audio_recording["recording_enabled"]:
                import time
                self.combined_audio_recording["outgoing_chunks"].append({
                    "data": audio_chunk.data,
                    "timestamp": time.time(),
                    "audio_timestamp": audio_chunk.timestamp,
                    "type": "outgoing"
                })
            
            # Send audio to Twilio in the correct format
            if self.stream_sid:
                media_message = {
                    "event": "media",
                    "streamSid": self.stream_sid,
                    "media": {
                        "payload": audio_chunk.to_base64()
                    }
                }
                await self.websocket.send_text(json.dumps(media_message))
            else:
                logger.warning("Cannot send audio - no stream_sid available")
            
        except Exception as e:
            logger.error(f"Error sending audio to Twilio: {e}")

    async def _on_gemini_turn_complete(self):
        """Handle Gemini turn completion"""
        logger.info(f"Gemini turn completed - session still active: {self.is_active}, message count: {self.message_count}")
        
        # Continue listening for user input instead of ending the call
        logger.info("Turn completed - continuing to listen for user input")

    async def _on_gemini_error(self, error: Exception):
        """Handle Gemini error"""
        logger.error(f"Gemini error: {error}")
        
        # Don't disable the session for recoverable errors like API signature issues
        # Only disable for critical errors that indicate the session is fundamentally broken
        error_message = str(error).lower()
        
        if any(keyword in error_message for keyword in [
            "connection", "network", "timeout", "authentication", "authorization"
        ]):
            # Critical errors that require session restart
            logger.error("Critical Gemini error - disabling session")
            self.is_active = False
        else:
            # Recoverable errors (like API signature issues) - log but continue
            logger.warning(f"Recoverable Gemini error: {error}")

    async def _handle_media_event(self, data: Dict[str, Any]):
        """Handle media events from Twilio"""
        try:
            if not self.session_manager or not self.is_active:
                logger.warning(f"Received media event but session not ready - session_manager: {self.session_manager is not None}, is_active: {self.is_active}")
                return
            
            # Extract media data
            media_data = data.get("media", {})
            media_payload = media_data.get("payload", "")
            media_timestamp = media_data.get("timestamp", 0)
            
            # Check if payload is empty
            if not media_payload:
                logger.warning("Empty media payload received")
                return
            
            # Check if payload is changing (detect repeated payloads)
            if not hasattr(self, '_last_payload_hash'):
                self._last_payload_hash = hash(media_payload)
                self._payload_repeat_count = 0
            else:
                current_hash = hash(media_payload)
                if current_hash == self._last_payload_hash:
                    self._payload_repeat_count += 1
                else:
                    self._last_payload_hash = current_hash
                    self._payload_repeat_count = 0
            
            # Send RAW Twilio audio directly to Gemini (no processing)
            if self.gemini_service:
                try:
                    # Create a simple audio chunk with raw data
                    import base64
                    raw_audio_data = base64.b64decode(media_payload)
                    
                    # Record incoming audio for combined recording
                    if self.combined_audio_recording["recording_enabled"]:
                        import time
                        self.combined_audio_recording["incoming_chunks"].append({
                            "data": raw_audio_data,
                            "timestamp": time.time(),
                            "media_timestamp": float(media_timestamp),
                            "type": "incoming"
                        })
                    
                    # Create AudioChunk with raw Twilio data
                    from v1.services.voice.audio_utils import AudioChunk, AudioFormat
                    raw_audio_chunk = AudioChunk(
                        data=raw_audio_data,
                        format=AudioFormat.TWILIO_MULAW,  # Keep original format
                        sample_rate=8000,  # Twilio's sample rate
                        timestamp=float(media_timestamp),
                        sequence_id=getattr(self, '_sequence_counter', 0)
                    )
                    
                    # Increment sequence counter
                    self._sequence_counter = getattr(self, '_sequence_counter', 0) + 1
                    
                    success = await self.gemini_service.send_raw_audio_chunk(raw_audio_chunk)
                    if not success:
                        logger.error(f"❌ Failed to send raw audio to Gemini")
                        
                except Exception as e:
                    logger.error(f"Error creating raw audio chunk: {e}")
            else:
                logger.error("No Gemini service available to send audio")
                
        except Exception as e:
            logger.error(f"Error handling media event: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

    async def _cleanup(self):
        """Cleanup resources"""
        try:
            # End Gemini session
            if self.gemini_service:
                await self.gemini_service.end_session()
            
            # Save combined audio recording
            if self.combined_audio_recording["recording_enabled"]:
                await self._save_combined_audio_recording()
            
            # Save session audio for debugging (individual files)
            if self.session_manager:
                logger.info("Saving session audio for debugging...")
                result = await self.session_manager.save_session_audio()
                logger.info(f"Audio save result: {result}")
            
            # Remove from active sessions
            if self.session_id in active_websocket_sessions:
                del active_websocket_sessions[self.session_id]
            
            logger.info(f"WebSocket cleanup completed for session: {self.session_id}")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    async def _save_combined_audio_recording(self):
        """Save combined audio recording (incoming + outgoing) as a single MP3 file"""
        try:
            if not self.combined_audio_recording["incoming_chunks"] and not self.combined_audio_recording["outgoing_chunks"]:
                logger.info("No audio chunks recorded for combined audio file")
                return
            
            # Prepare combined audio data
            combined_data = {
                "session_id": self.session_id,
                "call_sid": self.call_sid or "unknown",
                "phone_number": self.phone_number,
                "call_purpose": self.call_purpose,
                "incoming_chunks": self.combined_audio_recording["incoming_chunks"],
                "outgoing_chunks": self.combined_audio_recording["outgoing_chunks"],
                "total_incoming": len(self.combined_audio_recording["incoming_chunks"]),
                "total_outgoing": len(self.combined_audio_recording["outgoing_chunks"])
            }
            
            # Try to import Modal components
            try:
                import modal
                from v1.config.modal_config import app
                
                # Call Modal function to create combined audio file
                result = await _save_combined_audio_to_volume.remote.aio(combined_data)
                logger.info(f"Combined audio save result: {result}")
                
            except ImportError:
                logger.warning("Modal not available, skipping combined audio save")
            except Exception as e:
                logger.error(f"Failed to save combined audio: {e}")
                
        except Exception as e:
            logger.error(f"Error saving combined audio recording: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

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
    graduation_year: int,
    simulate_initial: bool = False,
    npi: str = None,
    last_4_ssn: str = None,
    dob: str = None
):
    """Make an education verification call with optional provider context"""
    try:
        result = await voice_service.make_education_verification_call(
            phone_number=phone_number,
            student_name=student_name,
            institution=institution,
            degree_type=degree_type,
            graduation_year=graduation_year,
            simulate_initial=simulate_initial,
            npi=npi,
            last_4_ssn=last_4_ssn,
            dob=dob
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

@router.get("/voice/debug/audio/{session_id}")
async def get_voice_debug_audio(session_id: str):
    """Get debug audio files for a voice session"""
    try:
        import modal
        from datetime import datetime
        
        # Get the voice debug volume
        debug_volume = modal.Volume.from_name("voice-debug-audio")
        
        # Try to find the session directory
        today = datetime.utcnow().strftime("%Y-%m-%d")
        session_dir = f"voice_debug/{today}/{session_id}"
        
        # List files in the session directory
        try:
            files = list(debug_volume.listdir(f"/{session_dir}"))
            
            # Get metadata if it exists
            metadata_path = f"/{session_dir}/session_metadata.json"
            metadata = None
            
            if "session_metadata.json" in [f.name for f in files]:
                with debug_volume.open(metadata_path, "r") as f:
                    metadata = json.loads(f.read())
            
            return {
                "status": "success",
                "session_id": session_id,
                "storage_path": session_dir,
                "files": [{"name": f.name, "size": f.size} for f in files],
                "metadata": metadata
            }
            
        except Exception as e:
            return {
                "status": "not_found",
                "message": f"Session audio not found: {e}",
                "session_id": session_id
            }
            
    except Exception as e:
        logger.error(f"Error retrieving debug audio: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@router.get("/voice/debug/audio/{session_id}/download/{filename}")
async def download_voice_debug_audio(session_id: str, filename: str):
    """Download a specific debug audio file"""
    try:
        import modal
        import tempfile
        import os
        from fastapi.responses import FileResponse
        from datetime import datetime
        
        # Get the voice debug volume
        debug_volume = modal.Volume.from_name("voice-debug-audio")
        
        # Construct file path
        today = datetime.utcnow().strftime("%Y-%m-%d")
        session_dir = f"voice_debug/{today}/{session_id}"
        file_path = f"/{session_dir}/{filename}"
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}") as temp_file:
            temp_path = temp_file.name
        
        try:
            # Download from volume - use the correct path format
            debug_volume.get_file(file_path, temp_path)
            
            # Determine media type based on filename
            if filename.endswith('.json'):
                media_type = "application/json"
            elif filename.endswith('.raw'):
                media_type = "audio/raw"
            else:
                media_type = "application/octet-stream"
            
            return FileResponse(
                path=temp_path,
                filename=filename,
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "X-Session-ID": session_id
                }
            )
            
        except Exception as download_error:
            # Clean up temp file if download failed
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise download_error
            
    except Exception as e:
        logger.error(f"Error downloading debug audio: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

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
    for session_id, handler in active_websocket_sessions.items():
        session_info[session_id] = {
            "session_id": session_id,
            "call_sid": handler.call_sid,
            "is_active": handler.is_active,
            "message_count": handler.message_count
        }
    return {"active_sessions": session_info}


# Modal function to save combined audio recording (only if Modal is available)
try:
    import modal
    from v1.config.modal_config import app
    MODAL_AVAILABLE = True
    # Reference the same volume used for other audio files
    audio_volume = modal.Volume.from_name("voice-debug-audio", create_if_missing=True)
    
    @app.function(
        timeout=600,
        volumes={"/audio_storage": audio_volume}
    )
    def _save_combined_audio_to_volume(combined_data: Dict[str, Any]) -> Dict[str, Any]:
        """Modal function to create combined audio file (incoming + outgoing) as MP3"""
        try:
            import os
            import io
            import audioop
            from datetime import datetime
            from pydub import AudioSegment
            import logging
            
            # Import helper functions from audio_utils
            from v1.services.voice.audio_utils import convert_to_mp3
            
            logger = logging.getLogger(__name__)
            
            # Create directory structure
            today = datetime.utcnow().strftime("%Y-%m-%d")
            session_dir = f"/audio_storage/voice_debug/{today}/{combined_data['session_id']}"
            os.makedirs(session_dir, exist_ok=True)
            
            # Collect and sort all audio chunks by timestamp
            all_chunks = []
            
            # Add incoming chunks (user speech)
            for chunk in combined_data.get('incoming_chunks', []):
                all_chunks.append({
                    "data": chunk["data"],
                    "timestamp": chunk["timestamp"],
                    "type": "incoming",
                    "source": "user"
                })
            
            # Add outgoing chunks (Gemini speech) 
            for chunk in combined_data.get('outgoing_chunks', []):
                all_chunks.append({
                    "data": chunk["data"],
                    "timestamp": chunk["timestamp"],
                    "type": "outgoing",
                    "source": "assistant"
                })
            
            # Sort by timestamp to create chronological conversation
            all_chunks.sort(key=lambda x: x["timestamp"])
            
            if not all_chunks:
                return {"status": "skipped", "message": "No audio chunks to process"}
            
            # Process audio chunks and combine them
            combined_audio_segments = []
            
            for i, chunk in enumerate(all_chunks):
                try:
                    audio_data = chunk["data"]
                    chunk_type = chunk["type"]
                    
                    # Both incoming and outgoing are μ-law format, use consistent conversion
                    # Convert μ-law to PCM then create AudioSegment
                    pcm_data = audioop.ulaw2lin(audio_data, 2)  # 2 = 16-bit
                    audio_segment = AudioSegment(
                        data=pcm_data,
                        sample_width=2,  # 16-bit
                        frame_rate=8000,  # 8kHz for both Twilio and converted Gemini audio
                        channels=1
                    )
                    
                    # Add a small gap between speakers for clarity (100ms)
                    if i > 0 and all_chunks[i-1]["source"] != chunk["source"]:
                        silence = AudioSegment.silent(duration=100)  # 100ms silence
                        combined_audio_segments.append(silence)
                    
                    combined_audio_segments.append(audio_segment)
                    
                except Exception as e:
                    logger.error(f"Error processing audio chunk {i}: {e}")
                    continue
            
            if not combined_audio_segments:
                return {"status": "failed", "message": "No valid audio segments processed"}
            
            # Combine all audio segments
            combined_audio = combined_audio_segments[0]
            for segment in combined_audio_segments[1:]:
                combined_audio += segment
            
            # Export to MP3 with fallback to WAV (reuse conversion logic pattern)
            try:
                # Try MP3 first
                combined_filename = "conversation_combined.mp3"
                combined_path = f"{session_dir}/{combined_filename}"
                
                mp3_buffer = io.BytesIO()
                combined_audio.export(mp3_buffer, format="mp3", bitrate="128k")
                mp3_buffer.seek(0)
                
                with open(combined_path, "wb") as f:
                    f.write(mp3_buffer.read())
                
                file_format = "MP3"
                logger.info(f"Successfully created combined MP3 audio file")
                
            except Exception as mp3_error:
                logger.warning(f"MP3 export failed: {mp3_error}, trying WAV")
                # Fallback to WAV
                combined_filename = "conversation_combined.wav"
                combined_path = f"{session_dir}/{combined_filename}"
                
                combined_audio.export(combined_path, format="wav")
                file_format = "WAV"
                logger.info(f"Successfully created combined WAV audio file")
            
            # Create metadata file for the combined recording
            metadata = {
                "session_id": combined_data['session_id'],
                "call_sid": combined_data['call_sid'],
                "phone_number": combined_data['phone_number'],
                "call_purpose": combined_data['call_purpose'],
                "created_at": datetime.utcnow().isoformat(),
                "combined_file": {
                    "filename": combined_filename,
                    "format": file_format,
                    "duration_seconds": len(combined_audio) / 1000.0,
                    "total_chunks_processed": len(all_chunks),
                    "incoming_chunks": combined_data['total_incoming'],
                    "outgoing_chunks": combined_data['total_outgoing']
                },
                "description": "Combined conversation audio with user input and assistant responses"
            }
            
            metadata_path = f"{session_dir}/combined_audio_metadata.json"
            import json
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
            
            # Commit changes to volume
            audio_volume.commit()
            
            return {
                "status": "success",
                "session_id": combined_data['session_id'],
                "storage_path": f"voice_debug/{today}/{combined_data['session_id']}",
                "combined_file": {
                    "filename": combined_filename,
                    "format": file_format,
                    "storage_path": f"voice_debug/{today}/{combined_data['session_id']}/{combined_filename}",
                    "duration_seconds": len(combined_audio) / 1000.0
                },
                "chunks_processed": len(all_chunks),
                "incoming_chunks": combined_data['total_incoming'],
                "outgoing_chunks": combined_data['total_outgoing']
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating combined audio file: {e}")
            return {"status": "failed", "message": str(e)}

except ImportError:
    MODAL_AVAILABLE = False
    
    # Dummy function when Modal is not available
    def _save_combined_audio_to_volume(combined_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "skipped", "message": "Modal not available"}
