"""
Voice Service - Integration layer for voice calling functionality

This service provides a clean interface for making voice calls using the
direct Twilio integration with WebSocket-based Gemini Live API.
"""

import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict

from v1.services.twilio_service import twilio_service, CallRequest
from v1.exceptions.api import ExternalServiceException

logger = logging.getLogger(__name__)

@dataclass
class VoiceCallRequest:
    """Request for making a voice call"""
    phone_number: str
    purpose: str = "education_verification"
    caller_name: str = "Vera Platform"
    system_instruction: Optional[str] = None
    voice_name: str = "Kore"
    max_duration_minutes: int = 10
    simulate_initial: bool = False

@dataclass
class VoiceCallResponse:
    """Response from voice call"""
    call_sid: str
    session_id: str
    status: str
    duration_seconds: float
    total_turns: int
    error_message: Optional[str] = None
    call_details: Optional[Dict[str, Any]] = None

class VoiceService:
    """Service for managing voice calls"""
    
    def __init__(self):
        self.timeout = 1800.0  # 30 minutes
    
    async def make_voice_call(self, request: VoiceCallRequest) -> VoiceCallResponse:
        """
        Make an outbound voice call with Gemini Live API
        
        Args:
            request: VoiceCallRequest containing call parameters
            
        Returns:
            VoiceCallResponse with call results
            
        Raises:
            ExternalServiceException: If call fails
        """
        try:
            logger.info(f"Starting voice call to: {request.phone_number}")
            
            # Convert to TwilioService CallRequest
            call_request = CallRequest(
                phone_number=request.phone_number,
                purpose=request.purpose,
                caller_name=request.caller_name,
                system_instruction=request.system_instruction,
                voice_name=request.voice_name,
                max_duration_minutes=request.max_duration_minutes
            )
            
            # Make call using TwilioService
            result = twilio_service.make_outbound_call(call_request)
            
            if result.status == "failed":
                logger.error(f"Voice call failed: {result.error_message}")
                raise ExternalServiceException(
                    detail=f"Voice call failed: {result.error_message}",
                    service_name="Voice Call Service"
                )
            
            # Convert to response format
            response = VoiceCallResponse(
                call_sid=result.call_sid,
                session_id=result.session_id,
                status=result.status,
                duration_seconds=0.0,  # Will be updated when call completes
                total_turns=0,  # Will be updated when call completes
                call_details={
                    "websocket_url": result.websocket_url,
                    "phone_number": request.phone_number,
                    "purpose": request.purpose
                }
            )
            
            logger.info(f"Voice call initiated successfully: {response.call_sid}")
            return response
            
        except Exception as e:
            logger.error(f"Error during voice call: {e}")
            raise ExternalServiceException(
                detail=f"Failed to make voice call: {str(e)}",
                service_name="Voice Call Service"
            )
    
    async def make_test_call(self, phone_number: str) -> VoiceCallResponse:
        """
        Make a simple test call that says "Hi"
        
        Args:
            phone_number: Phone number to call
            
        Returns:
            VoiceCallResponse with call results
            
        Raises:
            ExternalServiceException: If call fails
        """
        try:
            logger.info(f"Starting test voice call to: {phone_number}")
            
            # Make test call using TwilioService
            result = twilio_service.make_test_call(phone_number)
            
            if result.status == "failed":
                logger.error(f"Test voice call failed: {result.error_message}")
                raise ExternalServiceException(
                    detail=f"Test voice call failed: {result.error_message}",
                    service_name="Voice Call Service"
                )
            
            # Convert to response format
            response = VoiceCallResponse(
                call_sid=result.call_sid,
                session_id=result.session_id,
                status=result.status,
                duration_seconds=0.0,  # Will be updated when call completes
                total_turns=0,  # Will be updated when call completes
                call_details={
                    "websocket_url": result.websocket_url,
                    "phone_number": phone_number,
                    "purpose": "test"
                }
            )
            
            logger.info(f"Test voice call initiated successfully: {response.call_sid}")
            return response
            
        except Exception as e:
            logger.error(f"Error during test voice call: {e}")
            raise ExternalServiceException(
                detail=f"Failed to make test voice call: {str(e)}",
                service_name="Voice Call Service"
            )
    
    async def make_education_verification_call(self, 
                                             phone_number: str,
                                             student_name: str,
                                             institution: str,
                                             degree_type: str,
                                             graduation_year: int,
                                             simulate_initial: bool = False,
                                             npi: str = None,
                                             last_4_ssn: str = None,
                                             dob: str = None,
                                             application_id: int = None) -> VoiceCallResponse:
        """
        Make an education verification call
        
        Args:
            phone_number: Phone number to call
            student_name: Name of the student to verify
            institution: Educational institution
            degree_type: Type of degree
            graduation_year: Year of graduation
            simulate_initial: Whether to simulate initial greeting
            npi: Optional NPI number
            last_4_ssn: Optional last 4 digits of SSN
            dob: Optional date of birth
            application_id: Optional application ID for verification context
            
        Returns:
            VoiceCallResponse with call results
        """
        
        # Make education verification call using TwilioService
        result = twilio_service.make_education_verification_call(
            phone_number=phone_number,
            student_name=student_name,
            institution=institution,
            degree_type=degree_type,
            graduation_year=graduation_year,
            simulate_initial=simulate_initial,
            npi=npi,
            last_4_ssn=last_4_ssn,
            dob=dob,
            application_id=application_id
        )
        
        if result.status == "failed":
            logger.error(f"Education verification call failed: {result.error_message}")
            raise ExternalServiceException(
                detail=f"Education verification call failed: {result.error_message}",
                service_name="Voice Call Service"
            )
        
        # Convert to response format
        response = VoiceCallResponse(
            call_sid=result.call_sid,
            session_id=result.session_id,
            status=result.status,
            duration_seconds=0.0,  # Will be updated when call completes
            total_turns=0,  # Will be updated when call completes
            call_details={
                "websocket_url": result.websocket_url,
                "phone_number": phone_number,
                "purpose": "education_verification",
                "student_name": student_name,
                "institution": institution,
                "degree_type": degree_type,
                "graduation_year": graduation_year,
                "simulate_initial": simulate_initial
            }
        )
        
        logger.info(f"Education verification call initiated successfully: {response.call_sid}")
        return response

# Global service instance
voice_service = VoiceService() 