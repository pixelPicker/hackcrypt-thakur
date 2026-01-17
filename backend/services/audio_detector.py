import os
import torch
import librosa
import numpy as np
import requests
import tempfile
from urllib.parse import urlparse
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
import torch.nn.functional as F
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

# Set longer timeout for HuggingFace downloads
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '60'

class AudioDeepfakeDetector:
    """
    Advanced Audio Deepfake Detector using:
    1. MelodyMachine fine-tuned model
    2. Spectral analysis heuristics
    3. Optional Demucs vocal isolation (if available)
    """
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔊 Audio Detector initializing on: {self.device.upper()}")

        # Set up local model cache directory
        current_script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.normpath(os.path.join(current_script_dir, ".."))
        self.model_cache_dir = os.path.join(project_root, "models", "pretrained")
        os.makedirs(self.model_cache_dir, exist_ok=True)

        # Initialize Demucs (optional, for vocal isolation)
        self.demucs_model = None
        try:
            # Set torch hub cache to our local directory
            demucs_cache = os.path.join(self.model_cache_dir, "demucs")
            os.makedirs(demucs_cache, exist_ok=True)
            
            # Set environment variable for torch hub
            original_torch_home = os.environ.get('TORCH_HOME', None)
            os.environ['TORCH_HOME'] = demucs_cache
            
            from demucs.pretrained import get_model as demucs_get_model
            self.demucs_model = demucs_get_model('htdemucs')
            self.demucs_model.to(self.device)
            self.demucs_model.eval()
            
            # Restore original TORCH_HOME if it was set
            if original_torch_home:
                os.environ['TORCH_HOME'] = original_torch_home
            else:
                os.environ.pop('TORCH_HOME', None)
                
            print(f"✅ Demucs loaded for vocal isolation (cached in {demucs_cache})")
        except Exception as e:
            print(f"⚠️ Demucs not available: {e}. Proceeding without vocal isolation.")

        # Load main deepfake detection model
        try:
            model_name = "MelodyMachine/Deepfake-audio-detection"
            print(f"📂 Loading Audio Model: {model_name}")
            
            self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(
                model_name,
                cache_dir=self.model_cache_dir
            )
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(
                model_name,
                num_labels=2,
                cache_dir=self.model_cache_dir
            ).to(self.device)
            self.model.eval()
            print("✅ MelodyMachine Model Loaded Successfully")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model = None
            self.feature_extractor = None

    def analyze_audio(self, file_path: str) -> dict:
        """Analyze audio file for deepfake detection."""
        try:
            # Load audio
            y, sr = librosa.load(file_path, sr=16000, duration=10)
            
            # Optional: Use Demucs to isolate vocals
            if self.demucs_model is not None:
                try:
                    y = self._isolate_vocals(y, sr)
                    print("✓ Vocals isolated using Demucs")
                except Exception as e:
                    print(f"⚠️ Vocal isolation failed: {e}. Using original audio.")
            
            # LAYER 1: Spectral Flux Analysis
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            flux_mean = np.mean(onset_env)
            flux_risk = 1.0 if flux_mean < 1.2 else 0.0

            # LAYER 2: Tonal Consistency Analysis
            chroma = librosa.feature.chroma_cens(y=y, sr=sr)
            chroma_std = np.std(chroma)
            tonal_risk = 1.0 if chroma_std < 0.25 else 0.0

            # LAYER 3: Deep Learning Model
            if self.model is not None and self.feature_extractor is not None:
                inputs = self.feature_extractor(y, sampling_rate=16000, return_tensors="pt", padding=True)
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                with torch.no_grad():
                    logits = self.model(**inputs).logits
                    probs = F.softmax(logits, dim=-1)
                    ai_fake_score = probs[0][1].item()  # Class 1 = Fake

                # Combine model + heuristics (70% model, 30% heuristics)
                heuristic_score = (flux_risk + tonal_risk) / 2.0
                final_score = (ai_fake_score * 0.7) + (heuristic_score * 0.3)
                
            else:
                # Fallback: heuristics only
                final_score = (flux_risk + tonal_risk) / 2.0
                ai_fake_score = final_score

            return {
                "label": "FAKE" if final_score > 0.5 else "REAL",
                "fake_prob": float(final_score),
                "confidence_percent": round(float(max(final_score, 1-final_score)) * 100, 2),
                "analysis_metrics": {
                    "rhythm_fluidity": "Natural" if flux_mean > 1.2 else "Stiff/AI",
                    "tonal_consistency": "High (Suspect)" if chroma_std < 0.25 else "Normal",
                    "raw_ai_score": round(ai_fake_score, 3),
                    "vocal_isolation": "Yes" if self.demucs_model else "No",
                    "mode": "MelodyMachine+Demucs+Heuristic" if self.demucs_model else "MelodyMachine+Heuristic"
                }
            }

        except Exception as e:
            return {"error": str(e), "fake_prob": 0.5}

    def _isolate_vocals(self, audio, sr):
        """Use Demucs to isolate vocal track."""
        import torch.nn.functional as F_torch
        
        # Prepare audio for Demucs (stereo required)
        if len(audio.shape) == 1:
            audio_stereo = np.stack([audio, audio])
        else:
            audio_stereo = audio
        
        # Convert to tensor
        audio_tensor = torch.from_numpy(audio_stereo).float().unsqueeze(0).to(self.device)
        
        # Run Demucs
        with torch.no_grad():
            sources = self.demucs_model(audio_tensor)
        
        # Extract vocals (index 3 for htdemucs)
        vocals = sources[0, 3].cpu().numpy()
        
        # Convert back to mono
        if len(vocals.shape) > 1:
            vocals = np.mean(vocals, axis=0)
        
        return vocals

