"""
Example: How to Use the Audit Trail System

This file demonstrates different ways to integrate the audit trail system
with your verification services.
"""

import asyncio
from datetime import datetime
from v1.services.audit_trail_utils import (
    track_verification_step, 
    audit_trail_tracked,
    log_verification_start,
    log_verification_complete,
    log_verification_error,
    VerificationSteps
)
from v1.services.audit_trail_service import audit_trail_service
from v1.models.database import AuditTrailStatus

# Example 1: Using the decorator approach
@audit_trail_tracked(
    step_name=VerificationSteps.NPI_VERIFICATION,
    step_type=VerificationSteps.EXTERNAL_API,
    reasoning="Automated NPI verification using external registry"
)
async def verify_npi_with_tracking(application_id: int, npi_number: str):
    """Example NPI verification with automatic audit trail tracking"""
    # Simulate NPI verification logic
    await asyncio.sleep(0.1)  # Simulate API call
    
    if npi_number == "1234567890":
        return {
            "status": "success",
            "npi": npi_number,
            "provider_name": "Dr. John Doe",
            "is_active": True
        }
    else:
        raise ValueError("Invalid NPI number")

# Example 2: Using the wrapper function approach
async def verify_dea_with_tracking(application_id: int, dea_number: str):
    """Example DEA verification with manual audit trail tracking"""
    
    async def dea_verification_logic(dea_num):
        # Simulate DEA verification
        await asyncio.sleep(0.2)
        return {
            "status": "success",
            "dea_number": dea_num,
            "practitioner_name": "Dr. Jane Smith",
            "expiration_date": "2025-12-31"
        }
    
    return await track_verification_step(
        application_id=application_id,
        step_name=VerificationSteps.DEA_VERIFICATION,
        step_type=VerificationSteps.DATABASE_LOOKUP,
        func=dea_verification_logic,
        reasoning="Verifying DEA registration status",
        request_data={"dea_number": dea_number},
        processed_by="dea_service",
        dea_num=dea_number
    )

# Example 3: Using manual logging functions
async def verify_education_with_manual_tracking(application_id: int, institution: str, degree: str):
    """Example education verification with manual audit trail logging"""
    
    step_name = VerificationSteps.EDUCATION_VERIFICATION
    start_time = datetime.utcnow()
    
    try:
        # Start tracking
        await log_verification_start(
            application_id=application_id,
            step_name=step_name,
            step_type=VerificationSteps.AI_GENERATED,
            reasoning="Verifying educational credentials with AI-generated institutional response",
            request_data={
                "institution": institution,
                "degree": degree,
                "verification_method": "ai_generated_transcript"
            }
        )
        
        # Simulate education verification (AI-generated response)
        await asyncio.sleep(0.5)
        
        result = {
            "status": "success",
            "institution": institution,
            "degree": degree,
            "verified": True,
            "transcript_generated": True,
            "audio_file": "education_verification_audio.mp3"
        }
        
        # Calculate processing time
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Complete tracking
        await log_verification_complete(
            application_id=application_id,
            step_name=step_name,
            status="completed",
            reasoning="Education verification completed successfully with AI-generated institutional response",
            response_data=result,
            verification_result="verified",
            processing_duration_ms=processing_time,
            confidence_score=95.0,
            processing_method="ai_generated",
            external_service="gemini_ai",
            requires_manual_review=False
        )
        
        return result
        
    except Exception as e:
        # Calculate processing time even for errors
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Log error
        await log_verification_error(
            application_id=application_id,
            step_name=step_name,
            error=e,
            reasoning="Education verification failed due to system error",
            processing_duration_ms=processing_time,
            external_service="gemini_ai"
        )
        
        raise

