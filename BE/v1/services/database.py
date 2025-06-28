import os
from typing import Generator
from supabase import create_client, Client
from functools import lru_cache

@lru_cache()
def get_supabase_client() -> Client:
    """
    Create and cache a Supabase client instance.
    
    Returns:
        Client: Configured Supabase client
        
    Raises:
        ValueError: If required environment variables are not set
    """
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")
    
    if not url:
        raise ValueError("SUPABASE_URL environment variable is required")
    if not key:
        raise ValueError("SUPABASE_KEY environment variable is required")
    
    return create_client(url, key)

def get_db() -> Generator[Client, None, None]:
    """
    FastAPI dependency function to get database connection.
    
    This function can be used as a dependency in FastAPI route handlers
    to get access to the Supabase client.
    
    Usage:
        @app.get("/endpoint")
        async def endpoint(db: Client = Depends(get_db)):
            # Use db for database operations
            response = db.table("tablename").select("*").execute()
    
    Yields:
        Client: Supabase client instance
    """
    try:
        db = get_supabase_client()
        yield db
    finally:
        # Supabase client doesn't require explicit cleanup
        # but this structure allows for future cleanup if needed
        pass
