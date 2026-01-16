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
            # Load 10 seconds of audio
            y, sr = librosa.load(file_path, sr=16000, duration=10)
            
            # --- 🛡️ LAYER 1: SPECTRAL FLUX (Transition Analysis) ---
            # AI often has "perfect" transitions between phonemes. Humans are messy.
            # Spectral flux measures how quickly the power spectrum changes.
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            flux_mean = np.mean(onset_env)
            # High flux variance = Natural speech. Low/Constant flux = AI generation.
            flux_risk = 1.0 if flux_mean < 1.2 else 0.0

            # --- 🛡️ LAYER 2: CHROMA CENS (Tonal Constancy) ---
            # AI voices often have a very "locked" pitch texture. 
            # We measure the energy in 12 different pitch classes.
            chroma = librosa.feature.chroma_cens(y=y, sr=sr)
            chroma_std = np.std(chroma)
            # AI is often "too stable" (Low std dev).
            tonal_risk = 1.0 if chroma_std < 0.25 else 0.0

            # --- 🛡️ LAYER 3: THE AI MODEL (Wav2Vec2) ---
            inputs = self.feature_extractor(y, sampling_rate=16000, return_tensors="pt", padding=True).to(self.device)
            with torch.no_grad():
                logits = self.model(**inputs).logits
                ai_fake_score = F.softmax(logits, dim=-1)[0][1].item()

            # --- 🚀 THE "VETO" LOGIC ---
            # If BOTH Layer 1 and Layer 2 say it's fake, we override a weak AI score.
            # This is much more accurate than a simple average.
            if flux_risk + tonal_risk >= 1.5:
                # The physical signals are suspicious
                final_score = max(ai_fake_score, 0.85) 
            else:
                # Trust the AI model but dampen it if it's unsure
                final_score = ai_fake_score

            return {
                "label": "FAKE" if final_score > 0.5 else "REAL",
                "fake_prob": float(final_score),
                "confidence_percent": round(float(final_score if final_score > 0.5 else (1-final_score)) * 100, 2),
                "analysis_metrics": {
                    "rhythm_fluidity": "Natural" if flux_mean > 1.2 else "Stiff/AI",
                    "tonal_consistency": "High (Suspect)" if chroma_std < 0.25 else "Normal",
                    "raw_ai_score": round(ai_fake_score, 3)
                }
            }

        except Exception as e:
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

if __name__ == "__main__":
    import os

    # 1. Initialize the detector
    detector = AudioDetector()
    
    # 2. Define your local test file path
    # Make sure this file actually exists in your services folder!
    current_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(current_dir, "test1.mp3") # or "test_video.mp4"
    
    print(f"🧪 Starting Local Test...")
    print(f"📂 Target File: {test_file}")

    if not os.path.exists(test_file):
        print(f"❌ ERROR: Test file not found at {test_file}")
        print("👉 Tip: Put a .wav or .mp4 file in this folder and rename it to 'test_audio.wav'")
    else:
        # 3. Run the detection
        # The wrapper handles both video and audio files because of librosa
        try:
            results = detector.detect({"local_path": test_file})
            
            print("\n" + "="*50)
            print("🎧 AUDIO DETECTION RESULTS")
            print("="*50)
            print(f"🔹 Final Fake Score: {results['score']}")
            
            # Print the explainability metrics if available
            incon = results.get('inconsistencies', {})
            if incon.get('detected'):
                print(f"🚩 STATUS: {incon.get('severity')} Risk - {incon.get('description')}")
            else:
                print(f"✅ STATUS: {incon.get('status')}")
                
            print(f"🔹 Confidence: {incon.get('confidence')}%")
            print("="*50)
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}")