# Example 4: Complex verification workflow with multiple steps
async def complete_practitioner_verification(application_id: int, practitioner_data: dict):
    """Example of a complete practitioner verification workflow with audit trail"""
    
    verification_results = {}
    
    try:
        # Step 1: NPI Verification
        print(f"Starting NPI verification for application {application_id}")
        npi_result = await verify_npi_with_tracking(
            application_id=application_id,
            npi_number=practitioner_data.get("npi", "1234567890")
        )
        verification_results["npi"] = npi_result
        print(f"NPI verification completed: {npi_result}")
        
        # Step 2: DEA Verification
        print(f"Starting DEA verification for application {application_id}")
        dea_result = await verify_dea_with_tracking(
            application_id=application_id,
            dea_number=practitioner_data.get("dea", "AB1234567")
        )
        verification_results["dea"] = dea_result
        print(f"DEA verification completed: {dea_result}")
        
        # Step 3: Education Verification
        print(f"Starting education verification for application {application_id}")
        education_result = await verify_education_with_manual_tracking(
            application_id=application_id,
            institution=practitioner_data.get("institution", "Harvard Medical School"),
            degree=practitioner_data.get("degree", "MD")
        )
        verification_results["education"] = education_result
        print(f"Education verification completed: {education_result}")
        
        # Step 4: Final Review Step
        await log_verification_start(
            application_id=application_id,
            step_name="final_review",
            step_type=VerificationSteps.MANUAL_REVIEW,
            reasoning="Conducting final review of all verification results",
            request_data=verification_results
        )
        
        # Simulate final review logic
        overall_status = "approved" if all(
            result.get("status") == "success" 
            for result in verification_results.values()
        ) else "requires_review"
        
        await log_verification_complete(
            application_id=application_id,
            step_name="final_review",
            status="completed",
            reasoning=f"Final review completed with status: {overall_status}",
            response_data={"overall_status": overall_status, "verification_results": verification_results},
            verification_result="verified" if overall_status == "approved" else "requires_review",
            requires_manual_review=overall_status == "requires_review"
        )
        
        return {
            "application_id": application_id,
            "overall_status": overall_status,
            "verification_results": verification_results
        }
        
    except Exception as e:
        print(f"Verification workflow failed for application {application_id}: {e}")
        raise

# Example 5: Using the audit trail service directly
async def direct_audit_trail_usage(application_id: int):
    """Example of using the audit trail service directly"""
    
    # Start a custom verification step
    entry = await audit_trail_service.start_step(
        application_id=application_id,
        step_name="custom_compliance_check",
        step_type=VerificationSteps.COMPLIANCE_CHECK,
        reasoning="Performing custom compliance verification",
        request_data={"compliance_type": "hipaa", "check_level": "comprehensive"},
        processed_by="compliance_agent",
        agent_id="agent_001",
        priority="high",
        tags=["compliance", "hipaa", "security"]
    )
    
    print(f"Started audit trail step: {entry.step_name} with status: {entry.status}")
    
    # Simulate some processing
    await asyncio.sleep(0.3)
    
    # Complete the step
    completed_entry = await audit_trail_service.complete_step(
        application_id=application_id,
        step_name="custom_compliance_check",
        status=AuditTrailStatus.COMPLETED,
        reasoning="Compliance check completed successfully - all HIPAA requirements met",
        response_data={
            "compliance_status": "compliant",
            "hipaa_score": 98.5,
            "violations_found": 0,
            "recommendations": ["Implement additional encryption for data at rest"]
        },
        verification_result="verified",
        confidence_score=98.5,
        processing_duration_ms=300,
        compliance_checks=["hipaa_privacy", "hipaa_security", "hipaa_breach"],
        risk_score=5.0,  # Low risk
        requires_manual_review=False
    )
    
    print(f"Completed audit trail step: {completed_entry.step_name} with status: {completed_entry.status}")
    
    # Get the audit trail for the application
    audit_trail = await audit_trail_service.get_application_audit_trail(application_id)
    print(f"Total audit trail entries for application {application_id}: {len(audit_trail)}")
    
    for entry in audit_trail:
        print(f"  - {entry.step_name}: {entry.status.value} ({entry.data.step_type})")

