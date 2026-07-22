import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes.agent import router as agent_router
from app.api.routes.health import router as health_router
from app.api.routes.leads import router as leads_router
from app.config import get_settings
from app.db.database import Base, engine

# Import models so SQLAlchemy knows which tables to create.
from app.db import models  # noqa: F401


settings = get_settings()

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    description=(
        "AI-powered lead qualification "
        "and sales workflow agent."
    ),
    version="1.0.0"
)


app.include_router(
    health_router,
    prefix="/api",
    tags=["Health"]
)

app.include_router(
    leads_router,
    prefix="/api",
    tags=["Leads"]
)
app.include_router(
    agent_router,
    prefix="/api",
    tags=["Agent"],
)

# Mount static directory for frontend
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": settings.app_name,
        "docs": "/docs",
        "health": "/api/health"
    }