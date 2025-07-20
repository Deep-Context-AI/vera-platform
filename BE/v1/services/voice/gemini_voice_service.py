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
            
            logger.info(f"🚀 Starting Gemini Live session for call: {session_manager.call_sid}")
            
            # Initialize voice session manager
            self.voice_session_manager = VoiceSessionManager(
                session_id=session_manager.session_id,
                call_sid=session_manager.call_sid,
                phone_number=session_manager.phone_number
            )
            
            # Connect to Gemini Live API
            config = self._build_live_config()
            logger.info(f"📋 Gemini Live config: model={self.config.model_name}, voice={self.config.voice_name}")
            
            self._session_context_manager = self.client.aio.live.connect(
                model=self.config.model_name,
                config=config
            )
            
            # Start the session using the context manager
            logger.info("🔗 Establishing Gemini Live connection...")
            self.session = await self._session_context_manager.__aenter__()
            logger.info("✅ Gemini Live session established")
            
            self.state = GeminiSessionState.CONNECTED
            logger.info(f"Gemini Live session started for call: {session_manager.call_sid}")
            
            # Start response handler
            logger.info("🎧 Starting Gemini response handler task...")
            response_task = asyncio.create_task(self._handle_gemini_responses())
            logger.info(f"📡 Response handler task created: {response_task}")
            
            # Send initial greeting
            logger.info("👋 Sending initial greeting to Gemini...")
            await self.send_initial_greeting()
            logger.info("✅ Initial greeting sent")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to start Gemini session: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
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
            # Quick analysis of audio content
            non_zero_bytes = sum(1 for b in audio_chunk.data if b != 0) if len(audio_chunk.data) > 0 else 0
            silence_percentage = (len(audio_chunk.data) - non_zero_bytes) / len(audio_chunk.data) * 100 if len(audio_chunk.data) > 0 else 100
            
            # Only log if audio contains meaningful data (less than 90% silence)
            if silence_percentage < 90:
                logger.info(f"🎤 Sending VOICE audio to Gemini: {len(audio_chunk.data)} bytes, {non_zero_bytes} non-zero bytes ({100-silence_percentage:.1f}% signal)")
            else:
                logger.debug(f"🔇 Sending silence to Gemini: {len(audio_chunk.data)} bytes, {silence_percentage:.1f}% silence")
            
            # Create the blob for Gemini
            audio_blob = types.Blob(
                data=audio_chunk.data,
                mime_type="audio/pcm;rate=16000"
            )
            
            # Send to Gemini Live API
            await self.session.send_realtime_input(audio=audio_blob)
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending audio chunk to Gemini: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Check if this is a recoverable error
            error_str = str(e).lower()
            if "signature" in error_str or "invalid" in error_str:
                logger.warning("Gemini API signature/validation error - continuing session")
            else:
                logger.error("Critical Gemini error - may need to restart session")
                
            if self.on_error:
                await self.on_error(e)
            return False

    async def send_raw_audio_chunk(self, audio_chunk: AudioChunk) -> bool:
        """Send raw Twilio audio chunk to Gemini with proper format conversion"""
        if self.state != GeminiSessionState.CONNECTED:
            logger.debug(f"Cannot send audio chunk in state: {self.state}")
            return False
            
        if not self.session:
            logger.error("No active Gemini session")
            return False
            
        try:
            logger.info(f"📡 Converting and sending audio to Gemini:")
            logger.info(f"  - Input format: {audio_chunk.format} (μ-law)")
            logger.info(f"  - Input sample rate: {audio_chunk.sample_rate}Hz")
            logger.info(f"  - Input data length: {len(audio_chunk.data)} bytes")
            
            # Convert μ-law to PCM since Gemini expects PCM format
            import audioop
            
            # Step 1: Convert μ-law to linear PCM (16-bit)
            pcm_data = audioop.ulaw2lin(audio_chunk.data, 2)  # 2 = 16-bit
            logger.info(f"  - After μ-law->PCM conversion: {len(pcm_data)} bytes")
            
            # Step 2: Resample from 8kHz to 16kHz (Gemini expects 16kHz)
            pcm_16khz, _ = audioop.ratecv(
                pcm_data,
                2,  # 16-bit = 2 bytes
                1,  # mono
                8000,  # input sample rate (Twilio)
                16000,  # output sample rate (Gemini)
                None  # no state
            )
            logger.info(f"  - After resampling to 16kHz: {len(pcm_16khz)} bytes")
            
            # Step 3: Create blob with correct format for Gemini
            audio_blob = types.Blob(
                data=pcm_16khz,
                mime_type="audio/pcm;rate=16000"  # Gemini's expected format
            )
            
            logger.info("📤 Sending converted PCM audio to Gemini Live API...")
            await self.session.send_realtime_input(audio=audio_blob)
            logger.info("✅ Successfully sent converted audio to Gemini")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error converting and sending audio to Gemini: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            if self.on_error:
                await self.on_error(e)
            return False

    async def send_initial_greeting(self) -> bool:
        """Send initial greeting to start the conversation"""
        if self.state != GeminiSessionState.CONNECTED:
            logger.error("Cannot send greeting - session not connected")
            return False
            
        try:
            logger.info("📝 Preparing initial greeting for Gemini...")
            
            # Use send_client_content for text-to-audio conversion
            greeting_content = {
                "role": "user", 
                "parts": [{"text": "Hello! Please respond with audio and only 'hi'"}]
            }
            
            logger.info(f"💬 Sending greeting: {greeting_content}")
            
            await self.session.send_client_content(
                turns=greeting_content,
                turn_complete=True
            )
            
            logger.info("✅ Initial greeting sent to Gemini successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sending initial greeting: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
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
        """Continuously read and process responses from Gemini Live API.

        In some cases the underlying ``session.receive()`` async generator finishes
        without raising an exception (for example when the server thinks the turn
        is complete but keeps the connection open).  Previously we exited the
        handler permanently in that situation which meant **no further Gemini
        responses were ever processed** even though we kept streaming user audio.

        We now wrap the ``async for`` loop inside an outer ``while`` so that we
        automatically resume reading if the generator terminates while the
        session is still logically connected.  This makes the handler resilient
        to benign stream closures that happen after each turn and prevents the
        "stuck after first response" behaviour the logs in dump.txt revealed.
        """

        logger.info("Starting Gemini response handler...")
        response_count = 0

        while self.state == GeminiSessionState.CONNECTED and self.session:
            try:
                last_heartbeat = asyncio.get_event_loop().time()

                # The inner loop will automatically break if the stream closes
                async for response in self.session.receive():
                    response_count += 1
                    current_time = asyncio.get_event_loop().time()

                    logger.info(
                        f"📨 Gemini response #{response_count} received at {current_time:.2f}s"
                    )

                    await self._process_gemini_response(response)

                    # Emit a heartbeat every ~5 s so we know the task is alive
                    if current_time - last_heartbeat > 5.0:
                        logger.info(
                            f"💓 Gemini response handler heartbeat – {response_count} responses so far"
                        )
                        last_heartbeat = current_time

                # If we get here **without** hitting an exception the async
                # generator ended cleanly.  That usually means the server sent
                # a GO_AWAY or closed the stream after a turn.  We'll simply
                # restart the receive loop unless the session has been marked
                # inactive in the meantime.
                if self.state == GeminiSessionState.CONNECTED:
                    logger.warning(
                        "Gemini receive stream ended unexpectedly – restarting listener"
                    )
                    # Small pause to avoid a tight reconnect loop in pathological cases
                    await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(
                    f"Error in Gemini response handler after {response_count} responses: {e}"
                )
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")

                self.state = GeminiSessionState.ERROR
                if self.on_error:
                    await self.on_error(e)
                break  # Abort outer while – caller will decide what to do

        logger.info(
            f"Gemini response handler terminated after processing {response_count} responses"
        )

    async def _process_gemini_response(self, response):
        """Process individual response from Gemini"""
        try:
            logger.debug(f"=== GEMINI RESPONSE DEBUG ===")
            logger.debug(f"Response type: {type(response)}")
            logger.debug(f"Response attributes: {dir(response)}")
            
            processed_audio = False  # ensure we don't send the same chunk twice

            # 1) Top-level `data` attribute (seen with some server messages)
            if hasattr(response, 'data') and response.data:
                logger.info(f"🎵 Received audio data from Gemini: {len(response.data)} bytes (top-level)")

                await self._forward_gemini_audio(response.data)
                processed_audio = True

            # Handle server content (transcriptions, turn completion, etc.)
            if hasattr(response, 'server_content') and response.server_content:
                server_content = response.server_content
                logger.debug(f"Server content received: {type(server_content)}")
                logger.debug(f"Server content attributes: {dir(server_content)}")
                
                # Check for audio data in model_turn parts
                if hasattr(server_content, 'model_turn') and server_content.model_turn:
                    model_turn = server_content.model_turn
                    logger.debug(f"Model turn received: {type(model_turn)}")
                    
                    if hasattr(model_turn, 'parts'):
                        logger.debug(f"Model turn has {len(model_turn.parts)} parts")
                        for i, part in enumerate(model_turn.parts):
                            logger.debug(f"Part {i}: {type(part)}")
                            
                            # Check for text content
                            if hasattr(part, 'text') and part.text:
                                logger.info(f"💬 Gemini speech transcribed: '{part.text.strip()}'")
                            
                            # Check for audio data in parts
                            if hasattr(part, 'inline_data') and part.inline_data:
                                inline_data = part.inline_data
                                if hasattr(inline_data, 'mime_type') and 'audio' in inline_data.mime_type:
                                    if hasattr(inline_data, 'data') and inline_data.data:
                                        logger.info(f"🎵 Found audio in model_turn part {i}: {len(inline_data.data)} bytes, mime_type: {inline_data.mime_type}")
                                        
                                        if not processed_audio:
                                            await self._forward_gemini_audio(inline_data.data)
                                            processed_audio = True
                            
                            if not hasattr(part, 'text') and not hasattr(part, 'inline_data'):
                                logger.debug(f"Part {i} has no text or inline_data")

                # Handle turn completion
                if hasattr(server_content, 'turn_complete') and server_content.turn_complete:
                    self.turn_count += 1
                    logger.info(f"Gemini turn completed (Turn {self.turn_count})")
                    
                    if self.on_turn_complete:
                        await self.on_turn_complete()
                        logger.debug("Turn complete callback executed")
                    else:
                        logger.warning("No turn complete callback available")
                else:
                    logger.debug("No turn completion in server content")
            else:
                logger.debug("No server content in response")
                
            # Handle other response types
            if hasattr(response, 'tool_call') and response.tool_call:
                logger.debug(f"Tool call received: {response.tool_call}")
                
            if hasattr(response, 'client_content') and response.client_content:
                logger.debug(f"Client content received: {response.client_content}")
                
            logger.debug(f"=== END GEMINI RESPONSE DEBUG ===")

        except Exception as e:
            logger.error(f"Error processing Gemini response: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            if self.on_error:
                await self.on_error(e)

    async def _forward_gemini_audio(self, gemini_audio: bytes):
        """Helper to convert Gemini PCM to Twilio μ-law and forward via callback."""
        if not self.voice_session_manager:
            logger.warning("⚠️ No voice session manager available – dropping audio")
            return

        try:
            timestamp = asyncio.get_event_loop().time()
            twilio_chunk = await self.voice_session_manager.process_gemini_audio(
                gemini_audio, timestamp
            )

            logger.info(
                f"🔄 Converted Gemini audio to Twilio format: {len(twilio_chunk.data)} bytes"
            )

            if self.on_audio_received:
                await self.on_audio_received(twilio_chunk)
                logger.info("📤 Audio sent to Twilio callback")
            else:
                logger.warning("⚠️ No audio callback available")
        except Exception as e:
            logger.error(f"Error forwarding Gemini audio: {e}")

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