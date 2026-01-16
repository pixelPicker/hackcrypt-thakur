import os
import torch
import librosa
import numpy as np
import requests
import tempfile
import shutil
from urllib.parse import urlparse
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
import torch.nn.functional as F

# =========================================================
# 1. THE CORE LOGIC (Singleton - Loads Model Once)
# =========================================================
class AudioDeepfakeDetector:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔊 Audio Detector initializing on: {self.device.upper()}")

        # --- Dynamic Path Finding for Offline Model ---
        current_script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Look 2 levels up for 'backend/models/pretrained'
        base_path = os.path.normpath(os.path.join(current_script_dir, "..", ".."))
        self.model_path = os.path.join(base_path, "backend", "models", "pretrained")
        
        # Fallback logic
        if not os.path.exists(self.model_path):
             self.model_path = os.path.join(current_script_dir, "..", "models", "pretrained")
        
        self.model_path = os.path.normpath(self.model_path)

        try:
            print(f"📂 Loading Audio Model from: {self.model_path}")
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Directory not found: {self.model_path}")
                
            self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(self.model_path, local_files_only=True)
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(self.model_path, local_files_only=True).to(self.device)
            self.model.eval()
            print("✅ Audio Model Loaded Successfully (OFFLINE)")
        except Exception as e:
            print(f"❌ Error loading audio model: {e}")
            self.model = None

    def analyze_audio(self, file_path: str) -> dict:
        if not self.model: return {"error": "Model not loaded", "fake_prob": 0.5}
        
        try:
            # 1. Load Audio
            y, sr = librosa.load(file_path, sr=16000)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # --- ENHANCEMENT 1: Silence/Pause Analysis ---
            # Real humans pause (breathing). AI often doesn't.
            non_silent_intervals = librosa.effects.split(y, top_db=20)
            non_silent_duration = sum([end - start for start, end in non_silent_intervals]) / sr
            silence_ratio = 1.0 - (non_silent_duration / duration)
            
            # --- ENHANCEMENT 2: Pitch/Tone Analysis ---
            # Extract pitch (fundamental frequency F0)
            f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            # Calculate standard deviation of pitch (High std dev = Expressive, Low = Monotone/Robotic)
            pitch_variability = np.nanstd(f0) if f0 is not None else 0.0

            # 2. AI Inference (Existing Logic)
            if len(y) > 10 * sr: y = y[:10 * sr]
            inputs = self.feature_extractor(y, sampling_rate=16000, return_tensors="pt", padding=True).to(self.device)
            
            with torch.no_grad():
                logits = self.model(**inputs).logits
                probs = F.softmax(logits, dim=-1)
                real_score = probs[0][0].item()
                fake_score = probs[0][1].item()
                
            # 3. Construct Rich Response
            return {
                "label": "FAKE" if fake_score > 0.5 else "REAL",
                "fake_prob": fake_score,
                "confidence_percent": round(max(fake_score, real_score) * 100, 2),
                
                # NEW EXPLAINABILITY DATA 🌟
                "analysis_metrics": {
                    "duration_seconds": round(duration, 2),
                    "silence_ratio": round(silence_ratio, 3), # < 0.05 is suspicious (no breathing)
                    "pitch_variability": round(pitch_variability, 2), # < 20.0 might be robotic
                    "is_monotone": bool(pitch_variability < 20.0),
                    "unnatural_pauses": bool(silence_ratio < 0.02)
                }
            }
        except Exception as e:
            print(f"Analysis Error: {e}")
            return {"error": str(e), "fake_prob": 0.5}

# Initialize ONE global instance
_global_detector = AudioDeepfakeDetector()


# =========================================================
# 2. THE SERVICE ADAPTER (Connects to your main.py)
# =========================================================
class AudioDetector:
    def detect(self, media_data: dict) -> dict:
        """
        Adapter method called by main.py.
        Handles both LOCAL PATHS and REMOTE URLS automatically.
        """
        input_path = media_data.get("file_path") or media_data.get("local_path") or media_data.get("url")
        if input_path and input_path.startswith("file://"):
            input_path = input_path.replace("file://", "")
            
            if os.name == 'nt' and input_path.startswith("/") and not input_path.startswith("//"):
                 input_path = input_path.lstrip("/")
        
        temp_file_path = None
        final_path_to_analyze = None

        try:
            # 2. INTELLIGENT PATH RESOLUTION
            if not input_path:
                return {"score": 0.5, "inconsistencies": {"error": "No file path provided"}}

            # Check if it is a URL (http/https)
            if self._is_url(input_path):
                print(f"🌐 Remote URL detected. Downloading: {input_path}")
                temp_file_path = self._download_file(input_path)
                final_path_to_analyze = temp_file_path
            else:
                # Assume it is a local path
                if os.path.exists(input_path):
                    final_path_to_analyze = input_path
                else:
                    return {"score": 0.5, "inconsistencies": {"error": f"Local file not found: {input_path}"}}

            # 3. RUN ANALYSIS
            result = _global_detector.analyze_audio(final_path_to_analyze)
            
            # 4. FORMAT OUTPUT
            fake_score = result.get("fake_prob", 0.5)
            
            inconsistencies = {}
            if fake_score > 0.55:
                inconsistencies = {
                    "detected": True,
                    "severity": "High" if fake_score > 0.8 else "Medium",
                    "description": "Synthetic audio artifacts detected matching Deepfake signatures.",
                    "confidence": result.get("confidence_percent"),
                    "details": {
                        "fake_probability": round(fake_score, 4),
                        "real_probability": result.get("real_prob", 0.0)
                    }
                }
            else:
                inconsistencies = {
                    "detected": False,
                    "status": "Audio appears authentic based on spectral analysis."
                }

            return {
                "score": fake_score,              
                "inconsistencies": inconsistencies
            }

        except Exception as e:
            print(f"AudioDetector Wrapper Error: {e}")
            return {"score": 0.5, "inconsistencies": {"error": str(e)}}
        
        finally:
            # 5. CLEANUP TEMP DOWNLOADS
            # Only delete if WE created it (i.e., it was a download)
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    print(f"🧹 Cleaned up temp download: {temp_file_path}")
                except:
                    pass

    # --- HELPER METHODS ---
    def _is_url(self, path: str) -> bool:
        try:
            result = urlparse(path)
            return all([result.scheme, result.netloc])
        except:
            return False

    def _download_file(self, url: str) -> str:
        """Downloads a file from a URL to a temporary local path."""
        try:
            # Create a temp file
            # delete=False because we need to close it before librosa reads it (Windows lock issue)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                local_filename = tmp.name
            
            # Download stream
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                with open(local_filename, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            
            return local_filename
        except Exception as e:
            raise RuntimeError(f"Failed to download audio from URL: {e}")

# # Test Case (Uncomment to test)
# if __name__ == "__main__":
#     detector = AudioDetector()
#     # Mock a URL input (replace with a real wav url to test download)
#     print(detector.detect({"url": "https://www.voiptroubleshooter.com/open_speech/american/10s/IG_10s.wav"}))