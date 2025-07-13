"""
Audio utility functions for voice processing with Twilio and Gemini Live API

This module provides:
1. Audio format conversion between Twilio μ-law and Gemini PCM
2. WebSocket connection management
3. Audio chunk processing and buffering
4. Conversation state management
5. Audio recording and debugging capabilities
"""

import asyncio
import audioop
import base64
import json
import logging
import time
import uuid
import websockets
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, Callable, Deque
from enum import Enum

logger = logging.getLogger(__name__)

# Try to import Modal components for audio debugging
try:
    import modal
    from v1.config.modal_config import app
    MODAL_AVAILABLE = True
    # Create or reference the voice debug volume
    audio_volume = modal.Volume.from_name("voice-debug-audio", create_if_missing=True)
except ImportError:
    MODAL_AVAILABLE = False
    app = None
    audio_volume = None

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
        Convert Gemini's PCM output to Twilio's expected format
        
        Args:
            gemini_data: Raw PCM data from Gemini at 24kHz
            timestamp: Timestamp of the audio chunk
            
        Returns:
            AudioChunk with μ-law data at 8kHz for Twilio
        """
        try:
            # 1. Resample from 24kHz to 8kHz
            pcm_8khz, self.conversion_state_24k_to_8k = audioop.ratecv(
                gemini_data,
                self.SAMPLE_WIDTH,
                1,  # mono
                self.GEMINI_OUTPUT_SAMPLE_RATE,
                self.TWILIO_SAMPLE_RATE,
                self.conversion_state_24k_to_8k
            )
            
            # 2. Convert linear PCM to μ-law
            mulaw_data = audioop.lin2ulaw(pcm_8khz, self.SAMPLE_WIDTH)
            
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
    """Thread-safe audio buffer for managing audio chunks"""
    
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
        """Clear all chunks from buffer"""
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
        self.reconnect_count = 0
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
                self.reconnect_count = 0
                
                if self.on_connect:
                    await self.on_connect()
                
                logger.info(f"WebSocket connected to {self.uri}")
                return True
                
            except Exception as e:
                logger.error(f"Failed to connect to {self.uri}: {e}")
                self.state = ConnectionState.FAILED
                return False
    
    async def disconnect(self):
        """Close WebSocket connection"""
        async with self.lock:
            if self.websocket:
                await self.websocket.close()
                self.websocket = None
            
            if self.state == ConnectionState.CONNECTED and self.on_disconnect:
                await self.on_disconnect()
            
            self.state = ConnectionState.DISCONNECTED
            logger.info("WebSocket disconnected")
    
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
        except Exception as e:
            logger.error(f"Error receiving WebSocket message: {e}")
            await self._handle_connection_error()
            return None
    
    async def _handle_connection_error(self):
        """Handle connection errors with reconnection logic"""
        self.state = ConnectionState.RECONNECTING
        
        if self.reconnect_count < self.max_reconnect_attempts:
            self.reconnect_count += 1
            await asyncio.sleep(self.reconnect_delay)
            await self.connect()
        else:
            self.state = ConnectionState.FAILED
            logger.error("Max reconnection attempts reached")

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
        
        # Audio recording for debugging
        self.recorded_input_audio = bytearray()  # Raw Twilio audio (μ-law, 8kHz)
        self.recorded_output_audio = bytearray()  # Raw Gemini audio (PCM, 24kHz)
        self.recorded_gemini_input = bytearray()  # Converted audio sent to Gemini (PCM, 16kHz)
        self.audio_recording_enabled = True
    
    async def process_twilio_audio(self, audio_payload: str, timestamp: float) -> AudioChunk:
        """Process incoming audio from Twilio and convert to Gemini format"""
        try:
            logger.debug(f"Processing Twilio audio payload: {len(audio_payload)} chars")
            
            # Record raw Twilio audio for debugging
            if self.audio_recording_enabled:
                raw_audio = base64.b64decode(audio_payload)
                self.recorded_input_audio.extend(raw_audio)
                logger.debug(f"Recorded {len(raw_audio)} bytes of raw Twilio audio")
            
            # Convert Twilio audio to Gemini format
            logger.debug("Converting Twilio audio to Gemini format")
            gemini_chunk = self.audio_converter.twilio_to_gemini(audio_payload, timestamp)
            logger.debug(f"Converted to Gemini format: {len(gemini_chunk.data)} bytes")
            
            # Record converted audio sent to Gemini
            if self.audio_recording_enabled:
                self.recorded_gemini_input.extend(gemini_chunk.data)
            
            # Add to input buffer
            await self.input_buffer.add_chunk(gemini_chunk)
            
            # Update conversation state
            self.conversation_state.update_activity(timestamp)
            
            logger.debug(f"Successfully processed Twilio audio: {len(gemini_chunk.data)} bytes")
            return gemini_chunk
            
        except Exception as e:
            logger.error(f"Error processing Twilio audio: {e}")
            raise
    
    async def process_gemini_audio(self, audio_data: bytes, timestamp: float) -> AudioChunk:
        """Process outgoing audio from Gemini and convert to Twilio format"""
        try:
            # Record raw Gemini audio for debugging
            if self.audio_recording_enabled:
                self.recorded_output_audio.extend(audio_data)
            
            # Convert Gemini audio to Twilio format
            twilio_chunk = self.audio_converter.gemini_to_twilio(audio_data, timestamp)
            
            # Add to output buffer
            await self.output_buffer.add_chunk(twilio_chunk)
            
            logger.debug(f"Processed Gemini audio: {len(twilio_chunk.data)} bytes")
            return twilio_chunk
            
        except Exception as e:
            logger.error(f"Error processing Gemini audio: {e}")
            raise
    
    async def get_next_input_chunk(self) -> Optional[AudioChunk]:
        """Get next input audio chunk for processing"""
        return await self.input_buffer.get_chunk()
    
    async def get_next_output_chunk(self) -> Optional[AudioChunk]:
        """Get next output audio chunk for sending"""
        return await self.output_buffer.get_chunk()
    
    async def clear_buffers(self):
        """Clear all audio buffers"""
        await self.input_buffer.clear()
        await self.output_buffer.clear()
        logger.info("Audio buffers cleared")
    
    async def save_session_audio(self) -> Dict[str, Any]:
        """Save recorded audio to Modal volume for debugging"""
        try:
            if not self.audio_recording_enabled:
                return {"status": "disabled", "message": "Audio recording was disabled"}
            
            if not MODAL_AVAILABLE:
                logger.warning("Modal not available, skipping audio save")
                return {"status": "skipped", "message": "Modal not available"}
            
            # Prepare session data to send to Modal function
            session_data = {
                "session_id": self.conversation_state.session_id,
                "call_sid": self.conversation_state.call_sid,
                "phone_number": self.conversation_state.phone_number,
                "start_time": self.conversation_state.start_time,
                "duration": time.time() - self.conversation_state.start_time,
                "turn_count": self.conversation_state.turn_count,
                "input_audio": bytes(self.recorded_input_audio),
                "output_audio": bytes(self.recorded_output_audio),
                "gemini_input_audio": bytes(self.recorded_gemini_input)
            }
            
            # Call the Modal function to save the audio
            try:
                result = await _save_audio_to_volume.remote.aio(session_data)
                return result
            except Exception as e:
                logger.error(f"Failed to call Modal function: {e}")
                return {"status": "failed", "message": f"Modal function failed: {e}"}
            
        except Exception as e:
            logger.error(f"Error saving session audio: {e}")
            return {"status": "failed", "message": str(e)}
    
    def get_session_info(self) -> Dict[str, Any]:
        """Get current session information"""
        return {
            "session_id": self.conversation_state.session_id,
            "call_sid": self.conversation_state.call_sid,
            "phone_number": self.conversation_state.phone_number,
            "start_time": self.conversation_state.start_time,
            "is_active": self.conversation_state.is_active,
            "turn_count": self.conversation_state.turn_count,
            "last_activity": self.conversation_state.last_activity,
            "input_buffer_size": self.input_buffer.size(),
            "output_buffer_size": self.output_buffer.size(),
            "recorded_input_bytes": len(self.recorded_input_audio),
            "recorded_output_bytes": len(self.recorded_output_audio),
            "recorded_gemini_input_bytes": len(self.recorded_gemini_input),
            "audio_recording_enabled": self.audio_recording_enabled
        }
    
    async def download_audio_file(self, storage_path: str):
        """
        Download MP3 audio file from Modal Volume
        
        Args:
            storage_path: Path to the MP3 file in the volume (e.g., "2025-01-15/session-123/twilio_input_8khz.mp3")
            
        Returns:
            FastAPI Response with MP3 audio file
            
        Raises:
            VoiceSessionError: If file not found or download fails
        """
        try:
            if not MODAL_AVAILABLE:
                raise VoiceSessionError("Modal not available for audio download")
            
            logger.info(f"Downloading MP3 audio file from storage path: {storage_path}")
            
            # Get the voice debug volume
            volume = modal.Volume.from_name("voice-debug-audio")
            
            # Download the file from the volume
            import tempfile
            import os
            from fastapi.responses import FileResponse
            
            # Create a temporary file to download to
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
                temp_path = temp_file.name
            
            try:
                # Download from volume to temporary file
                volume.get_file(f"/{storage_path}", temp_path)
                
                # Get filename for response
                filename = os.path.basename(storage_path)
                
                logger.info(f"Successfully downloaded MP3 audio file: {filename}")
                
                # Return file response with proper headers
                return FileResponse(
                    path=temp_path,
                    filename=filename,
                    media_type="audio/mpeg",
                    headers={
                        "Content-Disposition": f"attachment; filename={filename}",
                        "Cache-Control": "public, max-age=3600"  # Cache for 1 hour
                    }
                )
                
            except Exception as download_error:
                # Clean up temp file if download failed
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                raise download_error
                
        except Exception as e:
            logger.error(f"Error downloading MP3 audio file: {e}")
            raise VoiceSessionError(f"Failed to download audio file: {str(e)}")

class AudioConversionError(Exception):
    """Raised when audio conversion fails"""
    pass

class WebSocketConnectionError(Exception):
    """Raised when WebSocket connection fails"""
    pass

class VoiceSessionError(Exception):
    """Raised when voice session encounters an error"""
    pass


async def download_voice_audio_file(storage_path: str):
    """
    Download MP3 audio file from Modal Volume (standalone function)
    
    Args:
        storage_path: Path to the MP3 file in the volume (e.g., "2025-01-15/session-123/twilio_input_8khz.mp3")
        
    Returns:
        FastAPI Response with MP3 audio file
        
    Raises:
        VoiceSessionError: If file not found or download fails
    """
    try:
        if not MODAL_AVAILABLE:
            raise VoiceSessionError("Modal not available for audio download")
        
        logger.info(f"Downloading voice MP3 audio file from storage path: {storage_path}")
        
        # Get the voice debug volume
        volume = modal.Volume.from_name("voice-debug-audio")
        
        # Download the file from the volume
        import tempfile
        import os
        from fastapi.responses import FileResponse
        
        # Create a temporary file to download to
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_path = temp_file.name
        
        try:
            # Download from volume to temporary file
            volume.get_file(f"/{storage_path}", temp_path)
            
            # Get filename for response
            filename = os.path.basename(storage_path)
            
            logger.info(f"Successfully downloaded voice MP3 audio file: {filename}")
            
            # Return file response with proper headers
            return FileResponse(
                path=temp_path,
                filename=filename,
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "Cache-Control": "public, max-age=3600"  # Cache for 1 hour
                }
            )
            
        except Exception as download_error:
            # Clean up temp file if download failed
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise download_error
            
    except Exception as e:
        logger.error(f"Error downloading voice MP3 audio file: {e}")
        raise VoiceSessionError(f"Failed to download voice audio file: {str(e)}") 

# Modal function to save audio to volume (only if Modal is available)
if MODAL_AVAILABLE:
    @app.function(
        timeout=600,
        volumes={"/audio_storage": audio_volume}
    )
    def _save_audio_to_volume(session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Modal function to save audio data to volume as playable MP3 files"""
        try:
            import modal
            import io
            import json
            import tempfile
            import os
            import uuid
            import logging
            from datetime import datetime
            from pydub import AudioSegment
            
            logger = logging.getLogger(__name__)
            
            # Create directory structure using mounted volume path
            today = datetime.utcnow().strftime("%Y-%m-%d")
            session_dir = f"/audio_storage/voice_debug/{today}/{session_data['session_id']}"
            
            # Prepare audio files info
            audio_files = []
            
            # Helper function to convert raw audio to MP3
            def convert_to_mp3(raw_audio: bytes, sample_rate: int, sample_width: int = 2, channels: int = 1) -> bytes:
                """Convert raw PCM audio to MP3 format using pydub"""
                if len(raw_audio) == 0:
                    return b""
                
                # Create AudioSegment from raw audio
                audio_segment = AudioSegment(
                    data=raw_audio,
                    sample_width=sample_width,  # 2 bytes = 16-bit
                    frame_rate=sample_rate,
                    channels=channels
                )
                
                # Export to MP3 format
                mp3_buffer = io.BytesIO()
                audio_segment.export(mp3_buffer, format="mp3", bitrate="128k")
                mp3_buffer.seek(0)
                return mp3_buffer.read()
            
            # Helper function to convert μ-law to PCM then to MP3
            def convert_mulaw_to_mp3(mulaw_audio: bytes, sample_rate: int = 8000) -> bytes:
                """Convert μ-law audio to MP3 format"""
                if len(mulaw_audio) == 0:
                    return b""
                
                import audioop
                # Convert μ-law to PCM (16-bit)
                pcm_audio = audioop.ulaw2lin(mulaw_audio, 2)  # 2 = 16-bit
                
                # Convert PCM to MP3
                return convert_to_mp3(pcm_audio, sample_rate, sample_width=2, channels=1)
            
            # Create directory structure
            os.makedirs(session_dir, exist_ok=True)
            
            # Save Twilio input as MP3 (converted from μ-law)
            if len(session_data['input_audio']) > 0:
                input_filename = f"twilio_input_8khz.mp3"
                input_path = f"{session_dir}/{input_filename}"
                
                try:
                    mp3_data = convert_mulaw_to_mp3(session_data['input_audio'], 8000)
                    if mp3_data:
                        with open(input_path, "wb") as f:
                            f.write(mp3_data)
                        
                        audio_files.append({
                            "type": "twilio_input",
                            "filename": input_filename,
                            "path": input_path,
                            "storage_path": f"voice_debug/{today}/{session_data['session_id']}/{input_filename}",
                            "format": "MP3",
                            "original_format": "μ-law",
                            "sample_rate": 8000,
                            "size_bytes": len(mp3_data),
                            "original_size_bytes": len(session_data['input_audio']),
                            "description": "Twilio input audio converted to MP3"
                        })
                except Exception as e:
                    logger.error(f"Failed to convert Twilio input to MP3: {e}")
            
            # Save Gemini input as MP3 (converted from PCM)
            if len(session_data['gemini_input_audio']) > 0:
                gemini_input_filename = f"gemini_input_16khz.mp3"
                gemini_input_path = f"{session_dir}/{gemini_input_filename}"
                
                try:
                    mp3_data = convert_to_mp3(session_data['gemini_input_audio'], 16000, sample_width=2, channels=1)
                    if mp3_data:
                        with open(gemini_input_path, "wb") as f:
                            f.write(mp3_data)
                        
                        audio_files.append({
                            "type": "gemini_input",
                            "filename": gemini_input_filename,
                            "path": gemini_input_path,
                            "storage_path": f"voice_debug/{today}/{session_data['session_id']}/{gemini_input_filename}",
                            "format": "MP3",
                            "original_format": "PCM",
                            "sample_rate": 16000,
                            "size_bytes": len(mp3_data),
                            "original_size_bytes": len(session_data['gemini_input_audio']),
                            "description": "Gemini input audio converted to MP3"
                        })
                except Exception as e:
                    logger.error(f"Failed to convert Gemini input to MP3: {e}")
            
            # Save Gemini output as MP3 (converted from PCM)
            if len(session_data['output_audio']) > 0:
                output_filename = f"gemini_output_24khz.mp3"
                output_path = f"{session_dir}/{output_filename}"
                
                try:
                    mp3_data = convert_to_mp3(session_data['output_audio'], 24000, sample_width=2, channels=1)
                    if mp3_data:
                        with open(output_path, "wb") as f:
                            f.write(mp3_data)
                        
                        audio_files.append({
                            "type": "gemini_output",
                            "filename": output_filename,
                            "path": output_path,
                            "storage_path": f"voice_debug/{today}/{session_data['session_id']}/{output_filename}",
                            "format": "MP3",
                            "original_format": "PCM",
                            "sample_rate": 24000,
                            "size_bytes": len(mp3_data),
                            "original_size_bytes": len(session_data['output_audio']),
                            "description": "Gemini output audio converted to MP3"
                        })
                except Exception as e:
                    logger.error(f"Failed to convert Gemini output to MP3: {e}")
            
            # Save session metadata
            session_info = {
                "session_id": session_data['session_id'],
                "call_sid": session_data['call_sid'],
                "phone_number": session_data['phone_number'],
                "start_time": session_data['start_time'],
                "duration": session_data['duration'],
                "turn_count": session_data['turn_count'],
                "audio_files": audio_files,
                "saved_at": datetime.utcnow().isoformat(),
                "format_note": "All audio files converted to MP3 for playback compatibility"
            }
            
            metadata_path = f"{session_dir}/session_metadata.json"
            with open(metadata_path, "w") as f:
                json.dump(session_info, f, indent=2)
            
            # Commit changes to volume (following the pattern from EDUCATION.py)
            audio_volume.commit()
            
            return {
                "status": "success",
                "session_id": session_data['session_id'],
                "storage_path": f"voice_debug/{today}/{session_data['session_id']}",
                "audio_files": audio_files,
                "total_files": len(audio_files),
                "format": "MP3",
                "note": "All audio files converted to playable MP3 format"
            }
            
        except Exception as e:
            logger.error(f"Error saving session audio to volume: {e}")
            return {"status": "failed", "message": str(e)}
else:
    # Dummy function when Modal is not available
    def _save_audio_to_volume(session_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "skipped", "message": "Modal not available"} 