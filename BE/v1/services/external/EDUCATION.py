import logging
import os
import asyncio
from typing import Optional, Dict, Any, List
import httpx
from datetime import datetime
import modal
import openai
from elevenlabs import ElevenLabs
from dataclasses import dataclass
import uuid

@dataclass
class DialogueInput:
    """Simple dialogue input class for text-to-speech conversion"""
    text: str
    voice_id: str

from v1.models.requests import EducationRequest
from v1.models.responses import EducationResponse, ResponseStatus
from v1.exceptions.api import ExternalServiceException

# Import Modal app from config
from v1.config.modal_config import app, modal_image

# Create or reference the audio storage volume
audio_volume = modal.Volume.from_name("education-audio-storage", create_if_missing=True)

logger = logging.getLogger(__name__)

@app.function(
    image=modal_image,
    timeout=300,  # 5 minutes timeout
    volumes={"/audio_storage": audio_volume}
)
def process_education_verification(
    first_name: str,
    last_name: str,
    institution: str,
    degree_type: str,
    graduation_year: int,
    verification_type: str
) -> Dict[str, Any]:
    """
    Modal function to process education verification
    
    This function:
    1. Uses OpenAI to generate a dialogue transcript
    2. Uses ElevenLabs text-to-dialogue to convert transcript to audio
    3. Returns the audio file information
    """    
    try:
        logger.info(f"Processing education verification for {first_name} {last_name}")
        
        # Initialize OpenAI client
        openai_client = openai.OpenAI(
            api_key=os.environ["OPENAI_API_KEY"]
        )
        
        # Initialize ElevenLabs client
        elevenlabs_client = ElevenLabs(
            api_key=os.environ["ELEVENLABS_API_KEY"]
        )
        
        # Step 1: Generate dialogue transcript using OpenAI
        dialogue_inputs = _generate_dialogue_transcript(
            openai_client, first_name, last_name, institution, 
            degree_type, graduation_year, verification_type
        )
        
        # Step 2: Convert dialogue to audio using ElevenLabs text-to-dialogue
        # Get the current function call ID for file organization
        import modal
        current_function_call_id = modal.current_function_call_id()
        audio_file_info = _convert_dialogue_to_audio(elevenlabs_client, dialogue_inputs, current_function_call_id)
        
        # Step 3: Return results
        result = {
            "status": "completed",
            "dialogue_transcript": [{"text": inp.text, "voice_id": inp.voice_id} for inp in dialogue_inputs],
            "audio_file": audio_file_info,
            "processed_at": datetime.utcnow().isoformat(),
            "verification_details": {
                "first_name": first_name,
                "last_name": last_name,
                "institution": institution,
                "degree_type": degree_type,
                "graduation_year": graduation_year,
                "verification_type": verification_type
            }
        }
        
        logger.info(f"Education verification completed for {first_name} {last_name}")
        return result
        
    except Exception as e:
        logger.error(f"Error in Modal function processing: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "processed_at": datetime.utcnow().isoformat()
        }


