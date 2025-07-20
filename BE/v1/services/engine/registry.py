from typing import Dict, Any, Callable
from pydantic import BaseModel

from v1.services.engine.verifications.models import VerificationSteps, VerificationStepRequest, VerificationStepResponse
from v1.services.engine.verifications.npi import verify_npi


class VerificationStep(BaseModel):
    name: VerificationSteps
    processing_function: Callable
    # Include subclassing for specific steps
    response_schema: type[VerificationStepResponse]
    request_schema: type[VerificationStepRequest]


VERIFICATION_STEPS: Dict[VerificationSteps, VerificationStep] = {
    VerificationSteps.NPI: VerificationStep(
        name=VerificationSteps.NPI,
        processing_function=verify_npi,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    )
}


def get_verification_step(step_name: str) -> VerificationStep:
    """Get a verification step by name"""
    if step_name not in VERIFICATION_STEPS:
        raise ValueError(f"Unknown verification step: {step_name}")
    
    return VERIFICATION_STEPS[step_name]

def get_all_verification_steps() -> Dict[str, VerificationStep]:
    """Get all registered verification steps"""
    return {name: get_verification_step(name) for name in VERIFICATION_STEPS.keys()}

