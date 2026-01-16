from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api import routes
from utils.logger import logger
import uvicorn

app = FastAPI(
    title="Deepfake Detection API",
    description="Advanced AI/ML system for detecting deepfakes in images, videos, and audio",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

from fastapi.staticfiles import StaticFiles
import os

# Mount static files for local storage fallback
os.makedirs("temp_storage", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="temp_storage"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Deepfake Detection API", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    logger.info("Starting Deepfake Detection API")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
