"""
Voice services module

This module provides voice calling functionality using:
- Twilio for telephony and media streaming
- Gemini Live API for real-time voice interactions
- Direct WebSocket integration (no Modal orchestration)
"""

from .audio_utils import (
    AudioChunk,
    AudioConverter,
    VoiceSessionManager,
    AudioFormat,
    ConnectionState,
    ConversationState
)

from .gemini_voice_service import (
    GeminiVoiceService,
    GeminiVoiceConfig,
    GeminiSessionState
)

# Modal voice call functions removed - using direct Twilio integration

# WebSocket handler is now integrated in routes.py

__all__ = [
    # Audio utilities
    "AudioChunk",
    "AudioConverter", 
    "VoiceSessionManager",
    "AudioFormat",
    "ConnectionState",
    "ConversationState",
    
    # Gemini service
    "GeminiVoiceService",
    "GeminiVoiceConfig",
    "GeminiSessionState",
    
    # Voice call service - now handled by TwilioService directly
]
