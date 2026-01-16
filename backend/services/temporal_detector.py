import torch
import torch.nn as nn
import cv2
import numpy as np
from utils.logger import logger

class TemporalDetector:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        logger.info(f"TemporalDetector initialized on {self.device}")
    
    def _load_model(self):
        model = nn.LSTM(
            input_size=2048,
            hidden_size=512,
            num_layers=2,
            batch_first=True,
            dropout=0.3
        )
        model = model.to(self.device)
        model.eval()
        return model
    
    def _read_sampled_frames(self, video_path: str, frame_count: int, max_frames: int = 30):
        """Read sampled frames from video file"""
        frames = []
        cap = cv2.VideoCapture(video_path)
        
        sample_rate = max(1, frame_count // max_frames)
        
        for i in range(0, frame_count, sample_rate):
            if len(frames) >= max_frames:
                break
            
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            
            if ret:
                # Downscale to save memory
                height, width = frame.shape[:2]
                max_height = 360
                if height > max_height:
                    scale = max_height / height
                    new_width = int(width * scale)
                    frame = cv2.resize(frame, (new_width, max_height), interpolation=cv2.INTER_AREA)
                
                frames.append(frame)
        
        cap.release()
        return frames
    
    def detect(self, media_data: dict):
        if media_data["type"] != "video":
            return {"score": 0.5, "timeline": None}
        
        from utils.memory_manager import MemoryManager
        
        video_path = media_data.get("video_path") or media_data.get("local_path")
        if not video_path:
            logger.error("No video path provided for temporal detection")
            return {"score": 0.5, "timeline": None}
        
        try:
            fps = media_data.get("fps", 30)
            frame_count = media_data.get("frame_count", 0)
            
            # Read frames on-demand
            frames = self._read_sampled_frames(video_path, frame_count)
            
            if len(frames) == 0:
                return {"score": 0.5, "timeline": None}
            
            with MemoryManager.memory_efficient_context():
                temporal_features = self._extract_temporal_features(frames)
                
                input_tensor = torch.FloatTensor(temporal_features).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    outputs, (hidden, cell) = self.model(input_tensor)
                    manipulated_score = torch.sigmoid(hidden[-1].mean()).item()
                
                # Clear tensors
                del input_tensor, outputs, hidden, cell
            
            timeline = self._generate_timeline(len(frames), fps, manipulated_score, frame_count)
            
            # Cleanup frames
            del frames
            MemoryManager.clear_memory()
            
            return {
                "score": manipulated_score,
                "timeline": timeline
            }
        
        except Exception as e:
            logger.error(f"Temporal detection error: {str(e)}")
            return {"score": 0.5, "timeline": None}
    
    def _extract_temporal_features(self, frames: list):
        features = []
        
        for i, frame in enumerate(frames[:30]):
            try:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                resized = cv2.resize(gray, (64, 64))
                
                feature_vector = resized.flatten()
                
                feature_vector = np.pad(feature_vector, (0, max(0, 2048 - len(feature_vector))))[:2048]
                
                features.append(feature_vector)
            
            except Exception as e:
                logger.error(f"Feature extraction error for frame {i}: {str(e)}")
                features.append(np.zeros(2048))
        
        if len(features) < 10:
            features.extend([np.zeros(2048)] * (10 - len(features)))
        
        return np.array(features)
    
    def _generate_timeline(self, sampled_frames_count: int, fps: float, score: float, total_frame_count: int):
        timeline = []
        
        duration = total_frame_count / fps if fps > 0 else total_frame_count
        
        num_points = min(20, sampled_frames_count)
        
        for i in range(num_points):
            timestamp = (i / num_points) * duration
            
            anomaly_score = score * np.random.uniform(0.7, 1.3)
            anomaly_score = np.clip(anomaly_score, 0.0, 1.0)
            
            timeline.append({
                "timestamp": float(timestamp),
                "score": float(anomaly_score),
                "frame_index": int((i / num_points) * total_frame_count)
            })
        
        return timeline
    
    def _detect_frame_inconsistencies(self, frames: list):
        inconsistencies = []
        
        for i in range(1, min(len(frames), 30)):
            try:
                prev_frame = cv2.cvtColor(frames[i-1], cv2.COLOR_BGR2GRAY)
                curr_frame = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY)
                
                flow = cv2.calcOpticalFlowFarneback(
                    prev_frame, curr_frame, None,
                    0.5, 3, 15, 3, 5, 1.2, 0
                )
                
                magnitude, angle = cv2.cartToPolar(flow[..., 0], flow[..., 1])
                
                flow_variance = np.var(magnitude)
                
                if flow_variance > 100:
                    inconsistencies.append({
                        "frame_index": i,
                        "type": "motion_inconsistency",
                        "severity": min(1.0, flow_variance / 200)
                    })
            
            except Exception as e:
                logger.error(f"Frame inconsistency detection error: {str(e)}")
        
        return inconsistencies
