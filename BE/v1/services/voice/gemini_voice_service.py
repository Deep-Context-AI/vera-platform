"""
Gemini Live API service for voice interactions

This module provides:
1. Gemini Live API session management
2. WebSocket connection handling to Gemini
3. Audio streaming to/from Gemini
4. Gemini's built-in voice activity detection
5. System instructions and configuration
"""

import asyncio
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Callable, Dict, Any

from google import genai
from google.genai import types

from v1.services.voice.audio_utils import VoiceSessionManager, AudioChunk, AudioFormat

logger = logging.getLogger(__name__)


class GeminiSessionState(Enum):
    """Simplified Gemini session states - let Gemini handle the rest"""
    CONNECTING = "connecting"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"


@dataclass
class GeminiVoiceConfig:
    """Configuration for Gemini voice interactions"""
    model_name: str = "gemini-2.0-flash-live-001"
    voice_name: str = "Kore"  # Options: Kore, Charon, Kore, Fenrir, Aoede
    response_modalities: list = None
    system_instruction: str = None
    max_output_tokens: int = 8192
    temperature: float = 0.7
    
    def __post_init__(self):
        if self.response_modalities is None:
            self.response_modalities = ["AUDIO"]
        
        if self.system_instruction is None:
            self.system_instruction = """You are a professional voice assistant for education verification calls. 
            Speak clearly and concisely. Keep responses brief and to the point. 
            You are calling to verify education credentials."""


