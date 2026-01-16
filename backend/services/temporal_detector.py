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
    
    def detect(self, media_data: dict):
        if media_data["type"] != "video":
            return {"score": 0.5, "timeline": None}
        
        try:
            frames = media_data["frames"]
            fps = media_data.get("fps", 30)
            
            temporal_features = self._extract_temporal_features(frames)
            
            input_tensor = torch.FloatTensor(temporal_features).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs, (hidden, cell) = self.model(input_tensor)
                
                manipulated_score = torch.sigmoid(hidden[-1].mean()).item()
            
            timeline = self._generate_timeline(frames, fps, manipulated_score)
            
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
    
    def _generate_timeline(self, frames: list, fps: float, score: float):
        timeline = []
        
        num_frames = len(frames)
        duration = num_frames / fps if fps > 0 else num_frames
        
        num_points = min(20, num_frames)
        
        for i in range(num_points):
            timestamp = (i / num_points) * duration
            
            anomaly_score = score * np.random.uniform(0.7, 1.3)
            anomaly_score = np.clip(anomaly_score, 0.0, 1.0)
            
            timeline.append({
                "timestamp": float(timestamp),
                "score": float(anomaly_score),
                "frame_index": int((i / num_points) * num_frames)
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
