from celery import Celery
from services.media_processor import MediaProcessor
from services.vision_detector import VisionDetector
from services.audio_detector import AudioDetector
from services.temporal_detector import TemporalDetector
from services.fusion_engine import FusionEngine
from services.explainability import ExplainabilityEngine
from utils.logger import logger
import time

celery_app = Celery(
    "deepfake_detection",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1"
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

job_results = {}

@celery_app.task(name="analyze_media")
def analyze_media_task(job_id: str, media_url: str, content_type: str):
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
        
        job_results[job_id] = result
        
        logger.info(f"Analysis complete for job {job_id}: {label} ({final_score:.2f})")
        
        return result
    
    except Exception as e:
        logger.error(f"Error analyzing job {job_id}: {str(e)}")
        job_results[job_id] = {"status": "error", "error": str(e)}
        raise

def get_job_result(job_id: str):
    return job_results.get(job_id)