# Example 6: Error handling and retry logic
async def verification_with_retry(application_id: int, max_retries: int = 3):
    """Example of verification with retry logic and audit trail tracking"""
    
    step_name = "sanctions_check_with_retry"
    
    for attempt in range(max_retries):
        try:
            # Start or update the audit trail step
            if attempt == 0:
                await log_verification_start(
                    application_id=application_id,
                    step_name=step_name,
                    step_type=VerificationSteps.EXTERNAL_API,
                    reasoning=f"Starting sanctions check (attempt {attempt + 1})",
                    request_data={"provider_id": "12345", "check_sources": ["OIG", "SAM.gov"]}
                )
            else:
                # Update the existing step with retry information
                await audit_trail_service.update_step_data(
                    application_id=application_id,
                    step_name=step_name,
                    retry_count=attempt,
                    reasoning=f"Retrying sanctions check (attempt {attempt + 1} of {max_retries})"
                )
            
            # Simulate sanctions check (fails first 2 times, succeeds on 3rd)
            if attempt < 2:
                raise ConnectionError("External service temporarily unavailable")
            
            # Success on final attempt
            result = {
                "status": "success",
                "sanctions_found": False,
                "sources_checked": ["OIG", "SAM.gov", "State_Medicaid"],
                "last_checked": datetime.utcnow().isoformat()
            }
            
            await log_verification_complete(
                application_id=application_id,
                step_name=step_name,
                status="completed",
                reasoning=f"Sanctions check completed successfully on attempt {attempt + 1}",
                response_data=result,
                verification_result="verified",
                retry_count=attempt,
                external_service="sanctions_api",
                processing_method="external_api"
            )
            
            return result
            
        except Exception as e:
            if attempt == max_retries - 1:
                # Final attempt failed
                await log_verification_error(
                    application_id=application_id,
                    step_name=step_name,
                    error=e,
                    reasoning=f"Sanctions check failed after {max_retries} attempts",
                    retry_count=attempt
                )
                raise
            else:
                # Will retry
                print(f"Attempt {attempt + 1} failed: {e}. Retrying...")
                await asyncio.sleep(1)  # Wait before retry

# Example usage
async def main():
    """Run examples of audit trail usage"""
    
    application_id = 12345
    
    print("=== Audit Trail System Examples ===\n")
    
    # Example 1: Decorator approach
    print("1. Testing decorator approach...")
    try:
        result = await verify_npi_with_tracking(application_id, "1234567890")
        print(f"   Result: {result}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
    
    # Example 2: Wrapper function approach
    print("2. Testing wrapper function approach...")
    try:
        result = await verify_dea_with_tracking(application_id, "AB1234567")
        print(f"   Result: {result}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
    
    # Example 3: Manual logging
    print("3. Testing manual logging approach...")
    try:
        result = await verify_education_with_manual_tracking(
            application_id, "Harvard Medical School", "MD"
        )
        print(f"   Result: {result}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
    
    # Example 4: Complete workflow
    print("4. Testing complete verification workflow...")
    try:
        practitioner_data = {
            "npi": "1234567890",
            "dea": "AB1234567",
            "institution": "Harvard Medical School",
            "degree": "MD"
        }
        result = await complete_practitioner_verification(application_id, practitioner_data)
        print(f"   Workflow result: {result}\n")
    except Exception as e:
        print(f"   Workflow error: {e}\n")
    
    # Example 5: Direct service usage
    print("5. Testing direct audit trail service usage...")
    try:
        await direct_audit_trail_usage(application_id)
        print("   Direct usage completed\n")
    except Exception as e:
        print(f"   Direct usage error: {e}\n")
    
    # Example 6: Retry logic
    print("6. Testing verification with retry logic...")
    try:
        result = await verification_with_retry(application_id, max_retries=3)
        print(f"   Retry result: {result}\n")
    except Exception as e:
        print(f"   Retry error: {e}\n")
    
    # Get final audit trail summary
    print("=== Final Audit Trail Summary ===")
    try:
        audit_trail = await audit_trail_service.get_application_audit_trail(application_id)
        print(f"Total steps tracked: {len(audit_trail)}")
        
        for entry in audit_trail:
            duration = ""
            if entry.finished_at and entry.started_at:
                duration_ms = int((entry.finished_at - entry.started_at).total_seconds() * 1000)
                duration = f" ({duration_ms}ms)"
            
            print(f"  - {entry.step_name}: {entry.status.value}{duration}")
            if entry.data.reasoning:
                print(f"    Reasoning: {entry.data.reasoning}")
            if entry.data.verification_result:
                print(f"    Result: {entry.data.verification_result}")
            print()
            
    except Exception as e:
        print(f"Error getting audit trail: {e}")

if __name__ == "__main__":
    # Note: This example won't run directly since it requires the full application context
    # It's provided as a reference for how to use the audit trail system
    print("This is an example file showing how to use the audit trail system.")
    print("To run these examples, integrate them into your FastAPI application.")
    print("See the functions above for different approaches to audit trail tracking.") 