from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ScenarioRequest(BaseModel):
    scenario_text: str
    
@router.post("/generate-testcase")
async def generate_testcase(payload: ScenarioRequest):
    if not payload.scenario_text.strip():
        raise HTTPException(status_code=400, detail="Scenario text cannot be empty")
    
    return {
        "success": True,
        "received_scenario": payload.scenario_text,
        "status": "Ready for AI prompt integration"
    }