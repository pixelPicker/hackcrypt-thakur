from fastapi import APIRouter, UploadFile, File
from app.services.analyzer import analyze_media
from app.schemas.analysis import AnalysisResult

router = APIRouter()

@router.post("/", response_model=AnalysisResult)
async def analyze(file: UploadFile = File(...)):
    return await analyze_media(file)
