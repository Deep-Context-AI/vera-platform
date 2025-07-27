from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import modal
import logging

from v1.config.modal_config import app, modal_image
from v1.api.routes import router as v1_router
from v1.api.vera_routes import router as vera_router
from v1.exceptions.api import (
    ValidationException,
    NotFoundException,
    ExternalServiceException,
    validation_exception_handler,
    not_found_exception_handler,
    external_service_exception_handler,
    general_exception_handler
)

@app.function(image=modal_image)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def fastapi_app():
    # Configure logging to suppress httpx logs
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # Create FastAPI app inside the function
    app = FastAPI(
        title="Vera Platform API",
        description="API for healthcare practitioner verification services",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register exception handlers
    app.add_exception_handler(ValidationException, validation_exception_handler)
    app.add_exception_handler(NotFoundException, not_found_exception_handler)
    app.add_exception_handler(ExternalServiceException, external_service_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # Include v1 router
    app.include_router(v1_router, prefix="/v1")
    app.include_router(vera_router, prefix="/v1/vera")
    
    @app.get("/")
    async def root():
        return {"message": "Vera Platform API", "version": "1.0.0"}

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app
