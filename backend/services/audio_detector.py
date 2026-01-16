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
