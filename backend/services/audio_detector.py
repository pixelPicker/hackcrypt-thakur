import os
import torch
import torchaudio
import librosa
import numpy as np
from torchaudio.pipelines import HDEMUCS_HIGH_MUSDB_PLUS
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor
import torch.nn.functional as F

class HackCryptUltimateDetector:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔊 Audio Detector initializing on: {self.device.upper()}")

        # Set up local model cache directory
        current_script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.normpath(os.path.join(current_script_dir, ".."))
        self.model_cache_dir = os.path.join(project_root, "models", "pretrained")
        
        # Create directory if it doesn't exist
        os.makedirs(self.model_cache_dir, exist_ok=True)

        try:
            # Use a specialized Deepfake Detection model
            model_name = "MelodyMachine/Deepfake-audio-detection"
            print(f"📂 Loading Audio Model from HuggingFace: {model_name}")
            print(f"💾 Cache directory: {self.model_cache_dir}")
            
            # Download and cache model to local project directory
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
            print("✅ Audio Model Loaded Successfully from HuggingFace")
        except Exception as e:
            print(f"❌ Error loading audio model: {e}")
            print("⚠️ Running in fallback mode - will use heuristic analysis only")
            self.model = None
            self.feature_extractor = None

    def analyze_audio(self, file_path: str) -> dict:
        try:
            # Load 10 seconds of audio
            y, sr = librosa.load(file_path, sr=16000, duration=10)
            
            # --- 🛡️ LAYER 1: SPECTRAL FLUX (Transition Analysis) ---
            # AI often has "perfect" transitions between phonemes. Humans are messy.
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            flux_mean = np.mean(onset_env)
            # High flux variance = Natural speech. Low/Constant flux = AI generation.
            flux_risk = 1.0 if flux_mean < 1.2 else 0.0

            # --- 🛡️ LAYER 2: CHROMA CENS (Tonal Constancy) ---
            # AI voices often have a very "locked" pitch texture. 
            chroma = librosa.feature.chroma_cens(y=y, sr=sr)
            chroma_std = np.std(chroma)
            # AI is often "too stable" (Low std dev).
            tonal_risk = 1.0 if chroma_std < 0.25 else 0.0

            # --- 🛡️ LAYER 3: THE AI MODEL (MelodyMachine) ---
            if self.model is not None and self.feature_extractor is not None:
                inputs = self.feature_extractor(y, sampling_rate=16000, return_tensors="pt", padding=True)
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                with torch.no_grad():
                    logits = self.model(**inputs).logits
                    probs = F.softmax(logits, dim=-1)
                    # Label 0: Real, Label 1: Fake (Standard for this model)
                    ai_fake_score = probs[0][1].item()

                # --- 🚀 COMBINATION LOGIC ---
                # We trust the specialized model primarily.
                # Heuristics act as a "soft" penalty or boost, not a veto.
                
                heuristic_score = (flux_risk + tonal_risk) / 2.0
                
                # Weighted average: 70% Model, 30% Heuristics
                final_score = (ai_fake_score * 0.7) + (heuristic_score * 0.3)
                
            else:
                # Fallback mode: Use only heuristic analysis
                print("⚠️ AI model not available, using heuristic analysis only")
                final_score = (flux_risk + tonal_risk) / 2.0
                ai_fake_score = final_score

            return {
                "label": "FAKE" if final_score > 0.5 else "REAL",
                "fake_prob": float(final_score),
                "confidence_percent": round(float(final_score if final_score > 0.5 else (1-final_score)) * 100, 2),
                "analysis_metrics": {
                    "rhythm_fluidity": "Natural" if flux_mean > 1.2 else "Stiff/AI",
                    "tonal_consistency": "High (Suspect)" if chroma_std < 0.25 else "Normal",
                    "raw_ai_score": round(ai_fake_score, 3),
                    "mode": "MelodyMachine(FineTuned)+Heuristic" if self.model else "Heuristic Only"
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
        
        # 1. Initialize Demucs (Vocal Separator)
        print("🎻 Loading Demucs Vocal Separator...")
        self.demucs_bundle = HDEMUCS_HIGH_MUSDB_PLUS
        self.demucs_model = self.demucs_bundle.get_model().to(self.device)
        self.demucs_model.eval()
        
        # 2. Initialize Deepfake Detector
        print("🚀 Loading XLSR Deepfake Engine...")
        self.df_checkpoint = "Gustking/wav2vec2-large-xlsr-deepfake-audio-classification"
        self.extractor = AutoFeatureExtractor.from_pretrained(self.df_checkpoint)
        self.model = AutoModelForAudioClassification.from_pretrained(self.df_checkpoint).to(self.device)
        self.model.eval()
        print(f"✅ Pipeline Ready on {self.device.upper()}")

    def _load_audio_librosa(self, path):
        """Loads MP3 using Librosa and converts to Torch Tensor for Demucs"""
        # Load as 44.1kHz (Demucs native SR) to avoid double resampling
        y, sr = librosa.load(path, sr=44100, mono=False)
        
        # Convert to Torch Tensor
        if y.ndim == 1:
            waveform = torch.from_numpy(y).float().unsqueeze(0) # (1, samples)
        else:
            waveform = torch.from_numpy(y).float() # (2, samples)
            
        return waveform, 44100

    def _separate_vocals(self, path):
        """Uses Demucs to strip background music and noise"""
        waveform, sr = self._load_audio_librosa(path)
        waveform = waveform.to(self.device)

        # Apply Demucs separation
        with torch.no_grad():
            # sources: [drums, bass, other, vocals]
            sources = self.demucs_model(waveform[None])[0]
        
        # Index 3 is Vocals
        vocals = sources[3] 
        
        # Convert to mono and resample to 16kHz for Wav2Vec2
        vocals_mono = torch.mean(vocals, dim=0, keepdim=True)
        # Resample using torchaudio (fast)
        resampler_16k = torchaudio.transforms.Resample(44100, 16000).to(self.device)
        vocals_16k = resampler_16k(vocals_mono)
        
        return vocals_16k.cpu().numpy().squeeze()

    def analyze(self, path):
        # 1. VOX ISOLATION
        print("🪄 Cleaning background music and noise...")
        y_clean = self._separate_vocals(path)
        
        # 2. NORMALIZATION
        if np.max(np.abs(y_clean)) > 0:
            y_clean = y_clean / np.max(np.abs(y_clean))

        # 3. SLIDING WINDOW (Consensus Voting)
        win_size = int(5 * 16000)
        stride = int(2.5 * 16000)
        chunk_probs = []
        
        for i in range(0, len(y_clean) - win_size + 1, stride):
            chunk = y_clean[i : i + win_size]
            inputs = self.extractor(chunk, sampling_rate=16000, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                logits = self.model(**inputs).logits
                probs = F.softmax(logits, dim=-1)
                # Label 0: Fake
                chunk_probs.append(probs[0][0].item())

        if not chunk_probs:
            return {"error": "Audio too short after cleaning."}

        # Use Median for stability
        final_score = np.median(chunk_probs)
        
        threshold = 0.55 
        is_fake = final_score > threshold

        return {
            "verdict": "FAKE" if is_fake else "REAL",
            "fake_score": f"{round(final_score * 100, 2)}%",
            "confidence": "High" if abs(final_score - threshold) > 0.2 else "Moderate",
            "details": {
                "cleaning_engine": "Hybrid-Demucs-V4",
                "segments_checked": len(chunk_probs)
            }
        }

# --- START ANALYSIS ---
if __name__ == "__main__":
    detector = HackCryptUltimateDetector()
    file_path = "profile.mp3" 
    
    if os.path.exists(file_path):
        results = detector.analyze(file_path)
        print("\n" + "="*30)
        print(f"🎤 RESULTS FOR: {file_path}")
        print(f"Verdict: {results['verdict']}")
        print(f"Fake Probability: {results.get('fake_score', 'N/A')}")
        print("="*30)
    else:
        print(f"❌ Error: {file_path} not found.")
    file_path = "audio.mp3" 
    
    if os.path.exists(file_path):
        results = detector.analyze(file_path)
        print("\n" + "="*30)
        print(f"🎤 RESULTS FOR: {file_path}")
        print(f"Verdict: {results['verdict']}")
        print(f"Fake Probability: {results.get('fake_score', 'N/A')}")
        print("="*30)
    else:
        print(f"❌ Error: {file_path} not found.")
        
        
            
    file_path = "modi_fake.mp3" 
    if os.path.exists(file_path):
        results = detector.analyze(file_path)
        print("\n" + "="*30)
        print(f"🎤 RESULTS FOR: {file_path}")
        print(f"Verdict: {results['verdict']}")
        print(f"Fake Probability: {results.get('fake_score', 'N/A')}")
        print("="*30)
    else:
        print(f"❌ Error: {file_path} not found.")
