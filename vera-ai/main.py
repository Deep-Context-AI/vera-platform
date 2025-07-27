import json
from typing import Any
import time

import aiohttp
import modal

vllm_image = (
    modal.Image.debian_slim(python_version="3.12")
        .pip_install(
            "vllm==0.9.1",
            "flashinfer-python==0.2.6.post1",
            "huggingface_hub[hf_transfer]==0.32.0",
            extra_index_url="https://download.pytorch.org/whl/cu128",
        )
        .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"}) # Faster modal transfer
        # .env({"VLLM_USE_V1": "1"}) # Use v1 API, use 0 if breaks with model
        .env({"VLLM_ATTENTION_BACKEND": "SDPA"}) # Use SDPA attention 
)

MODEL_NAME = "ab-ai/PII-Model-Phi3-Mini"

hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)
vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)

FAST_BOOT = True
# Fast boot means lower token generation performance but faster cold starts
# Setting to false requires multiple replicas running in parallel to distribute load and increase performance

app = modal.App("PII-LLM-API")
N_GPU = 1
MINUTES = 60 # Seconds
VLLM_PORT = 8000

@app.function(
    image=vllm_image,
    gpu=f"L4:{N_GPU}",
    scaledown_window=15 * MINUTES,
    timeout=10 * MINUTES,
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
)
@modal.concurrent(max_inputs=32) # Maximum requests per replica
@modal.web_server(port=VLLM_PORT, startup_timeout=10 * MINUTES)
def serve():
    import subprocess
    
    cmd = [
        "vllm",
        "serve",
        "--uvicorn-log-level=info",
        MODEL_NAME,
        "--served-model-name",
        MODEL_NAME,
        "llm",
        "--host",
        "0.0.0.0",
        "--port",
        str(VLLM_PORT),
    ]
    
    # enforce-eager disables both Torch compilation and CUDA graph capture
    # default is no-enforce-eager. see the --compilation-config flag for tighter control
    cmd += ["--enforce-eager" if FAST_BOOT else "--no-enforce-eager"]

    # assume multiple GPUs are for splitting up large matrix multiplications
    cmd += ["--tensor-parallel-size", str(N_GPU)]

    print(cmd)
    
    subprocess.Popen(" ".join(cmd), shell=True)



@app.local_entrypoint()
async def test(test_timeout=10 * MINUTES, content=None):
    url = serve.get_web_url()

    system_prompt = {
        "role": "system",
        "content": """
        ### Instruction: 
        Identify and extract the following PII entities from the text, if present: 
        
        firstname, lastname, middlename
        street address, city, county, precinct, ZIP code
        birthdate, admission date, discharge date, death date, age
        telephone_number, fax_number
        vehicle_identifiers
        device_identifiers, mac_address
        email_address
        urls
        social_security_number
        internet_protocol_address
        medical_record_number
        health_plan_number
        account_number
        certificate_number, license_number
        
        Return the output in JSON format
        
        ### Output:
        """,
    }
    if content is None:
        raise ValueError("Content is required")

    messages = [  # OpenAI chat format
        system_prompt,
        {"role": "user", "content": content},
    ]

    async with aiohttp.ClientSession(base_url=url) as session:
        print(f"Running health check for server at {url}")
        async with session.get("/health", timeout=test_timeout - 1 * MINUTES) as resp:
            up = resp.status == 200
        assert up, f"Failed health check for server at {url}"
        print(f"Successful health check for server at {url}")

        print(f"Sending messages to {url}:", *messages, sep="\n\t")
        await _send_request(session, "llm", messages)


async def _send_request(
    session: aiohttp.ClientSession, model: str, messages: list
) -> None:
    # `stream=True` tells an OpenAI-compatible backend to stream chunks
    payload: dict[str, Any] = {"messages": messages, "model": model}

    headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}
    start_time = time.time()

    async with session.post(
        "/v1/chat/completions", json=payload, headers=headers, timeout=1 * MINUTES
    ) as resp:
        async for raw in resp.content:
            resp.raise_for_status()
            # extract new content and stream it
            line = raw.decode().strip()
            if not line or line == "data: [DONE]":
                continue
            if line.startswith("data: "):  # SSE prefix
                line = line[len("data: ") :]

            chunk = json.loads(line)
            assert (
                chunk["object"] == "chat.completion.chunk"
            )  # or something went horribly wrong
            print(chunk["choices"][0]["delta"]["content"], end="")
    print()
    print(f"Time taken: {time.time() - start_time} seconds")

