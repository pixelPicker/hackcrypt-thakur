from hachoir.parser import createParser
from hachoir.metadata import extractMetadata
from PIL import Image
from PIL.ExifTags import TAGS
import io
from utils.logger import logger

def extract_metadata(data: bytes, media_type: str) -> dict:
    metadata = {
        "creation_time": None,
        "camera_info": None,
        "software_modified": False,
        "gps_location": None,
        "file_size": len(data),
        "compression": None
    }
    
    try:
        if media_type == "image":
            return _extract_image_metadata(data, metadata)
        elif media_type == "video":
            return _extract_video_metadata(data, metadata)
        elif media_type == "audio":
            return _extract_audio_metadata(data, metadata)
        else:
            return metadata
    
    except Exception as e:
        logger.error(f"Metadata extraction error: {str(e)}")
        return metadata

def _extract_image_metadata(data: bytes, metadata: dict) -> dict:
    try:
        image = Image.open(io.BytesIO(data))
        
        exif_data = image._getexif()
        
        if exif_data:
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                
                if tag == "DateTime":
                    metadata["creation_time"] = str(value)
                elif tag == "Make" or tag == "Model":
                    if not metadata["camera_info"]:
                        metadata["camera_info"] = {}
                    metadata["camera_info"][tag] = str(value)
                elif tag == "Software":
                    metadata["software_modified"] = True
                    metadata["software"] = str(value)
                elif tag == "GPSInfo":
                    metadata["gps_location"] = str(value)
        
        metadata["format"] = image.format
        metadata["size"] = image.size
        metadata["mode"] = image.mode
    
    except Exception as e:
        logger.error(f"Image metadata extraction error: {str(e)}")
    
    return metadata

def _extract_video_metadata(data: bytes, metadata: dict) -> dict:
    try:
        import tempfile
        import os
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_file.write(data)
        temp_file.close()
        
        parser = createParser(temp_file.name)
        
        if parser:
            meta = extractMetadata(parser)
            
            if meta:
                if meta.has("creation_date"):
                    metadata["creation_time"] = str(meta.get("creation_date"))
                
                if meta.has("producer"):
                    metadata["software_modified"] = True
                    metadata["software"] = str(meta.get("producer"))
                
                if meta.has("width") and meta.has("height"):
                    metadata["resolution"] = f"{meta.get('width')}x{meta.get('height')}"
                
                if meta.has("duration"):
                    metadata["duration"] = str(meta.get("duration"))
        
        os.unlink(temp_file.name)
    
    except Exception as e:
        logger.error(f"Video metadata extraction error: {str(e)}")
    
    return metadata

def _extract_audio_metadata(data: bytes, metadata: dict) -> dict:
    try:
        import tempfile
        import os
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        temp_file.write(data)
        temp_file.close()
        
        parser = createParser(temp_file.name)
        
        if parser:
            meta = extractMetadata(parser)
            
            if meta:
                if meta.has("creation_date"):
                    metadata["creation_time"] = str(meta.get("creation_date"))
                
                if meta.has("producer") or meta.has("encoder"):
                    metadata["software_modified"] = True
                    metadata["software"] = str(meta.get("producer") or meta.get("encoder"))
                
                if meta.has("duration"):
                    metadata["duration"] = str(meta.get("duration"))
                
                if meta.has("sample_rate"):
                    metadata["sample_rate"] = str(meta.get("sample_rate"))
        
        os.unlink(temp_file.name)
    
    except Exception as e:
        logger.error(f"Audio metadata extraction error: {str(e)}")
    
    return metadata
