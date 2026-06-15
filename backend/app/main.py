from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ai_controller

app = FastAPI(
    title="AI Testing Automation API",
    description="Backend orchestration layer for AI test case generatnion and execution analysis.",
    version="1.0.0"
)

# Configure CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_controller.router, prefix="/api/ai", tags=["AI Engine"])

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "message": "AI Testing Automation API is fully operational"
    }