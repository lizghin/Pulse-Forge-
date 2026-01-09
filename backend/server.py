from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Pulse Forge API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Pulse Forge API", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# Import and include analytics router
from analytics.router import analytics_router, set_analytics_db
from analytics.database import AnalyticsDB
from analytics.demo_data import generate_demo_data, clear_demo_data

# Initialize analytics DB
analytics_db = AnalyticsDB(db)
set_analytics_db(analytics_db)

# Include analytics router
api_router.include_router(analytics_router)

# Include the main router in the app
app.include_router(api_router)


# Admin endpoint to generate demo data
@api_router.post("/admin/generate-demo-data")
async def admin_generate_demo_data(
    days: int = 14,
    players: int = 100
):
    """Generate demo data for testing (admin only)"""
    result = await generate_demo_data(analytics_db, days=days, players=players)
    return {"success": True, "generated": result}


@api_router.delete("/admin/clear-demo-data")
async def admin_clear_demo_data():
    """Clear all analytics demo data (admin only)"""
    await clear_demo_data(analytics_db)
    return {"success": True, "message": "All demo data cleared"}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    """Initialize indexes on startup"""
    await analytics_db.ensure_indexes()
    logger.info("Analytics DB indexes created")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
