import logging
import os
import asyncio
from typing import Optional, Dict, Any, List
import httpx
from datetime import datetime
import modal
from google import genai
from google.genai import types
from elevenlabs import ElevenLabs
from dataclasses import dataclass
import uuid
import random
import json

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

def _lookup_student_context(first_name: str, last_name: str, institution: str, graduation_year: int) -> Dict[str, Any]:
    """Lookup student/practitioner information in database for context"""
    try:
        import os
        from supabase import create_client, Client
        
        # Initialize Supabase client
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found, using default context")
            return {"exists": False, "verified": False, "status": "unknown"}
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Search by name first, then cross-reference with education details
        practitioner = None
        
        # Try name lookup
        if first_name and last_name:
            response = supabase.schema('vera').table('practitioners').select('*').eq('first_name', first_name).eq('last_name', last_name).execute()
            if response.data:
                practitioner = response.data[0]
        
        if practitioner:
            logger.info(f"Found practitioner in database: {practitioner.get('first_name')} {practitioner.get('last_name')}")
            return {
                "exists": True,
                "verified": True,
                "practitioner_id": practitioner.get('id'),
                "npi": practitioner.get('npi'),
                "first_name": practitioner.get('first_name'),
                "last_name": practitioner.get('last_name'),
                "specialty": practitioner.get('specialty'),
                "status": "active",
                "license_state": practitioner.get('license_state'),
                "license_number": practitioner.get('license_number'),
                "education_verified": True
            }
        else:
            logger.info(f"Student/practitioner not found in database: {first_name} {last_name} from {institution}")
            return {
                "exists": False,
                "verified": False,
                "status": "not_found",
                "note": "This student/practitioner is not in our verification database"
            }
            
    except Exception as e:
        logger.error(f"Error looking up student context: {e}")
        return {"exists": False, "verified": False, "status": "lookup_error", "error": str(e)}

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
    1. Uses Gemini to generate a dialogue transcript
    2. Uses ElevenLabs text-to-dialogue to convert transcript to audio
    3. Generates and stores a simulated email response
    4. Returns the audio file information and email details
    """    
    try:
        logger.info(f"Processing education verification for {first_name} {last_name}")
        
        # Initialize Gemini client
        gemini_client = genai.Client(
            api_key=os.environ["GEMINI_API_KEY"]
        )
        
        # Initialize ElevenLabs client
        elevenlabs_client = ElevenLabs(
            api_key=os.environ["ELEVENLABS_API_KEY"]
        )
        
        # Step 0: Lookup student/practitioner in database for context
        student_context = _lookup_student_context(first_name, last_name, institution, graduation_year)
        
        # Step 1: Generate dialogue transcript using Gemini with database context
        dialogue_inputs = _generate_dialogue_transcript(
            gemini_client, first_name, last_name, institution, 
            degree_type, graduation_year, verification_type, student_context
        )
        
        # Step 2: Convert dialogue to audio using ElevenLabs text-to-dialogue
        # Get the current function call ID for file organization
        import modal
        current_function_call_id = modal.current_function_call_id()
        audio_file_info = _convert_dialogue_to_audio(elevenlabs_client, dialogue_inputs, current_function_call_id)
        
        # Step 3: Generate email response content with database context
        email_content = _generate_email_response(
            gemini_client, first_name, last_name, institution, 
            degree_type, graduation_year, verification_type, student_context
        )
        
        # Step 4: Schedule delayed email insertion (1-5 minutes)
        delay_minutes = random.randint(1, 5)
        logger.info(f"Scheduling email insertion in {delay_minutes} minutes")
        
        # Schedule the email to be inserted after delay
        _schedule_education_email_insertion.spawn(
            email_content=email_content,
            function_call_id=current_function_call_id,
            delay_minutes=delay_minutes,
            first_name=first_name,
            last_name=last_name,
            institution=institution,
            degree_type=degree_type,
            graduation_year=graduation_year,
            verification_type=verification_type
        )
        
        # Step 5: Return results
        result = {
            "status": "completed",
            "dialogue_transcript": [{"text": inp.text, "voice_id": inp.voice_id} for inp in dialogue_inputs],
            "audio_file": audio_file_info,
            "email_scheduled": {
                "delay_minutes": delay_minutes,
                "subject": email_content["subject"],
                "sender": email_content["sender_name"]
            },
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

@app.function(
    image=modal_image,
    timeout=600  # 10 minutes timeout for delayed execution
)
def _schedule_education_email_insertion(
    email_content: Dict[str, Any],
    function_call_id: str,
    delay_minutes: int,
    first_name: str,
    last_name: str,
    institution: str,
    degree_type: str,
    graduation_year: int,
    verification_type: str
):
    """
    Modal function to insert email after a delay to simulate real-world response time
    """
    import time
    import os
    from supabase import create_client, Client
    
    try:
        # Wait for the specified delay
        logger.info(f"Waiting {delay_minutes} minutes before sending email response...")
        time.sleep(delay_minutes * 60)  # Convert minutes to seconds
        
        # Initialize Supabase client
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise Exception("Supabase credentials not found in environment")
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Insert email into database
        email_data = {
            "message_id": f"edu-{uuid.uuid4().hex}",
            "thread_id": f"thread-{function_call_id}",
            "subject": email_content["subject"],
            "sender_email": email_content["sender_email"],
            "sender_name": email_content["sender_name"],
            "recipient_email": "verifications@vera-platform.com",
            "body_text": email_content["body_text"],
            "body_html": email_content["body_html"],
            "verification_type": "education",
            "verification_request_id": function_call_id,
            "function_call_id": function_call_id,
            "institution_name": institution,
            "degree_type": degree_type,
            "graduation_year": graduation_year,
            "student_first_name": first_name,
            "student_last_name": last_name,
            "status": "unread",
            "priority": "normal",
            "is_verified": True,
            "sent_at": datetime.utcnow().isoformat(),
            "attachments": email_content.get("attachments", [])
        }
        
        # Insert into Supabase (vera schema)
        result = supabase.schema('vera').table("inbox_emails").insert(email_data).execute()
        
        if result.data:
            logger.info(f"Email successfully inserted for {first_name} {last_name} from {institution}")
        else:
            logger.error(f"Failed to insert email: {result}")
            
    except Exception as e:
        logger.error(f"Error inserting delayed email: {e}")

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
    gemini_client: genai.Client, 
    first_name: str, 
    last_name: str, 
    institution: str,
    degree_type: str, 
    graduation_year: int, 
    verification_type: str,
    student_context: Dict[str, Any]
) -> List[DialogueInput]:
    """Generate education verification dialogue transcript using Gemini"""
    
    # Build context-aware prompt based on database lookup
    context_info = ""
    verification_approach = ""
    
    if student_context.get("exists"):
        context_info = f"""