class EducationService:
    """Service for education verification with transcript generation and audio conversion"""
    
    def __init__(self):
        self.timeout = 30.0
        # Modal function reference will be set when Modal is available
        self.modal_function = None
        
    async def verify_education(self, request: EducationRequest) -> EducationResponse:
        """
        Initiate education verification process
        
        Args:
            request: EducationRequest containing education information
            
        Returns:
            EducationResponse with job information
            
        Raises:
            ExternalServiceException: If service fails
        """
        try:
            logger.info(f"Starting education verification for: {request.first_name} {request.last_name}")
            
            # Spawn Modal function for async processing
            function_call = await self._spawn_modal_function(request)
            
            response = EducationResponse(
                status=ResponseStatus.SUCCESS,
                message="Education verification job spawned successfully",
                job_id=function_call.object_id,
                function_call_id=function_call.object_id,
                verification_status="processing",
                first_name=request.first_name,
                last_name=request.last_name,
                institution=request.institution,
                degree_type=request.degree_type,
                graduation_year=request.graduation_year
            )
            
            logger.info(f"Education verification job spawned with ID: {function_call.object_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error during education verification initiation: {e}")
            raise ExternalServiceException(
                detail="Failed to initiate education verification",
                service_name="Education Verification"
            )
    
    async def _spawn_modal_function(self, request: EducationRequest):
        """Spawn the Modal function for processing"""
        try:
            # Use the function directly from the current module
            # The process_education_verification function is decorated with @app.function
            function_call = process_education_verification.spawn(
                first_name=request.first_name,
                last_name=request.last_name,
                institution=request.institution,
                degree_type=request.degree_type,
                graduation_year=request.graduation_year,
                verification_type=request.verification_type
            )
            
            return function_call
            
        except Exception as e:
            logger.error(f"Failed to spawn Modal function: {e}")
            raise ExternalServiceException(
                detail="Failed to spawn processing job",
                service_name="Modal Function"
            )
    
    async def get_verification_result(self, function_call_id: str) -> Dict[str, Any]:
        """
        Get the result of an education verification job
        
        Args:
            function_call_id: Modal function call ID
            
        Returns:
            Dict containing the verification result
            
        Raises:
            ExternalServiceException: If unable to retrieve result
        """
        try:
            logger.info(f"Retrieving education verification result for function call: {function_call_id}")
            
            # Get the function call result using Modal's FunctionCall.from_id
            import modal
            
            # Create a FunctionCall object from the ID and get the result
            function_call = modal.FunctionCall.from_id(function_call_id)
            
            try:
                # Try to get the result (this will raise an exception if still running)
                result = function_call.get(timeout=0)  # Don't wait, just check if done
                logger.info(f"Successfully retrieved result for function call: {function_call_id}")
                return result
                
            except modal.exception.TimeoutError:
                # Job is still running
                return {
                    "status": "pending", 
                    "message": "Job is still processing",
                    "function_call_id": function_call_id
                }
            except modal.exception.InvalidError as e:
                # Job failed
                return {
                    "status": "failed",
                    "message": f"Job failed: {str(e)}",
                    "function_call_id": function_call_id
                }
            
        except Exception as e:
            logger.error(f"Error retrieving verification result: {e}")
            raise ExternalServiceException(
                detail=f"Failed to retrieve verification result: {str(e)}",
                service_name="Education Verification Result"
            )
    
    async def download_audio_file(self, storage_path: str):
        """
        Download audio file from Modal Volume
        
        Args:
            storage_path: Path to the audio file in the volume (e.g., "2025-01-15/fc-123/audio.mp3")
            
        Returns:
            FastAPI Response with audio file
            
        Raises:
            ExternalServiceException: If file not found or download fails
        """
        try:
            logger.info(f"Downloading audio file from storage path: {storage_path}")
            
            # Get the audio volume
            volume = modal.Volume.from_name("education-audio-storage")
            
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
                
                logger.info(f"Successfully downloaded audio file: {filename}")
                
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
            logger.error(f"Error downloading audio file: {e}")
            raise ExternalServiceException(
                detail=f"Failed to download audio file: {str(e)}",
                service_name="Education Audio Download"
            )


def _generate_dialogue_transcript(
    openai_client, 
    first_name: str, 
    last_name: str, 
    institution: str,
    degree_type: str, 
    graduation_year: int, 
    verification_type: str
) -> List[DialogueInput]:
    """Generate education verification dialogue transcript using OpenAI"""
    
    prompt = f"""
    Generate a realistic dialogue between a registrar and a verification officer for education verification.
    
    Student Details:
    Name: {first_name} {last_name}
    Institution: {institution}
    Degree Type: {degree_type}
    Graduation Year: {graduation_year}
    Verification Type: {verification_type}
    
    Create a professional dialogue that includes:
    1. Initial greeting and identification
    2. Request for verification details
    3. Confirmation of student enrollment and graduation
    4. Discussion of academic performance and degree completion
    5. Official verification statement
    6. Closing remarks
    
    Format the response as a JSON object with a "dialogue" key containing an array where each element has:
    - "speaker": either "registrar" or "verification_officer"
    - "text": the dialogue text
    
    Make it sound natural and include realistic audio events and emotional cues. Use ellipses (...) for trailing sentences and interruptions where appropriate.
    
    Example format:
    {{
        "dialogue": [
            {{"speaker": "registrar", "text": "Hello, this is the Registrar's Office at {institution}, how may I help you?"}},
            {{"speaker": "verification_officer", "text": "Good morning, I'm calling to verify the educational credentials for {first_name} {last_name}..."}}
        ]
    }}
    """
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert at creating realistic educational verification dialogues. Generate natural conversations with appropriate audio events and emotional cues. IMPORTANT: You must respond with ONLY valid JSON format - no markdown, no explanations, just the raw JSON array."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        # Get the response content
        response_content = response.choices[0].message.content
        logger.info(f"OpenAI response content: {response_content[:200]}...")  # Log first 200 chars for debugging
        
        if not response_content or response_content.strip() == "":
            raise Exception("OpenAI returned empty response")
        
        import json
        try:
            parsed_response = json.loads(response_content)
        except json.JSONDecodeError as json_error:
            logger.error(f"Failed to parse OpenAI response as JSON. Content: {response_content}")
            # Try to extract JSON from the response if it's wrapped in markdown or other text
            import re
            json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                logger.info(f"Attempting to parse extracted JSON: {json_str[:200]}...")
                parsed_response = json.loads(json_str)
            else:
                raise Exception(f"Could not extract valid JSON from OpenAI response: {json_error}")
        
        # Validate the parsed JSON structure
        if not isinstance(parsed_response, dict):
            raise Exception(f"Expected JSON object, got {type(parsed_response)}: {parsed_response}")
        
        if "dialogue" not in parsed_response:
            raise Exception(f"Expected 'dialogue' key in response: {parsed_response}")
        
        dialogue_data = parsed_response["dialogue"]
        
        if not isinstance(dialogue_data, list):
            raise Exception(f"Expected dialogue to be array, got {type(dialogue_data)}: {dialogue_data}")
        
        if len(dialogue_data) == 0:
            raise Exception("OpenAI returned empty dialogue array")
        
        # Convert to DialogueInput objects
        dialogue_inputs = []
        for i, item in enumerate(dialogue_data):
            if not isinstance(item, dict):
                raise Exception(f"Expected dialogue item {i} to be dict, got {type(item)}: {item}")
            
            if "speaker" not in item or "text" not in item:
                raise Exception(f"Dialogue item {i} missing required fields 'speaker' or 'text': {item}")
            
            # Use different voice IDs for different speakers
            voice_id = "pNInz6obpgDQGcFmaJgB" if item["speaker"] == "registrar" else "EXAVITQu4vr4xnSDxMaL"  # Adam for registrar, Bella for verification officer
            
            dialogue_inputs.append(DialogueInput(
                text=item["text"],
                voice_id=voice_id
            ))
        
        logger.info("Dialogue transcript generated successfully using OpenAI")
        return dialogue_inputs
        
    except Exception as e:
        logger.error(f"Error generating dialogue transcript with OpenAI: {e}")
        raise Exception(f"Failed to generate dialogue transcript: {e}")

