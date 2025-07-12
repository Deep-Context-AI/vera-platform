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
        "libopenjp2-7-dev"
    ]) \
    .pip_install_from_requirements("requirements.txt") \
    .add_local_python_source("v1") \
    .add_local_dir("v1/templates", remote_path="/root/v1/templates")

# Create Modal app for async processing
app = modal.App(
    "vera-platform", 
    image=modal_image,
    secrets=[
        modal.Secret.from_name("openai"),
        modal.Secret.from_name("elevenlabs"),
        modal.Secret.from_name("supabase"),
        modal.Secret.from_name("gemini")
    ]
) 