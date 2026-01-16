from fastapi import APIRouter, File, UploadFile, HTTPException
from api.schemas import AnalysisResult, JobResponse
from utils.storage import upload_to_storage
from utils.logger import logger
from services.media_processor import MediaProcessor
from services.vision_detector import VisionDetector
from services.audio_detector import AudioDetector
from services.temporal_detector import TemporalDetector
from services.fusion_engine import FusionEngine
from services.explainability import ExplainabilityEngine
import uuid
import time

router = APIRouter()

job_results_cache = {}

@router.post("/analyze", response_model=JobResponse)
async def analyze_media(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        job_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        storage_path = f"{job_id}.{file_extension}"
        
        media_url = upload_to_storage(content, storage_path, file.content_type)
        
        try:
            result = process_media_sync(job_id, media_url, file.content_type)
            job_results_cache[job_id] = result
        except Exception as e:
            logger.error(f"Processing error: {str(e)}")
            job_results_cache[job_id] = {
                "status": "error",
                "error": str(e)
            }
        
        logger.info(f"Analysis job completed: {job_id}")
        
        return JobResponse(
            job_id=job_id,
            status="completed",
            message="Media analysis completed successfully."
        )
    
    except Exception as e:
        logger.error(f"Error creating analysis job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def process_media_sync(job_id: str, media_url: str, content_type: str):
    start_time = time.time()
    
    try:
        logger.info(f"Starting analysis for job {job_id}")
        
        processor = MediaProcessor()
        media_data = processor.process(media_url, content_type)
        
        modality_scores = {}
        explainability_data = {}
        
        if media_data["type"] in ["image", "video"]:
            vision_detector = VisionDetector()
            vision_result = vision_detector.detect(media_data)
            modality_scores["vision"] = vision_result["score"]
            explainability_data["heatmap"] = vision_result.get("heatmap")
            explainability_data["manipulated_regions"] = vision_result.get("regions")
        
        if media_data["type"] in ["audio", "video"]:
            audio_detector = AudioDetector()
            audio_result = audio_detector.detect(media_data)
            modality_scores["audio"] = audio_result["score"]
            explainability_data["audio_inconsistencies"] = audio_result.get("inconsistencies")
        
        if media_data["type"] == "video":
            temporal_detector = TemporalDetector()
            temporal_result = temporal_detector.detect(media_data)
            modality_scores["temporal"] = temporal_result["score"]
            explainability_data["anomalies_timeline"] = temporal_result.get("timeline")
        
        modality_scores["metadata"] = media_data.get("metadata_score", 0.5)
        explainability_data["metadata_flags"] = media_data.get("metadata_flags", [])
        
        fusion_engine = FusionEngine()
        final_score, label = fusion_engine.fuse(modality_scores, media_data["type"])
        
        risk_level = "Low" if final_score < 0.3 else ("Medium" if final_score < 0.7 else "High")
        
        explainability_engine = ExplainabilityEngine()
        enhanced_explainability = explainability_engine.enhance(
            explainability_data,
            modality_scores,
            media_data
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        result = {
            "job_id": job_id,
            "label": label,
            "confidence_score": final_score,
            "risk_level": risk_level,
            "modality_scores": modality_scores,
            "explainability": enhanced_explainability,
            "media_type": media_data["type"],
            "processing_time_ms": processing_time
        }
        
        logger.info(f"Analysis complete for job {job_id}: {label} ({final_score:.2f})")
        
        return result
    
    except Exception as e:
        logger.error(f"Error analyzing job {job_id}: {str(e)}")
        raise

@router.get("/results/{job_id}", response_model=AnalysisResult)
async def get_results(job_id: str):
    result = job_results_cache.get(job_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    return AnalysisResult(**result)