Database Context (for realistic dialogue):
- Student/Practitioner Status: FOUND in verification database
- Database ID: {student_context.get('practitioner_id')}
- Current NPI: {student_context.get('npi')}
- Current Specialty: {student_context.get('specialty', 'Not specified')}
- License State: {student_context.get('license_state', 'Not specified')}
- Status: {student_context.get('status', 'Active')}
- Education Previously Verified: {student_context.get('education_verified', False)}
"""
        verification_approach = "The registrar should be able to find and verify the student's information relatively easily, but will still need to send formal verification via email."
    else:
        context_info = f"""
Database Context (for realistic dialogue):
- Student Status: NOT FOUND in verification database
- Reason: {student_context.get('note', 'Unknown student')}
"""
        verification_approach = "The registrar should indicate they need to check their records more thoroughly or may not have immediate access to this student's information, and will need to research before sending email verification."

    prompt = f"""You are an expert at creating realistic educational verification dialogues. Generate a natural conversation between a registrar and a verification officer.

Student Details:
- Name: {first_name} {last_name}
- Institution: {institution}
- Degree Type: {degree_type}
- Graduation Year: {graduation_year}
- Verification Type: {verification_type}

{context_info}

CRITICAL CALL FLOW REQUIREMENTS:
1. The verification officer is calling to REQUEST education verification
2. Both parties understand this is a formal verification request that requires official documentation
3. The registrar will need to check student records and databases
4. The registrar MUST state that verification details will be provided VIA EMAIL (not during the phone call)
5. The phone call is to initiate the verification process - actual verification details are sent via email
6. The registrar should ask for and confirm the email address for sending verification
7. Expected timeline should be mentioned (usually 24-48 hours for email response)

