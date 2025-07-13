import modal

# Define the Modal image with required dependencies
# WeasyPrint requires specific system libraries for PDF generation
modal_image = modal.Image.debian_slim() \
    .apt_install([
        "python3-pip",
        "libpango-1.0-0", 
        "libpangoft2-1.0-0", 
        "libharfbuzz-subset0",
        "libffi-dev",
        "libjpeg-dev",
        "libopenjp2-7-dev",
        # Voice related dependencies
        "portaudio19-dev",  # Required for pyaudio
        "alsa-utils",       # Audio utilities
        "pulseaudio-utils", # PulseAudio utilities
        "ffmpeg",           # Audio processing
        "libsndfile1-dev",  # Sound file processing
    ]) \
    .pip_install([
        # Additional voice-specific packages that might not be in requirements.txt
        "pyaudio>=0.2.11",
        "numpy>=1.24.0",
        "scipy>=1.10.0"
    ]) \
    .pip_install_from_requirements("requirements.txt") \
    .add_local_python_source("v1") \
    .add_local_dir("v1/templates", remote_path="/root/v1/templates")

# Create Modal app for async processing
app = modal.App(
    "vera-platform-v2", 
    image=modal_image,
    secrets=[
        modal.Secret.from_name("openai"),
        modal.Secret.from_name("elevenlabs"),
        modal.Secret.from_name("supabase"),
        modal.Secret.from_name("gemini"),
        modal.Secret.from_name("twilio")  # Added Twilio for voice functionality
    ]
) 