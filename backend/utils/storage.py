from minio import Minio
from utils.logger import logger
import io
import os

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "deepfake-media")

_client = None

def get_client():
    global _client
    if _client is None:
        _client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False
        )
        
        try:
            if not _client.bucket_exists(MINIO_BUCKET):
                _client.make_bucket(MINIO_BUCKET)
                logger.info(f"Created bucket: {MINIO_BUCKET}")
        except Exception as e:
            logger.warning(f"MinIO not available: {str(e)}")
    
    return _client

def upload_to_storage(data: bytes, object_name: str, content_type: str = "application/octet-stream") -> str:
    try:
        client = get_client()
        data_stream = io.BytesIO(data)
        
        client.put_object(
            MINIO_BUCKET,
            object_name,
            data_stream,
            length=len(data),
            content_type=content_type
        )
        
        url = f"http://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{object_name}"
        
        logger.info(f"Uploaded {object_name} to storage")
        
        return url
    
    except Exception as e:
        logger.error(f"Storage upload error: {str(e)}")
        
        temp_path = f"./temp_storage/{object_name}"
        os.makedirs("./temp_storage", exist_ok=True)
        with open(temp_path, 'wb') as f:
            f.write(data)
        logger.warning(f"Saved to local temp storage: {temp_path}")
        return f"file://{temp_path}"

def download_from_storage(url: str) -> bytes:
    try:
        if url.startswith("file://"):
            file_path = url.replace("file://", "")
            with open(file_path, 'rb') as f:
                return f.read()
        
        client = get_client()
        object_name = url.split(f"/{MINIO_BUCKET}/")[-1]
        
        response = client.get_object(MINIO_BUCKET, object_name)
        data = response.read()
        response.close()
        response.release_conn()
        
        logger.info(f"Downloaded {object_name} from storage")
        
        return data
    
    except Exception as e:
        logger.error(f"Storage download error: {str(e)}")
        raise

def delete_from_storage(url: str) -> bool:
    try:
        if url.startswith("file://"):
            file_path = url.replace("file://", "")
            if os.path.exists(file_path):
                os.remove(file_path)
            return True
        
        client = get_client()
        object_name = url.split(f"/{MINIO_BUCKET}/")[-1]
        
        client.remove_object(MINIO_BUCKET, object_name)
        
        logger.info(f"Deleted {object_name} from storage")
        
        return True
    
    except Exception as e:
        logger.error(f"Storage deletion error: {str(e)}")
        return False
