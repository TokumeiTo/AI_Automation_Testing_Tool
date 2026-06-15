from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import AIService

router = APIRouter()

ai_engine = AIService()

class ScenarioRequest(BaseModel):
    scenario_text: str
    
@router.post("/generate-testcase")
async def generate_testcase(payload: ScenarioRequest):
    if not payload.scenario_text.strip():
        raise HTTPException(status_code=400, detail="Scenario text cannot be empty")
    
    ai_response = await ai_engine.generate_test_cases(payload.scenario_text)
    
    if "error" in ai_response:
        raise HTTPException(status_code=500, detail=ai_response["error"])
    
    return {
        "success": True,
        "data": ai_response["test_cases"]
    }