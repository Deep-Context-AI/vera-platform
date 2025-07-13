"""
Gemini Live API service for voice interactions

This module provides:
1. Gemini Live API session management
2. WebSocket connection handling to Gemini
3. Audio streaming to/from Gemini
4. Voice activity detection handling
5. System instructions and configuration
"""

import asyncio
import base64
import json
import logging
import os
import time
from typing import Dict, Any, Optional, Callable, AsyncGenerator
from dataclasses import dataclass
from enum import Enum

from google import genai
from google.genai import types

from v1.services.voice.audio_utils import AudioChunk, VoiceSessionManager, AudioConversionError

logger = logging.getLogger(__name__)

class GeminiSessionState(Enum):
    """Gemini session states"""
    IDLE = "idle"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    LISTENING = "listening"
    INTERRUPTED = "interrupted"
    DISCONNECTED = "disconnected"
    ERROR = "error"

@dataclass
class GeminiVoiceConfig:
    """Configuration for Gemini voice interactions"""
    model_name: str = "gemini-2.0-flash-live-001"
    voice_name: str = "Puck"  # Options: Puck, Charon, Kore, Fenrir, Aoede
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
    """Service for managing Gemini Live API voice interactions"""
    
    def __init__(self, config: GeminiVoiceConfig = None):
        self.config = config or GeminiVoiceConfig()
        self.client = None
        self.session = None
        self.session_context = None
        self.session_manager: Optional[VoiceSessionManager] = None
        self.state = GeminiSessionState.IDLE
        self.lock = asyncio.Lock()
        
        # Callback functions
        self.on_audio_received: Optional[Callable] = None
        self.on_turn_complete: Optional[Callable] = None
        self.on_interrupted: Optional[Callable] = None
        self.on_error: Optional[Callable] = None
        
        # Session tracking
        self.session_start_time: Optional[float] = None
        self.total_turns = 0
        self.current_turn_id = 0
    
    async def initialize(self) -> bool:
        """Initialize Gemini client and prepare for connections"""
        try:
            # Initialize Gemini client
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set")
            
            self.client = genai.Client(api_key=api_key)
            logger.info("Gemini client initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.state = GeminiSessionState.ERROR
            return False
    
    async def start_session(self, session_manager: VoiceSessionManager) -> bool:
        """Start a new Gemini Live API session"""
        async with self.lock:
            if self.state != GeminiSessionState.IDLE:
                logger.warning(f"Cannot start session in state: {self.state}")
                return False
            
            try:
                self.state = GeminiSessionState.CONNECTING
                self.session_manager = session_manager
                self.session_start_time = time.time()
                
                # Configure the Live API session
                config = self._build_live_config()
                
                # Connect to Gemini Live API using async context manager
                self.session_context = self.client.aio.live.connect(
                    model=self.config.model_name,
                    config=config
                )
                self.session = await self.session_context.__aenter__()
                
                self.state = GeminiSessionState.CONNECTED
                logger.info(f"Gemini Live session started for call: {session_manager.conversation_state.call_sid}")
                
                # Start the response handler
                asyncio.create_task(self._handle_gemini_responses())
                
                return True
                
            except Exception as e:
                logger.error(f"Failed to start Gemini session: {e}")
                self.state = GeminiSessionState.ERROR
                if self.on_error:
                    await self.on_error(e)
                return False
    
    async def send_audio_chunk(self, audio_chunk: AudioChunk) -> bool:
        """Send audio chunk to Gemini"""
        # Allow audio input in more states - Gemini can handle interruptions
        if self.state in [GeminiSessionState.IDLE, GeminiSessionState.ERROR, GeminiSessionState.DISCONNECTED]:
            logger.warning(f"Cannot send audio in state: {self.state}")
            return False
        
        try:
            # Send raw audio data to Gemini Live API
            await self.session.send_realtime_input(
                audio=types.Blob(
                    data=audio_chunk.data,  # Send raw bytes, not base64
                    mime_type="audio/pcm;rate=16000"
                )
            )
            
            self.state = GeminiSessionState.LISTENING
            return True
            
        except Exception as e:
            logger.error(f"Error sending audio to Gemini: {e}")
            if self.on_error:
                await self.on_error(e)
            return False
    
    async def send_initial_greeting(self) -> bool:
        """Send initial greeting to start the conversation"""
        if self.state != GeminiSessionState.CONNECTED:
            logger.warning(f"Cannot send greeting in state: {self.state}")
            return False
        
        try:
            # Send initial text to trigger Gemini to speak
            await self.session.send_client_content(
                turns=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part(text="Hello! Please respond with audio and introduce yourself.")
                        ]
                    )
                ],
                turn_complete=True
            )
            
            self.state = GeminiSessionState.PROCESSING
            logger.info("Initial greeting sent to Gemini")
            return True
            
        except Exception as e:
            logger.error(f"Error sending initial greeting: {e}")
            if self.on_error:
                await self.on_error(e)
            return False
    
    async def interrupt_current_response(self) -> bool:
        """Interrupt Gemini's current response"""
        if self.state != GeminiSessionState.SPEAKING:
            return True  # Nothing to interrupt
        
        try:
            # Gemini Live API handles interruptions automatically through VAD
            # We just need to update our state
            self.state = GeminiSessionState.INTERRUPTED
            
            if self.on_interrupted:
                await self.on_interrupted()
            
            logger.info("Gemini response interrupted")
            return True
            
        except Exception as e:
            logger.error(f"Error interrupting Gemini response: {e}")
            return False
    
    async def end_session(self) -> bool:
        """End the current Gemini session"""
        async with self.lock:
            try:
                if self.session_context and self.session:
                    # Properly exit the async context manager
                    await self.session_context.__aexit__(None, None, None)
                    self.session = None
                    self.session_context = None
                
                self.state = GeminiSessionState.DISCONNECTED
                self.session_manager = None
                
                session_duration = time.time() - self.session_start_time if self.session_start_time else 0
                logger.info(f"Gemini session ended. Duration: {session_duration:.2f}s, Turns: {self.total_turns}")
                
                return True
                
            except Exception as e:
                logger.error(f"Error ending Gemini session: {e}")
                return False
    
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
            logger.debug(f"Processing Gemini response: {type(response)}, has data: {hasattr(response, 'data')}")
            
            # Handle audio data directly from response.data (as shown in docs)
            if hasattr(response, 'data') and response.data is not None:
                self.state = GeminiSessionState.SPEAKING
                logger.info(f"Received audio from Gemini: {len(response.data)} bytes")
                
                # Process audio data - response.data contains raw PCM audio at 24kHz
                timestamp = time.time()
                
                if self.session_manager:
                    # Convert from Gemini's 24kHz PCM to Twilio format
                    twilio_chunk = await self.session_manager.process_gemini_audio(
                        response.data, timestamp
                    )
                    logger.info(f"Converted to Twilio format: {len(twilio_chunk.data)} bytes")
                    
                    # Send to callback
                    if self.on_audio_received:
                        await self.on_audio_received(twilio_chunk)
                    else:
                        logger.warning("No audio callback set!")
            
            # Handle server content for other events
            if hasattr(response, 'server_content') and response.server_content:
                server_content = response.server_content
                logger.debug(f"Server content: {server_content}")
                
                # Handle interruptions
                if hasattr(server_content, 'interrupted') and server_content.interrupted:
                    logger.info("Gemini detected interruption")
                    self.state = GeminiSessionState.INTERRUPTED
                    if self.on_interrupted:
                        await self.on_interrupted()
                    return
                
                # Handle turn completion
                if hasattr(server_content, 'turn_complete') and server_content.turn_complete:
                    logger.info(f"Gemini turn completed (Turn {self.total_turns + 1})")
                    self.state = GeminiSessionState.LISTENING
                    self.total_turns += 1
                    self.current_turn_id += 1
                    if self.on_turn_complete:
                        await self.on_turn_complete()
                    else:
                        logger.warning("No turn complete callback set!")
                    
        except Exception as e:
            logger.error(f"Error processing Gemini response: {e}")
            if self.on_error:
                await self.on_error(e)
    
    def _build_live_config(self) -> types.LiveConnectConfig:
        """Build configuration for Gemini Live API"""
        return types.LiveConnectConfig(
            response_modalities=self.config.response_modalities,
            system_instruction=self.config.system_instruction,
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=self.config.voice_name
                    )
                )
            ),
            generation_config=types.GenerationConfig(
                max_output_tokens=self.config.max_output_tokens,
                temperature=self.config.temperature
            )
        )
    
    def get_session_status(self) -> Dict[str, Any]:
        """Get current session status"""
        return {
            "state": self.state.value,
            "session_active": self.session is not None,
            "session_start_time": self.session_start_time,
            "total_turns": self.total_turns,
            "current_turn_id": self.current_turn_id,
            "model_name": self.config.model_name,
            "voice_name": self.config.voice_name,
            "session_info": self.session_manager.get_session_info() if self.session_manager else None
        }
    
    def set_callbacks(self,
                     on_audio_received: Optional[Callable] = None,
                     on_turn_complete: Optional[Callable] = None,
                     on_interrupted: Optional[Callable] = None,
                     on_error: Optional[Callable] = None):
        """Set callback functions for session events"""
        self.on_audio_received = on_audio_received
        self.on_turn_complete = on_turn_complete
        self.on_interrupted = on_interrupted
        self.on_error = on_error

class GeminiVoiceServiceError(Exception):
    """Raised when Gemini voice service encounters an error"""
    pass 