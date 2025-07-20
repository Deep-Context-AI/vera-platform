"""
Formatter service for verification results

This module provides functions to format verification results for API responses,
stripping internal metadata and presenting clean, user-friendly results.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

def format_verification_results(raw_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format raw verification results for API response
    
    Args:
        raw_results: Raw results from the processor containing all verification steps
        
    Returns:
        Formatted results with metadata stripped and clean structure
    """
    try:
        logger.info("Formatting verification results for API response")
        
        application_id = raw_results.get("application_id")
        overall_status = raw_results.get("status", "unknown")
        verification_results = raw_results.get("verification_results", {})
        summary = raw_results.get("summary", {})
        
        # Format individual verification results
        formatted_verifications = {}
        
        for step_name, step_result in verification_results.items():
            formatted_verifications[step_name] = _format_single_verification(step_name, step_result)
        
        # Calculate overall verification status
        overall_verification_status = _calculate_overall_status(formatted_verifications)
        
        # Create formatted response
        formatted_response = {
            "application_id": application_id,
            "verification_status": overall_verification_status,
            "processed_at": datetime.utcnow().isoformat(),
            "verifications": formatted_verifications,
            "summary": {
                "total_verifications": summary.get("total_requested", 0),
                "completed_verifications": summary.get("successful", 0),
                "failed_verifications": summary.get("failed", 0),
                "success_rate": _calculate_success_rate(summary)
            }
        }
        
        logger.info(f"Successfully formatted results for application {application_id}")
        return formatted_response
        
    except Exception as e:
        logger.error(f"Error formatting verification results: {e}")
        return {
            "error": "Failed to format verification results",
            "details": str(e),
            "processed_at": datetime.utcnow().isoformat()
        }

def _format_single_verification(step_name: str, step_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format a single verification step result
    
    Args:
        step_name: Name of the verification step
        step_result: Raw result from the verification step
        
    Returns:
        Formatted verification result
    """
    try:
        # Handle error cases
        if step_result.get("status") == "failed" or "error" in step_result:
            return {
                "step": step_name,
                "status": "failed",
                "error": step_result.get("error", "Unknown error"),
                "decision": "requires_review"
            }
        
        # Handle not implemented cases
        if step_result.get("status") == "not_implemented":
            return {
                "step": step_name,
                "status": "not_implemented",
                "error": "Verification step not implemented",
                "decision": "requires_review"
            }
        
        # Format successful verification
        formatted_result = {
            "step": step_name,
            "status": "completed",
            "decision": step_result.get("decision", "requires_review"),
            "reasoning": step_result.get("reasoning", "No reasoning provided")
        }
        
        # Add step-specific fields based on verification type
        if step_name == "npi":
            formatted_result.update({
                "npi_number": step_result.get("npi_number"),
                "provider_name": step_result.get("provider_name"),
                "is_active": step_result.get("is_active"),
                "specialty": step_result.get("specialty")
            })
        
        # Add common fields if present
        if "confidence_score" in step_result:
            formatted_result["confidence_score"] = step_result["confidence_score"]
        
        return formatted_result
        
    except Exception as e:
        logger.error(f"Error formatting verification step {step_name}: {e}")
        return {
            "step": step_name,
            "status": "error",
            "error": f"Failed to format result: {str(e)}",
            "decision": "requires_review"
        }

def _calculate_overall_status(verifications: Dict[str, Any]) -> str:
    """
    Calculate overall verification status based on individual verification results
    
    Args:
        verifications: Dictionary of formatted verification results
        
    Returns:
        Overall status string
    """
    if not verifications:
        return "no_verifications"
    
    # Count different types of results
    approved_count = 0
    failed_count = 0
    review_count = 0
    error_count = 0
    
    for verification in verifications.values():
        decision = verification.get("decision", "requires_review")
        status = verification.get("status", "unknown")
        
        if status == "error" or status == "failed":
            error_count += 1
        elif decision == "approved":
            approved_count += 1
        elif decision == "requires_review":
            review_count += 1
        else:
            failed_count += 1
    
    # Determine overall status
    total_verifications = len(verifications)
    
    if error_count > 0:
        return "error"
    elif failed_count > 0:
        return "failed"
    elif review_count > 0:
        return "requires_review"
    elif approved_count == total_verifications:
        return "approved"
    else:
        return "partial_success"

def _calculate_success_rate(summary: Dict[str, Any]) -> float:
    """
    Calculate success rate as a percentage
    
    Args:
        summary: Summary statistics from processor
        
    Returns:
        Success rate as a float between 0.0 and 1.0
    """
    total = summary.get("total_requested", 0)
    successful = summary.get("successful", 0)
    
    if total == 0:
        return 0.0
    
    return round(successful / total, 2)

def format_verification_summary(results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a summary-only view of verification results
    
    Args:
        results: Raw or formatted verification results
        
    Returns:
        Summary-only response
    """
    try:
        if "verifications" in results:
            # Already formatted results
            verifications = results["verifications"]
        else:
            # Raw results from processor
            verification_results = results.get("verification_results", {})
            verifications = {
                name: _format_single_verification(name, result)
                for name, result in verification_results.items()
            }
        
        # Count results by decision
        decision_counts = {}
        for verification in verifications.values():
            decision = verification.get("decision", "unknown")
            decision_counts[decision] = decision_counts.get(decision, 0) + 1
        
        return {
            "application_id": results.get("application_id"),
            "verification_status": _calculate_overall_status(verifications),
            "processed_at": results.get("processed_at", datetime.utcnow().isoformat()),
            "summary": {
                "total_verifications": len(verifications),
                "decision_breakdown": decision_counts,
                "completion_rate": len([v for v in verifications.values() if v.get("status") == "completed"]) / len(verifications) if verifications else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error creating verification summary: {e}")
        return {
            "error": "Failed to create verification summary",
            "details": str(e),
            "processed_at": datetime.utcnow().isoformat()
        }

def strip_internal_metadata(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strip internal metadata from verification results
    
    Args:
        data: Data containing internal metadata
        
    Returns:
        Data with internal metadata removed
    """
    # List of internal metadata keys to remove
    internal_keys = [
        "metadata",
        "usage_metadata", 
        "internal_id",
        "processing_time",
        "debug_info",
        "raw_response",
        "audit_trail_id"
    ]
    
    def _strip_recursive(obj):
        if isinstance(obj, dict):
            return {
                key: _strip_recursive(value)
                for key, value in obj.items()
                if key not in internal_keys
            }
        elif isinstance(obj, list):
            return [_strip_recursive(item) for item in obj]
        else:
            return obj
    
    return _strip_recursive(data)

def format_for_client_response(results: Dict[str, Any], include_details: bool = True) -> Dict[str, Any]:
    """
    Format verification results for client API response
    
    Args:
        results: Raw or formatted verification results
        include_details: Whether to include detailed verification information
        
    Returns:
        Client-ready response
    """
    try:
        # Format the results
        formatted_results = format_verification_results(results)
        
        # Strip internal metadata
        clean_results = strip_internal_metadata(formatted_results)
        
        # Return summary only if details not requested
        if not include_details:
            return format_verification_summary(clean_results)
        
        return clean_results
        
    except Exception as e:
        logger.error(f"Error formatting client response: {e}")
        return {
            "error": "Failed to format response",
            "details": str(e),
            "processed_at": datetime.utcnow().isoformat()
        }
