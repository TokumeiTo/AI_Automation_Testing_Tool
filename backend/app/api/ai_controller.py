from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import AIService
from app.services.data_service import DataGenerationService

router = APIRouter()

ai_engine = AIService()
data_engine = DataGenerationService()

class ScenarioRequest(BaseModel):
    scenario_text: str

@router.post("/generate-testcase")
async def generate_testcase(request: ScenarioRequest):
    try:
        # 1. Clear previous run memory for a clean relational session sequence
        data_engine.clear_session()
        
        # 2. Get the structured baseline test array steps from your active Groq AI model
        ai_response = await ai_engine.generate_test_cases(request.scenario_text)
        
        if "error" in ai_response:
            raise HTTPException(status_code=500, detail=ai_response["error"])
            
        raw_steps = ai_response.get("test_cases", [])
        
        # 3. Pass the AI steps straight through the data relational generator engine
        final_conditioned_steps = data_engine.inject_relational_data(raw_steps)
        
        return {
            "success": True,
            "data": final_conditioned_steps
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"System Flow Error: {str(e)}")