def _convert_dialogue_to_audio(elevenlabs_client, dialogue_inputs: List[DialogueInput], function_call_id: str) -> Dict[str, Any]:
    """Convert dialogue transcript to audio using ElevenLabs text-to-speech
    
    Note: We use regular text-to-speech instead of text-to-dialogue because:
    - Text-to-dialogue API requires Eleven v3 model access (alpha/restricted)
    - Regular text-to-speech works with available models like eleven_flash_v2_5
    - We generate each dialogue segment separately and combine them
    """
    
    try:
        # Since text-to-dialogue requires Eleven v3 access, we'll use regular text-to-speech
        # and combine the dialogue parts into a single audio file
        audio_segments = []
        
        for i, dialogue_input in enumerate(dialogue_inputs):
            logger.info(f"Generating audio for dialogue segment {i+1}/{len(dialogue_inputs)}: {dialogue_input.text[:50]}...")
            
            # Generate audio for each dialogue segment using text-to-speech
            audio_generator = elevenlabs_client.text_to_speech.convert(
                voice_id=dialogue_input.voice_id,
                text=dialogue_input.text,
                model_id="eleven_flash_v2_5",
                output_format="mp3_44100_128"
            )
            
            # Convert generator to bytes
            audio_segment = b"".join(audio_generator)
            audio_segments.append(audio_segment)
            logger.info(f"Successfully generated audio segment {i+1}")
        
        # Combine all audio segments
        audio = b"".join(audio_segments)
        
        # Create directory structure: /audio_storage/YYYY-MM-DD/function_call_id/
        from datetime import datetime
        import os
        today = datetime.utcnow().strftime("%Y-%m-%d")
        storage_dir = f"/audio_storage/{today}/{function_call_id}"
        os.makedirs(storage_dir, exist_ok=True)
        
        # Generate unique filename
        audio_filename = f"education_verification_dialogue_{uuid.uuid4().hex[:8]}.mp3"
        file_path = f"{storage_dir}/{audio_filename}"
        
        # Save audio file to volume
        with open(file_path, "wb") as f:
            f.write(audio)
        
        # Commit changes to volume
        audio_volume.commit()
        
        # Calculate estimated duration based on dialogue length
        total_text_length = sum(len(inp.text) for inp in dialogue_inputs)
        estimated_duration = total_text_length / 150  # Rough estimate: 150 chars per minute
        
        audio_file_info = {
            "filename": audio_filename,
            "file_path": file_path,
            "storage_path": f"{today}/{function_call_id}/{audio_filename}",
            "format": "mp3",
            "size_bytes": len(audio),
            "duration_estimate": estimated_duration,
            "generated_at": datetime.utcnow().isoformat(),
            "dialogue_speakers": len(set(inp.voice_id for inp in dialogue_inputs))
        }
        
        logger.info(f"Dialogue audio generated successfully using text-to-speech: {audio_filename}")
        return audio_file_info
        
    except Exception as e:
        logger.error(f"Error converting dialogue to audio with ElevenLabs text-to-speech: {e}")
        raise Exception(f"Failed to convert dialogue to audio: {e}")

# Global service instance
education_service = EducationService() 