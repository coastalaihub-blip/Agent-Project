from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import businesses, calls, webhooks
from routers.voicebot_ws import router as voicebot_router
from routers.agent_instructions import router as agent_instructions_router
from routers.appointments import router as appointments_router

load_dotenv()

app = FastAPI(
    title="AI Agent Platform API",
    version="0.1.0",
    description="Role-based AI agent platform for Indian businesses",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(businesses.router, prefix="/api/businesses", tags=["businesses"])
app.include_router(calls.router, prefix="/api/calls", tags=["calls"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(voicebot_router, tags=["voicebot"])
app.include_router(agent_instructions_router, prefix="/api/agent", tags=["agent"])
app.include_router(appointments_router, prefix="/api/appointments", tags=["appointments"])


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}
