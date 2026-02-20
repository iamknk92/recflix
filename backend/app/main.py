"""
RecFlix FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.database import engine, Base
from app.models import *  # noqa: F401, F403 - Import all models for table creation

# Initialize Sentry before app creation (only when DSN is configured)
if settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

    # FastApiIntegration은 sentry-sdk 2.x에서 request body를 소비하는 버그가 있어 제외
    # sentry-sdk 2.x는 FastAPI를 자동 감지하므로 명시적으로 추가 불필요
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,
        environment=settings.APP_ENV,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    lifespan=lifespan,
    title=settings.APP_NAME,
    description="Context-Aware Personalized Movie Recommendation Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
print(f"CORS origins: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to RecFlix API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
