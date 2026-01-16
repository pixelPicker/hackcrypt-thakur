from fastapi import UploadFile
from app.schemas.analysis import AnalysisResult

async def analyze_media(file: UploadFile) -> AnalysisResult:
    contents = await file.read()

    # TODO: replace with real ML / media logic
    return AnalysisResult(
        filename=file.filename,
        content_type=file.content_type,
        size=len(contents),
        confidence=0.42,
        is_fake=False,
    )