class GeminiVoiceService:
    """Simplified Gemini voice service that trusts Gemini's built-in capabilities"""
    
    def __init__(self, config: GeminiVoiceConfig = None):
        self.config = config or GeminiVoiceConfig()
        self.client: Optional[genai.Client] = None
        self.session: Optional[genai.live.LiveSession] = None
        self._session_context_manager = None
        self.state = GeminiSessionState.CONNECTING
        self.voice_session_manager: Optional[VoiceSessionManager] = None
        self.turn_count = 0
        self.session_start_time = None
        
        # Callbacks
        self.on_audio_received: Optional[Callable] = None
        self.on_turn_complete: Optional[Callable] = None
        self.on_error: Optional[Callable] = None

    async def initialize(self) -> bool:
        """Initialize the Gemini client"""
        try:
            self.client = genai.Client()
            logger.info("Gemini client initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.state = GeminiSessionState.ERROR
            return False

    async def start_session(self, session_manager) -> bool:
        """Start a new Gemini Live session"""
        if not self.client:
            logger.error("Client not initialized")
            return False
            
        try:
            self.state = GeminiSessionState.CONNECTING
            self.session_start_time = asyncio.get_event_loop().time()
            
            # Initialize voice session manager
            self.voice_session_manager = VoiceSessionManager(
                session_id=session_manager.session_id,
                call_sid=session_manager.call_sid,
                phone_number=session_manager.phone_number
            )
            
            # Connect to Gemini Live API
            config = self._build_live_config()
            self._session_context_manager = self.client.aio.live.connect(
                model=self.config.model_name,
                config=config
            )
            
            # Start the session using the context manager
            self.session = await self._session_context_manager.__aenter__()
            
            self.state = GeminiSessionState.CONNECTED
            logger.info(f"Gemini Live session started for call: {session_manager.call_sid}")
            
            # Start response handler
            asyncio.create_task(self._handle_gemini_responses())
            
            # Send initial greeting
            await self.send_initial_greeting()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to start Gemini session: {e}")
            self.state = GeminiSessionState.ERROR
            if self.on_error:
                await self.on_error(e)
            return False

    async def send_audio_chunk(self, audio_chunk: AudioChunk) -> bool:
        """Send audio chunk to Gemini - simplified, trust Gemini's VAD"""
        if self.state != GeminiSessionState.CONNECTED:
            logger.debug(f"Cannot send audio chunk in state: {self.state}")
            return False
            
        if not self.session:
            logger.error("No active Gemini session")
            return False
            
        try:
            # Just send it - let Gemini handle VAD and turn management
            await self.session.send_realtime_input(
                audio=types.Blob(
                    data=audio_chunk.data,
                    mime_type="audio/pcm;rate=16000"
                )
            )
            return True
            
        except Exception as e:
            logger.error(f"Error sending audio chunk to Gemini: {e}")
            if self.on_error:
                await self.on_error(e)
            return False

    async def send_initial_greeting(self) -> bool:
        """Send initial greeting to start the conversation"""
        if self.state != GeminiSessionState.CONNECTED:
            logger.error("Cannot send greeting - session not connected")
            return False
            
        try:
            # Use send_client_content for text-to-audio conversion
            await self.session.send_client_content(
                turns={"role": "user", "parts": [{"text": "Hello! Please respond with audio and introduce yourself as Vera, a professional voice assistant helping with education verification calls."}]},
                turn_complete=True
            )
            
            logger.info("Initial greeting sent to Gemini")
            return True
            
        except Exception as e:
            logger.error(f"Error sending initial greeting: {e}")
            if self.on_error:
                await self.on_error(e)
            return False

    async def end_session(self) -> bool:
        """End the Gemini session"""
        if self.session and hasattr(self, '_session_context_manager'):
            try:
                await self._session_context_manager.__aexit__(None, None, None)
                duration = asyncio.get_event_loop().time() - self.session_start_time if self.session_start_time else 0
                logger.info(f"Gemini session ended. Duration: {duration:.2f}s, Turns: {self.turn_count}")
            except Exception as e:
                logger.error(f"Error closing Gemini session: {e}")
            finally:
                self.session = None
                self._session_context_manager = None
                
        self.state = GeminiSessionState.DISCONNECTED
        return True

    async def _handle_gemini_responses(self):
        """Handle responses from Gemini Live API"""
        try:
            async for response in self.session.receive():
                await self._process_gemini_response(response)
        except Exception as e:
            logger.error(f"Error in Gemini response handler: {e}")
            self.state = GeminiSessionState.ERROR
            if self.on_error:
                await self.on_error(e)

    async def _process_gemini_response(self, response):
        """Process individual response from Gemini"""
        try:
            # Handle audio output
            if hasattr(response, 'data') and response.data:
                if self.voice_session_manager:
                    # Convert Gemini audio to Twilio format
                    timestamp = asyncio.get_event_loop().time()
                    twilio_chunk = await self.voice_session_manager.process_gemini_audio(
                        response.data, timestamp
                    )
                    
                    # Send to callback
                    if self.on_audio_received:
                        await self.on_audio_received(twilio_chunk)

            # Handle server content (transcriptions, turn completion, etc.)
            if hasattr(response, 'server_content') and response.server_content:
                server_content = response.server_content
                
                # Log transcriptions
                if hasattr(server_content, 'model_turn') and server_content.model_turn:
                    model_turn = server_content.model_turn
                    if hasattr(model_turn, 'parts'):
                        for part in model_turn.parts:
                            if hasattr(part, 'text') and part.text:
                                logger.info(f"Gemini speech transcribed: '{part.text.strip()}'")

                # Handle turn completion
                if hasattr(server_content, 'turn_complete') and server_content.turn_complete:
                    self.turn_count += 1
                    logger.info(f"Gemini turn completed (Turn {self.turn_count})")
                    
                    if self.on_turn_complete:
                        await self.on_turn_complete()

        except Exception as e:
            logger.error(f"Error processing Gemini response: {e}")
            if self.on_error:
                await self.on_error(e)

    def _build_live_config(self) -> types.LiveConnectConfig:
        """Build configuration for Gemini Live API"""
        return types.LiveConnectConfig(
            response_modalities=self.config.response_modalities,
            system_instruction=self.config.system_instruction,
            tools=[],  # Add tools if needed
            generation_config=types.GenerationConfig(
                max_output_tokens=self.config.max_output_tokens,
                temperature=self.config.temperature
            ),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=self.config.voice_name
                    )
                )
            )
        )

    def get_session_status(self) -> Dict[str, Any]:
        """Get current session status"""
        duration = asyncio.get_event_loop().time() - self.session_start_time if self.session_start_time else 0
        return {
            "state": self.state.value,
            "turn_count": self.turn_count,
            "duration": duration,
            "session_active": self.session is not None
        }

    def set_callbacks(self,
                     on_audio_received: Optional[Callable] = None,
                     on_turn_complete: Optional[Callable] = None,
                     on_error: Optional[Callable] = None):
        """Set callback functions"""
        self.on_audio_received = on_audio_received
        self.on_turn_complete = on_turn_complete
        self.on_error = on_error


class GeminiVoiceServiceError(Exception):
    """Exception raised by Gemini voice service"""
    pass 