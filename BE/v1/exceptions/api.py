from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Any, Dict
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ValidationException(HTTPException):
    """Custom exception for validation errors"""
    def __init__(self, detail: str = "Validation error"):
        super().__init__(status_code=400, detail=detail)

class NotFoundException(HTTPException):
    """Custom exception for resource not found errors"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)

class ExternalServiceException(HTTPException):
    """Custom exception for external service errors"""
    def __init__(self, detail: str = "External service error", service_name: str = None):
        self.service_name = service_name
        super().__init__(status_code=502, detail=detail)

class RateLimitException(HTTPException):
    """Custom exception for rate limiting"""
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(status_code=429, detail=detail)

# Exception handlers
async def validation_exception_handler(request: Request, exc: ValidationException) -> JSONResponse:
    """Handle validation exceptions"""
    logger.warning(f"Validation error on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Validation Error",
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )

async def not_found_exception_handler(request: Request, exc: NotFoundException) -> JSONResponse:
    """Handle not found exceptions"""
    logger.warning(f"Resource not found on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Not Found",
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )

async def external_service_exception_handler(request: Request, exc: ExternalServiceException) -> JSONResponse:
    """Handle external service exceptions"""
    service_info = f" ({exc.service_name})" if exc.service_name else ""
    logger.error(f"External service error{service_info} on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "External Service Error",
            "detail": exc.detail,
            "service": exc.service_name,
            "status_code": exc.status_code
        }
    )

async def rate_limit_exception_handler(request: Request, exc: RateLimitException) -> JSONResponse:
    """Handle rate limit exceptions"""
    logger.warning(f"Rate limit exceeded on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Rate Limit Exceeded",
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all other exceptions as 500 errors"""
    error_id = id(exc)  # Simple error ID for tracking
    logger.error(f"Unhandled exception (ID: {error_id}) on {request.url}: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred. Please try again later.",
            "error_id": error_id,
            "status_code": 500
        }
    )
