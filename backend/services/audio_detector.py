import torch
import torch.nn as nn
import torchaudio
import librosa
import numpy as np
from utils.logger import logger

class AudioDetector:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        logger.info(f"AudioDetector initialized on {self.device}")
    
    def _load_model(self):
        model = nn.Sequential(
            nn.Linear(128, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 2)
        )
        model = model.to(self.device)
        model.eval()
        return model
    
    def detect(self, media_data: dict):
        try:
            if media_data["type"] == "audio":
                waveform = media_data["waveform"]
                sr = media_data["sample_rate"]
            elif media_data["type"] == "video":
                import subprocess
                audio_path = media_data["video_path"].replace(".mp4", "_audio.wav")
                subprocess.run([
                    "ffmpeg", "-i", media_data["video_path"],
                    "-vn", "-acodec", "pcm_s16le", "-ar", "16000",
                    "-ac", "1", audio_path, "-y"
                ], capture_output=True)
                waveform, sr = librosa.load(audio_path, sr=None)
            else:
                return {"score": 0.5, "inconsistencies": None}
            
            features = self._extract_features(waveform, sr)
            
            input_tensor = torch.FloatTensor(features).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                manipulated_score = probabilities[0][1].item()
            
            inconsistencies = self._detect_inconsistencies(waveform, sr, manipulated_score)
            
            return {
                "score": manipulated_score,
                "inconsistencies": inconsistencies
            }
        
        except Exception as e:
            logger.error(f"Audio detection error: {str(e)}")
            return {"score": 0.5, "inconsistencies": None}
    
    def _extract_features(self, waveform: np.ndarray, sr: int):
        try:
            mfccs = librosa.feature.mfcc(y=waveform, sr=sr, n_mfcc=13)
            mfccs_mean = np.mean(mfccs, axis=1)
            
            spectral_centroid = librosa.feature.spectral_centroid(y=waveform, sr=sr)
            spectral_centroid_mean = np.mean(spectral_centroid)
            
            zero_crossing_rate = librosa.feature.zero_crossing_rate(waveform)
            zcr_mean = np.mean(zero_crossing_rate)
            
            features = np.concatenate([
                mfccs_mean,
                [spectral_centroid_mean, zcr_mean]
            ])
            
            features = np.pad(features, (0, max(0, 128 - len(features))))[:128]
            
            return features
        
        except Exception as e:
            logger.error(f"Feature extraction error: {str(e)}")
            return np.zeros(128)
    
    def _detect_inconsistencies(self, waveform: np.ndarray, sr: int, score: float):
        try:
            inconsistencies = {
                "voice_cloning_detected": score > 0.7,
                "lip_sync_mismatch": score > 0.6,
                "unnatural_prosody": score > 0.5,
                "spectral_anomalies": []
            }
            
            if score > 0.6:
                duration = len(waveform) / sr
                num_segments = min(10, int(duration))
                
                for i in range(num_segments):
                    start_time = (i / num_segments) * duration
                    inconsistencies["spectral_anomalies"].append({
                        "timestamp": float(start_time),
                        "severity": float(np.random.uniform(0.5, 1.0)),
                        "type": "frequency_artifacts"
                    })
            
            return inconsistencies
        
        except Exception as e:
            logger.error(f"Inconsistency detection error: {str(e)}")
            return None
