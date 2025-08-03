from typing import List
import requests
import tqdm.asyncio as tqdm
import asyncio
from pydantic import BaseModel, Field
import aiohttp

APP_IDS = ["15004","15005","15035","15038","15067","15069","15114","15117","15144","15149","15156","15158","15167","15170","15178","15197","15216","15236","15241","15246","14993","14994","14995","14996","14997","14998","14999","15000","15001","15002","15003","15006","15007","15008","15009","15010","15011","15012","15013","15014","15015","15016","15017","15018","15019","15020","15021","15022","15023","15024","15025","15026","15027","15028","15029","15030","15031","15032","15033","15034","15036","15037","15039","15040","15041","15042","15043","15044","15045","15046","15047","15048","15049","15050","15051","15052","15053","15054","15055","15056","15057","15058","15059","15060","15061","15062","15063","15064","15065","15066","15068","15070","15071","15072","15073","15074","15075","15076","15077","15078"]

VERIFICATIONS = [
    "npi", "dea", "dca", "abms", "medical", "medicare", "sanctions", "npdb"
]

BASE_URL = "https://mikhailocampo--vera-platform-v2-fastapi-app.modal.run"
ENDPOINT = "v1/vera/verify_application"

class RequestModel(BaseModel):
    application_id: str
    requested_verifications: List[str] = Field(default=VERIFICATIONS)
    requester: str = Field(default="annie.nguyen1128@gmail.com")


async def get_data(app_id: str):
    url = f"{BASE_URL}/{ENDPOINT}"
    payload = RequestModel(application_id=app_id).model_dump()
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            return await response.json()


async def main():
    # Create semaphore to limit concurrent operations to 5
    semaphore = asyncio.Semaphore(5)
    
    async def process_app_id(app_id: str):
        async with semaphore:
            try:
                result = await get_data(app_id)
                print(f"Completed app_id {app_id}")
                return result
            except Exception as e:
                print(f"Error processing app_id {app_id}: {e}")
                return None
    
    # Create tasks for all app IDs
    tasks = [process_app_id(app_id) for app_id in APP_IDS]
    
    # Execute all tasks with progress bar
    results = []
    for task in tqdm.tqdm(
        asyncio.as_completed(tasks),
        total=len(tasks),
        desc="Processing applications",
        unit="app",
        leave=True,
    ):
        result = await task
        results.append(result)
    
    # Print summary
    successful = sum(1 for result in results if result is not None)
    print(f"\nCompleted: {successful}/{len(APP_IDS)} applications")
    
    return results


if __name__ == "__main__":
    asyncio.run(main())