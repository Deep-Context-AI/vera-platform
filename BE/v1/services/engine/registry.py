from typing import Dict, Any, Callable
from pydantic import BaseModel

from v1.services.engine.verifications.models import VerificationSteps, VerificationStepRequest, VerificationStepResponse, rebuild_verification_models
from v1.services.engine.verifications.npi import verify_npi
from v1.services.engine.verifications.dea import verify_dea
from v1.services.engine.verifications.dca import verify_dca
from v1.services.engine.verifications.abms import verify_abms
from v1.services.engine.verifications.ladmf import verify_ladmf

# Rebuild the VerificationStepRequest model to resolve forward references
rebuild_verification_models()


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
    ),
    VerificationSteps.DEA: VerificationStep(
        name=VerificationSteps.DEA,
        processing_function=verify_dea,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
    VerificationSteps.DCA: VerificationStep(
        name=VerificationSteps.DCA,
        processing_function=verify_dca,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
    VerificationSteps.ABMS: VerificationStep(
        name=VerificationSteps.ABMS,
        processing_function=verify_abms,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
    VerificationSteps.LADMF: VerificationStep(
        name=VerificationSteps.LADMF,
        processing_function=verify_ladmf,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
}


def get_verification_step(step_name: str) -> VerificationStep:
    """Get a verification step by name"""
    if step_name not in VERIFICATION_STEPS:
        raise ValueError(f"Unknown verification step: {step_name}")
    
    return VERIFICATION_STEPS[step_name]

def get_all_verification_steps() -> Dict[str, VerificationStep]:
    """Get all registered verification steps"""
    return {name: get_verification_step(name) for name in VERIFICATION_STEPS.keys()}