# Initialize global instance
_global_detector = AudioDeepfakeDetector()


class AudioDetector:
    """Service adapter for integration with main application."""
    
    def detect(self, media_data: dict) -> dict:
        """
        Detect deepfakes in audio files.
        Handles local paths and URLs automatically.
        """
        input_path = media_data.get("file_path") or media_data.get("local_path") or media_data.get("url")
        
        # Handle file:// prefix
        if input_path and input_path.startswith("file://"):
            input_path = input_path.replace("file://", "")
            if os.name == 'nt' and input_path.startswith("/") and not input_path.startswith("//"):
                input_path = input_path.lstrip("/")
        
        temp_file_path = None

        try:
            if not input_path:
                return {"score": 0.5, "inconsistencies": {"error": "No file path provided"}}

            # Handle URLs
            if self._is_url(input_path):
                temp_file_path = self._download_file(input_path)
                input_path = temp_file_path
            
            # Verify file exists
            if not os.path.exists(input_path):
                return {"score": 0.5, "inconsistencies": {"error": f"File not found: {input_path}"}}

            # Run analysis
            result = _global_detector.analyze_audio(input_path)
            fake_score = result.get("fake_prob", 0.5)
            
            # Format output
            inconsistencies = {}
            if fake_score > 0.55:
                inconsistencies = {
                    "detected": True,
                    "severity": "High" if fake_score > 0.8 else "Medium",
                    "description": "Synthetic audio artifacts detected matching Deepfake signatures.",
                    "confidence": result.get("confidence_percent"),
                    "details": {
                        "fake_probability": round(fake_score, 4),
                        "real_probability": round(1 - fake_score, 4)
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
            print(f"AudioDetector Error: {e}")
            return {"score": 0.5, "inconsistencies": {"error": str(e)}}
        
        finally:
            # Cleanup temp files
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except:
                    pass

    def _is_url(self, path: str) -> bool:
        """Check if path is a URL."""
        try:
            result = urlparse(path)
            return all([result.scheme, result.netloc])
        except:
            return False

    def _download_file(self, url: str) -> str:
        """Download file from URL to temp location."""
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                local_filename = tmp.name
            
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                with open(local_filename, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            
            return local_filename
        except Exception as e:
            raise RuntimeError(f"Failed to download audio: {e}")
