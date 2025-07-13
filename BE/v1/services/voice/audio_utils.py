"""
Audio utility functions for voice processing with Twilio and Gemini Live API

This module provides:
1. Audio format conversion between Twilio μ-law and Gemini PCM
2. WebSocket connection management
3. Audio chunk processing and buffering
4. Conversation state management
"""

import asyncio
import audioop
import base64
import json
import logging
import uuid
import websockets
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, Callable, Deque
from enum import Enum

logger = logging.getLogger(__name__)

class AudioFormat(Enum):
    """Audio format constants"""
    TWILIO_MULAW = "mulaw"
    TWILIO_PCM = "pcm"
    GEMINI_PCM = "pcm"

class ConnectionState(Enum):
    """WebSocket connection states"""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"
    FAILED = "failed"

@dataclass
class AudioChunk:
    """Represents a chunk of audio data"""
    data: bytes
    format: AudioFormat
    sample_rate: int
    timestamp: float
    sequence_id: int = 0
    
    def to_base64(self) -> str:
        """Convert audio data to base64 string"""
        return base64.b64encode(self.data).decode('utf-8')
    
    @classmethod
    def from_base64(cls, b64_data: str, format: AudioFormat, sample_rate: int, timestamp: float) -> 'AudioChunk':
        """Create AudioChunk from base64 data"""
        return cls(
            data=base64.b64decode(b64_data),
            format=format,
            sample_rate=sample_rate,
            timestamp=timestamp
        )

@dataclass
class ConversationState:
    """Manages conversation state and context"""
    session_id: str
    call_sid: str
    phone_number: str
    start_time: float
    is_active: bool = True
    turn_count: int = 0
    last_activity: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def update_activity(self, timestamp: float):
        """Update last activity timestamp"""
        self.last_activity = timestamp
    
    def increment_turn(self):
        """Increment conversation turn counter"""
        self.turn_count += 1

class AudioConverter:
    """Handles audio format conversion between Twilio and Gemini"""
    
    # Audio format constants
    TWILIO_SAMPLE_RATE = 8000  # 8kHz
    GEMINI_INPUT_SAMPLE_RATE = 16000  # 16kHz
    GEMINI_OUTPUT_SAMPLE_RATE = 24000  # 24kHz
    SAMPLE_WIDTH = 2  # 16-bit = 2 bytes
    
    def __init__(self):
        self.conversion_state_8k_to_16k = None
        self.conversion_state_24k_to_8k = None
        self.sequence_counter = 0
    
    def twilio_to_gemini(self, twilio_payload: str, timestamp: float) -> AudioChunk:
        """
        Convert Twilio μ-law audio to Gemini's expected PCM format
        
        Args:
            twilio_payload: Base64 encoded μ-law audio from Twilio
            timestamp: Timestamp of the audio chunk
            
        Returns:
            AudioChunk with PCM data at 16kHz
        """
        try:
            # 1. Decode base64 from Twilio
            mulaw_data = base64.b64decode(twilio_payload)
            
            # 2. Convert μ-law to linear PCM (16-bit)
            pcm_data = audioop.ulaw2lin(mulaw_data, self.SAMPLE_WIDTH)
            
            # 3. Resample from 8kHz to 16kHz
            pcm_16khz, self.conversion_state_8k_to_16k = audioop.ratecv(
                pcm_data,
                self.SAMPLE_WIDTH,
                1,  # mono
                self.TWILIO_SAMPLE_RATE,
                self.GEMINI_INPUT_SAMPLE_RATE,
                self.conversion_state_8k_to_16k
            )
            
            self.sequence_counter += 1
            
            return AudioChunk(
                data=pcm_16khz,
                format=AudioFormat.GEMINI_PCM,
                sample_rate=self.GEMINI_INPUT_SAMPLE_RATE,
                timestamp=timestamp,
                sequence_id=self.sequence_counter
            )
            
        except Exception as e:
            logger.error(f"Error converting Twilio to Gemini audio: {e}")
            raise AudioConversionError(f"Failed to convert Twilio audio: {e}")
    
    def gemini_to_twilio(self, gemini_data: bytes, timestamp: float) -> AudioChunk:
        """
        Convert Gemini's 24kHz PCM to Twilio's μ-law format
        
        Args:
            gemini_data: Raw PCM data from Gemini (24kHz, 16-bit)
            timestamp: Timestamp of the audio chunk
            
        Returns:
            AudioChunk with μ-law data at 8kHz
        """
        try:
            logger.debug(f"Converting Gemini audio: {len(gemini_data)} bytes from 24kHz to 8kHz μ-law")
            
            # 1. Downsample from 24kHz to 8kHz
            pcm_8khz, self.conversion_state_24k_to_8k = audioop.ratecv(
                gemini_data,
                self.SAMPLE_WIDTH,
                1,  # mono
                self.GEMINI_OUTPUT_SAMPLE_RATE,
                self.TWILIO_SAMPLE_RATE,
                self.conversion_state_24k_to_8k
            )
            
            logger.debug(f"Downsampled to 8kHz: {len(pcm_8khz)} bytes")
            
            # 2. Convert PCM to μ-law
            mulaw_data = audioop.lin2ulaw(pcm_8khz, self.SAMPLE_WIDTH)
            
            logger.debug(f"Converted to μ-law: {len(mulaw_data)} bytes")
            
            self.sequence_counter += 1
            
            return AudioChunk(
                data=mulaw_data,
                format=AudioFormat.TWILIO_MULAW,
                sample_rate=self.TWILIO_SAMPLE_RATE,
                timestamp=timestamp,
                sequence_id=self.sequence_counter
            )
            
        except Exception as e:
            logger.error(f"Error converting Gemini to Twilio audio: {e}")
            raise AudioConversionError(f"Failed to convert Gemini audio: {e}")

