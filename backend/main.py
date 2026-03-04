from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers.auth_router import router as auth_router
from routers.sos_router import router as sos_router
from routers.incident_router import router as incident_router
from routers.helpline_router import router as helpline_router
from routers.resources_router import resources_router, counseling_router
from routers.safe_places_router import router as safe_places_router
from routers.admin_router import router as admin_router

# Create all tables
Base.metadata.create_all(bind=engine)

# Seed initial data
from seed import seed
seed()

app = FastAPI(
    title="SafeGuard – Women & Child Safety Platform",
    description="Comprehensive API for reporting incidents, SOS alerts, legal resources, counseling, and more.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sos_router)
app.include_router(incident_router)
app.include_router(helpline_router)
app.include_router(resources_router)
app.include_router(counseling_router)
app.include_router(safe_places_router)
app.include_router(admin_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "platform": "SafeGuard – Women & Child Safety",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
