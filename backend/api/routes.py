from fastapi import APIRouter, File, UploadFile, HTTPException
from api.schemas import AnalysisResult, JobResponse
from workers.tasks import analyze_media_task
from utils.storage import upload_to_storage
from utils.logger import logger
import uuid

router = APIRouter()

@router.post("/analyze", response_model=JobResponse)
async def analyze_media(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        job_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        storage_path = f"{job_id}.{file_extension}"
        
        media_url = upload_to_storage(content, storage_path, file.content_type)
        
        analyze_media_task.delay(job_id, media_url, file.content_type)
        
        logger.info(f"Analysis job created: {job_id}")
        
        return JobResponse(
            job_id=job_id,
            status="processing",
            message="Media uploaded successfully. Analysis in progress."
        )
    
    except Exception as e:
        logger.error(f"Error creating analysis job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{job_id}", response_model=AnalysisResult)
async def get_results(job_id: str):
    from workers.tasks import get_job_result
    
    result = get_job_result(job_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Job not found or still processing")
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    return AnalysisResult(**result)
