import modal

# Define the Modal image with required dependencies
modal_image = modal.Image.debian_slim().pip_install_from_requirements("requirements.txt") \
    .add_local_python_source("v1")

# Create Modal app for async processing
app = modal.App(
    "vera-platform", 
    image=modal_image,
    secrets=[
        modal.Secret.from_name("openai"),
        modal.Secret.from_name("elevenlabs"),
        modal.Secret.from_name("supabase")
    ]
) 