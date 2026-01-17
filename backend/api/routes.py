from itsdangerous import URLSafeSerializer
import os
from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Response
from services.lipsync_detector import LipSyncDetector
from api.schemas import AnalysisResult, JobResponse
from utils.storage import upload_to_storage
from utils.logger import logger
from services.media_processor import MediaProcessor
from services.vision_detector import VisionDetector
from services.audio_detector import _global_detector as audio_detector
from services.temporal_detector import TemporalDetector
from services.fusion_engine import FusionEngine
from services.explainability import ExplainabilityEngine
import uuid
import time
import traceback


SECRET_KEY = "super-secret-key-change-this"
serializer = URLSafeSerializer(SECRET_KEY)

MAX_CREDITS = 3
COOKIE_NAME = "credits_token"


def create_token(credits: int):
    return serializer.dumps({"credits": credits})


def read_token(token: str):
    try:
        return serializer.loads(token)
    except Exception:
        return None

def credits(request: Request, response: Response):
    token = request.cookies.get(COOKIE_NAME)

    # First-time visitor
    if not token:
        credits = MAX_CREDITS - 1
        response.set_cookie(
            key=COOKIE_NAME,
            value=create_token(credits),
            httponly=True,
            samesite="lax",
            secure=False  # set True in production (HTTPS)
        )
        return {"result": "analysis done", "credits_left": credits}

    data = read_token(token)
    if not data:
        raise HTTPException(status_code=400, detail="Invalid session")

    credits = data.get("credits", 0)

    if credits <= 0:
        raise HTTPException(
            status_code=429,
            detail="Free limit reached. Please sign up."
        )

    credits -= 1
    response.set_cookie(
        key=COOKIE_NAME,
        value=create_token(credits),
        httponly=True,
        samesite="lax",
        secure=False
    )

    return {"result": "analysis done", "credits_left": credits}

router = APIRouter()

job_results_cache = {}

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_media(request: Request, response: Response, mode: str = "auto", file: UploadFile = File(...)):
  if mode != "user":
    tokenRes = credits(request, response)
    logger.info(f"Credits after consumption: {tokenRes['credits_left']}")
  
  try:
      content = await file.read()
      
      job_id = str(uuid.uuid4())
      file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
      storage_path = f"{job_id}.{file_extension}"
      
      media_url = upload_to_storage(content, storage_path, file.content_type)
      
      try:
          result = process_media_sync(job_id, media_url, file.content_type)
          job_results_cache[job_id] = result
          return AnalysisResult(**result)
      except Exception as e:
          logger.error(f"Processing error: {str(e)}")
          logger.error(traceback.format_exc())
          job_results_cache[job_id] = {
              "status": "error",
              "error": str(e)
          }
          # Re-raise to be caught by outer exception handler or return error structure
          raise e
  
  except Exception as e:
      logger.error(f"Error creating analysis job: {str(e)}")
      raise HTTPException(status_code=500, detail=str(e))

def process_media_sync(job_id: str, media_url: str, content_type: str):
    start_time = time.time()
    
    try:
        logger.info(f"Processing media for job {job_id}")
        
        processor = MediaProcessor()
        logger.info(f"Content-Type: {content_type}")
        media_data = processor.process(media_url, content_type)
        logger.info(f"Detected media type: {media_data['type']}")
        
        modality_scores = {}
        explainability_data = {}
        
        # --- 1. VISION DETECTION ---
        if media_data["type"] in ["image", "video"]:
            from utils.memory_manager import MemoryManager
            
            if media_data["type"] == "video":
                MemoryManager.log_memory_usage("Starting video analysis: ")
            
            vision_detector = VisionDetector()
            vision_result = vision_detector.detect(media_data)
            modality_scores["vision"] = vision_result["score"]
            explainability_data["heatmap"] = vision_result.get("heatmap")
            explainability_data["manipulated_regions"] = vision_result.get("regions")
        
        # --- 2. AUDIO DETECTION ---
        if media_data["type"] in ["audio", "video"]:
            # Use the global singleton imported as audio_detector
            # Determine path (handles extracted audio from video or raw audio files)
            audio_path = media_data.get("audio_path") or media_data.get("video_path") or media_data.get("local_path")
            
            audio_result = audio_detector.analyze_audio(audio_path)
            
            # Map score to 0-1 range
            modality_scores["audio"] = float(audio_result.get("fake_prob", 0.5))
            explainability_data["audio_metrics"] = audio_result.get("analysis_metrics", {})

        # --- 3. VIDEO SPECIFIC (TEMPORAL & LIPSYNC) ---
        if media_data["type"] == "video":
            # A. Temporal Consistency
            temporal_detector = TemporalDetector()
            temporal_result = temporal_detector.detect(media_data)
            modality_scores["temporal"] = temporal_result["score"]
            
            raw_timeline = temporal_result.get("timeline", [])
            explainability_data["anomalies_timeline"] = [
                {"t": p["timestamp"], "score": p["score"]} for p in raw_timeline
            ] if raw_timeline else None

            # B. LIPSYNC DETECTION (NEW) 👄
            logger.info(f"Running LipSync analysis for job {job_id}")
            lipsync_detector = LipSyncDetector()
            # Pass media_data which contains the local_path
            ls_result = lipsync_detector.detect(media_data)
            
            modality_scores["lipsync"] = float(ls_result["score"])
            explainability_data["lipsync_details"] = ls_result.get("inconsistencies", {})

        # --- 4. FUSION (No default scores) ---
        if media_data.get("metadata_score") is not None and media_data.get("metadata_score") != 0.5:
            modality_scores["metadata"] = media_data.get("metadata_score")
            explainability_data["metadata_flags"] = media_data.get("metadata_flags", [])
        
        # The FusionEngine now receives only active detectors
        fusion_engine = FusionEngine()
        final_score, label = fusion_engine.fuse(modality_scores, media_data["type"])
        
        risk_level = "Low" if final_score < 0.3 else ("Medium" if final_score < 0.7 else "High")
        
        # --- 5. EXPLAINABILITY ---
        explainability_engine = ExplainabilityEngine()
        enhanced_explainability = explainability_engine.enhance(
            explainability_data,
            modality_scores,
            media_data
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Clean modality_scores - remove None values and 0.5 defaults
        # Only keep scores from detectors that actually ran successfully
        cleaned_scores = {
            k: v for k, v in modality_scores.items() 
            if v is not None and v != 0.5
        }
        
        logger.info(f"Final scores for {media_data['type']}: {cleaned_scores}")
        logger.info(f"Final aggregated score: {final_score:.4f} ({label})")
        
        # Path resolution for public URL
        public_media_url = media_url
        if media_url.startswith("file://"):
            # Extract filename from file path (handles both ./temp_storage/file.mp4 and absolute paths)
            file_path = media_url.replace("file://", "")
            filename = os.path.basename(file_path)
            public_media_url = f"http://localhost:8000/uploads/{filename}"

        return {
            "job_id": job_id,
            "label": label,
            "confidence_score": round(final_score, 4),
            "risk_level": risk_level,
            "modality_scores": cleaned_scores,
            "explainability": enhanced_explainability,
            "media_type": media_data["type"],
            "media_url": public_media_url,
            "processing_time_ms": processing_time
        }
    
    except Exception as e:
        logger.error(f"Error analyzing job {job_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@router.get("/results/{job_id}", response_model=AnalysisResult)
async def get_results(job_id: str):
    result = job_results_cache.get(job_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    return AnalysisResult(**result)
