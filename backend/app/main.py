from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # ◄── Import StaticFiles mounting class
import os

from app.api import ai_controller
from app.api import automation  

app = FastAPI(title="AI Testing Automation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ MOUNT STATIC EVIDENCE TRACKING ROUTE
# Maps your frontend's evidence workspace output folder directly under a public backend route URL
evidence_path = "C:\\Thz\\AI_Automation_Tool\\frontend\\playwright-evidence"
if os.path.exists(evidence_path):
    app.mount("/evidence", StaticFiles(directory=evidence_path), name="evidence")
    print(f"📂 Assets mounting pipeline synced cleanly at: /evidence")

# Router Registrations
app.include_router(ai_controller.router, prefix="/api/ai", tags=["AI Engine"])
app.include_router(automation.router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "message": "AI Testing Automation API is fully operational"
    }