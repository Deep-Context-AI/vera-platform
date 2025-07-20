# Pydantic models for verification steps

from enum import Enum
from typing import Optional, Union, Any
from pydantic import BaseModel, Field, ConfigDict
from google.genai.types import GenerateContentResponseUsageMetadata

from v1.models.context import ApplicationContext

class VerificationSteps(str, Enum):
    """Predefined verification step names and types"""
    
    # Step names (matching AuditTrailStepName enum)
    NPI = "npi"
    DEA = "dea"
    ABMS = "abms"
    DCA = "dca"
    MEDICARE = "medicare"
    NPDB = "npdb"
    SANCTIONS = "sanctions"
    LADMF = "ladmf"
    MEDICAL = "medical"
    EDUCATION = "education"
    HOSPITAL = "hospital"

class VerificationStepDecision(str, Enum):
    # A successful request to Vera results in one of these decisions
    APPROVED = "approved"
    # REQUIRES REVIEW is a bucket representing these cases:
    # - The verification step failed
    # - The verification step returned a result that requires human review
    REQUIRES_REVIEW = "requires_review"

class VerificationStepMetadataEnum(str, Enum):
    # Metadata ENUMS to help calculate fill-rate. 
    # More related to, what happened to the verification step.
    COMPLETE = "complete"
    # The verification step failed. Base case but can be partitioned by error type later
    FAILED = "failed"
    NOT_FOUND = "not_found"
    EXPIRED = "expired"

class VerificationMetadata(BaseModel):
    status: VerificationStepMetadataEnum = Field(default=VerificationStepMetadataEnum.COMPLETE)
    usage_metadata: Optional[Union[dict, GenerateContentResponseUsageMetadata]] = Field(default_factory=dict)
    model: Optional[str] = Field(default=None, description="The model used to generate the response")
    response_time: Optional[float] = Field(default=None, description="The time taken to generate the response in seconds")
    document_url: Optional[str] = Field(default=None)
    error: Optional[Any] = Field(default=None)
    
    # Allow arbitrary types for the error field
    model_config = ConfigDict(arbitrary_types_allowed=True)

class LLMResponse(BaseModel):
    # Base pydantic model for all LLM Responses that should be subclassed if unique to a specific verification step
    reasoning: str
    decision: VerificationStepDecision

class VerificationStepRequest(BaseModel):
    # Input base model for verification steps ensuring ApplicationContext is passed in
    # Necessary for all verification steps to subclass this
    application_context: ApplicationContext

class VerificationStepResponse(BaseModel):
    # Base case for all verification steps should return REQUIRES_REVIEW
    decision: VerificationStepDecision = Field(default=VerificationStepDecision.REQUIRES_REVIEW)
    analysis: Union[LLMResponse, BaseModel, None] = None
    metadata: VerificationMetadata = Field(default_factory=VerificationMetadata)
    
    @classmethod
    def from_exception(cls, exception: Exception) -> "VerificationStepResponse":
        """Use for infra-related exceptions that are not business-logic exceptions"""
        return cls(
            reasoning=f"Error: {exception}",
            decision=VerificationStepDecision.REQUIRES_REVIEW,
            metadata=VerificationMetadata(
                status=VerificationStepMetadataEnum.FAILED,
                error=str(exception)
            )
        )
    
    @classmethod
    def from_business_logic_exception(
        cls, reasoning: str, metadata_status: VerificationStepMetadataEnum = VerificationStepMetadataEnum.FAILED
    ) -> "VerificationStepResponse":
        """
        Use for business-logic exceptions e.g, NOT FOUND, EXPIRED, etc. Represents, RAN, but warrants a REQUIRES_REVIEW decision.
        This information should store the non-pseudonymized values that were used during the verification step.
        """
        return cls(
            reasoning=reasoning,
            decision=VerificationStepDecision.REQUIRES_REVIEW,
            metadata=VerificationMetadata(
                status=metadata_status
            )
        )

class UserAgent(str, Enum):
    VERA_AI = "vera-ai"
    
    