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

# Import websockets exceptions for precise error handling
try:
    from websockets.exceptions import ConnectionClosedOK
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    ConnectionClosedOK = None

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
    simulate_initial: bool = False
    enable_function_calling: bool = True
    application_id: Optional[int] = None
    practitioner_name: Optional[str] = None
    
    def __post_init__(self):
        if self.response_modalities is None:
            self.response_modalities = ["AUDIO"]
        
        if self.system_instruction is None:
            self.system_instruction = """You are a professional voice assistant for education verification calls. 
            Speak clearly and concisely. Keep responses brief and to the point. 
            You are calling to verify education credentials.
            
            When you have gathered sufficient information to make a verification decision, call the 
            complete_education_verification function with your assessment. You should call this function 
            when you either:
            1. Successfully verified the education credentials and can approve them
            2. Found discrepancies or issues that require manual review
            3. Cannot obtain sufficient information to complete verification
            
            After completing the verification, you should politely conclude the conversation and then
            call the end_call function to gracefully terminate the call. Always provide a clear summary 
            of the conversation and your reasoning for the decision.
            
            Use the end_call function when:
            - You have completed the verification process and said goodbye
            - The conversation has naturally concluded after providing results
            - You need to end the call due to inability to reach the right department or person
            - The other party has indicated they need to end the call
            
            Always be polite and professional when ending calls."""


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
        
        # Transcript storage
        self.input_transcript = []  # User speech transcriptions
        self.output_transcript = []  # Gemini speech transcriptions
        self.full_conversation = []  # Combined conversation flow
        
        # Token usage tracking
        self.total_token_count = 0
        self.token_usage_details = []  # List of usage metadata entries
        self.current_session_tokens = {
            "total": 0,
            "audio_input": 0,
            "audio_output": 0,
            "text_input": 0,
            "text_output": 0
        }
        
        # Callbacks
        self.on_audio_received: Optional[Callable] = None
        self.on_turn_complete: Optional[Callable] = None
        self.on_error: Optional[Callable] = None
        self.on_function_call: Optional[Callable] = None

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
            
            # Send initial greeting only if simulate_initial is enabled
            if self.config.simulate_initial:
                logger.info("👋 Sending initial greeting to Gemini...")
                await self.send_initial_greeting()
                logger.info("✅ Initial greeting sent")
            else:
                logger.info("⏭️ Skipping initial greeting (simulate_initial=False)")
            
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
            # Convert μ-law to PCM since Gemini expects PCM format
            import audioop
            
            # Step 1: Convert μ-law to linear PCM (16-bit)
            pcm_data = audioop.ulaw2lin(audio_chunk.data, 2)  # 2 = 16-bit
            
            # Step 2: Resample from 8kHz to 16kHz (Gemini expects 16kHz)
            pcm_16khz, _ = audioop.ratecv(
                pcm_data,
                2,  # 16-bit = 2 bytes
                1,  # mono
                8000,  # input sample rate (Twilio)
                16000,  # output sample rate (Gemini)
                None  # no state
            )
            
            # Step 3: Create blob with correct format for Gemini
            audio_blob = types.Blob(
                data=pcm_16khz,
                mime_type="audio/pcm;rate=16000"  # Gemini's expected format
            )
            
            await self.session.send_realtime_input(audio=audio_blob)
            
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
        """End the Gemini session and save both audio and transcript"""
        if self.session and hasattr(self, '_session_context_manager'):
            try:
                await self._session_context_manager.__aexit__(None, None, None)
                duration = asyncio.get_event_loop().time() - self.session_start_time if self.session_start_time else 0
                logger.info(f"Gemini session ended. Duration: {duration:.2f}s, Turns: {self.turn_count}, Total Tokens: {self.total_token_count}")
                
                # Log token usage breakdown if available
                if self.current_session_tokens and any(v > 0 for v in self.current_session_tokens.values() if isinstance(v, int)):
                    token_breakdown = ", ".join([f"{k.replace('_', ' ').title()}: {v}" for k, v in self.current_session_tokens.items() if isinstance(v, int) and v > 0])
                    logger.info(f"🪙 Final token breakdown: {token_breakdown}")
                
                # Save both audio and transcript
                if self.voice_session_manager:
                    # Save audio files
                    audio_result = await self.voice_session_manager.save_session_audio()
                    logger.info(f"Audio save result: {audio_result}")
                    
                    # Save transcript files
                    transcript_result = await self._save_session_transcript()
                    logger.info(f"Transcript save result: {transcript_result}")
                    
            except Exception as e:
                logger.error(f"Error closing Gemini session: {e}")
            finally:
                self.session = None
                self._session_context_manager = None
                
        self.state = GeminiSessionState.DISCONNECTED
        return True

    async def _save_session_transcript(self) -> Dict[str, Any]:
        """Save conversation transcript to Modal volume"""
        try:
            if not self.voice_session_manager:
                return {"status": "skipped", "message": "No voice session manager available"}
            
            # Try to import Modal components
            try:
                import modal
                from v1.config.modal_config import app
                MODAL_AVAILABLE = True
            except ImportError:
                logger.warning("Modal not available, skipping transcript save")
                return {"status": "skipped", "message": "Modal not available"}
            
            # Prepare transcript data
            transcript_data = {
                "session_id": self.voice_session_manager.conversation_state.session_id,
                "call_sid": self.voice_session_manager.conversation_state.call_sid,
                "phone_number": self.voice_session_manager.conversation_state.phone_number,
                "start_time": self.voice_session_manager.conversation_state.start_time,
                "duration": asyncio.get_event_loop().time() - self.session_start_time if self.session_start_time else 0,
                "turn_count": self.turn_count,
                "input_transcript": self.input_transcript,
                "output_transcript": self.output_transcript,
                "full_conversation": self.full_conversation,
                "token_usage": {
                    "total_tokens": self.total_token_count,
                    "session_tokens": self.current_session_tokens,
                    "usage_details": self.token_usage_details,
                    "total_usage_entries": len(self.token_usage_details)
                }
            }
            
            # Call the Modal function to save the transcript
            try:
                result = await _save_transcript_to_volume.remote.aio(transcript_data)
                return result
            except Exception as e:
                logger.error(f"Failed to call Modal transcript function: {e}")
                return {"status": "failed", "message": f"Modal function failed: {e}"}
            
        except Exception as e:
            logger.error(f"Error saving session transcript: {e}")
            return {"status": "failed", "message": str(e)}

    async def _process_token_usage(self, usage_metadata):
        """Process token usage metadata from Gemini responses"""
        try:
            if not usage_metadata:
                return
            
            # Get total token count
            total_tokens = getattr(usage_metadata, 'total_token_count', 0)
            timestamp = asyncio.get_event_loop().time()
            
            # Update total count
            if total_tokens > self.total_token_count:
                self.total_token_count = total_tokens
                self.current_session_tokens["total"] = total_tokens
            
            # Process detailed token breakdown by modality
            token_details = {}
            if hasattr(usage_metadata, 'response_tokens_details'):
                for detail in usage_metadata.response_tokens_details:
                    if hasattr(detail, 'modality') and hasattr(detail, 'token_count'):
                        modality = str(detail.modality).lower()
                        token_count = detail.token_count
                        token_details[modality] = token_count
                        
                        # Update current session tracking
                        if modality in self.current_session_tokens:
                            self.current_session_tokens[modality] = token_count
                        
                        logger.debug(f"🪙 Token usage - {modality}: {token_count}")
            
            # Store detailed usage entry
            usage_entry = {
                "timestamp": timestamp,
                "turn": self.turn_count,
                "total_tokens": total_tokens,
                "token_details": token_details,
                "cumulative_total": self.total_token_count
            }
            
            self.token_usage_details.append(usage_entry)
            
            # Log token usage summary
            if token_details:
                details_str = ", ".join([f"{k}: {v}" for k, v in token_details.items()])
                logger.info(f"🪙 Token usage update - Total: {total_tokens} ({details_str})")
            else:
                logger.info(f"🪙 Token usage update - Total: {total_tokens}")
                
        except Exception as e:
            logger.error(f"Error processing token usage: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

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

                    await self._process_gemini_response(response)

                    # Emit a heartbeat every ~5 s so we know the task is alive
                    if current_time - last_heartbeat > 5.0:
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
                # Handle normal WebSocket closure (1000 OK) gracefully
                if WEBSOCKETS_AVAILABLE and ConnectionClosedOK and isinstance(e, ConnectionClosedOK):
                    logger.info(f"Gemini session ended normally (WebSocket closed OK) after {response_count} responses")
                    # This is a normal session end initiated by Gemini - don't restart
                    # TODO: Monitor if this pattern is too aggressive in ending sessions
                    break
                
                # Fallback: check error string for connection closure patterns
                error_str = str(e).lower()
                if "connectionclosedok" in error_str or "sent 1000 (ok)" in error_str:
                    logger.info(f"Gemini session ended normally (WebSocket closed OK) after {response_count} responses")
                    # This is a normal session end initiated by Gemini - don't restart
                    # TODO: Monitor if this pattern is too aggressive in ending sessions
                    break
                
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
            processed_audio = False  # ensure we don't send the same chunk twice

            # 1) Top-level `data` attribute (seen with some server messages)
            if hasattr(response, 'data') and response.data:
                await self._forward_gemini_audio(response.data)
                processed_audio = True

            # Handle server content (transcriptions, turn completion, etc.)
            if hasattr(response, 'server_content') and response.server_content:
                server_content = response.server_content
                
                # Check for audio data in model_turn parts
                if hasattr(server_content, 'model_turn') and server_content.model_turn:
                    model_turn = server_content.model_turn
                    
                    if hasattr(model_turn, 'parts'):
                        for i, part in enumerate(model_turn.parts):
                            
                            # Check for text content
                            if hasattr(part, 'text') and part.text:
                                logger.info(f"💬 Gemini speech transcribed: '{part.text.strip()}'")
                            
                            # Check for audio data in parts
                            if hasattr(part, 'inline_data') and part.inline_data:
                                inline_data = part.inline_data
                                if hasattr(inline_data, 'mime_type') and 'audio' in inline_data.mime_type:
                                    if hasattr(inline_data, 'data') and inline_data.data:
                                        if not processed_audio:
                                            await self._forward_gemini_audio(inline_data.data)
                                            processed_audio = True

                # Handle turn completion
                if hasattr(server_content, 'turn_complete') and server_content.turn_complete:
                    self.turn_count += 1
                    logger.info(f"Gemini turn completed (Turn {self.turn_count})")
                    
                    if self.on_turn_complete:
                        await self.on_turn_complete()
                        logger.debug("Turn complete callback executed")
                    else:
                        logger.warning("No turn complete callback available")
                # else:
                #     logger.debug("No turn completion in server content")
            else:
                logger.debug("No server content in response")
                
            # Handle function calls (tool calls)
            if hasattr(response, 'tool_call') and response.tool_call:
                logger.info(f"🔧 Function call received from Gemini: {response.tool_call}")
                
                try:
                    # Process the function call
                    if self.on_function_call:
                        await self.on_function_call(response.tool_call)
                    else:
                        logger.warning("⚠️ Function call received but no callback handler set")
                        
                    # Send function response back to Gemini
                    function_responses = []
                    if hasattr(response.tool_call, 'function_calls'):
                        for fc in response.tool_call.function_calls:
                            function_response = types.FunctionResponse(
                                id=fc.id,
                                name=fc.name,
                                response={"result": "completed", "status": "success"}
                            )
                            function_responses.append(function_response)
                        
                        # Send the function responses back to Gemini
                        await self.session.send_tool_response(function_responses=function_responses)
                        logger.info(f"✅ Sent function response back to Gemini: {len(function_responses)} responses")
                    
                except Exception as e:
                    logger.error(f"❌ Error processing function call: {e}")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")
                
            if hasattr(response, 'client_content') and response.client_content:
                logger.debug(f"Client content received: {response.client_content}")
            
            # Collect transcript text both I/O
            if hasattr(response, 'server_content') and response.server_content:
                server_content = response.server_content
                
                # Collect input transcription (user speech)
                if hasattr(server_content, 'input_transcription') and server_content.input_transcription:
                    try:
                        # Handle Transcription object properly - access text content
                        transcription_obj = server_content.input_transcription
                        if hasattr(transcription_obj, 'text'):
                            input_text = transcription_obj.text.strip() if transcription_obj.text else ""
                        elif hasattr(transcription_obj, 'content'):
                            input_text = transcription_obj.content.strip() if transcription_obj.content else ""
                        else:
                            # If it's already a string, use it directly
                            input_text = str(transcription_obj).strip()
                        
                        if input_text:
                            timestamp = asyncio.get_event_loop().time()
                            self.input_transcript.append({
                                "text": input_text,
                                "timestamp": timestamp,
                                "turn": self.turn_count,
                                "type": "user"
                            })
                            self.full_conversation.append({
                                "speaker": "user",
                                "text": input_text,
                                "timestamp": timestamp,
                                "turn": self.turn_count
                            })
                            logger.info(f"🎤 User speech transcribed: '{input_text}'")
                    except Exception as e:
                        logger.error(f"Error processing input transcription: {e}")
                
                # Collect output transcription (Gemini speech)
                if hasattr(server_content, 'output_transcription') and server_content.output_transcription:
                    try:
                        # Handle Transcription object properly - access text content
                        transcription_obj = server_content.output_transcription
                        if hasattr(transcription_obj, 'text'):
                            output_text = transcription_obj.text.strip() if transcription_obj.text else ""
                        elif hasattr(transcription_obj, 'content'):
                            output_text = transcription_obj.content.strip() if transcription_obj.content else ""
                        else:
                            # If it's already a string, use it directly
                            output_text = str(transcription_obj).strip()
                        
                        if output_text:
                            timestamp = asyncio.get_event_loop().time()
                            self.output_transcript.append({
                                "text": output_text,
                                "timestamp": timestamp,
                                "turn": self.turn_count,
                                "type": "assistant"
                            })
                            self.full_conversation.append({
                                "speaker": "assistant",
                                "text": output_text,
                                "timestamp": timestamp,
                                "turn": self.turn_count
                            })
                            logger.info(f"🤖 Gemini speech transcribed: '{output_text}'")
                    except Exception as e:
                        logger.error(f"Error processing output transcription: {e}")
            
            # Collect token usage information
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                await self._process_token_usage(response.usage_metadata)

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

            if self.on_audio_received:
                await self.on_audio_received(twilio_chunk)
            else:
                logger.warning("⚠️ No audio callback available")
        except Exception as e:
            logger.error(f"Error forwarding Gemini audio: {e}")

    def _build_live_config(self) -> types.LiveConnectConfig:
        """Build configuration for Gemini Live API"""
        tools = []
        
        # Add function calling tool if enabled
        if self.config.enable_function_calling:
            education_verification_function = {
                "name": "complete_education_verification",
                "description": "Complete the education verification process with a final decision based on the conversation",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "decision": {
                            "type": "string",
                            "enum": ["approved", "requires_review"],
                            "description": "The verification decision: 'approved' if credentials are verified successfully, 'requires_review' if there are issues or insufficient information"
                        },
                        "call_summary": {
                            "type": "string",
                            "description": "A comprehensive summary of the call including who was contacted, what information was gathered, and the verification outcome"
                        },
                        "reasoning": {
                            "type": "string", 
                            "description": "Detailed reasoning for the decision, explaining what was verified or what issues were found"
                        },
                        "contact_person": {
                            "type": "string",
                            "description": "Name and title of the person contacted during verification (if any)"
                        },
                        "verification_status": {
                            "type": "string",
                            "description": "Status of the verification attempt: 'completed', 'partial', 'failed', or 'unable_to_contact'"
                        }
                    },
                    "required": ["decision", "call_summary", "reasoning", "verification_status"]
                }
            }
            
            end_call_function = {
                "name": "end_call",
                "description": "End the phone call gracefully after completing the verification or when the conversation has concluded",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "reason": {
                            "type": "string",
                            "description": "Reason for ending the call: 'verification_completed', 'unable_to_help', 'wrong_department', or 'conversation_concluded'"
                        },
                        "farewell_message": {
                            "type": "string",
                            "description": "A brief farewell message that was conveyed to the person before ending the call"
                        }
                    },
                    "required": ["reason"]
                }
            }
            
            tools.append({"function_declarations": [education_verification_function, end_call_function]})
        
        return types.LiveConnectConfig(
            response_modalities=self.config.response_modalities,
            system_instruction=self.config.system_instruction,
            tools=tools,
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
            ),
            # API Reference says this is no types and this is exactly how it is in example
            input_audio_transcription={},
            output_audio_transcription={},
        )

    def get_session_status(self) -> Dict[str, Any]:
        """Get current session status"""
        duration = asyncio.get_event_loop().time() - self.session_start_time if self.session_start_time else 0
        return {
            "state": self.state.value,
            "turn_count": self.turn_count,
            "duration": duration,
            "session_active": self.session is not None,
            "transcript_info": self.get_transcript_info()
        }
    
    def get_transcript_info(self) -> Dict[str, Any]:
        """Get current transcript information"""
        return {
            "input_entries": len(self.input_transcript),
            "output_entries": len(self.output_transcript),
            "conversation_entries": len(self.full_conversation),
            "has_transcript_data": len(self.full_conversation) > 0,
            "token_usage": {
                "total_tokens": self.total_token_count,
                "usage_entries": len(self.token_usage_details),
                "current_session_tokens": self.current_session_tokens
            }
        }

    def set_callbacks(self,
                     on_audio_received: Optional[Callable] = None,
                     on_turn_complete: Optional[Callable] = None,
                     on_error: Optional[Callable] = None,
                     on_function_call: Optional[Callable] = None):
        """Set callback functions"""
        self.on_audio_received = on_audio_received
        self.on_turn_complete = on_turn_complete
        self.on_error = on_error
        self.on_function_call = on_function_call


