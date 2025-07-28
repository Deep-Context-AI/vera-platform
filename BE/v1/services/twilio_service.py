"""
Twilio Service - Direct integration for voice calls

This service provides direct Twilio integration for making outbound calls
and generating TwiML responses that connect to our WebSocket endpoints.
"""

from datetime import datetime
import logging
import os
import uuid
from typing import Dict, Any, Optional
from dataclasses import dataclass

from twilio.rest import Client as TwilioClient
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream

logger = logging.getLogger(__name__)

@dataclass
class CallRequest:
    """Request for making a voice call"""
    phone_number: str
    purpose: str = "education_verification"
    caller_name: str = "Vera Platform"
    system_instruction: Optional[str] = None
    voice_name: str = "Kore"
    max_duration_minutes: int = 10
    simulate_initial: bool = False

@dataclass
class CallResult:
    """Result of a voice call initiation"""
    call_sid: str
    session_id: str
    status: str
    websocket_url: str
    error_message: Optional[str] = None

class TwilioService:
    """Service for direct Twilio voice call management"""
    
    def __init__(self):
        self.account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        self.auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        self.phone_number = os.environ.get("TWILIO_PHONE_NUMBER")
        
        if not all([self.account_sid, self.auth_token, self.phone_number]):
            logger.warning("Missing Twilio environment variables - service will not function properly")
            self.client = None
        else:
            self.client = TwilioClient(self.account_sid, self.auth_token)
        
        # Base URL for WebSocket endpoints - this should match your deployment
        self.base_websocket_url = os.environ.get(
            "WEBSOCKET_BASE_URL", 
            "mikhailocampo--vera-platform-v2-fastapi-app-dev.modal.run"
        )
    
    def make_outbound_call(self, call_request: CallRequest) -> CallResult:
        """
        Make an outbound call that connects to our WebSocket endpoint
        
        Args:
            call_request: CallRequest with call parameters
            
        Returns:
            CallResult with call details
        """
        try:
            if not self.client:
                raise ValueError("TwilioService not properly initialized - missing environment variables")
            
            # Generate unique session ID
            session_id = str(uuid.uuid4())
            
            # Construct WebSocket URL
            websocket_url = f"wss://{self.base_websocket_url}/v1/media-stream/{session_id}"
            
            # Store call context for the WebSocket handler to access
            self._store_call_context(session_id, call_request)
            
            # Create TwiML response
            twiml = self._generate_twiml(websocket_url, call_request)
            
            # Make the call
            call = self.client.calls.create(
                to=call_request.phone_number,
                from_=self.phone_number,
                twiml=twiml
            )
            
            logger.info(f"Outbound call initiated: {call.sid} to {call_request.phone_number}")
            logger.info(f"WebSocket URL: {websocket_url}")
            
            return CallResult(
                call_sid=call.sid,
                session_id=session_id,
                status="initiated",
                websocket_url=websocket_url
            )
            
        except Exception as e:
            logger.error(f"Failed to make outbound call: {e}")
            return CallResult(
                call_sid="failed",
                session_id=session_id if 'session_id' in locals() else "unknown",
                status="failed",
                websocket_url="",
                error_message=str(e)
            )
    
    def _generate_twiml(self, websocket_url: str, call_request: CallRequest) -> str:
        """Generate TwiML for the outbound call"""
        response = VoiceResponse()
        
        # Add initial greeting
        greeting = f"Hello, connecting you to our voice assistant on a recorded line."
        response.say(greeting, voice='alice')
        
        # Connect to media stream
        connect = Connect()
        stream = Stream(url=websocket_url)
        connect.append(stream)
        response.append(connect)
        
        return str(response)
    
    def _store_call_context(self, session_id: str, call_request: CallRequest):
        """
        Store call context for the WebSocket handler to access
        This is a simple in-memory store - in production you might use Redis
        """
        if not hasattr(self, '_call_contexts'):
            self._call_contexts = {}
        
        self._call_contexts[session_id] = {
            "phone_number": call_request.phone_number,
            "purpose": call_request.purpose,
            "caller_name": call_request.caller_name,
            "system_instruction": call_request.system_instruction,
            "voice_name": call_request.voice_name,
            "max_duration_minutes": call_request.max_duration_minutes,
            "simulate_initial": call_request.simulate_initial
        }
    
    def get_call_context(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get stored call context for a session"""
        if hasattr(self, '_call_contexts'):
            return self._call_contexts.get(session_id)
        return None
    
    def end_call(self, call_sid: str) -> bool:
        """End an active call"""
        try:
            call = self.client.calls(call_sid).update(status='completed')
            logger.info(f"Call ended: {call_sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to end call {call_sid}: {e}")
            return False
    
    def make_test_call(self, phone_number: str) -> CallResult:
        """Make a simple test call"""
        test_request = CallRequest(
            phone_number=phone_number,
            purpose="test",
            caller_name="Vera Platform Test",
            system_instruction="You are a test voice assistant. Simply say 'Hi, this is a test call from Vera Platform. Have a great day!' and then end the call.",
            voice_name="Kore",
            max_duration_minutes=2
        )
        
        return self.make_outbound_call(test_request)
    
    def make_education_verification_call(self, 
                                       phone_number: str,
                                       student_name: str,
                                       institution: str,
                                       degree_type: str,
                                       graduation_year: int,
                                       simulate_initial: bool = False) -> CallResult:
        """Make an education verification call"""
        system_instruction = f"""You are a professional voice assistant calling to verify education credentials for {student_name}. You're an experimental AI assistant named Vera working with the credentialing team at VERA PLATFORM CORP. Today's date is {datetime.now().strftime("%Y-%m-%d")}.

        You are calling {institution} to verify that {student_name} graduated with a {degree_type} in {graduation_year}.

        Follow this process:
        1. Introduce yourself professionally yet succinctly
        2. Explain that you are calling to verify education credentials. Confirm that the recipient is the correct institution and that you are with the right department to verify the education credentials.
        3. If the recipient is not the correct institution, ask to be transferred to the correct institution.
        4. If correct, state that you wish to verify the education credentials of {student_name} alleged to have graduated with a {degree_type} in {graduation_year}. Typical procedures are for you to send a form to the institution to verify the education credentials, check if they will send back the same form or if they will send a different form.
        5. Confirm the email address to send the verification details to and estimated time for the verification to be completed.
        6. Be polite and professional throughout
        7. If they cannot help, ask to be transferred to someone who can assist with education verification
        8. For in-residency verification, ask for the residency program name and the year of graduation. Check for the status of the residency program.

        Keep the conversation focused and efficient. Speak clearly and professionally."""
        
        education_request = CallRequest(
            phone_number=phone_number,
            purpose="education_verification",
            caller_name="Vera Platform Education Verification",
            system_instruction=system_instruction,
            voice_name="Kore",
            max_duration_minutes=10,
            simulate_initial=simulate_initial
        )
        
        return self.make_outbound_call(education_request)

# Global instance
twilio_service = TwilioService() 