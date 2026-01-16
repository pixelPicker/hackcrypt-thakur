from pydantic import BaseModel

class AnalysisResult(BaseModel):
    filename: str
    content_type: str
    size: int
    confidence: float
    is_fake: bool