class GeminiVoiceServiceError(Exception):
    """Exception raised by Gemini voice service"""
    pass


# Modal function to save transcript to volume (only if Modal is available)
try:
    import modal
    from v1.config.modal_config import app
    MODAL_AVAILABLE = True
    # Reference the same volume used for audio
    audio_volume = modal.Volume.from_name("voice-debug-audio", create_if_missing=True)
    
    @app.function(
        timeout=300,
        volumes={"/audio_storage": audio_volume}
    )
    def _save_transcript_to_volume(transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        """Modal function to save transcript data to volume as text files"""
        try:
            import json
            import os
            from datetime import datetime
            
            # Create directory structure using mounted volume path (same as audio)
            today = datetime.utcnow().strftime("%Y-%m-%d")
            session_dir = f"/audio_storage/voice_debug/{today}/{transcript_data['session_id']}"
            
            # Create directory structure
            os.makedirs(session_dir, exist_ok=True)
            
            # Prepare transcript files
            transcript_files = []
            
            # 1. Save full conversation transcript
            if transcript_data['full_conversation']:
                conversation_filename = "full_conversation.txt"
                conversation_path = f"{session_dir}/{conversation_filename}"
                
                with open(conversation_path, "w", encoding="utf-8") as f:
                    f.write(f"Voice Call Transcript\n")
                    f.write(f"=====================\n")
                    f.write(f"Session ID: {transcript_data['session_id']}\n")
                    f.write(f"Call SID: {transcript_data['call_sid']}\n")
                    f.write(f"Phone Number: {transcript_data['phone_number']}\n")
                    f.write(f"Start Time: {datetime.fromtimestamp(transcript_data['start_time']).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
                    f.write(f"Duration: {transcript_data['duration']:.2f} seconds\n")
                    f.write(f"Total Turns: {transcript_data['turn_count']}\n")
                    
                    # Add token usage summary
                    if 'token_usage' in transcript_data:
                        token_usage = transcript_data['token_usage']
                        f.write(f"\nToken Usage Summary:\n")
                        f.write(f"===================\n")
                        f.write(f"Total Tokens: {token_usage['total_tokens']}\n")
                        if token_usage['session_tokens']:
                            session_tokens = token_usage['session_tokens']
                            if session_tokens.get('audio_input', 0) > 0:
                                f.write(f"Audio Input Tokens: {session_tokens['audio_input']}\n")
                            if session_tokens.get('audio_output', 0) > 0:
                                f.write(f"Audio Output Tokens: {session_tokens['audio_output']}\n")
                            if session_tokens.get('text_input', 0) > 0:
                                f.write(f"Text Input Tokens: {session_tokens['text_input']}\n")
                            if session_tokens.get('text_output', 0) > 0:
                                f.write(f"Text Output Tokens: {session_tokens['text_output']}\n")
                        f.write(f"Usage Updates: {token_usage['total_usage_entries']}\n")
                    
                    f.write(f"\nConversation:\n")
                    f.write(f"=============\n\n")
                    
                    for entry in transcript_data['full_conversation']:
                        timestamp = datetime.fromtimestamp(entry['timestamp']).strftime('%H:%M:%S')
                        speaker = entry['speaker'].upper()
                        text = entry['text']
                        turn = entry['turn']
                        f.write(f"[{timestamp}] {speaker} (Turn {turn}): {text}\n")
                
                transcript_files.append({
                    "type": "full_conversation",
                    "filename": conversation_filename,
                    "path": conversation_path,
                    "storage_path": f"voice_debug/{today}/{transcript_data['session_id']}/{conversation_filename}",
                    "description": "Complete conversation transcript with timestamps"
                })
            
            # 2. Save user input transcript
            if transcript_data['input_transcript']:
                input_filename = "user_input.txt"
                input_path = f"{session_dir}/{input_filename}"
                
                with open(input_path, "w", encoding="utf-8") as f:
                    f.write("User Speech Transcript\n")
                    f.write("======================\n\n")
                    
                    for entry in transcript_data['input_transcript']:
                        timestamp = datetime.fromtimestamp(entry['timestamp']).strftime('%H:%M:%S')
                        turn = entry['turn']
                        text = entry['text']
                        f.write(f"[{timestamp}] Turn {turn}: {text}\n")
                
                transcript_files.append({
                    "type": "user_input",
                    "filename": input_filename,
                    "path": input_path,
                    "storage_path": f"voice_debug/{today}/{transcript_data['session_id']}/{input_filename}",
                    "description": "User speech transcriptions only"
                })
            
            # 3. Save assistant output transcript
            if transcript_data['output_transcript']:
                output_filename = "assistant_output.txt"
                output_path = f"{session_dir}/{output_filename}"
                
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write("Assistant Speech Transcript\n")
                    f.write("===========================\n\n")
                    
                    for entry in transcript_data['output_transcript']:
                        timestamp = datetime.fromtimestamp(entry['timestamp']).strftime('%H:%M:%S')
                        turn = entry['turn']
                        text = entry['text']
                        f.write(f"[{timestamp}] Turn {turn}: {text}\n")
                
                transcript_files.append({
                    "type": "assistant_output",
                    "filename": output_filename,
                    "path": output_path,
                    "storage_path": f"voice_debug/{today}/{transcript_data['session_id']}/{output_filename}",
                    "description": "Assistant speech transcriptions only"
                })
            
            # 4. Save token usage details
            if 'token_usage' in transcript_data and transcript_data['token_usage']['total_usage_entries'] > 0:
                token_filename = "token_usage.txt"
                token_path = f"{session_dir}/{token_filename}"
                
                with open(token_path, "w", encoding="utf-8") as f:
                    f.write("Token Usage Details\n")
                    f.write("===================\n\n")
                    
                    token_usage = transcript_data['token_usage']
                    f.write(f"Session Summary:\n")
                    f.write(f"Total Tokens Consumed: {token_usage['total_tokens']}\n")
                    f.write(f"Total Usage Updates: {token_usage['total_usage_entries']}\n\n")
                    
                    if token_usage['session_tokens']:
                        f.write(f"Final Token Breakdown:\n")
                        session_tokens = token_usage['session_tokens']
                        for modality, count in session_tokens.items():
                            if count > 0:
                                f.write(f"  {modality.replace('_', ' ').title()}: {count}\n")
                        f.write(f"\n")
                    
                    f.write(f"Detailed Usage Timeline:\n")
                    f.write(f"========================\n\n")
                    
                    for i, usage_entry in enumerate(token_usage['usage_details'], 1):
                        timestamp = datetime.fromtimestamp(usage_entry['timestamp']).strftime('%H:%M:%S')
                        f.write(f"Update #{i} - [{timestamp}] Turn {usage_entry['turn']}:\n")
                        f.write(f"  Total Tokens: {usage_entry['total_tokens']}\n")
                        f.write(f"  Cumulative Total: {usage_entry['cumulative_total']}\n")
                        
                        if usage_entry['token_details']:
                            f.write(f"  Breakdown:\n")
                            for modality, count in usage_entry['token_details'].items():
                                f.write(f"    {modality.replace('_', ' ').title()}: {count}\n")
                        f.write(f"\n")
                
                transcript_files.append({
                    "type": "token_usage",
                    "filename": token_filename,
                    "path": token_path,
                    "storage_path": f"voice_debug/{today}/{transcript_data['session_id']}/{token_filename}",
                    "description": "Detailed token usage and consumption tracking"
                })
            
            # 5. Save structured JSON data
            json_filename = "transcript_data.json"
            json_path = f"{session_dir}/{json_filename}"
            
            transcript_metadata = {
                "session_info": {
                    "session_id": transcript_data['session_id'],
                    "call_sid": transcript_data['call_sid'],
                    "phone_number": transcript_data['phone_number'],
                    "start_time": transcript_data['start_time'],
                    "duration": transcript_data['duration'],
                    "turn_count": transcript_data['turn_count']
                },
                "transcripts": {
                    "input_transcript": transcript_data['input_transcript'],
                    "output_transcript": transcript_data['output_transcript'],
                    "full_conversation": transcript_data['full_conversation']
                },
                "files": transcript_files,
                "saved_at": datetime.utcnow().isoformat()
            }
            
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(transcript_metadata, f, indent=2)
            
            transcript_files.append({
                "type": "structured_data",
                "filename": json_filename,
                "path": json_path,
                "storage_path": f"voice_debug/{today}/{transcript_data['session_id']}/{json_filename}",
                "description": "Structured transcript data in JSON format"
            })
            
            # Commit changes to volume
            audio_volume.commit()
            
            return {
                "status": "success",
                "session_id": transcript_data['session_id'],
                "storage_path": f"voice_debug/{today}/{transcript_data['session_id']}",
                "transcript_files": transcript_files,
                "total_files": len(transcript_files),
                "input_entries": len(transcript_data['input_transcript']),
                "output_entries": len(transcript_data['output_transcript']),
                "conversation_entries": len(transcript_data['full_conversation']),
                "token_usage_summary": {
                    "total_tokens": transcript_data.get('token_usage', {}).get('total_tokens', 0),
                    "usage_entries": transcript_data.get('token_usage', {}).get('total_usage_entries', 0),
                    "has_token_data": 'token_usage' in transcript_data and transcript_data['token_usage']['total_usage_entries'] > 0
                }
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error saving transcript to volume: {e}")
            return {"status": "failed", "message": str(e)}

except ImportError:
    MODAL_AVAILABLE = False
    
    # Dummy function when Modal is not available
    def _save_transcript_to_volume(transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "skipped", "message": "Modal not available"} 