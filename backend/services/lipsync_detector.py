import os
import cv2
import numpy as np
import librosa
from moviepy import VideoFileClip
from scipy.stats import pearsonr
import tempfile
import urllib.request
import warnings

warnings.filterwarnings("ignore")

class LipSyncDetector:
    def __init__(self):
        print("⏳ Initializing Native OpenCV LipSync...")
        self.model_url = "https://github.com/kurnianggoro/GSOC2017/raw/master/data/lbfmodel.yaml"
        self.model_path = os.path.join(os.getcwd(), "lbfmodel.yaml")
        
        if not os.path.exists(self.model_path):
            print("⬇️ Downloading Face Model (Standard OpenCV)...")
            try:
                urllib.request.urlretrieve(self.model_url, self.model_path)
            except Exception as e:
                print(f"❌ Failed to download model: {e}")
        
        try:
            self.face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
            self.landmark_detector = cv2.face.createFacemarkLBF()
            self.landmark_detector.loadModel(self.model_path)
            print("✅ Native LipSync Ready.")
            self.is_ready = True
        except Exception as e:
            print(f"⚠️ Init Error: {e}")
            self.is_ready = False

    def detect(self, media_data: dict) -> dict:
        if not self.is_ready:
            return {"score": 0.5, "inconsistencies": {"warning": "Detector not ready"}}

        video_path = media_data.get("file_path") or media_data.get("local_path")
        
        # Windows Path Fix
        if video_path and video_path.startswith("file://"):
            video_path = video_path.replace("file://", "")
            if os.name == 'nt' and video_path.startswith("/") and not video_path.startswith("//"):
                 video_path = video_path.lstrip("/")
        
        if not video_path or not os.path.exists(video_path):
            return {"score": 0.5, "inconsistencies": {"error": "Video file not found"}}

        try:
            sync_score, details = self._analyze_synchronization(video_path, chunk_seconds=30)
            
            # Convert numpy types to python native types for JSON compatibility
            s_score = float(sync_score)
            
            # Logic: If sync is less than 0.15, we start flagging it as suspicious
            # Deepfakes usually hover around 0.0 or negative.
            fake_prob = 1.0 - max(0, s_score)
            fake_prob = float(max(0.0, min(1.0, fake_prob)))

            inconsistencies = {}
            # Threshold: If fake probability is high, report it
            if fake_prob > 0.75:
                inconsistencies = {
                    "detected": True,
                    "type": "LIP_SYNC_MISMATCH",
                    "severity": "High" if fake_prob > 0.9 else "Medium",
                    "description": "Mouth movements do not correlate with speech audio.",
                    "details": {
                        "sync_score": round(s_score, 3),
                        "frames_analyzed": int(details.get("frames", 0))
                    }
                }
            else:
                inconsistencies = {
                    "detected": False,
                    "status": "Lip movement synchronization within normal limits."
                }

            return {
                "score": fake_prob, 
                "inconsistencies": inconsistencies
            }
        except Exception as e:
            print(f"❌ Error during detection: {e}")
            return {"score": 0.5, "inconsistencies": {"error": str(e)}}

    def _analyze_synchronization(self, video_path, chunk_seconds=30):
        # 1. Extract 30s of Video Frames
        mar_list, fps = self._extract_mouth_openings(video_path, chunk_seconds)
        
        if len(mar_list) < 15: 
            return 0.5, {"frames": 0}

        # 2. Extract 30s of Audio Energy
        audio_energy = self._extract_audio_energy(video_path, len(mar_list), fps, chunk_seconds)
        
        if audio_energy is None: 
            return 1.0, {"warning": "No Audio"}

        try:
            corr, _ = pearsonr(mar_list, audio_energy)
            if np.isnan(corr): corr = 0.0
        except:
            corr = 0.0
            
        return corr, {"frames": len(mar_list)}

    def _extract_mouth_openings(self, video_path, chunk_seconds):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        max_frames = int(fps * chunk_seconds) # 30 seconds worth of frames
        
        mar_list = []
        frame_count = 0
        
        while cap.isOpened() and frame_count < max_frames:
            ret, frame = cap.read()
            if not ret: break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_detector.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) > 0:
                _, landmarks = self.landmark_detector.fit(gray, faces)
                for landmark in landmarks:
                    lm = landmark[0]
                    try:
                        # Inner lip distance
                        dist = np.linalg.norm(lm[62] - lm[66])
                        mar_list.append(dist)
                    except:
                        mar_list.append(0.0)
                    break 
            else:
                mar_list.append(0.0)
            
            frame_count += 1
                
        cap.release()
        return mar_list, fps

    def _extract_audio_energy(self, video_path, num_frames, fps, chunk_seconds):
        try:
            clip = VideoFileClip(video_path)
            if not clip.audio: 
                clip.close()
                return None
            
            # Use only the first 30 seconds
            duration = min(clip.duration, chunk_seconds)
            subclip = clip.subclipped(0, duration) # MoviePy 2.x uses subclipped()
            
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                temp_name = f.name
            
            subclip.audio.write_audiofile(temp_name, logger=None)
            subclip.close()
            clip.close()
            
            y, sr = librosa.load(temp_name, sr=16000)
            try: os.remove(temp_name)
            except: pass
            
            hop = int(sr / fps)
            if hop < 1: hop = 1
            rmse = librosa.feature.rms(y=y, frame_length=hop, hop_length=hop)[0]
            
            # Align lengths
            if len(rmse) != num_frames:
                rmse = cv2.resize(rmse.reshape(1,-1), (num_frames, 1)).flatten()
                
            return (rmse - np.min(rmse)) / (np.max(rmse) + 1e-6)
        except Exception as e:
            print(f"Audio Error: {e}")
            return None

# if __name__ == "__main__":
#     f = os.path.join(os.getcwd(), "test_final.mp4")
#     if os.path.exists(f):
#         detector = LipSyncDetector()
#         print(detector.detect({"file_path": f}))
