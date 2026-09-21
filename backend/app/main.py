import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1 import auth, cases, work_orders, evidence, verification, municipal, memos
from app.seed.demo_data import seed_database
from app.core.multi_db import init_contractor_databases

# Create all database tables
Base.metadata.create_all(bind=engine)
init_contractor_databases()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure upload dirs exist and seed demo database
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "memos"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "social_ingest"), exist_ok=True)
    init_contractor_databases()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    description="CivicFix AI: Real-time verification system verifying whether assigned municipal pothole repairs were actually completed.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static image access
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(cases.router, prefix=f"{settings.API_V1_STR}/cases", tags=["Cases"])
app.include_router(work_orders.router, prefix=f"{settings.API_V1_STR}/work-orders", tags=["Work Orders"])
app.include_router(evidence.router, prefix=f"{settings.API_V1_STR}/evidence", tags=["Evidence"])
app.include_router(verification.router, prefix=f"{settings.API_V1_STR}/verification", tags=["AI Verification"])
app.include_router(municipal.router, prefix=f"{settings.API_V1_STR}/municipal", tags=["Municipal Dashboard"])
app.include_router(memos.router, prefix=f"{settings.API_V1_STR}/memos", tags=["Expense Memos"])


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs",
        "version": "1.0.0"
    }

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "healthy", "service": "CivicFix AI Backend"}
