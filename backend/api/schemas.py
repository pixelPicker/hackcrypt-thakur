from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any

class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class ModalityScore(BaseModel):
    vision: Optional[float] = None
    audio: Optional[float] = None
    temporal: Optional[float] = None
    metadata: Optional[float] = None

class ExplainabilityData(BaseModel):
    heatmap: Optional[List[Dict[str, float]]] = None
    anomalies_timeline: Optional[List[Dict[str, Any]]] = None
    manipulated_regions: Optional[List[Dict[str, Any]]] = None
    audio_inconsistencies: Optional[Dict[str, Any]] = None
    metadata_flags: Optional[List[str]] = None

class AnalysisResult(BaseModel):
    job_id: str
    label: str = Field(..., description="authentic or manipulated")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str = Field(..., description="Low, Medium, or High")
    modality_scores: ModalityScore
    explainability: ExplainabilityData
    media_type: str
    media_url: Optional[str] = None
    processing_time_ms: Optional[int] = None
