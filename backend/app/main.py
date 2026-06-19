import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html

from app.api import ai_controller
from app.api import automation  

app = FastAPI(
    title="AI Testing Automation API", 
    version="1.0.0",
    docs_url=None, 
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🟩 DYNAMIC PATH GENERATION BLOCK
# Determine the absolute directory path of this main.py file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Securely extract the base project folder absolute path string
path_parts = BASE_DIR.split(os.sep)
if "AI_Automation_Tool" in path_parts:
    # Cut the array right after the workspace directory name
    idx = path_parts.index("AI_Automation_Tool")
    PROJECT_ROOT = os.sep.join(path_parts[:idx + 1])
else:
    # Safe fallback to move up one directory level
    PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

# ✅ MOUNT OFFLINE SWAGGER UI ASSETS (Relative to app location)
static_swagger_path = os.path.join(BASE_DIR, "static")
if os.path.exists(static_swagger_path):
    app.mount("/static", StaticFiles(directory=static_swagger_path), name="static")

# ✅ MOUNT STATIC EVIDENCE TRACKING ROUTE (Relative to structural project root)
evidence_path = os.path.join(PROJECT_ROOT, "frontend", "playwright-evidence")

# Clean up path separators for Windows environments
evidence_path = os.path.normpath(evidence_path)

# Ensure the evidence folder exists so mounting doesn't throw runtime crashes
if not os.path.exists(evidence_path):
    os.makedirs(evidence_path, exist_ok=True)

app.mount("/evidence", StaticFiles(directory=evidence_path), name="evidence")
print(f"📂 Assets mounting pipeline synced cleanly at: /evidence -> {evidence_path}")


# ✅ CUSTOM OFFLINE SWAGGER ROUTE INTERCEPTOR
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="/static/swagger/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger/swagger-ui-css.css",
        swagger_favicon_url="/static/swagger/favicon.png"
    )

# Router Registrations
app.include_router(ai_controller.router, prefix="/api/ai", tags=["AI Engine"])
app.include_router(automation.router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "message": "AI Testing Automation API is fully operational"
    }