import os
import torch
import librosa
import numpy as np
import soundfile as sf
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
import torch.nn.functional as F

class AudioDeepfakeDetector:
    def __init__(self):
        """
        Initializes the Deepfake Detector using the LOCALLY saved model.
        """
        # 1. ROBUST DEVICE SELECTION
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔊 Audio Detector initializing on: {self.device.upper()}")

        # 2. LOCATE LOCAL MODEL (The Refactored Part) 🔍
        # This logic finds the 'backend' folder relative to this script, 
        # then navigates to 'models/pretrained'.
        
        # Get directory of THIS file (e.g., backend/services)
        current_script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Go up one level to 'backend', then into 'models/pretrained'
        # Adjust '..' depending on where you put this file. 
        # If this file is in 'backend/services/', we go up once (..) to reach 'backend'.
        self.model_path = os.path.join(current_script_dir, "..", "models", "pretrained")
        
        # Normalize path (fixes slashes for Windows)
        self.model_path = os.path.normpath(self.model_path)

        # 3. SAFE LOADING (OFFLINE MODE)
        try:
            print(f"📂 Loading Local Model from: {self.model_path}")
            
            # Check if files actually exist
            if not os.path.exists(os.path.join(self.model_path, "config.json")):
                raise FileNotFoundError(f"Model files not found in {self.model_path}")

            # Load from Disk
            self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(self.model_path, local_files_only=True)
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(self.model_path, local_files_only=True).to(self.device)
            self.model.eval() # Set to evaluation mode
            
            print("✅ Audio Model loaded successfully (OFFLINE MODE)")
            
        except Exception as e:
            print(f"❌ CRITICAL ERROR: Could not load local model.")
            print(f"   Reason: {e}")
            print(f"   💡 Tip: Did you run 'download_hypermoon.py'?")
            self.model = None

    def analyze_audio(self, file_path: str) -> dict:
        """
        Main API Entry Point.
        """
        # A. PRE-FLIGHT CHECKS
        if not self.model:
            return {
                "status": "error", 
                "message": "AI Model is not loaded. Check server logs."
            }
        
        if not os.path.exists(file_path):
            return {
                "status": "error", 
                "message": f"File not found at path: {file_path}"
            }

        try:
            # B. AUDIO LOADING (Librosa + SoundFile)
            # sr=16000 is MANDATORY for Wav2Vec2
            audio, sr = librosa.load(file_path, sr=16000)
            
            # C. MEMORY PROTECTION (Chunking)
            # Analyze max 10 seconds to keep speed high
            max_seconds = 10
            if len(audio) > max_seconds * sr:
                audio = audio[:max_seconds * sr]

            # D. TOKENIZATION
            inputs = self.feature_extractor(
                audio, 
                sampling_rate=16000, 
                return_tensors="pt", 
                padding=True
            ).to(self.device)

            # E. INFERENCE
            with torch.no_grad():
                logits = self.model(**inputs).logits
                probs = F.softmax(logits, dim=-1)
                
                # Index 0 = Real, Index 1 = Fake
                real_score = probs[0][0].item()
                fake_score = probs[0][1].item()
                
                # F. DECISION LOGIC
                if fake_score > 0.50:
                    label = "FAKE"
                    confidence = fake_score
                else:
                    label = "REAL"
                    confidence = real_score

            # G. SUCCESS RESPONSE
            return {
                "status": "success",
                "filename": os.path.basename(file_path),
                "label": label, 
                "confidence": round(confidence * 100, 2),
                "detailed_scores": {
                    "real_prob": round(real_score, 4),
                    "fake_prob": round(fake_score, 4)
                },
                "meta": {
                    "duration_analyzed": len(audio)/16000,
                    "device_used": self.device
                }
            }

        except Exception as e:
            print(f"⚠️ Error during scan: {str(e)}")
            return {
                "status": "error", 
                "message": f"Analysis failed: {str(e)}"
            }

# --- SELF-TEST BLOCK (No Internet Needed) ---
if __name__ == "__main__":
    detector = AudioDeepfakeDetector()
    
    # Generate dummy noise for testing (no external file needed)
    print("\n🧪 Running Self-Test with Dummy Audio...")
    test_file = "temp_debug_noise.wav"
    dummy_audio = np.random.uniform(-0.5, 0.5, 16000*3) # 3 seconds noise
    sf.write(test_file, dummy_audio, 16000)
    
    result = detector.analyze_audio(test_file)
    print("\nAPI Response Output:")
    print(result)
    
    if os.path.exists(test_file):
        os.remove(test_file)