{verification_approach}

Create a professional dialogue that includes:
1. Professional greeting and introduction
2. Clear statement that this is an education verification request
3. Collection of student information (name, degree, graduation year)
4. Registrar explains they need to check student records/database
5. EXPLICIT statement that verification details will be provided via email
6. Confirmation of email address for sending verification
7. Timeline expectation (24-48 hours)
8. Professional closing

Make the conversation natural with realistic institutional language and procedures.

IMPORTANT: Respond with ONLY valid JSON format. No markdown, no explanations, just the raw JSON.

Format as JSON object with "dialogue" key containing array where each element has:
- "speaker": either "registrar" or "verification_officer"
- "text": the dialogue text

Example:
{{"dialogue": [{{"speaker": "registrar", "text": "Good morning, this is the Registrar's Office at {institution}, how may I help you?"}}, {{"speaker": "verification_officer", "text": "Good morning, I'm calling to request education verification for {first_name} {last_name}. We understand you'll need to send the verification details via email."}}]}}"""
    
    try:
        # Create content with proper types
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]
        
        # Configure generation settings
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="text/plain",
        )
        
        # Generate content using the proper API
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=generate_content_config,
        )
        
        # Get the response content
        response_content = response.text
        logger.info(f"Gemini response content: {response_content[:200]}...")  # Log first 200 chars for debugging
        
        if not response_content or response_content.strip() == "":
            raise Exception("Gemini returned empty response")
        
        import json
        try:
            # First try to parse as-is
            parsed_response = json.loads(response_content)
        except json.JSONDecodeError as json_error:
            logger.error(f"Failed to parse Gemini response as JSON. Content: {response_content}")
            # Try to extract JSON from markdown code blocks or other wrapper text
            import re
            
            # Look for JSON wrapped in markdown code blocks
            markdown_json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_content, re.DOTALL)
            if markdown_json_match:
                json_str = markdown_json_match.group(1)
                logger.info(f"Found JSON in markdown code block, attempting to parse: {json_str[:200]}...")
                parsed_response = json.loads(json_str)
            else:
                # Fallback to looking for any JSON object
                json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    logger.info(f"Attempting to parse extracted JSON: {json_str[:200]}...")
                    parsed_response = json.loads(json_str)
                else:
                    raise Exception(f"Could not extract valid JSON from Gemini response: {json_error}")
        
        # Validate the parsed JSON structure
        if not isinstance(parsed_response, dict):
            raise Exception(f"Expected JSON object, got {type(parsed_response)}: {parsed_response}")
        
        if "dialogue" not in parsed_response:
            raise Exception(f"Expected 'dialogue' key in response: {parsed_response}")
        
        dialogue_data = parsed_response["dialogue"]
        
        if not isinstance(dialogue_data, list):
            raise Exception(f"Expected dialogue to be array, got {type(dialogue_data)}: {dialogue_data}")
        
        if len(dialogue_data) == 0:
            raise Exception("Gemini returned empty dialogue array")
        
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
        
        logger.info("Dialogue transcript generated successfully using Gemini")
        return dialogue_inputs
        
    except Exception as e:
        logger.error(f"Error generating dialogue transcript with Gemini: {e}")
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

def _generate_email_response(
    gemini_client: genai.Client,
    first_name: str,
    last_name: str,
    institution: str,
    degree_type: str,
    graduation_year: int,
    verification_type: str,
    student_context: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate a realistic institutional email response using Gemini"""
    
    # Generate realistic institutional email domains and sender names
    institution_domains = {
        "university": ["edu", "ac.uk", "edu.au"],
        "college": ["edu", "ac.uk"],
        "institute": ["edu", "org"],
        "school": ["edu", "ac.uk"]
    }
    
    # Determine domain based on institution type
    inst_lower = institution.lower()
    if "university" in inst_lower:
        domain_suffix = random.choice(institution_domains["university"])
    elif "college" in inst_lower:
        domain_suffix = random.choice(institution_domains["college"])
    elif "institute" in inst_lower:
        domain_suffix = random.choice(institution_domains["institute"])
    else:
        domain_suffix = random.choice(institution_domains["university"])
    
    # Create institutional email
    institution_clean = institution.replace(" ", "").replace("University", "").replace("College", "").replace("of", "").lower()[:20]
    sender_email = f"registrar@{institution_clean}.{domain_suffix}"
    
    # Generate sender name
    registrar_names = [
        "Dr. Sarah Mitchell", "Dr. Robert Chen", "Dr. Maria Rodriguez", "Dr. James Thompson",
        "Dr. Lisa Wang", "Dr. Michael Brown", "Dr. Jennifer Davis", "Dr. David Wilson",
        "Dr. Amanda Taylor", "Dr. Christopher Lee", "Dr. Rachel Green", "Dr. Kevin Martinez"
    ]
    sender_name = random.choice(registrar_names)
    
    prompt = f"""You are a university registrar responding to education verification requests. Generate a professional, authentic institutional email.

Context:
- Student: {first_name} {last_name}
- Institution: {institution}
- Degree: {degree_type}
- Graduation Year: {graduation_year}
- Verification Type: {verification_type}
- Sender: {sender_name}, Registrar

Create a realistic email with:
1. Professional subject line
2. Formal greeting
3. Confirmation of student enrollment and graduation
4. Degree and graduation date verification
5. Contact information for follow-up
6. Professional closing

IMPORTANT: Respond with ONLY valid JSON - no markdown, no explanations.

Required JSON format:
{{"subject": "Email subject", "body_text": "Plain text body", "body_html": "HTML body", "attachments": []}}"""
    
    try:
        # Create content with proper types
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]
        
        # Configure generation settings
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="text/plain",
        )
        
        # Generate content using the proper API
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=generate_content_config,
        )
        
        response_content = response.text
        
        if not response_content or response_content.strip() == "":
            raise Exception("Gemini returned empty response for email generation")
        
        try:
            # First try to parse as-is
            parsed_response = json.loads(response_content)
        except json.JSONDecodeError as json_error:
            logger.error(f"Failed to parse Gemini email response as JSON. Content: {response_content}")
            # Try to extract JSON from markdown code blocks or other wrapper text
            import re
            
            # Look for JSON wrapped in markdown code blocks
            markdown_json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_content, re.DOTALL)
            if markdown_json_match:
                json_str = markdown_json_match.group(1)
                logger.info(f"Found JSON in markdown code block, attempting to parse: {json_str[:200]}...")
                parsed_response = json.loads(json_str)
            else:
                # Fallback to looking for any JSON object
                json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    logger.info(f"Attempting to parse extracted JSON: {json_str[:200]}...")
                    parsed_response = json.loads(json_str)
                else:
                    raise Exception(f"Could not extract valid JSON from email response: {json_error}")
        
        # Validate required fields
        required_fields = ["subject", "body_text", "body_html"]
        for field in required_fields:
            if field not in parsed_response:
                raise Exception(f"Missing required field '{field}' in email response")
        
        # Add sender information
        email_content = {
            "subject": parsed_response["subject"],
            "sender_email": sender_email,
            "sender_name": sender_name,
            "body_text": parsed_response["body_text"],
            "body_html": parsed_response["body_html"],
            "attachments": parsed_response.get("attachments", [])
        }
        
        logger.info(f"Email response generated successfully for {first_name} {last_name}")
        return email_content
        
    except Exception as e:
        logger.error(f"Error generating email response with Gemini: {e}")
        raise Exception(f"Failed to generate email response: {e}")

# Global service instance
education_service = EducationService() 