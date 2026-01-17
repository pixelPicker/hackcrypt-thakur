from fastapi import FastAPI, File, UploadFile, Request, Response, HTTPException
from itsdangerous import URLSafeSerializer
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
    allow_origins=[
        "http://localhost:3000",
        "https://hackcrypt-thakur.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(routes.router)

SECRET_KEY = "super-secret-key-change-this"
serializer = URLSafeSerializer(SECRET_KEY)

MAX_CREDITS = 3
COOKIE_NAME = "credits_token"

from fastapi.staticfiles import StaticFiles
import os

# Mount static files for local storage fallback
os.makedirs("temp_storage", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="temp_storage"), name="uploads")

def create_token(credits: int):
    return serializer.dumps({"credits": credits})

def read_token(token: str):
    try:
        return serializer.loads(token)
    except Exception:
        return None

@app.get("/")
async def root():
    return {"message": "Deepfake Detection API", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/me")
def get_me(request: Request, response: Response, mode: str = "auto"):
    token = request.cookies.get(COOKIE_NAME)

    if mode == "user":
        return {
            "authenticated": True,
            "credits_left": None, 
        }

    # No cookie → create fresh anonymous session
    if not token:
        response.set_cookie(
            key=COOKIE_NAME,
            value=create_token(MAX_CREDITS),
            httponly=True,
            samesite="lax",
            secure=False  # True in prod
        )

        return {
            "authenticated": False,
            "credits_left": MAX_CREDITS
        }

    data = read_token(token)

    # Corrupted / tampered cookie → reset safely
    if not data or "credits" not in data:
        response.set_cookie(
            key=COOKIE_NAME,
            value=create_token(MAX_CREDITS),
            httponly=True,
            samesite="lax",
            secure=False
        )
        logger.info("Resetting corrupted credits cookie")

        return {
            "authenticated": False,
            "credits_left": MAX_CREDITS
        }

    # Valid cookie → just return state
    return {
        "authenticated": False,
        "credits_left": data["credits"]
    }

# if __name__ == "__main__":
#     logger.info("Starting Deepfake Detection API")
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)