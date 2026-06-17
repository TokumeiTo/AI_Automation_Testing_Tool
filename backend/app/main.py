import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html  # ◄── Import manual UI constructor

from app.api import ai_controller
from app.api import automation  

# 🟩 Disable default CDN docs by setting docs_url and redoc_url to None
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

# Determine the absolute directory path of this main.py file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ✅ MOUNT OFFLINE SWAGGER UI ASSETS
# Mounts the local directory containing downloaded css/js assets
static_swagger_path = os.path.join(BASE_DIR, "static")
if os.path.exists(static_swagger_path):
    app.mount("/static", StaticFiles(directory=static_swagger_path), name="static")

# ✅ MOUNT STATIC EVIDENCE TRACKING ROUTE
evidence_path = "C:\\Thz\\AI_Automation_Tool\\frontend\\playwright-evidence"
if os.path.exists(evidence_path):
    app.mount("/evidence", StaticFiles(directory=evidence_path), name="evidence")
    print(f"📂 Assets mounting pipeline synced cleanly at: /evidence")


# ✅ CUSTOM OFFLINE SWAGGER ROUTE INTERCEPTOR
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        # 🟩 Force paths to fetch from our local mounted "/static" route instead of CDN
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