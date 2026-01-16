import os
from urllib.parse import urlparse

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from utils.logger import logger

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "deepfake-media")
AWS_S3_BASE_URL = os.getenv(
    "AWS_S3_BASE_URL",
    f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com"
)
_client = None

def get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            region_name=AWS_REGION,
        )
        try:
            _client.head_bucket(Bucket=AWS_S3_BUCKET)
        except ClientError:
            try:
                if AWS_REGION == "us-east-1":
                    _client.create_bucket(Bucket=AWS_S3_BUCKET)
                else:
                    _client.create_bucket(
                        Bucket=AWS_S3_BUCKET,
                        CreateBucketConfiguration={"LocationConstraint": AWS_REGION}
                    )
                logger.info(f"Created bucket: {AWS_S3_BUCKET}")
            except Exception as e:
                logger.warning(f"S3 bucket check/create failed: {str(e)}")
        except BotoCoreError as e:
            logger.warning(f"S3 not available: {str(e)}")
    
    return _client

def _parse_s3_url(url: str) -> tuple[str, str]:
    if url.startswith("s3://"):
        path = url[len("s3://"):]
        bucket, key = path.split("/", 1)
        return bucket, key

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError(f"Unsupported URL scheme for S3: {parsed.scheme}")

    host = parsed.netloc
    path = parsed.path.lstrip("/")

    if ".s3." in host or host.startswith("s3."):
        if host.startswith("s3."):
            bucket, key = path.split("/", 1)
            return bucket, key

        bucket = host.split(".", 1)[0]
        return bucket, path

    bucket, key = path.split("/", 1)
    return bucket, key

def upload_to_storage(data: bytes, object_name: str, content_type: str = "application/octet-stream") -> str:
    try:
        client = get_client()
        client.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=object_name,
            Body=data,
            ContentType=content_type
        )

        url = f"{AWS_S3_BASE_URL}/{object_name}"
        
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

        bucket, key = _parse_s3_url(url)

        client = get_client()
        response = client.get_object(Bucket=bucket, Key=key)
        data = response["Body"].read()
        
        logger.info(f"Downloaded {key} from storage")
        
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

        bucket, key = _parse_s3_url(url)

        client = get_client()
        client.delete_object(Bucket=bucket, Key=key)

        logger.info(f"Deleted {key} from storage")
        
        return True
    
    except Exception as e:
        logger.error(f"Storage deletion error: {str(e)}")
        return False
