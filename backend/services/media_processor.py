import cv2
import numpy as np
from PIL import Image
import tempfile
import os
from utils.metadata import extract_metadata
from utils.logger import logger
import hashlib

class MediaProcessor:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    def process(self, media_url: str, content_type: str):
        media_type = self._determine_type(content_type)
        
        logger.info(f"Processing {media_type} from {media_url}")
        
        if media_type == "image":
            return self._process_image(media_url, content_type)
        elif media_type == "video":
            return self._process_video(media_url, content_type)
        elif media_type == "audio":
            return self._process_audio(media_url, content_type)
        else:
            raise ValueError(f"Unsupported media type: {content_type}")
    
    def _determine_type(self, content_type: str) -> str:
        if content_type.startswith("image/"):
            return "image"
        elif content_type.startswith("video/"):
            return "video"
        elif content_type.startswith("audio/"):
            return "audio"
        return "unknown"
    
    def _process_image(self, media_url: str, content_type: str):
        from utils.storage import download_from_storage
        
        image_data = download_from_storage(media_url)
        
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Failed to decode image")
        
        metadata = extract_metadata(image_data, "image")
        metadata_score = self._analyze_metadata(metadata)
        
        return {
            "type": "image",
            "data": image,
            "shape": image.shape,
            "metadata": metadata,
            "metadata_score": metadata_score,
            "metadata_flags": self._get_metadata_flags(metadata),
            "url": media_url
        }
    
    def _process_video(self, media_url: str, content_type: str):
        from utils.storage import download_from_storage
        
        video_data = download_from_storage(media_url)
        
        temp_path = os.path.join(self.temp_dir, f"video_{hashlib.md5(video_data).hexdigest()}.mp4")
        with open(temp_path, 'wb') as f:
            f.write(video_data)
        
        cap = cv2.VideoCapture(temp_path)
        
        frames = []
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        sample_rate = max(1, frame_count // 30)
        
        for i in range(0, frame_count, sample_rate):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if ret:
                frames.append(frame)
        
        cap.release()
        
        metadata = extract_metadata(video_data, "video")
        metadata_score = self._analyze_metadata(metadata)
        
        return {
            "type": "video",
            "frames": frames,
            "fps": fps,
            "frame_count": frame_count,
            "video_path": temp_path,
            "metadata": metadata,
            "metadata_score": metadata_score,
            "metadata_flags": self._get_metadata_flags(metadata),
            "url": media_url
        }
    
    def _process_audio(self, media_url: str, content_type: str):
        from utils.storage import download_from_storage
        import librosa
        
        audio_data = download_from_storage(media_url)
        
        temp_path = os.path.join(self.temp_dir, f"audio_{hashlib.md5(audio_data).hexdigest()}.wav")
        with open(temp_path, 'wb') as f:
            f.write(audio_data)
        
        y, sr = librosa.load(temp_path, sr=None)
        
        metadata = extract_metadata(audio_data, "audio")
        metadata_score = self._analyze_metadata(metadata)
        
        return {
            "type": "audio",
            "waveform": y,
            "sample_rate": sr,
            "audio_path": temp_path,
            "metadata": metadata,
            "metadata_score": metadata_score,
            "metadata_flags": self._get_metadata_flags(metadata),
            "url": media_url
        }
    
    def _analyze_metadata(self, metadata: dict) -> float:
        suspicious_score = 0.5
        
        if not metadata.get("creation_time"):
            suspicious_score += 0.1
        
        if not metadata.get("camera_info"):
            suspicious_score += 0.1
        
        if metadata.get("software_modified"):
            suspicious_score += 0.2
        
        return min(1.0, suspicious_score)
    
    def _get_metadata_flags(self, metadata: dict) -> list:
        flags = []
        
        if not metadata.get("creation_time"):
            flags.append("missing_creation_time")
        
        if metadata.get("software_modified"):
            flags.append("software_modified")
        
        if not metadata.get("camera_info"):
            flags.append("missing_camera_info")
        
        return flags
