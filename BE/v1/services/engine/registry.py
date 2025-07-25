from typing import Dict, Any, Callable
from pydantic import BaseModel

from v1.services.engine.verifications.models import VerificationSteps, VerificationStepRequest, VerificationStepResponse, rebuild_verification_models
from v1.services.engine.verifications.npi import verify_npi
from v1.services.engine.verifications.dea import verify_dea
from v1.services.engine.verifications.dca import verify_dca
from v1.services.engine.verifications.abms import verify_abms
from v1.services.engine.verifications.ladmf import verify_ladmf
from v1.services.engine.verifications.medicare import verify_medicare
from v1.services.engine.verifications.medical import verify_medical
from v1.services.engine.verifications.npdb import verify_npdb
from v1.services.engine.verifications.sanctions import verify_sanctions
from v1.services.engine.verifications.education import verify_education
from v1.services.engine.verifications.hospital_privileges import verify_hospital_privileges

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
    VerificationSteps.MEDICARE: VerificationStep(
        name=VerificationSteps.MEDICARE,
        processing_function=verify_medicare,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
    VerificationSteps.MEDICAL: VerificationStep(
        name=VerificationSteps.MEDICAL,
        processing_function=verify_medical,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
    VerificationSteps.NPDB: VerificationStep(
        name=VerificationSteps.NPDB,
        processing_function=verify_npdb,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
    VerificationSteps.SANCTIONS: VerificationStep(
        name=VerificationSteps.SANCTIONS,
        processing_function=verify_sanctions,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
    VerificationSteps.EDUCATION: VerificationStep(
        name=VerificationSteps.EDUCATION,
        processing_function=verify_education,
        request_schema=VerificationStepRequest,
        response_schema=VerificationStepResponse,
    ),
    VerificationSteps.HOSPITAL: VerificationStep(
        name=VerificationSteps.HOSPITAL,
        processing_function=verify_hospital_privileges,
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

