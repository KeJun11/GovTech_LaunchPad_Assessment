# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# MongoDB
import motor.motor_asyncio
from beanie import init_beanie

# Basic
import os
import logging
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Other files
from .models import ConversationFull
from .routes import router

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database intialization and fastAPI lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # —— startup logic ——
    try:
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        database_name = os.getenv("DATABASE_NAME", "conversation_db")

        client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)

        # Test the connection
        try:
            # The ismaster command is cheap and does not require auth
            client.admin.command('ismaster')
            logger.info("MongoDB connection test successful")
        except Exception as e:
            logger.error(f"MongoDB connection test failed: {e}")
            raise

        db = client[database_name]
        await init_beanie(
            database=db,
            document_models=[ConversationFull]
        )
        app.state.mongo_client = client  # so we can close it on shutdown
        logger.info(f"Connected to MongoDB: {mongodb_url}/{database_name}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

    yield  # app runs

    # —— shutdown logic ——
    app.state.mongo_client.close()
    logger.info("MongoDB connection closed.")

# Intialize FastAPI app
app = FastAPI(
    title="Conversation API",
    description="API for managing conversations with LLM",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable Routes
app.include_router(
    router, 
    # prefix="/api"
)