class AudioBuffer:
    """Manages audio buffering and streaming"""
    
    def __init__(self, max_size: int = 1000):
        self.buffer: Deque[AudioChunk] = deque(maxlen=max_size)
        self.lock = asyncio.Lock()
    
    async def add_chunk(self, chunk: AudioChunk):
        """Add audio chunk to buffer"""
        async with self.lock:
            self.buffer.append(chunk)
    
    async def get_chunk(self) -> Optional[AudioChunk]:
        """Get next audio chunk from buffer"""
        async with self.lock:
            if self.buffer:
                return self.buffer.popleft()
            return None
    
    async def clear(self):
        """Clear all buffered audio"""
        async with self.lock:
            self.buffer.clear()
    
    def size(self) -> int:
        """Get current buffer size"""
        return len(self.buffer)

class WebSocketManager:
    """Manages WebSocket connections with reconnection logic"""
    
    def __init__(self, 
                 uri: str,
                 on_message: Optional[Callable] = None,
                 on_connect: Optional[Callable] = None,
                 on_disconnect: Optional[Callable] = None,
                 max_reconnect_attempts: int = 5,
                 reconnect_delay: float = 1.0):
        self.uri = uri
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.state = ConnectionState.DISCONNECTED
        self.on_message = on_message
        self.on_connect = on_connect
        self.on_disconnect = on_disconnect
        self.max_reconnect_attempts = max_reconnect_attempts
        self.reconnect_delay = reconnect_delay
        self.reconnect_attempts = 0
        self.connection_id = str(uuid.uuid4())
        self.lock = asyncio.Lock()
    
    async def connect(self) -> bool:
        """Establish WebSocket connection"""
        async with self.lock:
            if self.state == ConnectionState.CONNECTED:
                return True
            
            try:
                self.state = ConnectionState.CONNECTING
                self.websocket = await websockets.connect(self.uri)
                self.state = ConnectionState.CONNECTED
                self.reconnect_attempts = 0
                
                if self.on_connect:
                    await self.on_connect()
                
                logger.info(f"WebSocket connected to {self.uri}")
                return True
                
            except Exception as e:
                self.state = ConnectionState.FAILED
                logger.error(f"Failed to connect to WebSocket {self.uri}: {e}")
                return False
    
    async def disconnect(self):
        """Close WebSocket connection"""
        async with self.lock:
            if self.websocket and self.state == ConnectionState.CONNECTED:
                await self.websocket.close()
                self.state = ConnectionState.DISCONNECTED
                
                if self.on_disconnect:
                    await self.on_disconnect()
                
                logger.info(f"WebSocket disconnected from {self.uri}")
    
    async def send_message(self, message: Dict[str, Any]) -> bool:
        """Send message through WebSocket"""
        if self.state != ConnectionState.CONNECTED or not self.websocket:
            logger.warning("Cannot send message: WebSocket not connected")
            return False
        
        try:
            await self.websocket.send(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
            await self._handle_connection_error()
            return False
    
    async def receive_message(self) -> Optional[Dict[str, Any]]:
        """Receive message from WebSocket"""
        if self.state != ConnectionState.CONNECTED or not self.websocket:
            return None
        
        try:
            message = await self.websocket.recv()
            return json.loads(message)
        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed")
            await self._handle_connection_error()
            return None
        except Exception as e:
            logger.error(f"Error receiving WebSocket message: {e}")
            return None
    
    async def _handle_connection_error(self):
        """Handle connection errors and attempt reconnection"""
        self.state = ConnectionState.RECONNECTING
        
        if self.reconnect_attempts < self.max_reconnect_attempts:
            self.reconnect_attempts += 1
            logger.info(f"Attempting to reconnect ({self.reconnect_attempts}/{self.max_reconnect_attempts})")
            
            await asyncio.sleep(self.reconnect_delay)
            await self.connect()
        else:
            self.state = ConnectionState.FAILED
            logger.error(f"Max reconnection attempts reached for {self.uri}")

class VoiceSessionManager:
    """Manages voice session state and coordination"""
    
    def __init__(self, session_id: str, call_sid: str, phone_number: str):
        self.conversation_state = ConversationState(
            session_id=session_id,
            call_sid=call_sid,
            phone_number=phone_number,
            start_time=asyncio.get_event_loop().time()
        )
        self.audio_converter = AudioConverter()
        self.input_buffer = AudioBuffer(max_size=500)
        self.output_buffer = AudioBuffer(max_size=500)
        self.is_processing = False
        self.lock = asyncio.Lock()
    
    async def process_twilio_audio(self, audio_payload: str, timestamp: float) -> AudioChunk:
        """Process incoming audio from Twilio"""
        try:
            # Convert Twilio audio to Gemini format
            gemini_chunk = self.audio_converter.twilio_to_gemini(audio_payload, timestamp)
            
            # Add to input buffer
            await self.input_buffer.add_chunk(gemini_chunk)
            
            # Update conversation state
            self.conversation_state.update_activity(timestamp)
            
            return gemini_chunk
            
        except Exception as e:
            logger.error(f"Error processing Twilio audio: {e}")
            raise
    
    async def process_gemini_audio(self, audio_data: bytes, timestamp: float) -> AudioChunk:
        """Process outgoing audio from Gemini"""
        try:
            # Convert Gemini audio to Twilio format
            twilio_chunk = self.audio_converter.gemini_to_twilio(audio_data, timestamp)
            
            # Add to output buffer
            await self.output_buffer.add_chunk(twilio_chunk)
            
            return twilio_chunk
            
        except Exception as e:
            logger.error(f"Error processing Gemini audio: {e}")
            raise
    
    async def get_next_input_chunk(self) -> Optional[AudioChunk]:
        """Get next audio chunk for Gemini"""
        return await self.input_buffer.get_chunk()
    
    async def get_next_output_chunk(self) -> Optional[AudioChunk]:
        """Get next audio chunk for Twilio"""
        return await self.output_buffer.get_chunk()
    
    async def clear_buffers(self):
        """Clear all audio buffers"""
        await self.input_buffer.clear()
        await self.output_buffer.clear()
    
    def get_session_info(self) -> Dict[str, Any]:
        """Get session information"""
        return {
            "session_id": self.conversation_state.session_id,
            "call_sid": self.conversation_state.call_sid,
            "phone_number": self.conversation_state.phone_number,
            "start_time": self.conversation_state.start_time,
            "turn_count": self.conversation_state.turn_count,
            "last_activity": self.conversation_state.last_activity,
            "is_active": self.conversation_state.is_active,
            "input_buffer_size": self.input_buffer.size(),
            "output_buffer_size": self.output_buffer.size()
        }

# Custom exceptions
class AudioConversionError(Exception):
    """Raised when audio conversion fails"""
    pass

class WebSocketConnectionError(Exception):
    """Raised when WebSocket connection fails"""
    pass

class VoiceSessionError(Exception):
    """Raised when voice session encounters an error"""
    pass 