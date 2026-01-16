import os
import torch
import librosa
import numpy as np
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
        
        # Fallback if running inside backend directly
        if not os.path.exists(self.model_path):
             self.model_path = os.path.join(current_script_dir, "..", "models", "pretrained")
        
        self.model_path = os.path.normpath(self.model_path)
        # ---------------------------------------------

        try:
            print(f"📂 Loading Audio Model from: {self.model_path}")
            
            # Verify model files exist
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
        """
        Performs the raw analysis.
        """
        if not self.model: 
            return {"error": "Model not loaded", "fake_prob": 0.5}
        
        try:
            # Load Audio (resample to 16kHz)
            audio, sr = librosa.load(file_path, sr=16000)
            
            # Optimization: limit to first 10 seconds
            if len(audio) > 10 * sr: 
                audio = audio[:10 * sr]
            
            # Prepare inputs
            inputs = self.feature_extractor(
                audio, 
                sampling_rate=16000, 
                return_tensors="pt", 
                padding=True
            ).to(self.device)
            
            # Inference
            with torch.no_grad():
                logits = self.model(**inputs).logits
                probs = F.softmax(logits, dim=-1)
                
                # Index 0 = Real, Index 1 = Fake
                real_score = probs[0][0].item()
                fake_score = probs[0][1].item()
                
            return {
                "label": "FAKE" if fake_score > 0.5 else "REAL",
                "fake_prob": fake_score,
                "real_prob": real_score,
                "confidence_percent": round(fake_score * 100, 2) if fake_score > 0.5 else round(real_score * 100, 2)
            }
        except Exception as e:
            print(f"Audio Analysis Error: {e}")
            return {"error": str(e), "fake_prob": 0.5}

# Initialize ONE global instance to save memory
_global_detector = AudioDeepfakeDetector()


# =========================================================
# 2. THE SERVICE ADAPTER (Connects to your main.py)
# =========================================================
class AudioDetector:
    def detect(self, media_data: dict) -> dict:
        """
        This method is called by 'process_media_sync' in your main.py.
        Input: media_data dict (must contain file path)
        Output: dict with 'score' and 'inconsistencies'
        """
        # 1. Extract File Path
        # We check multiple common keys to be safe
        file_path = media_data.get("file_path") or media_data.get("local_path") or media_data.get("url")
        
        # 2. Validation
        if not file_path or not os.path.exists(file_path):
            print(f"⚠️ AudioDetector: File path missing or invalid: {file_path}")
            return {
                "score": 0.5, 
                "inconsistencies": {"error": "File not found"}
            }

        # 3. Run Analysis
        result = _global_detector.analyze_audio(file_path)
        
        # 4. Format Output for main.py / schemas.py
        fake_score = result.get("fake_prob", 0.5)
        
        # Create the 'inconsistencies' dictionary (matches your Schema's Dict[str, Any])
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
            # If it's real, we return metadata indicating it's clean
            inconsistencies = {
                "detected": False,
                "status": "Audio appears authentic based on spectral analysis."
            }

        return {
            "score": fake_score,              # Goes to modality_scores['audio']
            "inconsistencies": inconsistencies # Goes to explainability_data['audio_inconsistencies']
        }

# Test Case
# if __name__ == "__main__":
#     import soundfile as sf
#     import tempfile
    
#     print("\n🧪 STARTING AUDIO DETECTOR SELF-TEST...")
    
#     # 1. Create a dummy audio file (3 seconds of noise)
#     # We use a temp file so we don't clutter your project
#     with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
#         dummy_path = tmp.name
        
#     print(f"📝 Created dummy file at: {dummy_path}")
    
#     # Generate random noise (simulating audio)
#     samplerate = 16000
#     data = np.random.uniform(-0.5, 0.5, samplerate * 3) # 3 seconds
#     sf.write(dummy_path, data, samplerate)
    
#     # 2. Instantiate the Adapter
#     detector = AudioDetector()
    
#     # 3. Simulate the input from MediaProcessor
#     mock_media_data = {
#         "type": "audio",
#         "file_path": dummy_path,  
#         "metadata_score": 1.0
#     }
    
#     print("🧠 Running detection...")
#     try:
#         result = detector.detect(mock_media_data)
        
#         print("\n" + "="*40)
#         print("🎉 TEST RESULTS")
#         print("="*40)
#         print(f"1. Fake Score (0-1): {result['score']}")
#         print(f"2. Inconsistencies:  {result['inconsistencies']}")
#         print("="*40)
        
#         # Verify logic
#         if result['score'] > 0.5:
#             print("✅ Logic Check: Noise correctly flagged as FAKE/ANOMALY.")
#         else:
#             print("⚠️ Logic Check: Noise flagged as REAL (Might happen if model is strict).")
            
#     except Exception as e:
#         print(f"❌ TEST FAILED: {e}")
        
#     # 4. Cleanup
#     if os.path.exists(dummy_path):
#         os.remove(dummy_path)
#         print("\n🗑️ Dummy file deleted.")