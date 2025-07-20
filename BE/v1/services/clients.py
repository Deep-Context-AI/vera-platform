import os
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Union
from google.genai.types import UsageMetadata
from enum import Enum

class GeminiModel(str, Enum):
    GEMINI_20_FLASH = "gemini-2.0-flash"
    GEMINI_25_FLASH_LITE = "gemini-2.5-flash-lite-preview-06-17"
    GEMINI_25_FLASH = "gemini-2.5-flash"
    GEMINI_25_PRO = "gemini-2.5-pro"

async def get_gemini_client():
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


async def call_gemini_model(
    model: GeminiModel,
    system_prompt: str, # Prompt to the model
    messages: list[str], # Must have at least one message
    client: genai.Client,
    **kwargs, # Additional config options e.g, temperature
) -> tuple[Union[str, BaseModel], UsageMetadata]:
    """
    Call a Gemini model with the given parameters. Use `response_mime_type` to specify the response format and `system_instruction` to specify the prompt to the model.
    
    For structured outputs, use `response_mime_type` application/json and `response_schema` a Pydantic model.

    Args:
        model: The model to use.
        system_prompt: The system prompt to use.
        messages: The messages to send to the model.
        config: The configuration to use.
        client: The client to use.
        **kwargs: Additional configuration options.
    """
    # Pop response_mime_type from kwargs
    response_mime_type = kwargs.pop("response_mime_type", "text/plain")
    # Pop response_schema from kwargs
    response_schema = kwargs.pop("response_schema", None)
    
    # Validate response_schema if provided
    if response_schema is not None:
        if not (isinstance(response_schema, type) and issubclass(response_schema, BaseModel)) and response_schema != dict:
            raise ValueError("response_schema must be a Pydantic model or dict")
    
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type=response_mime_type,
        response_schema=response_schema,
        **kwargs,
    )
    response = await client.aio.models.generate_content(
        model=model.value,
        contents=messages,
        config=config,
    )
    
    usage_metadata = response.usage_metadata
    
    return response.text if response_mime_type == "text/plain" else response.parsed, usage_metadata

